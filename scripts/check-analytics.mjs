import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const directory = mkdtempSync(join(tmpdir(), "doroboty-analytics-"));
const output = join(directory, "dist");
const env = {
  ...process.env,
  VITE_POSTHOG_PROJECT_TOKEN: "phc_synthetic_offline_verification_only",
  VITE_POSTHOG_HOST: "https://analytics.invalid",
  ANALYTICS_TEST_DIST: output,
};
function run(args) {
  const result = spawnSync("npm", ["exec", "--", ...args], { stdio: "inherit", env });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Analytics verification exited ${result.status ?? 1}.`);
}
try {
  run(["vite", "build", "--outDir", output, "--emptyOutDir"]);
  run(["playwright", "test", "--config", "playwright.analytics.config.ts"]);
} finally {
  rmSync(directory, { recursive: true, force: true });
}
