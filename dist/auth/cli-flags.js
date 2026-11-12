/**
 * Provider-neutral CLI compatibility helpers: which `--flags` an installed CLI advertises on its help page and
 * which one it rejected at run time. Only flag names are read; nothing here touches a login.
 */
/** Every `--long-flag` named on a help page, or `undefined` when the text names none (so it is not a help page). */
export function parseHelpFlags(help) {
    const flags = new Set([...help.matchAll(/(?:^|[\s,|[(])(--[a-z][a-z0-9]*(?:-[a-z0-9]+)*)/gim)].map((match) => match[1].toLowerCase()));
    return flags.size ? flags : undefined;
}
/** The flag a CLI reports as unknown (commander and argparse wording), or `undefined`. */
export function refusedFlag(output) {
    return output
        .match(/(?:unknown option|unrecognized (?:option|argument)s?)[:\s]*['"`]?(--[a-z][a-z0-9-]*)/i)?.[1]
        ?.toLowerCase();
}
/**
 * Arguments to run with. Optional flags the CLI lacks (or already refused) are dropped; a required one the
 * CLI lacks is returned in `missing`. With no `supported` set (help unreadable) nothing is judged in advance.
 */
export function planCliArguments(parts, supported, refused) {
    const argv = [];
    const missing = [];
    for (const part of parts) {
        if (part.optional && refused.has(part.flag))
            continue;
        if (supported && !supported.has(part.flag)) {
            if (!part.optional)
                missing.push(part.flag);
            continue;
        }
        argv.push(...part.args);
    }
    return { argv, missing };
}
