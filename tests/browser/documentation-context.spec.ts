import { expect, test } from '@playwright/test';

const storybook = 'http://127.0.0.1:6006';

test('initial HTML identifies the project before JavaScript runs', async ({ request }) => {
  const response = await request.get(storybook);
  expect(response.ok()).toBe(true);
  const html = await response.text();
  expect(html.match(/<title>/g)).toHaveLength(1);
  expect(html).toContain('<title>nuk component system by Brent Stees - Storybook</title>');
  expect(html).toContain('name="author" content="Brent Stees"');
  expect(html).toContain('name="description"');
  expect(html).toContain('property="og:title"');
});

test('welcome connects the interactive reference to its owner, source, and limitations', async ({
  page,
}) => {
  await page.goto(`${storybook}/iframe.html?viewMode=docs&id=welcome-start-here--docs`);
  await expect(page.getByRole('heading', { name: 'nuk', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Brent Stees', exact: true })).toHaveAttribute(
    'href',
    'https://brentstees.com',
  );
  await expect(page.getByRole('link', { name: 'Source and local setup' })).toHaveAttribute(
    'href',
    'https://github.com/bstees/nuk',
  );
  await expect(page.getByRole('link', { name: 'API reference and known limits' })).toHaveAttribute(
    'href',
    'https://github.com/bstees/nuk/blob/main/docs/components.md',
  );
  await expect(page.getByRole('link', { name: 'Continuous-integration results' })).toHaveAttribute(
    'href',
    'https://github.com/bstees/nuk/actions',
  );
  await expect(page.getByText(/Manual screen-reader validation remains outstanding/)).toBeVisible();
});
