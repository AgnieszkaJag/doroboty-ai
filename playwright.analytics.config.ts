import { defineConfig, devices } from "@playwright/test";
import { isAbsolute } from "node:path";

const output = process.env.ANALYTICS_TEST_DIST;
if (!output || !isAbsolute(output)) throw new Error("Use npm run test:analytics.");
const quote = (value: string) => `'${value.replaceAll("'", "'\\''")}'`;

export default defineConfig({
  testDir: "./tests/analytics",
  workers: 1,
  retries: 0,
  forbidOnly: !!process.env.CI,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3107",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run preview -- --port 3107 --outDir ${quote(output)}`,
    url: "http://127.0.0.1:3107",
    reuseExistingServer: false,
  },
});
