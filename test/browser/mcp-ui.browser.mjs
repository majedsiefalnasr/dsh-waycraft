// Opt-in real-browser checks for the MCP manager (npm run test:browser). Skips without Playwright/Chromium.
import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { launch } from './harness.mjs';
import { startMcpServer } from './mcp-harness.mjs';

const launched = await launch();
const skip = launched.skip;
if (skip) console.log(`# test:browser skipped: ${skip}`);

describe('MCP manager in a real browser', { skip }, () => {
  const { browser } = launched;
  let server;
  before(async () => { server = await startMcpServer(); });
  after(async () => { await browser?.close(); await server?.close(); });

  const open = async (lang = 'en', width = 760) => {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto(server.url(lang));
    await page.waitForSelector('.waycraft-mcp-card');
    return page;
  };

  test('rows are compact, collapsed, and the stats strip counts servers', async () => {
    const page = await open();
    assert.equal(await page.locator('article.waycraft-mcp-card').count(), 3);
    assert.equal(await page.locator('.waycraft-mcp-card-body').count(), 0);
    assert.equal(await page.locator('.waycraft-mcp-stat strong').first().textContent(), '3');
    await page.close();
  });

  test('expanding a row reveals its actions; switch is a real switch', async () => {
    const page = await open();
    await page.locator('.waycraft-mcp-row-toggle').first().click();
    assert.ok(await page.getByRole('button', { name: 'Test connection' }).isVisible());
    assert.equal(await page.getByRole('switch').first().getAttribute('role'), 'switch');
    await page.close();
  });

  test('narrow width does not overflow horizontally', async () => {
    const page = await open('en', 360);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert.ok(overflow <= 0, `horizontal overflow ${overflow}px`);
    await page.close();
  });

  test('Arabic renders right-to-left', async () => {
    const page = await open('ar');
    assert.equal(await page.locator('.waycraft-mcp').getAttribute('dir'), 'rtl');
    await page.close();
  });

  test('no section when the component route is not served (component disabled)', async () => {
    const s = await startMcpServer({ noRoute: true });
    const page = await browser.newPage();
    await page.goto(s.url('en'));
    await page.waitForTimeout(1200);
    assert.equal(await page.locator('.waycraft-mcp').count(), 0);
    await page.close(); await s.close();
  });
});
