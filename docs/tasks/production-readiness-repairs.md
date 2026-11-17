# Production readiness repairs

## Intent

Apply the local repairs authorized after the initial production-readiness assessment. Correct participant-facing guidance to match the existing scenario controller and prevent the generated readiness report from breaking the repository formatting gate.

## Acceptance criteria

- Architecture and participant guidance describe same-origin synchronization, rejection of an unseen external update, protected unsaved state and deliberate import/reset replacement consistently with SYS-09/SYS-10.
- Keep the one-editing-tab recommendation and explain that synchronization does not guarantee atomic concurrent writes or cross-device sharing.
- Correct the adjacent obsolete candidate application instructions: candidates write their answer directly, and legacy notes/generated text remain preserved separately.
- Ignore only the generated readiness HTML in Prettier; validate its embedded state with the skill renderer.
- Run `./scripts/verify`, report any environment limitation accurately and run available relevant local checks without installing tools.
- Review the changes separately and refresh the readiness report, retaining the previous completed audit and current evidence identities.
- Review `FEATURES.md`; no register update is needed because these repairs do not change application behavior.

## Boundaries

No deployment, hosting purchase, authentication change or monitoring service selection is included. Missing deployment decisions and unavailable verification tools remain explicit open requirements.

## Validation and review

- Fixed the synchronization/recovery contradiction in architecture and participant guidance, including stale-action retries, protected unsaved state, explicit import/reset replacement and the one-editing-tab limit. Corrected the adjacent obsolete candidate proposal instructions.
- Confirmed that the generated checklist initially failed Prettier, then added only `docs/production-readiness.html` to `.prettierignore`. The complete formatting check now passes; the skill renderer remains responsible for checklist validation.
- `./scripts/verify` was attempted and exited 127 because `npm` is unavailable in this execution environment. No tools or browser binaries were installed. The expected Playwright Chromium executable is not provisioned, so the automated browser suite remains unexecuted.
- Available direct checks passed: Prettier, ESLint, TypeScript, 9 unit-test files / 66 tests, design-system integrity and 6 renderer tests, baseline packet verification and Vite production build. The build retains its existing warnings about dependency annotations and a JavaScript chunk over 500 kB.
- A temporary baseline participant package passed pristine verification: 226 files, baseline stage and no `.git`, `docs/source`, `docs/tasks` or readiness report. Both corrected guides were present in the output; the temporary package was removed.
- Manually repeated candidate submission, employer review, same-origin two-tab propagation and reload persistence against the static preview at `http://127.0.0.1:3106/`, using only synthetic data. Closed the second tab and reset the disposable test scenario afterward.
- Separately reviewed the documentation against `scenario-store.ts`, `store.tsx`, synchronization tests, the brief and SYS-09/SYS-10. Confirmed that no wording promises atomic concurrent writes or cross-device synchronization. `FEATURES.md` was reviewed and requires no change because application behavior is unchanged.
- The refreshed checklist retains the previous completed audit. Missing hosting, operational decisions, dependency audit and unavailable verification prerequisites remain open; local checks are not deployment evidence.
