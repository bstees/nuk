import { expect, test } from '@playwright/test';

import { expectNoA11yViolations } from './accessibility.js';

const digest = 'http://127.0.0.1:4321';

test('home, issue, topic, sources, and methodology routes are static and linked', async ({
  page,
}) => {
  await page.goto(digest);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('link', { name: /customizable select/iu }).first()).toBeVisible();
  await expectNoA11yViolations(page);

  for (const path of [
    '/issue/issue-001/',
    '/topics/',
    '/topic/accessibility/',
    '/sources/',
    '/about/',
    '/archive/',
  ]) {
    const response = await page.goto(`${digest}${path}`);
    expect(response?.status()).toBe(200);
    await expect(page.locator('main')).toBeVisible();
  }
});

test('theme override is explicit and persistent', async ({ page }) => {
  await page.goto(digest);
  const toggle = page.getByRole('button', { name: /color theme/iu });
  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', /dark|light/u);
  const stored = await page.evaluate(() => localStorage.getItem('signal-interface-theme'));
  expect(stored).toMatch(/dark|light/u);
});

test('RSS and sitemap preserve canonical URLs', async ({ request }) => {
  const rss = await request.get(`${digest}/rss.xml`);
  expect(rss.ok()).toBe(true);
  expect(await rss.text()).toContain('<rss');

  const sitemap = await request.get(`${digest}/sitemap.xml`);
  expect(sitemap.ok()).toBe(true);
  expect(await sitemap.text()).toContain('<urlset');
});
