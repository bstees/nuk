import { expect, test } from '@playwright/test';

import { expectNoA11yViolations } from './accessibility.js';

const storybook = 'http://127.0.0.1:6006';

async function openStory(page: Parameters<typeof expectNoA11yViolations>[0], id: string) {
  await page.goto(`${storybook}/iframe.html?viewMode=story&id=${id}`);
  await expect(page.locator('#storybook-root')).toBeVisible();
}

test('button story runs the real custom element and passes axe', async ({ page }) => {
  await openStory(page, 'components-actions--button');
  const button = page.locator('nuk-button').getByRole('button', { name: 'Start review' });
  await expect(button).toBeEnabled();
  await button.click();
  await expectNoA11yViolations(page);
});

test('form story supports shadow-DOM typing and narrow reflow', async ({ page }) => {
  await openStory(page, 'components-forms--field-patterns');
  await page.setViewportSize({ width: 320, height: 800 });
  const input = page.locator('nuk-text-field').getByRole('textbox', { name: 'Email address' });
  await expect(input).toHaveValue('reader@example.com');
  await input.fill('reviewer@example.com');
  await expect(input).toHaveValue('reviewer@example.com');
  const fitsViewport = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
  );
  expect(fitsViewport).toBe(true);
  await expectNoA11yViolations(page);
});

test('tabs implement arrow-key activation', async ({ page }) => {
  await openStory(page, 'components-disclosure-and-tabs--tabs');
  const overview = page.getByRole('tab', { name: 'Overview' });
  const activity = page.getByRole('tab', { name: 'Activity' });
  // Establish a deterministic starting point through the public interaction.
  await overview.click();
  await expect(overview).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('ArrowRight');
  await expect(activity).toHaveAttribute('aria-selected', 'true');
  await expectNoA11yViolations(page);
});

test('a configured company namespace registers tags and events together', async ({ page }) => {
  await openStory(page, 'configuration-custom-prefix--company-namespace');
  await expect(page.locator('acme-button')).toHaveCount(1);
  await expect(page.getByText('Public event: acme-press')).toBeVisible();
  await expectNoA11yViolations(page);
});
