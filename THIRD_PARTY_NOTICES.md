# Third-party notices

## Components at a glance

| Component | Version / pin | License | Used for |
|---|---|---|---|
| V1ki/dsh-plugin-subscriptions | v0.9.12 (commit b802311) | MIT | Subscriptions (Codex, Antigravity, accounts, usage, Speed) |
| MichengAI dsh-skills-manager | v1.2.29 (commit 49037a9) | Apache-2.0 | Skill manager behavior (full license in `skills/LICENSE-APACHE-2.0`) |
| FishBottle7/opencode2dsh | v0.3.14 (commit 1aa2120) | MIT | OpenCode Zen identification and catalog |
| DeepSeek Harness | 0.2.1-rc.3 / 0.2.1-rc.5 | MIT | Native API-provider UI structure and the add icon |
| yaml | 2.8.1 | ISC | Skill frontmatter parsing (external runtime dependency) |
| fflate | 0.8.3 | MIT | ZIP handling (embedded in generated output) |
| lcestou dsh-oh-my-claude | 1.6.2 | MIT | Plan-review dialog structure and two deny messages for the Claude CLI control channel (#184) |

Per-ticket detail follows.

#151 Trash workflows (`src/skills-trash.ts`, host actions and EN/AR controls) adapt the same pinned dsh-skills-manager v1.2.29 under Apache-2.0; checked source ranges and local transaction differences are recorded in `src/PROVENANCE.md`. The full Apache license remains in `skills/LICENSE-APACHE-2.0`.

#150 local import/upload behavior (`src/skills-import.ts`, host routes and client controls) adapts the same pinned dsh-skills-manager v1.2.29 under Apache-2.0; checked ranges/local differences are in `src/PROVENANCE.md`. The existing complete Apache license is retained. `fflate` 0.8.3 (Copyright (c) 2026 Arjun Barrett, MIT) is a pinned external runtime dependency; no fflate source is embedded in generated output.

#146's conditional source-relative skill policy overlay adapts dsh-skills-manager v1.2.29, commit `49037a919b87b000de9003a49930425ae9742632`, under Apache License 2.0. The complete upstream license is retained in `skills/LICENSE-APACHE-2.0`; precise source ranges and local changes are recorded in `src/PROVENANCE.md`. Other skill-manager implementation is locally authored.

#147's registered-project and custom-source behavior (`src/skills-sources.ts`, the project and custom-source logic in `src/skills.ts`, and the matching controls in `src/skills-browser.ts`) adapts the same pinned reference under Apache License 2.0; ranges and local changes are recorded in `src/PROVENANCE.md`.

#148's category, note and navigation-placement behavior (the corresponding logic in `src/skills.ts` and `src/skills-browser.ts`) adapts the same pinned reference under Apache License 2.0; ranges and local changes are recorded in `src/PROVENANCE.md`.

#149's creation behavior and explicit-approval tool (`src/skills.ts` and `src/skills-browser.ts`) adapt the same pinned reference under Apache License 2.0; checked source ranges and local publication differences are recorded in `src/PROVENANCE.md`.

#146 uses `yaml` 2.8.1 (Eemeli Aro, ISC License) to parse skill frontmatter. It is a pinned runtime dependency in `package.json`; the built `dist/skills.js` imports it as an external package and does not embed it.

#137 adapts OpenCode Zen client identification, free-lane catalog and gate schemas from https://github.com/FishBottle7/opencode2dsh `v0.3.14`, commit `1aa212063cf68b0ad6f3ed310bca4588cf06c008`. MIT License, Copyright (c) 2026 FishBottle7. The complete MIT permission, inclusion condition and warranty disclaimer reproduced below apply to these adapted portions as well. See `src/PROVENANCE.md` for local changes.

#136's native API-provider UI narrowly adapts ModelsSection structure and styles from DeepSeek Harness `dsh-client-ui-settings-models` `0.2.1-rc.3`, https://github.com/deepseek-ai/deepseek-harness, under MIT. The precise source ranges and local adaptations are recorded in `src/PROVENANCE.md`. Controlled tests and public-remotes composition are locally authored.

#138 copies the general modules/addition icon (`icon.svg`) from `@deepseek-ai/dsh-experimental-plugin-market-bundle` `0.2.1-rc.5` in DeepSeek Harness (https://github.com/deepseek-ai/deepseek-harness). The DeepSeek MIT copyright, permission and disclaimer below apply to this asset. Source and local usage are recorded in `src/PROVENANCE.md`.

MIT License

Copyright (c) 2026 DeepSeek

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

#135 additionally ports Google Antigravity OAuth/provider and Gemini-shaped request/schema/thinking/stream translation, with its reference behavior and visible-model quota-filter tests, from V1ki/dsh-plugin-subscriptions v0.9.12 at `b8023110864494acefc6f5963c2a197d85dda20c` under MIT. The retained V1ki copyright and license in `src/PROVENANCE.md` apply; that record identifies owned lifecycle/composition and English/Arabic adaptations.

`dsh-waycraft` is released under the MIT License (see `LICENSE`). It includes the following third-party material.

| Component | Version | License | Location |
|---|---|---|---|
| Inter, Roboto, Open Sans, Noto Sans, Noto Sans Arabic, IBM Plex Sans, IBM Plex Sans Arabic (via Fontsource) | see `fonts/manifest.json` | SIL Open Font License 1.1 | `fonts/` (licenses in `fonts/LICENSE-*.txt`) |
| dsh-persian-rtl (chat direction CSS/logic, adapted) | n/a | MIT | `client.js` |

Subscriptions #128 adapts the exact authenticated Fetch RPC registration/envelope convention and closure-factory build recipe from [V1ki/dsh-plugin-subscriptions](https://github.com/V1ki/dsh-plugin-subscriptions), v0.9.12, commit b802311, MIT. Local changes and the license notice are recorded in `src/PROVENANCE.md`. That historical #128 slice contained no provider implementation. #129 additionally ports the pinned Codex and shared accounts/auth/translation/catalog/pool/retry code, compiled output and adapted tests; the exact inventory and local changes are recorded in `src/PROVENANCE.md`, together with the retained Copyright (c) 2026 V1ki MIT notice.

#130 additionally ports the pinned provider-settings, model-defaults, account-preferences, HTTP proxy, image account pool, Codex web-search provider, tool alias registration and the Codex-only `image_generate` tool, with adapted tests; the file-level map, the Codex-only changes and the excluded Grok/x_search/video surfaces are in `src/PROVENANCE.md`. The same copyright and MIT license apply.

The #129 visual correction additionally adapts the Codex presentation and helper styles from `src/client/SubscriptionsSection.tsx` and `src/client/provider-settings-styles.ts` at that same pin. Its scoped source map and render limitations are in `docs/ai/ticket-129-ui-parity.md`; the copyright/license above and in the provenance record continue to apply.

#131 additionally ports the composer usage badge, its display setting and preference store, the usage-window filter, the Speed control and the `/fast` command description from `src/client/` at that same pin, the `speed`/`setSpeed` host behavior from `src/auth/rpc.ts` and `src/index.ts`, and the matching tests; the file-level map is in `src/PROVENANCE.md` and the copyright/licence text above applies unchanged.

#132 additionally ports the pinned Claude provider, Anthropic translation, Claude CLI version detection and Claude Code credential reader from `src/providers/`, `src/translate/` and `src/auth/` at that same pin, adapts the Claude card, cache-lifetime Manage option and locale strings from `src/client/`, and ports the matching reference tests; the file-level map is in `src/PROVENANCE.md` and the copyright and MIT license above apply unchanged.

#133 additionally ports the pinned Grok provider, video and X tools, Grok image/edit extension, image gallery/lightbox and image/video toolviews, with reference tests. Owned namespace/storage, RPC, lifecycle and English/Arabic adaptations are inventoried in `src/PROVENANCE.md`. The same V1ki copyright and MIT license apply.

Ported source added by later components is listed here with its version, commit and the location of its provenance record. No provider account, trademark or service authorization follows from a code license.

#134 additionally ports GitHub Copilot, the device-flow engine, Chat Completions translation and their reference tests from the same v0.9.12 / b802311 MIT pin, with owned composition and EN/AR device-code card adaptations. See `src/PROVENANCE.md` for the inventory and local changes; the retained V1ki copyright and MIT notice apply.

#153 additionally adapts repository source parsing, hardened Git acquisition, GitHub archive scanning and subscription/tracked-install provenance workflows from `src/repository-git.ts` and `src/repositories.ts` of MichengAI/dsh-skills-manager v1.2.29 (commit 49037a919b87b000de9003a49930425ae9742632, Apache-2.0; license in `skills/LICENSE-APACHE-2.0`). Provenance record: `src/PROVENANCE.md` (#153). No reference runtime, state or updater is required.

#154 additionally adapts the repository content update and previous-version rollback workflow (preview of added/removed/modified files, local-modification consent, staged replacement with a retained backup, failure recovery, update/rollback availability) from `src/repository-updates.ts` and `src/repositories.ts` (lines 490-497) of MichengAI/dsh-skills-manager v1.2.29 (commit 49037a919b87b000de9003a49930425ae9742632, Apache-2.0; license in `skills/LICENSE-APACHE-2.0`). Provenance record: `src/PROVENANCE.md` (#154). No reference runtime, state or updater is required.

#155 additionally adapts the ClawHub and skills.sh catalog browsing, search, detail and install workflow (`clawhub-catalog.ts`, `skills-sh-catalog.ts`, `catalog-skill.ts`, catalog routes, catalog install records and catalog UI) of MichengAI/dsh-skills-manager v1.2.29 (commit 49037a919b87b000de9003a49930425ae9742632) under Apache License 2.0; the complete license remains in `skills/LICENSE-APACHE-2.0` and source ranges and local differences are recorded in `src/PROVENANCE.md`. No new third-party dependency is added.

#158's Skill manager navigation icon vector and `settings.section.icon` registration pattern adapt dsh-skills-manager v1.2.29 (commit 49037a919b87b000de9003a49930425ae9742632) under Apache License 2.0; the complete license remains in `skills/LICENSE-APACHE-2.0` and the record is in `src/PROVENANCE.md`.

#156's destination picker and project-scoped install destinations adapt the behavior of `destination-picker.ts` of dsh-skills-manager v1.2.29 (commit `49037a919b87b000de9003a49930425ae9742632`) under Apache License 2.0; the complete license remains in `skills/LICENSE-APACHE-2.0`. The code is independently authored; details are in `src/PROVENANCE.md`.

#184's plan-review dialog (`src/auth/claude-cli-control.ts`, `src/auth/claude-cli-plan-text.ts`) adapts the structure of the plan-review branch of `decide()` in `lib/server/adapter/class.js` and the plan-review wording of `lib/server/locale.js` from dsh-oh-my-claude 1.6.2 (https://www.npmjs.com/package/dsh-oh-my-claude), MIT License, Copyright (c) 2026 lcestou: the question id convention, the one-question `plan-review` layout with approve and keep-planning options, the approve test, and two deny messages. It is read from the installed package, which is not part of this repository. The rest of the control channel is authored from Anthropic's Agent SDK documentation. The complete MIT permission, inclusion condition and warranty disclaimer for dsh-oh-my-claude follow. See `src/PROVENANCE.md` (#184).

MIT License

Copyright (c) 2026 lcestou

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
