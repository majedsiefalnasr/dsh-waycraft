import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { launch } from './harness.mjs';
import { startMcpServer } from './mcp-harness.mjs';

const launched = await launch();
after(async () => {
  await launched.browser?.close();
});
test('Registry search, cursor, review and explicit addition in EN/AR at narrow/wide widths', {
  skip: launched.skip,
}, async () => {
  const { browser } = launched;
  const server = await startMcpServer();
  try {
    for (const lang of ['en', 'ar'])
      for (const width of [390, 760]) {
        const page = await browser.newPage({
          viewport: { width, height: 900 },
        });
        const calls = [];
        await page.route('**/api/waycraft-mcp.manage', async (route) => {
          const body = route.request().postDataJSON();
          calls.push(body);
          if (body.action !== 'registry_search') return route.continue();
          await route.fulfill({
            json: {
              ok: true,
              registry: {
                servers: [
                  {
                    name: `org.example/review-${lang}-${width}`,
                    description: '<script>untrusted</script>',
                    version: '1',
                    remotes: [
                      {
                        type: 'streamable-http',
                        url: 'https://example.com/{tenant}/mcp',
                        headers: [{ name: 'Authorization', required: true }],
                      },
                    ],
                  },
                  {
                    name: 'org.example/package',
                    description: 'Manual package setup',
                    version: '1',
                    remotes: [],
                    hasPackages: true,
                  },
                ],
                nextCursor: body.cursor ? undefined : 'opaque/+',
              },
            },
          });
        });
        try {
          await page.goto(server.url(lang));
          await page
            .getByRole('tab', {
              name: lang === 'ar' ? 'الاكتشاف والاستيراد' : 'Discover & Import',
            })
            .click();
          const search = page.getByRole('button', {
            name: lang === 'ar' ? 'بحث في السجل' : 'Search Registry',
            exact: true,
          });
          await page
            .getByRole('textbox', {
              name: lang === 'ar' ? 'ابحث باسم الخادم' : 'Search server names',
            })
            .fill('review');
          await search.click();
          await page
            .getByRole('button', {
              name: lang === 'ar' ? 'الصفحة التالية' : 'Next page',
            })
            .click();
          assert.equal(
            calls.filter((c) => c.action === 'registry_search')[1].query,
            'review',
          );
          assert.equal(
            calls.filter((c) => c.action === 'registry_search')[1].cursor,
            'opaque/+',
          );
          await page
            .getByRole('button', {
              name: lang === 'ar' ? 'التفاصيل' : 'Details',
              exact: true,
            })
            .last()
            .click();
          assert.ok(
            await page
              .getByText(
                lang === 'ar'
                  ? 'لا توجد نقطة HTTP مدعومة.'
                  : 'No supported HTTP remote.',
                { exact: false },
              )
              .isVisible(),
          );
          await page
            .getByRole('button', {
              name: lang === 'ar' ? 'التفاصيل' : 'Details',
              exact: true,
            })
            .first()
            .click();
          await page
            .getByRole('button', {
              name: lang === 'ar' ? 'مراجعة الإعداد' : 'Review configuration',
            })
            .click();
          const dialog = page.getByRole('dialog');
          const save = dialog.getByRole('button', {
            name: lang === 'ar' ? 'حفظ الإعداد' : 'Save configuration',
            exact: true,
          });
          assert.equal(await save.isDisabled(), true);
          await dialog
            .locator('input[type=url]')
            .fill('https://example.com/tenant/mcp');
          await dialog
            .locator('textarea')
            .first()
            .fill('Authorization: ${credential:API_KEY}plaintext');
          assert.equal(await save.isDisabled(), true);
          await dialog
            .locator('textarea')
            .first()
            .fill('Authorization: ${credential:API_KEY}');
          assert.notEqual(
            await save.getAttribute('aria-disabled'),
            'true',
            await dialog.innerText(),
          );
          await save.click();
          await dialog.waitFor({ state: 'detached', timeout: 5000 });
          assert.equal(calls.filter((c) => c.action === 'create').length, 1);
          assert.equal(
            calls.some((c) =>
              [
                'test_connection',
                'approve_trust',
                'refresh_tools',
                'import_register',
              ].includes(c.action),
            ),
            false,
          );
          assert.equal(
            await page.evaluate(
              () => document.documentElement.scrollWidth > innerWidth,
            ),
            false,
          );
        } finally {
          await page.close();
        }
      }
  } finally {
    await server.close();
  }
});

