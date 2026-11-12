/**
 * The Claude CLI's control channel (`--permission-prompt-tool stdio`): permission prompts, questions and plan reviews
 * arrive as `control_request` lines on stdout and are answered with `control_response` lines on stdin. This module
 * turns each request into a DSH dialog and the dialog's answer into the reply. Wire shapes follow Anthropic's Agent
 * SDK (`can_use_tool` request; `allow` with `updatedInput` or `deny` with `message`). The plan-review dialog and its
 * deny messages follow dsh-oh-my-claude 1.6.2 (MIT); see `src/PROVENANCE.md` and `THIRD_PARTY_NOTICES.md`.
 */
import { CLAUDE_CAPABILITIES } from '../provider-capabilities.js';
import { ENGLISH_PLAN_TEXT } from './claude-cli-plan-text.js';
/** The text of a message's content, whatever its shape. */
function textOf(content) {
    if (typeof content === 'string')
        return content;
    if (!Array.isArray(content))
        return '';
    return content
        .map((part) => part &&
        typeof part === 'object' &&
        part.type === 'text'
        ? String(part.text ?? '')
        : '')
        .join('');
}
/**
 * The last runtime-context snapshot's text in a request, or `undefined` when DSH sent none. Messages the person typed
 * (source kind `user`, which includes attached file text) are never read, so nothing pasted into a prompt can choose a
 * more permissive mode; DSH's own context injection carries another producer's kind.
 */
function lastContext(messages) {
    let found;
    for (const message of messages) {
        if (message.role !== 'user' || message.source?.kind === 'user')
            continue;
        const text = textOf(message.content);
        if (text.includes('Current DSH file policy:'))
            found = text;
    }
    return found;
}
/**
 * The CLI mode for a turn, from the last `Current DSH file policy: <policy>` line DSH put in the request. Read again
 * every turn, so a change applies from the next turn. A missing or unrecognised line gives the declared fallback.
 */
export function permissionModeFor(messages) {
    const { byFilePolicy, fallback } = CLAUDE_CAPABILITIES.permissionModes;
    const policy = lastContext(messages)?.match(/Current DSH file policy: ([a-z-]+)/)?.[1];
    return policy !== undefined && Object.hasOwn(byFilePolicy, policy)
        ? byFilePolicy[policy]
        : fallback;
}
/** Whether DSH says approval prompts are off for the session, so a rejection means nobody was asked. */
export function approvalsDisabled(messages) {
    return (lastContext(messages)?.includes('Approval prompts are disabled in this session') ?? false);
}
const clip = (value, limit) => value.length > limit ? `${value.slice(0, limit)}…` : value;
/** One line saying what the tool is about to do, for the approval dialog's reason. */
function reasonFor(toolName, input, request) {
    const field = (name) => typeof request[name] === 'string' ? request[name] : undefined;
    const subject = typeof input.command === 'string'
        ? input.command
        : typeof input.file_path === 'string'
            ? input.file_path
            : typeof input.url === 'string'
                ? input.url
                : typeof input.pattern === 'string'
                    ? input.pattern
                    : undefined;
    const parts = [
        field('title') ?? field('description') ?? field('decision_reason'),
        subject === undefined ? undefined : `${toolName}: ${clip(subject, 500)}`,
    ].filter((part) => part !== undefined);
    return parts.length
        ? parts.join(' — ')
        : `Claude Code wants to use ${toolName}`;
}
const NOBODY = 'Nobody refused this action: ';
const deny = (message) => ({
    behavior: 'deny',
    message,
});
/** A deny for a dialog that did not complete: withdrawn on purpose, or one DSH could not show (for example a subagent). */
const dialogFailure = (what, error, signal) => deny(signal.aborted
    ? `The ${what} was cancelled before the user answered it.`
    : `DSH could not show the ${what} (${errorText(error)}), so nobody answered it.`);
