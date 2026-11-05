import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: "http://localhost:3100",
    browserName: "chromium",
    channel: process.platform === "win32" ? "msedge" : undefined,
    viewport: { width: 1366, height: 768 },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run start -- --port 3100",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
