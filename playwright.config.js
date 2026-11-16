import { defineConfig } from '@playwright/test';

const externalUrl = process.env.CONTACTHUB_TEST_URL;
const baseURL = externalUrl || 'http://127.0.0.1:4174';

export default defineConfig({
  testDir: 'tests/e2e',
  reporter: 'list',
  forbidOnly: Boolean(process.env.CI),
  fullyParallel: true,
  workers: 2,
  use: {
    baseURL,
    channel: process.env.CONTACTHUB_CHROMIUM_CHANNEL || undefined,
    trace: 'retain-on-failure',
  },
  webServer: externalUrl ? undefined : {
    command: 'npm run preview -- --port 4174 --strictPort',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
});
