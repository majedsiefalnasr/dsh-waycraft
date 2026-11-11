// Opt-in real-browser checks for the MCP manager (npm run test:browser). Skips without Playwright/Chromium.
import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { launch, startServer } from './harness.mjs';
import { startMcpServer } from './mcp-harness.mjs';
import { readFileSync } from 'node:fs';
let ts;
try {
  ts = (await import('typescript')).default;
} catch {
  ts = (
    await import(
      '../../.agents/worktrees/impl/146-skill-manager/node_modules/typescript/lib/typescript.js'
    )
  ).default;
}

// Exercise current client source without rebuilding or overwriting the installed artifacts.
const source = ts.transpileModule(
  readFileSync(new URL('../../src/mcp-browser.ts', import.meta.url), 'utf8'),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
const sourceClient = `const waycraftMcpFactory = (require) => { const module = { exports: {} }; const exports = module.exports; ${source}; return module.exports; };`;
const visit = async (page, url) => {
  if (process.env.WAYCRAFT_MCP_SOURCE === '1')
    await page.route(
      (u) => u.pathname === '/',
      async (route) => {
        const response = await route.fetch();
        const html = (await response.text()).replace(
          /<script>const waycraftMcpFactory[\s\S]*?<\/script>/,
          () =>
            `<script>${sourceClient.replace(/<\/script>/g, '<\\/script>')}</script>`,
        );
        await route.fulfill({ response, body: html });
      },
    );
  await page.goto(url);
};

const launched = await launch();
const skip = launched.skip;
if (skip) console.log(`# test:browser skipped: ${skip}`);

describe('MCP manager in a real browser', { skip }, () => {
  const { browser } = launched;
  let server;
  before(async () => {
    server = await startMcpServer();
  });
  after(async () => {
    await browser?.close();
    await server?.close();
  });

  const open = async (lang = 'en', width = 760) => {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await visit(page, server.url(lang));
    await page.waitForSelector('.waycraft-mcp-card');
    return page;
  };

  test('JSON import dialog supports drop, validation and dirty-close confirmation in EN/AR', async () => {
    for (const lang of ['en', 'ar']) {
      const page = await open(lang, lang === 'ar' ? 390 : 760);
      await page
        .getByRole('button', {
          name:
            lang === 'ar' ? 'استيراد إعداد MCP' : 'Import MCP configuration',
          exact: true,
        })
        .click();
      const dialog = page.getByRole('dialog');
      await dialog.waitFor();
      await dialog.locator('input[type=file]').setInputFiles({
        name: 'servers.json',
        mimeType: 'application/json',
        buffer: Buffer.from('{"mcpServers":{"demo":{"command":"node"}}}'),
      });
      await page.waitForFunction(() =>
        document
          .querySelector('[role=dialog] textarea')
          .value.includes('mcpServers'),
      );
      assert.match(await dialog.locator('textarea').inputValue(), /mcpServers/);
      await dialog.locator('textarea').focus();
      await page.keyboard.press('Escape');
      await page.getByRole('alertdialog').waitFor();
      await page.getByRole('alertdialog').getByRole('button').first().click();
      await dialog.waitFor();
      await dialog.locator('.waycraft-mcp-dropzone').evaluate((el) => {
        const data = new DataTransfer();
        data.items.add(new File(['{}'], 'bad.yaml', { type: 'text/plain' }));
        el.dispatchEvent(
          new DragEvent('drop', {
            bubbles: true,
            cancelable: true,
            dataTransfer: data,
          }),
        );
      });
      await page.waitForFunction(
        () => document.querySelector('[role=dialog] textarea').value === '',
      );
      assert.ok(await dialog.getByRole('alert').count());
      assert.ok(
        await dialog.evaluate(
          (el) => el.getBoundingClientRect().right <= innerWidth,
        ),
      );
      await page.screenshot({ path: `/tmp/mcp-import-${lang}.png` });
      await page.close();
    }
  });

  test('rows are compact, collapsed, and the stats strip counts servers', async () => {
    const page = await open();
    assert.equal(await page.locator('article.waycraft-mcp-card').count(), 3);
    assert.equal(await page.locator('.waycraft-mcp-card-body').count(), 0);
    assert.equal(
      await page.locator('.waycraft-mcp-stat strong').first().textContent(),
      '3',
    );
    await page.close();
  });

  test('expanding a row reveals its actions; switch is a real switch', async () => {
    const page = await open();
    // Quick actions and the switch live in the collapsed row; expanding adds only the detail tabs.
    assert.equal(
      await page
        .getByRole('button', { name: 'Test connection', exact: true })
        .count(),
      0,
    );
    const more = page.getByRole('button', {
      name: 'More actions: github',
      exact: true,
    });
    await more.focus();
    await page.keyboard.press('ArrowDown');
    assert.ok(
      await page
        .getByRole('menuitem', { name: 'Edit', exact: true })
        .isVisible(),
    );
    const menu = await page.getByRole('menu').boundingBox();
    assert.ok(
      menu.width > 100 && menu.width < 220,
      `content-fit menu width, got ${menu.width}px`,
    );
    await page.keyboard.press('End');
    assert.equal(
      await page.evaluate(() =>
        document.activeElement.getAttribute('aria-label'),
      ),
      'Move to Trash',
    );
    await page.keyboard.press('Escape');
    assert.ok(await more.evaluate((el) => el === document.activeElement));
    await more.click();
    await page.locator('.waycraft-mcp-title').click();
    assert.equal(await page.getByRole('menu').count(), 0);
    await page.locator('.waycraft-mcp-row-toggle').first().click();
    const size = await page.getByRole('switch').first().boundingBox();
    assert.equal(size.width, 36);
    assert.equal(size.height, 20);
    assert.ok(
      await page.getByRole('tab', { name: 'Configuration' }).isVisible(),
    );
    assert.equal(await page.locator('.waycraft-mcp-about').count(), 0);
    assert.equal(
      await page.getByRole('switch').first().getAttribute('role'),
      'switch',
    );
    await page.close();
  });

  test('whole summary toggles once; independent controls and keyboard preserve disclosure state', async () => {
    for (const lang of ['en', 'ar']) {
      const page = await open(lang, 612);
      const row = page.locator('[data-waycraft-server="github"]');
      const toggle = row.locator('.waycraft-mcp-row-toggle');
      const expanded = async (value) =>
        assert.equal(await toggle.getAttribute('aria-expanded'), String(value));
      for (const part of [
        '.waycraft-mcp-row-title',
        '.waycraft-mcp-status',
        '.waycraft-mcp-row-sub',
      ]) {
        const box = await row.locator(part).boundingBox();
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        await expanded(true);
        const head = await row.locator('.waycraft-mcp-row-head').boundingBox();
        await page.mouse.click(head.x + head.width / 2, head.y + 2);
        await expanded(false);
      }
      const more = row.locator('[aria-haspopup=menu]');
      await more.click();
      await expanded(false);
      await page.keyboard.press('Escape');
      await expanded(false);
      await row.getByRole('switch').click();
      await page.waitForFunction(
        () =>
          !document.querySelector(
            '[data-waycraft-server="github"] [role=switch]',
          ).disabled,
      );
      await expanded(false);
      await row.locator('.waycraft-mcp-expand').click();
      await expanded(true);
      await row.locator('.waycraft-mcp-expand').click();
      await expanded(false);
      await toggle.focus();
      await page.keyboard.press('Enter');
      await expanded(true);
      await page.keyboard.press('Space');
      await expanded(false);
      await page.close();
    }
  });

  test('narrow width does not overflow horizontally', async () => {
    const page = await open('en', 360);
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    assert.ok(overflow <= 0, `horizontal overflow ${overflow}px`);
    await page.close();
  });

  test('filters use Skill-manager widths; Add dialog preserves dirty drafts in EN and AR', async () => {
    for (const lang of ['en', 'ar']) {
      const page = await open(lang, 612); // 580px content, matching the reported settings screenshots.
      const boxes = await page
        .locator('.waycraft-mcp-filterrow select')
        .evaluateAll((els) =>
          els.map((el) => ({
            width: el.getBoundingClientRect().width,
            y: el.getBoundingClientRect().top,
          })),
        );
      assert.equal(boxes.length, 3);
      assert.ok(
        boxes.every((b) => b.y === boxes[0].y && b.width === 150),
        JSON.stringify(boxes),
      );
      const search = await page
        .locator('.waycraft-mcp-toolbar input')
        .boundingBox();
      assert.ok(search.y > boxes[0].y, 'search occupies the following row');
      await page.setViewportSize({ width: 552, height: 900 });
      const narrow = await page
        .locator('.waycraft-mcp-filterrow select')
        .evaluateAll((els) =>
          els.map((el) => ({
            width: el.getBoundingClientRect().width,
            y: el.getBoundingClientRect().top,
          })),
        );
      assert.ok(
        narrow.every((b) => b.width === 520),
        JSON.stringify(narrow),
      );
      assert.ok(
        narrow[0].y < narrow[1].y && narrow[1].y < narrow[2].y,
        'narrow filters stack',
      );
      await page
        .getByRole('button', {
          name: lang === 'en' ? 'Add server' : 'إضافة خادم',
          exact: true,
        })
        .click();
      await page.locator('input[required]').first().fill('new-server');
      await page.setViewportSize({ width: 390, height: 900 });
      assert.equal(
        await page.locator('input[required]').first().inputValue(),
        'new-server',
      );
      assert.equal(
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth,
        ),
        0,
      );
      assert.ok(await page.locator('.waycraft-mcp-dialog-footer').isVisible());
      await page.keyboard.press('Escape');
      assert.ok(await page.getByRole('alertdialog').isVisible());
      await page
        .locator('[role=alertdialog] .waycraft-mcp-dialog-footer button')
        .first()
        .click();
      assert.equal(
        await page.locator('input[required]').first().inputValue(),
        'new-server',
      );
      await page.close();
    }
  });

  test('server summaries and toolbar use measured Skill-manager geometry', async () => {
    const skills = await startServer();
    try {
      for (const dark of [false, true]) {
        const fixture = await startMcpServer({ dark });
        try {
          for (const lang of ['en', 'ar'])
            for (const width of [390, 760]) {
              const pages = [];
              const measurements = [];
              for (const [kind, host] of [
                ['skills', skills],
                ['mcp', fixture],
              ]) {
                const page = await browser.newPage({
                  viewport: { width, height: 900 },
                });
                pages.push(page);
                if (kind === 'mcp') await visit(page, host.url(lang));
                else await page.goto(host.url(lang));
                const prefix = `.waycraft-${kind}`;
                await page.waitForSelector(`${prefix}-toolbar input`);
                // Both surfaces use the identical font, viewport and theme in this isolated harness.
                await page.evaluate((dark) => {
                  document.body.style.margin = '0';
                  document.body.toggleAttribute('data-ds-dark-theme', dark);
                  const root = document.documentElement.style;
                  root.setProperty(
                    '--dsw-alias-settings-card-fill',
                    dark ? '#252525' : '#f6f6f6',
                  );
                  root.setProperty(
                    '--dsw-alias-label-primary',
                    dark ? '#eee' : '#111',
                  );
                  root.setProperty(
                    '--dsw-alias-interactive-bg-hover',
                    dark ? '#333' : '#eee',
                  );
                }, dark);
                measurements.push(
                  await page.evaluate(
                    ({ kind, prefix }) => {
                      const row = document.querySelector(
                        kind === 'skills'
                          ? `${prefix}-source>summary`
                          : `${prefix}-row-head`,
                      );
                      const css = getComputedStyle(row);
                      const input = document.querySelector(
                        `${prefix}-toolbar input`,
                      );
                      const filter = document.querySelector(
                        `${prefix}-filterrow select, ${prefix}-toolbar select`,
                      );
                      const control = row.querySelector(`${prefix}-icon-btn`);
                      if (!input || !filter || !control)
                        throw new Error(
                          `${kind}: missing input=${!input} filter=${!filter} control=${!control}`,
                        );
                      return {
                        rowHeight: row.getBoundingClientRect().height,
                        padding: css.padding,
                        gap: css.gap,
                        searchHeight: input.getBoundingClientRect().height,
                        filterHeight: filter.getBoundingClientRect().height,
                        control: control.getBoundingClientRect().height,
                        radius: getComputedStyle(row.parentElement)
                          .borderRadius,
                      };
                    },
                    { kind, prefix },
                  ),
                );
                await page.screenshot({
                  path: `.scratch/mcp-parity/${kind}-${lang}-${width}-${dark ? 'dark' : 'light'}.png`,
                });
              }
              const [reference, actual] = measurements;
              for (const key of [
                'padding',
                'gap',
                'searchHeight',
                'filterHeight',
                'control',
                'radius',
              ])
                assert.equal(
                  actual[key],
                  reference[key],
                  `${lang}/${width}/${dark}: ${key}`,
                );
              assert.equal(actual.searchHeight, 32);
              assert.equal(actual.control, 28);
              if (width === 760)
                assert.equal(
                  actual.rowHeight,
                  reference.rowHeight,
                  'wide summaries share exact height',
                );
              else
                assert.ok(
                  actual.rowHeight <= reference.rowHeight,
                  'narrow MCP summary is no taller than the incumbent',
                );
              for (const page of pages) await page.close();
            }
        } finally {
          await fixture.close();
        }
      }
    } finally {
      await skills.close();
    }
  });

  test('More has usable intrinsic content in both languages, widths and themes', async () => {
    for (const dark of [false, true]) {
      const fixture = await startMcpServer({ dark });
      try {
        for (const lang of ['en', 'ar'])
          for (const width of [390, 760]) {
            const page = await browser.newPage({
              viewport: { width, height: 900 },
            });
            await visit(page, fixture.url(lang));
            const more = page.locator(
              '[data-waycraft-server="github"] [aria-haspopup="menu"]',
            );
            await more.click();
            const menu = page.getByRole('menu');
            const box = await menu.boundingBox();
            assert.ok(
              box.width > 100 && box.width < 220 && box.width <= width - 16,
              `intrinsic menu width ${box.width}`,
            );
            const intrinsic = await menu.evaluate((el) => {
              const widths = [...el.querySelectorAll('[role=menuitem]')].map(
                (item) => {
                  const range = document.createRange();
                  range.selectNodeContents(
                    [...item.childNodes].find(
                      (node) => node.nodeType === Node.TEXT_NODE,
                    ),
                  );
                  return range.getBoundingClientRect().width + 14 + 6 + 16;
                },
              );
              return Math.max(...widths) + 8;
            });
            assert.ok(
              Math.abs(box.width - intrinsic) <= 2,
              `menu ${box.width}px fits content ${intrinsic}px`,
            );
            assert.ok(
              box.x >= 8 && box.x + box.width <= width - 8,
              'menu fits viewport',
            );
            const items = await menu.getByRole('menuitem').evaluateAll((els) =>
              els.map((el) => ({
                text: el.textContent,
                width: el.clientWidth,
                overflow: el.scrollWidth > el.clientWidth,
                height: el.clientHeight,
              })),
            );
            assert.equal(items.length, 4);
            assert.ok(
              items.every(
                (item) =>
                  item.text.trim() &&
                  item.width > 90 &&
                  !item.overflow &&
                  item.height === 34,
              ),
              JSON.stringify(items),
            );
            assert.equal(
              box.height,
              144,
              'four native 34px items and 4px surface padding',
            );
            const itemStyle = await menu
              .getByRole('menuitem')
              .first()
              .evaluate((el) => {
                const css = getComputedStyle(el),
                  icon = el.querySelector('svg').getBoundingClientRect();
                return {
                  font: css.fontSize,
                  line: css.lineHeight,
                  padding: css.padding,
                  gap: css.gap,
                  icon: icon.width,
                };
              });
            assert.deepEqual(itemStyle, {
              font: '13px',
              line: '20px',
              padding: '6px 8px',
              gap: '6px',
              icon: 14,
            });
            assert.ok(
              await menu
                .getByRole('menuitem', {
                  name: lang === 'en' ? 'Test connection' : 'اختبار الاتصال',
                  exact: true,
                })
                .isVisible(),
            );
            const status = page.locator(
              '[data-waycraft-server="github"] .waycraft-mcp-status',
            );
            assert.match(await status.getAttribute('class'), /status-warning/);
            assert.ok(await status.getAttribute('aria-label'));
            assert.equal(
              await status.getAttribute('title'),
              await status.getAttribute('aria-label'),
            );
            await page.screenshot({
              path: `.scratch/mcp-refinement/${lang}-${width}-${dark ? 'dark' : 'light'}-menu.png`,
            });
            await page.keyboard.press('Escape');
            assert.ok(
              await more.evaluate((el) => el === document.activeElement),
            );
            await page.close();
          }
      } finally {
        await fixture.close();
      }
    }
  });

  test('status priority reflects explicit observations, never configuration or trust alone', async () => {
    const page = await browser.newPage();
    let disabled = false,
      trust = 'trusted',
      fingerprint = 'one',
      outcome = true;
    const actions = [];
    await page.route('**/api/waycraft-mcp.manage', async (route) => {
      const request = route.request().postDataJSON();
      actions.push(request.action);
      const data =
        request.action === 'test_connection'
          ? { test: { ok: outcome, message: 'Fixture observation' } }
          : {
              fingerprint: 'file',
              servers: [
                {
                  serverName: 'fixture',
                  config: { transport: 'stdio', command: 'fixture' },
                  disabled,
                  trust: { state: trust },
                  reviewedConfigFingerprint: fingerprint,
                },
              ],
              trashedServers: [],
            };
      await route.fulfill({ json: data });
    });
    await visit(page, server.url());
    const dot = page.locator('.waycraft-mcp-status');
    await dot.waitFor();
    assert.match(await dot.getAttribute('class'), /status-unknown/);
    assert.deepEqual(
      actions,
      ['status', 'list'],
      'rendering only checks component availability and lists configuration, never probes connections',
    );
    assert.equal(
      await page.locator('.waycraft-mcp-row-title .waycraft-mcp-badge').count(),
      0,
      'trusted has no badge',
    );
    const testConnection = async () => {
      await page.getByRole('button', { name: 'More actions: fixture' }).click();
      await page
        .getByRole('menuitem', { name: 'Test connection', exact: true })
        .click();
    };
    await testConnection();
    await page.locator('.waycraft-mcp-status-success').waitFor();
    outcome = false;
    await testConnection();
    await page.locator('.waycraft-mcp-status-error').waitFor();
    trust = 'invalidated';
    await page
      .getByRole('button', { name: 'Refresh servers', exact: true })
      .click();
    await page.locator('.waycraft-mcp-status-warning').waitFor();
    disabled = true;
    await page
      .getByRole('button', { name: 'Refresh servers', exact: true })
      .click();
    await page.locator('.waycraft-mcp-status-off').waitFor();
    disabled = false;
    trust = 'trusted';
    fingerprint = 'changed';
    await page
      .getByRole('button', { name: 'Refresh servers', exact: true })
      .click();
    await page.locator('.waycraft-mcp-status-unknown').waitFor();
    assert.equal(
      actions.filter((action) => action === 'test_connection').length,
      2,
    );
    await page.close();
  });

  test('area and detail tabs support keyboard navigation in EN/AR', async () => {
    for (const lang of ['en', 'ar']) {
      const page = await open(lang);
      const area = page.getByRole('tablist').first();
      const first = area.getByRole('tab').first();
      await first.focus();
      await page.keyboard.press(lang === 'ar' ? 'ArrowLeft' : 'ArrowRight');
      assert.equal(
        await area.getByRole('tab').nth(1).getAttribute('aria-selected'),
        'true',
      );
      assert.ok(
        await area
          .getByRole('tab')
          .nth(1)
          .evaluate((e) => e === document.activeElement),
      );
      await page.keyboard.press('End');
      assert.equal(
        await area.getByRole('tab').last().getAttribute('aria-selected'),
        'true',
      );
      await page.keyboard.press('Home');
      assert.equal(await first.getAttribute('aria-selected'), 'true');
      await page
        .locator('.waycraft-mcp-row-head')
        .first()
        .getByRole('button')
        .first()
        .click();
      const detail = page.getByRole('tablist').nth(1);
      await detail.getByRole('tab').first().focus();
      await page.keyboard.press(lang === 'ar' ? 'ArrowLeft' : 'ArrowRight');
      const selected = detail.getByRole('tab').nth(1);
      assert.equal(await selected.getAttribute('aria-selected'), 'true');
      assert.ok(await selected.evaluate((e) => e === document.activeElement));
      const panelId = await selected.getAttribute('aria-controls');
      assert.ok(panelId);
      const panel = page.locator(`[id="${panelId}"]`);
      assert.equal(
        await panel.getAttribute('aria-labelledby'),
        await selected.getAttribute('id'),
      );
      await page.keyboard.press('End');
      assert.equal(
        await detail.getByRole('tab').last().getAttribute('aria-selected'),
        'true',
      );
      await page.keyboard.press('Home');
      assert.equal(
        await detail.getByRole('tab').first().getAttribute('aria-selected'),
        'true',
      );
      await page.close();
    }
  });

  test('Arabic renders right-to-left', async () => {
    const page = await open('ar');
    assert.equal(
      await page.locator('.waycraft-mcp').getAttribute('dir'),
      'rtl',
    );
    await page.close();
  });

  test('Move to Trash asks in a modal dialog, Escape cancels and returns focus, confirming shows a toast', async () => {
    const page = await open();
    const opener = page.getByRole('button', {
      name: 'More actions: github',
      exact: true,
    });
    await opener.click();
    await page
      .getByRole('menuitem', { name: 'Move to Trash', exact: true })
      .click();
    assert.ok(await page.locator('[role=alertdialog]').isVisible());
    assert.ok(
      await page.evaluate(
        () => !!document.activeElement.closest('[role=alertdialog]'),
      ),
      'focus moves into the dialog',
    );
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('[role=alertdialog]').count(), 0);
    assert.ok(
      await opener.evaluate((el) => el === document.activeElement),
      'focus returns to More',
    );
    await opener.click();
    await page
      .getByRole('menuitem', { name: 'Move to Trash', exact: true })
      .click();
    await page.locator('.waycraft-mcp-dialog-footer button').last().click();
    await page.waitForSelector('.waycraft-mcp-toast');
    assert.match(
      await page.locator('.waycraft-mcp-toast').textContent(),
      /Moved to Trash/,
    );
    await page.close();
  });

  test('no section when the component route is not served (component disabled)', async () => {
    const s = await startMcpServer({ noRoute: true });
    const page = await browser.newPage();
    await page.goto(s.url('en'));
    await page.waitForTimeout(1200);
    assert.equal(await page.locator('.waycraft-mcp').count(), 0);
    await page.close();
    await s.close();
  });
});
