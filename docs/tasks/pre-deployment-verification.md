# Pre-deployment verification

## Intent

Complete the local verification authorized by the user before selecting hosting: provide npm and the Playwright Chromium browser, run the complete project gate and assess current dependency advisories.

## Acceptance criteria

- Use the existing Node.js 24 runtime, npm and `package-lock.json`; introduce no second package manager.
- Provision the missing npm CLI and the browser required by the locked Playwright version in a task-scoped tools directory, without installing operating-system dependencies or changing system configuration.
- Perform a clean dependency installation and run `./scripts/verify`, including the existing browser journeys against the local static preview.
- Run `npm audit`, inspect relevant advisory details and resolve applicable local defects without changing the product's simulation/data boundaries.
- Preserve unrelated files and record actual command outcomes, browser-test results and any remaining blocker.
- Review any repairs separately, re-run appropriate checks and refresh the existing readiness HTML while retaining completed audit history.
- Review `FEATURES.md` and update it only if application behavior changes.

## Boundaries

The user explicitly authorized provisioning the missing verification tools, running the full gate and assessing dependencies. Hosting, deployment, paid services and production data remain outside this task.

## Results

- Prepared npm 12.2.2 with the existing Node.js 24.22.3 runtime under `/private/tmp/doroboty-preflight-tools/`. Verified the npm tarball against the SHA-512 integrity published by the official registry. Configuration/cache and browser files are task-scoped; no system or OS dependencies were installed.
- Downloaded Playwright's required Chromium 153.0.8010.12, revision 1243, headless shell and FFmpeg through the installed Playwright 1.63.0 CLI. The environment file at `/private/tmp/doroboty-preflight-tools/env.sh` selects these tools for this local verification session; participant setup remains Node.js 24 with npm.
- Completed `npm ci` before and after the dependency repair. npm 12's default policy blocked the esbuild/fsevents lifecycle scripts; the shipped platform binaries were available and the actual build checks exercised them. No lifecycle-script approval or OS installation was added.
- The initial complete gate passed formatting, design-system checks, lint, types, 66 unit tests, baseline verification and build, then reported 35 passing / 9 failing browser tests. The failures were locator mismatches: implicit textarea labels after restoring content, repeated source/analysis excerpts, multiple live status regions and the recruiter source disclosure introduced by the existing material-review UI.
- Updated the existing E2E assertions to select the application's named textbox and exact save message, scope source checks to the card preview, and explicitly verify/open the recruiter source disclosure. Exact content, persistence, consent, snapshots and source immutability assertions remain. All nine repaired browser tests passed with retries disabled.
- The initial `npm audit` reported 10 moderate dependency findings tracing to [GHSA-g3hv-75wg-m249](https://github.com/isaacs/minimatch/security/advisories/GHSA-g3hv-75wg-m249). Updated typescript-eslint within major version 8 to 8.73.0 and scoped a minimatch 11.0.1 override to `@ts-morph/common`, used by the shadcn development CLI. The upstream common dependency used by this CLI remains on minimatch 10; the override avoids an unrelated shadcn downgrade or broad override of ESLint's minimatch 3 dependency.
- Confirmed that runtime dependency records are unchanged. Exercised ts-morph's in-memory source discovery/glob matching with the patched dependency and checked that the shadcn CLI starts. The subsequent complete dependency audit returned zero findings at every severity.
- Separately reviewed the source diffs and confirmed that the repairs change development dependencies and test targeting, with no changes to product React code, styling, domain operations or storage. `FEATURES.md` was reviewed and needs no behavioral update.
- The final full-gate result, exact source/configuration identity, participant package verification and refreshed readiness findings are recorded in `docs/production-readiness.html`. Tool provisioning and local success do not establish GitHub CI execution, deployment or course approval.
