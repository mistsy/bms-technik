import { defineConfig, devices } from '@playwright/test';

const chromiumLaunchOptions = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
  ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
  : {};

export default defineConfig({
  testDir: './test',
  testMatch: 'browser.spec.ts',
  fullyParallel: true,
  workers: 2,
  use: {
    baseURL: process.env.BMS_BROWSER_ORIGIN || 'http://127.0.0.1:8787',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { launchOptions: chromiumLaunchOptions, viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile', use: { launchOptions: chromiumLaunchOptions, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
    { name: 'webkit-iphone', use: { ...devices['iPhone 13'], browserName: 'webkit' } },
    { name: 'webkit-iphone-se', use: { ...devices['iPhone SE'], browserName: 'webkit' } },
  ],
  webServer: process.env.BMS_BROWSER_ORIGIN ? undefined : {
    command: 'npm run build && npm run preview -- --port 8787',
    url: 'http://127.0.0.1:8787',
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
});
