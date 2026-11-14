/**
 * Provider-neutral CLI compatibility helpers: which `--flags` an installed CLI advertises on its help page and
 * which one it rejected at run time. Only flag names are read; nothing here touches a login.
 */

/** Every `--long-flag` named on a help page, or `undefined` when the text names none (so it is not a help page). */
export function parseHelpFlags(help: string): Set<string> | undefined {
  const flags = new Set(
    [
      ...help.matchAll(/(?:^|[\s,|[(])(--[a-z][a-z0-9]*(?:-[a-z0-9]+)*)/gim),
    ].map((match) => match[1]!.toLowerCase()),
  );
  return flags.size ? flags : undefined;
}

/** The flag a CLI reports as unknown (commander and argparse wording), or `undefined`. */
export function refusedFlag(output: string): string | undefined {
  return output
    .match(
      /(?:unknown option|unrecognized (?:option|argument)s?)[:\s]*['"`]?(--[a-z][a-z0-9-]*)/i,
    )?.[1]
    ?.toLowerCase();
}

/** One argument group the driver passes: the flag that must exist, the arguments, and whether a run can do without it. */
export interface CliArgument {
  flag: string;
  args: string[];
  optional?: boolean;
}

/**
 * Arguments to run with. Optional flags the CLI lacks (or already refused) are dropped; a required one the
 * CLI lacks is returned in `missing`. With no `supported` set (help unreadable) nothing is judged in advance.
 */
export function planCliArguments(
  parts: readonly CliArgument[],
  supported: ReadonlySet<string> | undefined,
  refused: ReadonlySet<string>,
): { argv: string[]; missing: string[] } {
  const argv: string[] = [];
  const missing: string[] = [];
  for (const part of parts) {
    if (part.optional && refused.has(part.flag)) continue;
    if (supported && !supported.has(part.flag)) {
      if (!part.optional) missing.push(part.flag);
      continue;
    }
    argv.push(...part.args);
  }
  return { argv, missing };
}