const errorText = (error) => error instanceof Error ? error.message : String(error);
function questionItems(input) {
    if (!Array.isArray(input.questions) || input.questions.length === 0)
        return undefined;
    const items = input.questions.map((entry, index) => {
        if (!entry || typeof entry.question !== 'string')
            return undefined;
        const options = Array.isArray(entry.options)
            ? entry.options.flatMap((option) => typeof option?.label === 'string'
                ? [
                    {
                        label: option.label,
                        ...(typeof option.description === 'string'
                            ? { description: option.description }
                            : {}),
                    },
                ]
                : [])
            : [];
        return {
            id: `q${index}`,
            question: entry.question,
            ...(typeof entry.header === 'string' ? { header: entry.header } : {}),
            options,
            multiSelect: entry.multiSelect === true,
        };
    });
    return items.every((item) => item !== undefined)
        ? items
        : undefined;
}
async function askQuestions(input, services, signal) {
    const items = questionItems(input);
    if (!items)
        return deny('DSH could not read this question, so nobody answered it.');
    if (!services.userQuestions)
        return deny('DSH cannot show this question: its question service is unavailable, so nobody answered it.');
    let response;
    try {
        response = await services.userQuestions.ask({
            questions: items,
            agent: services.agent,
            signal,
        });
    }
    catch (error) {
        return dialogFailure('question', error, signal);
    }
    if (signal.aborted)
        return deny('The question was cancelled before the user answered it.');
    const answers = {};
    for (const item of items) {
        const answer = response.answers?.find((entry) => entry.id === item.id);
        const typed = answer?.custom?.trim();
        // DSH: a single-select `custom` replaces the choice; a multi-select `custom` adds to the selected labels.
        // An item with nothing selected and no custom text is a skip and stays out of the answers.
        const value = item.multiSelect
            ? [...(answer?.selected ?? []), ...(typed ? [typed] : [])].join(', ')
            : typed || answer?.selected?.join(', ');
        if (value)
            answers[item.question] = value;
    }
    if (Object.keys(answers).length === 0)
        return deny('The user did not answer the question.');
    return {
        behavior: 'allow',
        updatedInput: { ...input, questions: input.questions, answers },
    };
}
async function reviewPlan(input, toolUseId, services, signal) {
    const plan = typeof input.plan === 'string' ? input.plan : '';
    // Leaving plan mode is never allowed unseen: a plan with no text is sent back instead of waved through.
    if (!plan.trim())
        return deny('Claude Code sent no plan to review, so nobody approved leaving plan mode; present the plan again.');
    if (!services.userQuestions)
        return deny('DSH cannot show this plan: its question service is unavailable, so nobody reviewed it.');
    const id = `plan-review:${toolUseId}`;
    const words = services.planReviewText ?? ENGLISH_PLAN_TEXT;
    const approve = words.approve;
    let response;
    try {
        response = await services.userQuestions.ask({
            questions: [
                {
                    id,
                    header: words.header,
                    question: words.question,
                    detail: plan,
                    options: [
                        { label: approve, description: words.approveDetail },
                        { label: words.keep, description: words.keepDetail },
                    ],
                    intent: { kind: 'plan-review', approve },
                    multiSelect: false,
                },
            ],
            agent: services.agent,
            signal,
        });
    }
    catch (error) {
        return dialogFailure('plan review', error, signal);
    }
    if (signal.aborted)
        return deny('The plan review was cancelled before the user answered it.');
    const answer = response.answers?.find((entry) => entry.id === id);
    const feedback = answer?.custom?.trim() ?? '';
    if (answer?.selected?.length === 1 &&
        answer.selected[0] === approve &&
        feedback === '')
        return { behavior: 'allow', updatedInput: input };
    return deny(feedback === ''
        ? 'The user chose to keep planning; revise the plan and present it again.'
        : `The user chose to keep planning; their feedback: ${feedback}`);
}
async function askApproval(toolName, input, request, toolUseId, services, signal, promptsDisabled) {
    if (!services.approval || services.agent === undefined)
        return deny(`${NOBODY}DSH has no approval dialog available for this session.`);
    let outcome;
    try {
        outcome = await services.approval.request({
            agent: services.agent,
            toolName,
            callId: toolUseId,
            reason: reasonFor(toolName, input, request),
            signal,
        });
    }
    catch (error) {
        return deny(`${NOBODY}the approval dialog failed (${errorText(error)}).`);
    }
    if (signal.aborted || outcome === 'cancelled')
        return deny(`${NOBODY}the approval was cancelled before anyone answered it.`);
    if (outcome === 'unavailable')
        return deny(`${NOBODY}DSH found no one to ask.`);
    if (outcome === 'allowed-once')
        return { behavior: 'allow', updatedInput: input };
    return deny(promptsDisabled
        ? `${NOBODY}approval prompts are disabled in this session, so nobody was asked. The user can turn prompts back on in DSH or choose a more permissive permission mode.`
        : 'The user declined this action.');
}
/** Answer one `can_use_tool` request through the matching DSH dialog. Never throws. */
export async function answerControlRequest(request, services, signal, promptsDisabled = false) {
    const toolName = typeof request.tool_name === 'string' ? request.tool_name : 'tool';
    const input = request.input &&
        typeof request.input === 'object' &&
        !Array.isArray(request.input)
        ? request.input
        : {};
    const toolUseId = typeof request.tool_use_id === 'string' ? request.tool_use_id : toolName;
    try {
        if (toolName === 'AskUserQuestion')
            return await askQuestions(input, services, signal);
        if (toolName === 'ExitPlanMode')
            return await reviewPlan(input, toolUseId, services, signal);
        return await askApproval(toolName, input, request, toolUseId, services, signal, promptsDisabled);
    }
    catch (error) {
        return deny(`${NOBODY}${errorText(error)}.`);
    }
}
/** The stdin line that answers a control request with a decision. */
export const controlResponseLine = (requestId, response) => `${JSON.stringify({ type: 'control_response', response: { subtype: 'success', request_id: requestId, response } })}\n`;
/** The stdin line that answers a control request this client cannot serve. */
export const controlErrorLine = (requestId, error) => `${JSON.stringify({ type: 'control_response', response: { subtype: 'error', request_id: requestId, error } })}\n`;
