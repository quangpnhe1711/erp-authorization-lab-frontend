import { defineConfig, devices } from '@playwright/test'

const BACKEND = process.env.BACKEND_ORIGIN ?? 'http://localhost:8080'
const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:5173'

/**
 * The suite drives the real backend: every assertion about rows and columns is an assertion about
 * the permission engine, not about a mock. Single worker so the one config-mutating test cannot
 * race the read-only ones.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.E2E_NO_SERVER
    ? undefined
    : {
        command: 'npm run dev -- --port 5173 --strictPort',
        url: BASE_URL,
        reuseExistingServer: true,
        timeout: 120_000,
        env: { BACKEND_ORIGIN: BACKEND },
      },
})
