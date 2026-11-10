import { defineConfig, devices } from '@playwright/test';

const ci = process.env.CI === 'true';

export default defineConfig({
  expect: { timeout: 10_000 },
  forbidOnly: ci,
  fullyParallel: true,
  outputDir: 'test-results',
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  reporter: ci ? [['github'], ['html', { open: 'never' }]] : 'list',
  retries: ci ? 2 : 0,
  testDir: 'tests/browser',
  timeout: 30_000,
  use: {
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  webServer: [
    {
      command:
        'pnpm storybook:build && pnpm --filter @nuk-ui/storybook exec vite preview --host 127.0.0.1 --port 6006 --strictPort --outDir storybook-static',
      reuseExistingServer: !ci,
      stderr: 'pipe',
      stdout: 'pipe',
      timeout: 120_000,
      url: 'http://127.0.0.1:6006',
    },
    {
      command:
        'pnpm digest:build && pnpm --filter @nuk-ui/digest exec vite preview --host 127.0.0.1 --port 4321 --strictPort --outDir dist',
      reuseExistingServer: !ci,
      stderr: 'pipe',
      stdout: 'pipe',
      timeout: 120_000,
      url: 'http://127.0.0.1:4321',
    },
  ],
});
