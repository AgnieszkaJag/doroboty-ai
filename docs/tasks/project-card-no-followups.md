# Project card: form followed by AI review

## Intent

The user requested removal of candidate clarification questions. The three-question initial form now leads directly to the existing local AI completeness report, preview and confirmation.

## Acceptance criteria

- No new follow-up prompts, intermediate follow-up screen or follow-up editing action.
- Incomplete narrative details remain report gaps rather than additional candidate questions; the existing AI report is otherwise unchanged.
- Legacy drafts in the followups workflow open the ordinary form. Previously written active extra answers remain readable and editable as legacy information within that form.
- Old saves/imports and submitted snapshots remain valid; no original source or historical snapshot is rewritten during loading.
- Update domain/browser regressions and the behavior register; run relevant checks, attempt the repository gate and review independently.

## Validation

- `./scripts/verify`: formatting, design-system integrity and renderer tests, lint, type checking, 37 unit tests, the 120-journey baseline packet and production build passed. Browser E2E could not launch because the provisioned Playwright Chromium executable is absent; no browser installation was attempted.
- Manual browser verification on a separate local test origin with synthetic data: a minimally completed form opens the existing AI report and preview directly, with zero clarification inputs and the confirmation action available.
- Domain regressions cover repeated review without generated questions, legacy answer editing/clearing, import compatibility and immutable submitted snapshots. The browser journey was updated for the direct flow.
- Independent read-only review found no material issues. Evidence screenshot: `artifacts/project-card/review-without-followups.jpg`.
