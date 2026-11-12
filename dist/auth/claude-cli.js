import { mkdir, readFile, writeFile, rename, rm } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { dshHomePath } from '@deepseek-ai/dsh-home-paths';
/** Waycraft-owned storage for the Claude Official CLI: account directories, Provider settings and metadata. */
const claudeStorage = (...parts) => dshHomePath('plugins', 'waycraft', 'subscriptions', 'claude', ...parts);
const accountsFile = () => claudeStorage('accounts.json');
/** Credential- and endpoint-selecting variables removed from every CLI child run for an account. */
const SCRUBBED_ENV = {
    ANTHROPIC_API_KEY: undefined,
    ANTHROPIC_AUTH_TOKEN: undefined,
    CLAUDE_CODE_OAUTH_TOKEN: undefined,
    ANTHROPIC_BASE_URL: undefined,
    CLAUDE_CODE_USE_BEDROCK: undefined,
    CLAUDE_CODE_USE_VERTEX: undefined,
};
export class ClaudeCliLogin {
    terminal;
    loginId;
    verification;
    identity;
    starting = false;
    disposed = false;
    state = 'authenticating';
    output = '';
    truncated = false;
    onOutput = (chunk) => {
        this.output += chunk.toString();
        if (this.output.length > 65536) {
            this.output = this.output.slice(-65536);
            this.truncated = true;
        }
    };
    /**
     * Official CLI accounts from Waycraft's metadata. A missing or unreadable file and any invalid entry are skipped,
     * so a damaged file never breaks the Claude status that also lists Direct accounts.
     */
    async accounts() {
        let metadata;
        try {
            metadata = JSON.parse(await readFile(accountsFile(), 'utf8'));
        }
        catch {
            return [];
        }
        const entries = metadata?.accounts;
        if (!entries || typeof entries !== 'object' || Array.isArray(entries))
            return [];
        const text = (value) => typeof value === 'string' ? value : undefined;
        return Object.entries(entries).flatMap(([key, value]) => {
            const account = value;
            if (!/^[a-f0-9-]{36}$/.test(key) ||
                account?.accessMethod !== 'official-cli')
                return [];
            const email = text(account.email);
            const plan = text(account.subscriptionType);
            return [
                {
                    key,
                    accessMethod: 'official-cli',
                    cliPath: text(account.cliPath),
                    cliVersion: text(account.cliVersion),
                    // The Claude card shows `account` and `plan`; the email and subscription names stay for other consumers.
                    account: email,
                    plan,
                    emailAddress: email,
                    subscriptionType: plan,
                },
            ];
        });
    }
    async read(loginId) {
        await this.verification;
        if (!this.terminal || this.loginId !== loginId)
            throw new Error('Claude CLI login is not active');
        return {
            output: this.output,
            truncated: this.truncated,
            state: this.state,
            identity: this.identity,
        };
    }
    async input(loginId, data) {
        if (!this.terminal || this.loginId !== loginId)
            throw new Error('Claude CLI login is not active');
        if (this.state !== 'authenticating')
            throw new Error('Claude CLI terminal has exited');
        if (!data || data.length > 4096)
            throw new Error('Claude CLI terminal input must be 1–4096 characters');
        await this.terminal.write(data);
    }
    async cancel(loginId) {
        if (!this.terminal || this.loginId !== loginId)
            throw new Error('Claude CLI login is not active');
        await this.stop();
    }
    async login(runtime) {
        if (this.disposed)
            throw new Error('Claude CLI login is unavailable');
        if (this.terminal || this.starting)
            throw new Error('Claude CLI login is already active');
        this.starting = true;
        try {
            const discovery = await discoverClaudeCli(runtime);
            if (!discovery.available || !discovery.path)
                return discovery;
            const loginId = randomUUID();
            const directory = claudeStorage('accounts', loginId);
            await mkdir(claudeStorage('settings'), {
                recursive: true,
                mode: 0o700,
            });
            await mkdir(directory, { recursive: true, mode: 0o700 });
            if (this.disposed)
                throw new Error('Claude CLI login is unavailable');
            this.terminal = runtime.spawnTerminal({
                argv: [discovery.path, 'auth', 'login'],
                cwd: directory,
                env: { CLAUDE_CONFIG_DIR: directory },
                cols: 80,
                rows: 24,
                terminalType: 'xterm-256color',
                graceMs: 1000,
            });
            this.loginId = loginId;
            this.identity = undefined;
            this.verification = undefined;
            this.output = '';
            this.truncated = false;
            this.state = 'authenticating';
            this.terminal.output?.on('data', this.onOutput);
            void this.terminal.done.then((outcome) => {
                if (this.loginId !== loginId)
                    return;
                this.state =
                    outcome.exitCode === 0 && !outcome.signal ? 'verifying' : 'failed';
                if (this.state === 'verifying') {
                    this.verification = this.verify(runtime, discovery.path, directory, loginId, discovery.version);
                }
            }, () => {
                if (this.loginId === loginId)
                    this.state = 'failed';
            });
            return {
                state: 'authenticating',
                loginId,
                path: discovery.path,
                version: discovery.version,
            };
        }
        finally {
            this.starting = false;
        }
    }
    async verify(runtime, path, directory, loginId, version) {
        try {
            const handle = runtime.spawn({
                argv: [path, 'auth', 'status', '--json'],
                cwd: directory,
                env: { CLAUDE_CONFIG_DIR: directory, ...SCRUBBED_ENV },
                stdio: {
                    stdin: 'ignore',
                    stdout: { maxBytes: 16384 },
                    stderr: { maxBytes: 4096 },
                },
                graceMs: 1000,
                signal: AbortSignal.timeout(10000),
            });
            try {
                const outcome = await handle.done;
                const output = handle.collected.stdout?.readFrom(0);
                if (outcome.exitCode !== 0 || outcome.signal || !output || output.lossy)
                    throw new Error('Claude CLI identity unavailable');
                const status = JSON.parse(output.text);
                if (status.loggedIn !== true)
                    throw new Error('Claude CLI is not signed in');
                if (this.loginId !== loginId)
                    return;
                this.identity = {
                    ...(typeof status.email === 'string' && status.email.length <= 320
                        ? { email: status.email }
                        : {}),
                    ...(typeof status.subscriptionType === 'string' &&
                        status.subscriptionType.length <= 80
                        ? { subscriptionType: status.subscriptionType }
                        : {}),
                };
                const metadataPath = accountsFile();
                let metadata;
                try {
                    metadata = JSON.parse(await readFile(metadataPath, 'utf8'));
                    if (!metadata.accounts ||
                        typeof metadata.accounts !== 'object' ||
                        Array.isArray(metadata.accounts))
                        throw new Error('Invalid Claude CLI account metadata');
                }
                catch (error) {
                    if (error.code !== 'ENOENT')
                        throw error;
                    metadata = { accounts: {} };
                }
                if (this.loginId !== loginId || this.disposed)
                    return;
                metadata.accounts[loginId] = {
                    accessMethod: 'official-cli',
                    directory,
                    cliPath: path,
                    cliVersion: version,
                    ...this.identity,
                };
                const temporary = `${metadataPath}.${randomUUID()}.tmp`;
                try {
                    await writeFile(temporary, JSON.stringify(metadata, null, 2), {
                        mode: 0o600,
                        flag: 'wx',
                    });
                    // A cancel that arrived while the file was staged must not publish the account.
                    if (this.loginId !== loginId || this.disposed)
                        return;
                    await rename(temporary, metadataPath);
                }
                finally {
                    await rm(temporary, { force: true });
                }
                this.state = 'authenticated';
            }
            finally {
                await handle.terminate();
                await handle.waitForExit();
            }
        }
        catch {
            if (this.loginId === loginId)
                this.state = 'failed';
        }
    }
    async dispose() {
        this.disposed = true;
        await this.stop();
        await this.verification;
    }
    async stop() {
        this.loginId = undefined;
        await this.terminal?.terminate();
        this.terminal?.output?.off('data', this.onOutput);
        this.output = '';
        this.terminal = undefined;
        await this.verification;
    }
}
/** Probes only a Waycraft-owned configuration directory, never the CLI default. */
export async function discoverClaudeCli(runtime) {
    let path;
    try {
        path = await runtime.resolveExecutable('claude');
    }
    catch (error) {
        if (error.code !== 'SUBPROCESS_EXECUTABLE_NOT_FOUND')
            throw error;
        return {
            available: false,
            installCommand: 'curl -fsSL https://claude.ai/install.sh | bash',
            source: 'https://code.claude.com/docs/en/setup',
        };
    }
    const directory = claudeStorage('probe');
    await mkdir(directory, { recursive: true, mode: 0o700 });
    const signal = AbortSignal.timeout(10_000);
    const handle = runtime.spawn({
        argv: [path, '--version'],
        cwd: directory,
        env: { CLAUDE_CONFIG_DIR: directory, ...SCRUBBED_ENV },
        stdio: {
            stdin: 'ignore',
            stdout: { maxBytes: 4096 },
            stderr: { maxBytes: 4096 },
        },
        graceMs: 1000,
        signal,
    });
    try {
        const outcome = await handle.done;
        const output = handle.collected.stdout?.readFrom(0);
        if (signal.aborted ||
            outcome.exitCode !== 0 ||
            outcome.signal ||
            output?.lossy)
            throw new Error('Claude CLI version probe failed');
        const version = output?.text.match(/^(\d+\.\d+\.\d+)(?:\s|$)/)?.[1];
        if (!version)
            throw new Error('Claude CLI returned an unsupported version response');
        return { available: true, path, version };
    }
    finally {
        await handle.terminate();
        await handle.waitForExit();
    }
}
