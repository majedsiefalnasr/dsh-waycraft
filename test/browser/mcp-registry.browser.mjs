import assert from 'node:assert/strict';
import { test } from 'node:test';
import { launch } from './harness.mjs';
import { startMcpServer } from './mcp-harness.mjs';

const launched = await launch();
test('Registry search, cursor, review and explicit addition in EN/AR at narrow/wide widths', { skip: launched.skip }, async () => {
  const { browser } = launched;
  const server = await startMcpServer();
  try {
    for (const lang of ['en', 'ar']) for (const width of [390, 760]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const calls = [];
      await page.route('**/api/waycraft-mcp.manage', async route => {
        const body = route.request().postDataJSON(); calls.push(body);
        if (body.action !== 'registry_search') return route.continue();
        await route.fulfill({ json: { ok: true, registry: { servers: [{ name: `org.example/review-${lang}-${width}`, description: '<script>untrusted</script>', version: '1', remotes: [{ type: 'streamable-http', url: 'https://example.com/{tenant}/mcp', headers: [{ name: 'Authorization', required: true }] }] }, { name: 'org.example/package', description: 'Manual package setup', version: '1', remotes: [], hasPackages: true }], nextCursor: body.cursor ? undefined : 'opaque/+' } } });
      });
      try {
        await page.goto(server.url(lang));
        await page.getByRole('tab', { name: lang === 'ar' ? 'الاكتشاف والاستيراد' : 'Discover & Import' }).click();
        const search = page.getByRole('button', { name: lang === 'ar' ? 'بحث في السجل' : 'Search Registry', exact: true });
        await page.getByRole('textbox', { name: lang === 'ar' ? 'ابحث باسم الخادم' : 'Search server names' }).fill('review');
        await search.click();
        await page.getByRole('button', { name: lang === 'ar' ? 'الصفحة التالية' : 'Next page' }).click();
        assert.equal(calls.filter(c => c.action === 'registry_search')[1].query, 'review');
        assert.equal(calls.filter(c => c.action === 'registry_search')[1].cursor, 'opaque/+');
        await page.getByRole('button', { name: lang === 'ar' ? 'التفاصيل' : 'Details', exact: true }).last().click();
        assert.ok(await page.getByText(lang === 'ar' ? 'لا توجد نقطة HTTP مدعومة.' : 'No supported HTTP remote.', { exact: false }).isVisible());
        await page.getByRole('button', { name: lang === 'ar' ? 'التفاصيل' : 'Details', exact: true }).first().click();
        await page.getByRole('button', { name: lang === 'ar' ? 'مراجعة الإعداد' : 'Review configuration' }).click();
        const dialog = page.getByRole('dialog');
        const save = dialog.getByRole('button', { name: lang === 'ar' ? 'حفظ الإعداد' : 'Save configuration', exact: true });
        assert.equal(await save.isDisabled(), true);
        await dialog.locator('input[type=url]').fill('https://example.com/tenant/mcp');
        await dialog.locator('textarea').first().fill('Authorization: ${credential:API_KEY}plaintext');
        assert.equal(await save.isDisabled(), true);
        await dialog.locator('textarea').first().fill('Authorization: ${credential:API_KEY}');
        assert.notEqual(await save.getAttribute('aria-disabled'), 'true', await dialog.innerText());
        await save.click();
        await dialog.waitFor({ state: 'detached', timeout: 5000 });
        assert.equal(calls.filter(c => c.action === 'create').length, 1);
        assert.equal(calls.some(c => ['test_connection', 'approve_trust', 'refresh_tools', 'import_register'].includes(c.action)), false);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      } finally { await page.close(); }
    }
  } finally { await browser.close(); await server.close(); }
});
