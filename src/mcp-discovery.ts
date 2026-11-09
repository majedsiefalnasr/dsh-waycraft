/**
 * MCP manager V1 — filesystem discovery (#172).
 * Spec §14.1: scan user-approved folders for known MCP config files; approved
 * search roots, explicit boundaries, safe symlink handling, no unexpected
 * traversal, malformed/oversized files handled gracefully, no secret leakage,
 * no execution of discovered commands, present candidates for explicit
 * registration. Scanning project folders as filesystem locations does not imply
 * project runtime isolation.
 */
import { lstat, readFile, realpath } from 'node:fs/promises';
import { basename, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { previewMcpImport, type McpImportPreview } from './mcp-import.js';
import { sanitizeMcpObservable } from './mcp-credentials.js';

export const MCP_DISCOVERY_FILE_NAMES = new Set([
  '.mcp.json',
  'mcp-servers.json',
  'mcp_servers.json',
  'mcp.json',
]);

export const MCP_DISCOVERY_PATH_SUFFIXES = [
  join('.dsh', 'dshmm', 'mcp.json'),
  join('.dsh', 'mcp.json'),
];

export const DEFAULT_DISCOVERY_MAX_FILE_BYTES = 256 * 1024; // 256 KiB
export const DEFAULT_DISCOVERY_MAX_FILES = 200;

export interface McpDiscoveryOptions {
  roots: string[];
  existingServerNames?: string[];
  maxFileBytes?: number;
  maxFiles?: number;
  /** For tests: override known file checks by returning candidate relative paths from root. */
}

export interface McpDiscoveryFileResult {
  root: string;
  path: string; // absolute, inside approved root
  relativePath: string;
  status: 'candidate' | 'malformed' | 'oversized' | 'unreadable' | 'unsupported' | 'skipped';
  bytes?: number;
  message?: string;
  preview?: McpImportPreview;
}

export interface McpDiscoveryResult {
  ok: boolean;
  roots: Array<{ requested: string; resolved?: string; ok: boolean; message?: string }>;
  files: McpDiscoveryFileResult[];
  stats: { roots: number; scanned: number; candidates: number; malformed: number; oversized: number; unreadable: number; skipped: number };
  scope: { filesystemScanOnly: true; projectRuntimeIsolation: false; note: string };
}

function isPathInside(parent: string, child: string): boolean {
  const rel = relative(resolve(parent), resolve(child));
  return rel === '' || (!rel.startsWith('..' + sep) && rel !== '..' && !isAbsolute(rel));
}

function normalizeRoots(roots: unknown): string[] {
  if (!Array.isArray(roots)) return [];
  const out: string[] = [];
  for (const r of roots) {
    if (typeof r !== 'string') continue;
    const t = r.trim();
    if (!t) continue;
    out.push(t);
  }
  return [...new Set(out)];
}

function isKnownDiscoveryPath(absPath: string, root: string): boolean {
  const base = basename(absPath);
  if (MCP_DISCOVERY_FILE_NAMES.has(base)) return true;
  const rel = relative(root, absPath);
  return MCP_DISCOVERY_PATH_SUFFIXES.some((suffix) => rel === suffix || rel.endsWith(sep + suffix));
}

async function safeResolveInsideRoot(rootReal: string, candidatePath: string): Promise<{ ok: true; path: string } | { ok: false; message: string }> {
  try {
    const st = await lstat(candidatePath);
    if (st.isSymbolicLink()) {
      const target = await realpath(candidatePath);
      if (!isPathInside(rootReal, target)) return { ok: false, message: 'Symlink target escapes approved search root' };
      return { ok: true, path: target };
    }
    const real = await realpath(candidatePath);
    if (!isPathInside(rootReal, real)) return { ok: false, message: 'Resolved path escapes approved search root' };
    return { ok: true, path: real };
  } catch (err: any) {
    return { ok: false, message: err?.code === 'ENOENT' ? 'File not found' : `Cannot resolve path safely: ${err?.code || 'error'}` };
  }
}

async function collectCandidates(rootAbs: string, rootReal: string): Promise<string[]> {
  // Explicit known paths only; do not walk arbitrary trees. This keeps discovery
  // bounded, avoids unexpected traversal, and limits exposure to approved roots.
  const checks = [
    ...[...MCP_DISCOVERY_FILE_NAMES].map((name) => join(rootAbs, name)),
    ...MCP_DISCOVERY_PATH_SUFFIXES.map((suffix) => join(rootAbs, suffix)),
  ];
  const found: string[] = [];
  for (const p of checks) {
    try {
      const st = await lstat(p);
      if (st.isFile() || st.isSymbolicLink()) found.push(p);
    } catch (err: any) {
      if (err?.code !== 'ENOENT' && err?.code !== 'ENOTDIR') {
        // ignore inaccessible known paths; root-level result reports root access issues
      }
    }
  }
  return found;
}

export async function discoverMcpConfigs(opts: McpDiscoveryOptions): Promise<McpDiscoveryResult> {
  const requestedRoots = normalizeRoots(opts.roots);
  const maxFileBytes = typeof opts.maxFileBytes === 'number' && opts.maxFileBytes > 0 ? opts.maxFileBytes : DEFAULT_DISCOVERY_MAX_FILE_BYTES;
  const maxFiles = typeof opts.maxFiles === 'number' && opts.maxFiles > 0 ? opts.maxFiles : DEFAULT_DISCOVERY_MAX_FILES;
  const existingServerNames = Array.isArray(opts.existingServerNames) ? opts.existingServerNames : [];
  const result: McpDiscoveryResult = {
    ok: requestedRoots.length > 0,
    roots: [],
    files: [],
    stats: { roots: 0, scanned: 0, candidates: 0, malformed: 0, oversized: 0, unreadable: 0, skipped: 0 },
    scope: { filesystemScanOnly: true, projectRuntimeIsolation: false, note: 'Filesystem discovery scans approved folders only. Scanning project folders does not imply project runtime isolation in V1.' },
  };
  if (!requestedRoots.length) {
    result.files.push({ root: '', path: '', relativePath: '', status: 'skipped', message: 'No approved search roots provided' });
    result.stats.skipped = 1;
    return sanitizeMcpObservable(result) as McpDiscoveryResult;
  }

  for (const requested of requestedRoots) {
    if (result.stats.scanned >= maxFiles) {
      result.roots.push({ requested, ok: false, message: `Discovery file limit reached (${maxFiles})` });
      continue;
    }
    const rootAbs = resolve(requested);
    let rootReal: string;
    try {
      rootReal = await realpath(rootAbs);
    } catch (err: any) {
      result.roots.push({ requested, resolved: rootAbs, ok: false, message: `Approved root unavailable: ${err?.code || 'error'}` });
      continue;
    }
    result.roots.push({ requested, resolved: rootReal, ok: true });
    result.stats.roots++;

    const candidates = await collectCandidates(rootAbs, rootReal);
    for (const candidatePath of candidates) {
      if (result.stats.scanned >= maxFiles) break;
      const safe = await safeResolveInsideRoot(rootReal, candidatePath);
      if (!safe.ok) {
        result.files.push({ root: rootReal, path: resolve(candidatePath), relativePath: relative(rootReal, resolve(candidatePath)), status: 'skipped', message: safe.message });
        result.stats.skipped++;
        continue;
      }
      if (!isKnownDiscoveryPath(safe.path, rootReal) && !isKnownDiscoveryPath(resolve(candidatePath), rootReal)) {
        result.files.push({ root: rootReal, path: safe.path, relativePath: relative(rootReal, safe.path), status: 'skipped', message: 'Not a known MCP discovery file name' });
        result.stats.skipped++;
        continue;
      }
      let st;
      try {
        st = await lstat(safe.path);
      } catch (err: any) {
        result.files.push({ root: rootReal, path: safe.path, relativePath: relative(rootReal, safe.path), status: 'unreadable', message: `Cannot stat file: ${err?.code || 'error'}` });
        result.stats.unreadable++;
        continue;
      }
      if (!st.isFile()) {
        result.files.push({ root: rootReal, path: safe.path, relativePath: relative(rootReal, safe.path), status: 'skipped', message: 'Not a regular file' });
        result.stats.skipped++;
        continue;
      }
      result.stats.scanned++;
      if (st.size > maxFileBytes) {
        result.files.push({ root: rootReal, path: safe.path, relativePath: relative(rootReal, safe.path), status: 'oversized', bytes: st.size, message: `File exceeds size limit (${st.size} > ${maxFileBytes} bytes)` });
        result.stats.oversized++;
        continue;
      }
      let rawText: string;
      try {
        rawText = await readFile(safe.path, 'utf8');
      } catch (err: any) {
        result.files.push({ root: rootReal, path: safe.path, relativePath: relative(rootReal, safe.path), status: 'unreadable', bytes: st.size, message: `Cannot read file: ${err?.code || 'error'}` });
        result.stats.unreadable++;
        continue;
      }
      let parsed: unknown;
      try {
        parsed = JSON.parse(rawText);
      } catch (err: any) {
        result.files.push({ root: rootReal, path: safe.path, relativePath: relative(rootReal, safe.path), status: 'malformed', bytes: st.size, message: 'Malformed JSON; file skipped gracefully' });
        result.stats.malformed++;
        continue;
      }
      const preview = previewMcpImport(parsed, { existingServerNames });
      const status = preview.ok ? 'candidate' : 'unsupported';
      if (status === 'candidate') result.stats.candidates++;
      else result.stats.skipped++;
      result.files.push({ root: rootReal, path: safe.path, relativePath: relative(rootReal, safe.path), status, bytes: st.size, preview: sanitizeMcpObservable(preview) as McpImportPreview, message: preview.ok ? undefined : (preview.issues[0]?.message || 'Unsupported MCP config structure') });
    }
  }

  return sanitizeMcpObservable(result) as McpDiscoveryResult;
}
