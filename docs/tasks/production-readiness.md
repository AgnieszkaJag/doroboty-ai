# Production readiness assessment

## Intent

Run the `production-readiness` workflow against the current DoRoboty.ai AIPH3 teaching prototype and save its offline checklist at `docs/production-readiness.html`. Assess local preparation separately from a future hosted deployment and real-use observation. Treat the project brief, case protocol, current feature register and implementation as evidence; do not imply that local checks verify a hosted release.

## Acceptance criteria

- Record the current source fingerprint and concrete local environment without inventing a Git commit or configuration revision.
- Evaluate every baseline checklist item, preserving its stable ID, stage and required status. Use `pass` only for current evidence; explain exclusions and leave inaccessible or future-stage checks open.
- Record only non-secret evidence and distinguish repository inspection from executed commands and human confirmations.
- Explain the next actionable step, blockers and later deployment/observation checks in Polish.
- Keep the assessment offline and self-contained. Do not deploy, alter application behavior, install tools, or modify production data.
- Inspect the generated checklist in a browser if the available interface permits it; otherwise record the limitation.
- Record that `FEATURES.md` was reviewed and needs no update because this assessment does not change product behavior.

## Scope

Current local source and the local preparation stage. The target hosting provider and any deployment URL are not established in the project brief. Deployment and real-use evidence remain separate follow-up work.

## Execution notes

- Reviewed `BRIEF.md`, `docs/case/CASE_PROTOCOL.md`, `TODO.md`, `FEATURES.md`, the security/data-flow guides, package scripts and local deployment configuration.
- Built the production bundle and exercised the candidate submission, employer review and reload-persistence flow in an isolated local preview origin using synthetic personas and data.
- Direct local checks passed: Prettier, design-system integrity/example checks, ESLint, TypeScript, 66 unit tests, baseline packet verification, Vite production build and creation/verification of a temporary baseline participant package.
- `./scripts/verify` could not start because `npm` is absent from this execution environment. Playwright E2E was not run because the required Playwright Chromium binary is not provisioned; no browser or OS dependencies were installed. The end-to-end flow was checked manually in the browser against the built static preview.
- This change adds only an assessment record and offline checklist. `FEATURES.md` was reviewed and does not need an update because application behavior did not change.
