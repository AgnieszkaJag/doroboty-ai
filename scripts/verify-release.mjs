import { spawnSync } from "node:child_process";

function run(script, env) {
  const result = spawnSync("npm", ["run", script], { stdio: "inherit", env });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

// Exercise a deterministic, offline build before producing the configured artifact.
run("check", {
  ...process.env,
  VITE_POSTHOG_PROJECT_TOKEN: "",
  VITE_POSTHOG_HOST: "",
});
run("build", process.env);
