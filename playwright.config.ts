import { defineConfig, devices } from '@playwright/test'
import 'dotenv/config'

const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000'

// See https://playwright.dev/docs/test-configuration
export default defineConfig({
  testDir: './tests/e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'html' : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: 'chromium' },
    },
  ],
  // Needs Postgres running: `docker compose up -d db`.
  webServer: {
    command: 'pnpm dev',
    reuseExistingServer: true,
    url: baseURL,
  },
})
