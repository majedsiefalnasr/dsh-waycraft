import type { PlanReviewText } from './claude-cli-control.js';

/** The slice of DSH's settings service that holds the display language (`locale.preference`). */
export interface LocaleSettingsReader {
  describe?(options?: { redactSecrets?: boolean }): readonly {
    ns?: unknown;
    value?: unknown;
  }[];
}

// Host code cannot import the browser locale files (they sit outside this project's compiled source root), so the
// few words of this one dialog live here, in both shipped languages.
export const ENGLISH_PLAN_TEXT: PlanReviewText = {
  header: 'Plan review',
  question: 'Claude Code has a plan. Approve it?',
  approve: 'Approve the plan',
  approveDetail: 'Let Claude Code carry out the plan.',
  keep: 'Keep planning',
  keepDetail: 'Send the plan back with your feedback.',
};

const ARABIC: PlanReviewText = {
  header: 'مراجعة الخطة',
  question: 'لدى Claude Code خطة. هل توافق عليها؟',
  approve: 'الموافقة على الخطة',
  approveDetail: 'اسمح لـ Claude Code بتنفيذ الخطة.',
  keep: 'متابعة التخطيط',
  keepDetail: 'أعد الخطة مع ملاحظاتك.',
};

/**
 * The plan-review dialog's words in the language DSH is set to under Settings, General. Only Arabic and English ship;
 * an unset language, a missing settings service or a failed read gives English. The CLI's own question text is shown
 * as the CLI wrote it.
 */
export function planReviewTextFor(
  settings: LocaleSettingsReader | undefined,
): PlanReviewText {
  let preference: unknown;
  try {
    preference = settings
      ?.describe?.({ redactSecrets: true })
      ?.find((entry) => entry.ns === 'locale')?.value;
  } catch {
    preference = undefined;
  }
  const tag = (preference as { preference?: unknown } | undefined)?.preference;
  return typeof tag === 'string' && tag.toLowerCase().startsWith('ar')
    ? ARABIC
    : ENGLISH_PLAN_TEXT;
}