const L = {
  en: {
    tab: 'Discover & Import',
    query: 'Search server names',
    search: 'Search Registry',
    next: 'Next page',
    details: 'Details',
    review: 'Review configuration',
    manual: 'No supported HTTP remote.',
    retry: 'Retry',
  },
  ar: {
    tab: 'الاكتشاف والاستيراد',
    query: 'ابحث باسم الخادم',
    search: 'بحث في السجل',
    next: 'الصفحة التالية',
    details: 'التفاصيل',
    review: 'مراجعة الإعداد',
    manual: 'لا توجد نقطة HTTP مدعومة.',
    retry: 'إعادة المحاولة',
  },
};
const remoteServer = (name) => ({
  name,
  description: 'Remote',
  version: '1',
  remotes: [
    { type: 'streamable-http', url: 'https://example.com/mcp', headers: [] },
  ],
  hasPackages: false,
});
const ok = (servers, nextCursor) => ({
  json: {
    ok: true,
    registry: { servers, ...(nextCursor ? { nextCursor } : {}) },
  },
});
const focusInRegistry = (page) =>
  page.evaluate(() => {
    const active = document.activeElement;
    return (
      !!active &&
      active !== document.body &&
      !!active.closest('section[aria-label]')
    );
  });

/** Runs `body` for every language and width after a first search, with a scripted registry_search handler. */
async function eachVariant(respond, body) {
  const server = await startMcpServer();
  try {
    for (const lang of ['en', 'ar'])
      for (const width of [390, 760]) {
        const page = await launched.browser.newPage({
          viewport: { width, height: 900 },
        });
        const calls = [];
        const searches = () =>
          calls.filter((c) => c.action === 'registry_search');
        await page.route('**/api/waycraft-mcp.manage', async (route) => {
          const request = route.request().postDataJSON();
          calls.push(request);
          if (request.action !== 'registry_search') return route.continue();
          const { status = 200, json } = respond(request, searches().length);
          await route.fulfill({ status, json });
        });
        try {
          const l = L[lang];
          await page.goto(server.url(lang));
          await page.getByRole('tab', { name: l.tab }).click();
          await page.getByRole('textbox', { name: l.query }).fill('review');
          await page
            .getByRole('button', { name: l.search, exact: true })
            .click();
          await body({ page, l, searches, where: `${lang}@${width}` });
          assert.equal(
            calls.some((c) =>
              [
                'create',
                'test_connection',
                'approve_trust',
                'refresh_tools',
                'import_register',
              ].includes(c.action),
            ),
            false,
          );
          assert.equal(
            await page.evaluate(
              () => document.documentElement.scrollWidth > innerWidth,
            ),
            false,
          );
        } finally {
          await page.close();
        }
      }
  } finally {
    await server.close();
  }
}

test('Registry package-only and unsupported-transport entries offer no configuration review', {
  skip: launched.skip,
}, async () => {
  const names = [
    'org.example/package-only',
    'org.example/sse-only',
    'org.example/file-url',
  ];
  await eachVariant(
    () =>
      ok([
        {
          name: names[0],
          description: 'Package',
          version: '1',
          remotes: [],
          hasPackages: true,
        },
        {
          name: names[1],
          description: 'SSE',
          version: '2',
          remotes: [
            { type: 'sse', url: 'https://example.com/sse', headers: [] },
          ],
          hasPackages: false,
        },
        {
          name: names[2],
          description: 'File',
          version: '3',
          remotes: [
            { type: 'streamable-http', url: 'file:///etc/hosts', headers: [] },
          ],
          hasPackages: false,
        },
      ]),
    async ({ page, l, where }) => {
      for (const name of names) {
        const article = page.locator('article', { hasText: name });
        await article
          .getByRole('button', { name: l.details, exact: true })
          .click();
        assert.ok(
          await article.getByText(l.manual, { exact: false }).isVisible(),
          `${where} ${name} manual note`,
        );
        assert.equal(
          await article.getByRole('button', { name: l.review }).count(),
          0,
          `${where} ${name} has no review`,
        );
      }
      assert.equal(await page.getByRole('dialog').count(), 0);
    },
  );
});

