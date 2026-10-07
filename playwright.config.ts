import { defineConfig } from '@playwright/test';

const liveUrl = process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: './tests/browser',
  timeout: 30_000,
  retries: 0,
  workers: 1,
  reporter: [['list'], ['json', { outputFile: 'test-results/browser-results.json' }]],
  use: { baseURL: liveUrl || 'http://127.0.0.1:4173/marriott-trip-planner/', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { browserName: 'chromium', viewport: { width: 1366, height: 900 } } },
    { name: 'narrow', use: { browserName: 'chromium', viewport: { width: 390, height: 844 } } },
  ],
  ...(liveUrl ? {} : {
    webServer: {
      command: 'npm run preview -- --host 127.0.0.1',
      url: 'http://127.0.0.1:4173/marriott-trip-planner/',
      reuseExistingServer: false,
      timeout: 30_000,
    },
  }),
});
