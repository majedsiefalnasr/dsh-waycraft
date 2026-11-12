import { mkdir, readFile, writeFile, rename, rm } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import type { Readable } from 'node:stream';
import { dshHomePath } from '@deepseek-ai/dsh-home-paths';

interface CliProcess {
  done: Promise<{ exitCode: number | null; signal: string | null }>;
  collected: {
    stdout?: { readFrom(offset: number): { text: string; lossy: boolean } };
  };
  terminate(): Promise<unknown>;
  waitForExit(): Promise<unknown>;
}

export interface ClaudeCliRuntime {
  resolveExecutable(name: string): Promise<string>;
  spawnTerminal(request: {
    argv: string[];
    cwd: string;
    env: Record<string, string>;
    cols: number;
    rows: number;
    terminalType: string;
    graceMs: number;
  }): {
    output: Readable;
    write(data: string): Promise<void>;
    terminate(): Promise<void>;
    done: Promise<{ exitCode: number | null; signal: string | null }>;
  };
  spawn(request: {
    argv: string[];
    cwd: string;
    env: Record<string, string | undefined>;
    stdio: {
      stdin: 'ignore';
      stdout: { maxBytes: number };
      stderr: { maxBytes: number };
    };
    graceMs: number;
    signal: AbortSignal;
  }): CliProcess;
}

/** Waycraft-owned storage for the Claude Official CLI: account directories, Provider settings and metadata. */
const claudeStorage = (...parts: string[]) =>
  dshHomePath('plugins', 'waycraft', 'subscriptions', 'claude', ...parts);
const accountsFile = () => claudeStorage('accounts.json');
/** Credential- and endpoint-selecting variables removed from every CLI child run for an account. */
const SCRUBBED_ENV = {
  ANTHROPIC_API_KEY: undefined,
  ANTHROPIC_AUTH_TOKEN: undefined,
  CLAUDE_CODE_OAUTH_TOKEN: undefined,
  ANTHROPIC_BASE_URL: undefined,
  CLAUDE_CODE_USE_BEDROCK: undefined,
  CLAUDE_CODE_USE_VERTEX: undefined,
} as const;

export class ClaudeCliLogin {
  private terminal?: ReturnType<ClaudeCliRuntime['spawnTerminal']>;
  private loginId?: string;
  private verification?: Promise<void>;
  private identity?: { email?: string; subscriptionType?: string };
  private starting = false;
  private disposed = false;
  private state: 'authenticating' | 'verifying' | 'authenticated' | 'failed' =
    'authenticating';
  private output = '';
  private truncated = false;
  private readonly onOutput = (chunk: Buffer | string) => {
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
    let metadata: unknown;
    try {
      metadata = JSON.parse(await readFile(accountsFile(), 'utf8'));
    } catch {
      return [];
    }
    const entries = (metadata as { accounts?: unknown } | null)?.accounts;
    if (!entries || typeof entries !== 'object' || Array.isArray(entries))
      return [];
    const text = (value: unknown) =>
      typeof value === 'string' ? value : undefined;
    return Object.entries(entries).flatMap(([key, value]) => {
      const account = value as Record<string, unknown> | null;
      if (
        !/^[a-f0-9-]{36}$/.test(key) ||
        account?.accessMethod !== 'official-cli'
      )
        return [];
      const email = text(account.email);
      const plan = text(account.subscriptionType);
      return [
        {
          key,
          accessMethod: 'official-cli' as const,
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

  async read(loginId: string) {
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

  async input(loginId: string, data: string) {
    if (!this.terminal || this.loginId !== loginId)
      throw new Error('Claude CLI login is not active');
    if (this.state !== 'authenticating')
      throw new Error('Claude CLI terminal has exited');
    if (!data || data.length > 4096)
      throw new Error('Claude CLI terminal input must be 1–4096 characters');
    await this.terminal.write(data);
  }

  async cancel(loginId: string) {
    if (!this.terminal || this.loginId !== loginId)
      throw new Error('Claude CLI login is not active');
    await this.stop();
  }

  async login(runtime: ClaudeCliRuntime) {
    if (this.disposed) throw new Error('Claude CLI login is unavailable');
    if (this.terminal || this.starting)
      throw new Error('Claude CLI login is already active');
    this.starting = true;
    try {
      const discovery = await discoverClaudeCli(runtime);
      if (!discovery.available || !discovery.path) return discovery;
      const loginId = randomUUID();
      const directory = claudeStorage('accounts', loginId);
      await mkdir(claudeStorage('settings'), {
        recursive: true,
        mode: 0o700,
      });
      await mkdir(directory, { recursive: true, mode: 0o700 });
      if (this.disposed) throw new Error('Claude CLI login is unavailable');
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
      void this.terminal.done.then(
        (outcome) => {
          if (this.loginId !== loginId) return;
          this.state =
            outcome.exitCode === 0 && !outcome.signal ? 'verifying' : 'failed';
          if (this.state === 'verifying') {
            this.verification = this.verify(
              runtime,
              discovery.path,
              directory,
              loginId,
              discovery.version!,
            );
          }
        },
        () => {
          if (this.loginId === loginId) this.state = 'failed';
        },
      );
      return {
        state: 'authenticating',
        loginId,
        path: discovery.path,
        version: discovery.version,
      };
    } finally {
      this.starting = false;
    }
  }

  private async verify(
    runtime: ClaudeCliRuntime,
    path: string,
    directory: string,
    loginId: string,
    version: string,
  ) {
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
        if (this.loginId !== loginId) return;
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
        let metadata: { accounts: Record<string, unknown> };
        try {
          metadata = JSON.parse(await readFile(metadataPath, 'utf8'));
          if (
            !metadata.accounts ||
            typeof metadata.accounts !== 'object' ||
            Array.isArray(metadata.accounts)
          )
            throw new Error('Invalid Claude CLI account metadata');
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
          metadata = { accounts: {} };
        }
        if (this.loginId !== loginId || this.disposed) return;
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
          if (this.loginId !== loginId || this.disposed) return;
          await rename(temporary, metadataPath);
        } finally {
          await rm(temporary, { force: true });
        }
        this.state = 'authenticated';
      } finally {
        await handle.terminate();
        await handle.waitForExit();
      }
    } catch {
      if (this.loginId === loginId) this.state = 'failed';
    }
  }

  async dispose() {
    this.disposed = true;
    await this.stop();
    await this.verification;
  }

  private async stop() {
    this.loginId = undefined;
    await this.terminal?.terminate();
    this.terminal?.output?.off('data', this.onOutput);
    this.output = '';
    this.terminal = undefined;
    await this.verification;
  }
}

/** Probes only a Waycraft-owned configuration directory, never the CLI default. */
export async function discoverClaudeCli(runtime: ClaudeCliRuntime) {
  let path: string;
  try {
    path = await runtime.resolveExecutable('claude');
  } catch (error) {
    if ((error as { code?: string }).code !== 'SUBPROCESS_EXECUTABLE_NOT_FOUND')
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
    if (
      signal.aborted ||
      outcome.exitCode !== 0 ||
      outcome.signal ||
      output?.lossy
    )
      throw new Error('Claude CLI version probe failed');
    const version = output?.text.match(/^(\d+\.\d+\.\d+)(?:\s|$)/)?.[1];
    if (!version)
      throw new Error('Claude CLI returned an unsupported version response');
    return { available: true, path, version };
  } finally {
    await handle.terminate();
    await handle.waitForExit();
  }
}