test('Registry error shows an alert and Retry repeats the same search with focus kept in the panel', {
  skip: launched.skip,
}, async () => {
  await eachVariant(
    (request, n) =>
      n === 1
        ? {
            status: 502,
            json: {
              ok: false,
              error: 'Registry is unavailable (HTTP 503). Retry later.',
              code: 'registry_upstream',
            },
          }
        : ok([remoteServer('org.example/after-retry')]),
    async ({ page, l, searches, where }) => {
      const alert = page.getByRole('alert');
      await alert.waitFor();
      assert.match(
        await alert.innerText(),
        /Registry is unavailable \(HTTP 503\)/,
        where,
      );
      assert.equal(
        await page.locator('article').count(),
        0,
        `${where} no stale results`,
      );
      await alert.getByRole('button', { name: l.retry }).click();
      await page.getByText('org.example/after-retry').waitFor();
      assert.equal(
        await page.getByRole('alert').count(),
        0,
        `${where} alert cleared`,
      );
      assert.equal(searches().length, 2);
      assert.equal(searches()[1].query, 'review');
      assert.equal(searches()[1].cursor, undefined);
      assert.ok(
        await focusInRegistry(page),
        `${where} focus kept in the Registry panel after retry`,
      );
    },
  );
});

test('Registry stops paging when the upstream repeats a cursor', {
  skip: launched.skip,
}, async () => {
  const cursors = [undefined, 'c1', 'c2', 'c1'];
  await eachVariant(
    (request, n) => ok([remoteServer(`org.example/page-${n}`)], cursors[n]),
    async ({ page, l, searches, where }) => {
      const next = page.getByRole('button', { name: l.next });
      for (const n of [2, 3]) {
        await next.click();
        await page.getByText(`org.example/page-${n}`).waitFor();
        assert.ok(
          await focusInRegistry(page),
          `${where} focus kept in the Registry panel after page ${n}`,
        );
      }
      assert.deepEqual(
        searches().map((c) => c.cursor),
        [undefined, 'c1', 'c2'],
      );
      assert.equal(
        await next.count(),
        0,
        `${where} repeated cursor c1 hides Next page`,
      );
    },
  );
});

test('Registry details keep focus on the toggle and the review dialog returns focus to its opener', {
  skip: launched.skip,
}, async () => {
  await eachVariant(
    () => ok([remoteServer('org.example/focus')]),
    async ({ page, l, where }) => {
      const details = page.getByRole('button', {
        name: l.details,
        exact: true,
      });
      await details.click();
      assert.equal(await details.getAttribute('aria-expanded'), 'true');
      assert.ok(
        await details.evaluate((el) => el === document.activeElement),
        `${where} focus on Details`,
      );
      const review = page.getByRole('button', { name: l.review });
      await review.focus();
      await page.keyboard.press('Enter');
      const dialog = page.getByRole('dialog');
      await dialog.waitFor();
      assert.ok(
        await dialog.evaluate((el) => el.contains(document.activeElement)),
        `${where} focus moved into dialog`,
      );
      await page.keyboard.press('Escape');
      await dialog.waitFor({ state: 'detached' });
      assert.ok(
        await review.evaluate((el) => el === document.activeElement),
        `${where} focus returned to Review configuration`,
      );
      await details.click();
      assert.equal(await details.getAttribute('aria-expanded'), 'false');
      assert.equal(await review.count(), 0);
    },
  );
});
