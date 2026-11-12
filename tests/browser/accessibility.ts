import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

type AxeResults = Awaited<ReturnType<AxeBuilder['analyze']>>;

/** Storybook's accessibility addon also runs axe in the page; wait for it instead of failing. */
async function analyze(page: Page): Promise<AxeResults> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .disableRules(['region'])
        .analyze();
    } catch (error) {
      const busy = error instanceof Error && error.message.includes('Axe is already running');
      if (!busy || attempt >= 20) throw error;
      await page.waitForTimeout(150);
    }
  }
}

export async function expectNoA11yViolations(page: Page): Promise<void> {
  const results = await analyze(page);
  expect(
    results.violations,
    results.violations
      .map((violation) => `${violation.id}: ${violation.help} (${String(violation.nodes.length)})`)
      .join('\n'),
  ).toEqual([]);
}
