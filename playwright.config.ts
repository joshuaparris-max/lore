import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for the Dreadnought Drifters vertical slice.
 *
 * Tests run against the PRODUCTION build served by `vite preview`, so they also
 * validate the real bundle. WebGL is needed for the R3F canvas, so Chromium is
 * launched with SwiftShader/ANGLE flags to make it work in headless CI too.
 */
// Deliberately uncommon port so we never collide with (and silently reuse) a
// stray `vite dev`/`vite preview` a developer may already have running.
const PORT = 47823;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests/e2e',
  // Software WebGL (SwiftShader) is CPU-heavy; running specs in parallel starves
  // the GPU emulation and causes timeouts. Serialize for stability.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          // Enable software WebGL so the Three.js canvas renders headless.
          args: [
            '--use-gl=angle',
            '--use-angle=swiftshader',
            '--enable-unsafe-swiftshader',
            '--ignore-gpu-blocklist',
          ],
        },
      },
    },
  ],

  // Build + serve the production bundle for the duration of the test run.
  // reuseExistingServer:false guarantees every run tests the CURRENT build,
  // never a stale/foreign server left listening on the port.
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
