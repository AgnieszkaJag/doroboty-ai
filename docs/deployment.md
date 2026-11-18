# Netlify release and recovery

## Target and boundaries

- Repository: `AgnieszkaJag/doroboty-ai`, production branch `codex/pre-production`.
- Public prototype: <https://dorobotyaiaj.netlify.app/>. This teaching prototype remains separate from the public DoRoboty portal. Use synthetic data only; persona selection is a simulation.
- Publish only `dist/`. Never publish the checkout, participant source archive, instructor evidence, exports, `.env`, Git history or test reports.
- The prior private Sites deployment is historical: [retained runbook](deployment-sites-history.md). Do not use it as proof of the Netlify configuration.
- The audited deployed source was `878d58597e8a56153a40d84a5d30e88deb84cad9`, deploy `6afd3959620f2a58161e42bd`. The local repair package is not deployed merely by editing these files.

## Release gate

1. Confirm the intended commit, review its diff and update `FEATURES.md`. Preserve a JSON export of any disposable browser scenario used for a rehearsal.
2. Use Node.js 24, npm and `package-lock.json`. Install with `npm ci` in a fresh checkout. CI/Netlify provisions Playwright Chromium; local `npm run dev` never installs browsers or system tools.
3. Run `./scripts/verify` and separately review the changes. `npm run check:release` repeats the complete check with PostHog configuration blank, then rebuilds `dist` with the original production environment only after success. Domain/browser tests therefore cannot send events to the production project.
4. `netlify.toml` sets the hosted build to provision Chromium and run `check:release`, publishing `dist` only after it exits successfully. Its file settings take precedence over matching UI build settings. Verify the first hosted log actually uses this command; a local pass does not prove the remote build image has browser libraries or that GitHub CI ran. [Netlify configuration](https://docs.netlify.com/build/configure-builds/file-based-configuration/).
5. Inspect Netlify's production build variables without copying values into logs: `VITE_POSTHOG_PROJECT_TOKEN` must be the public project ingestion token, and `VITE_POSTHOG_HOST` must be `https://eu.i.posthog.com` for project `355474`. Never use a personal API key. No backend/provider secret belongs in a `VITE_` variable. Analytics configuration is compiled into the artifact and needs a new build when changed.
6. The branch is automatically published by Netlify. Before pushing a release during a test window, lock the currently published deploy in Netlify. This requires the owner's publication decision. Do not infer permission to publish from an audit result.
7. After the hosted build passes, inspect its immutable deploy URL and run `npm run smoke -- https://<deploy-id>--dorobotyaiaj.netlify.app/`. In an isolated browser complete: fresh deep link/persona selection, offer/filter, project create/analyze/human confirmation, attached application with consent, reload, employer detail, export/import, narrow screen and keyboard navigation. Inspect errors and failed requests.
8. Check fresh `$autocapture` public button/link clicks, `application_start_clicked`, `project_card_add_clicked`, `project_card_confirmed`, `application_submitted` and safe `prototype_error` events in PostHog. In Activity → Explore events, select the event and use at least the last 24 hours when checking earlier traffic; the default last-hour window can hide existing records. Disable internal/test exclusions only when inspecting the synthetic rehearsal. Clicks are separate from pageviews, and masked autocapture elements have no text labels. Private routes keep explicit events only. Use a voluntary test run code to distinguish the synthetic rehearsal from participants; verify payloads contain no free text or dynamic route IDs. Replay stays disabled in the client.
9. Record exact commit, deploy ID, main asset hash, configuration revision, smoke time and result in `production-readiness.html`. Publish the reviewed deploy deliberately, then repeat the smoke check at the canonical URL. Freeze that deploy for the three-person test window.

`npm run smoke` performs only bounded read-only HTTP checks (8-second timeout, at most two attempts per resource). It does not submit data, inspect analytics delivery or establish user success. Do not replace browser checks with its result.

## Freeze and rollback

The primary fallback for the pending repaired release is the currently published `878d585` artifact, deploy `6afd3959620f2a58161e42bd`. Its exact immutable URL <https://6afd3959620f2a58161e42bd--dorobotyaiaj.netlify.app/> and the canonical URL both returned HTTP 200 in the November 18 check. A local exact-source build also passed the synthetic draft export/import round trip. Keep this immutable deploy ID before publishing a new release; the `a75c666` version below is an older secondary fallback.

- Lock the published deploy before inviting participants; new builds may still complete but will not replace the frozen site. Record the frozen deploy ID in the invitation log. [Netlify deploy management](https://docs.netlify.com/deploy/manage-deploys/manage-deploys-overview/).
- The older successful deploy is `6afcc08455fce5e098e5fc46`, source `a75c666`, immutable URL <https://6afcc08455fce5e098e5fc46--dorobotyaiaj.netlify.app/>. Confirm it remains available before relying on it. Once the repaired release is approved, the current `878d585` deploy is another code fallback, with the known draft/deep-link limitations recorded in audit history.
- On November 18 the unauthenticated previous-deploy HTTP probe returned 401, while the canonical site returned 200 and passed the static smoke. Verify rollback access in the owner's Netlify console before admission. The separate local `a75c666` archive build and version-1 draft export/import round trip passed; that establishes local compatibility, not a production rollback or access to the protected immutable URL.
- If HTML/assets fail, a main journey is blocked, private text appears in analytics or repeated unexpected errors occur: stop invitations, retain the failure time and run code, and lock publication. Select the last verified successful deploy and use **Publish Deploy**; keep it locked so a later Git build cannot overwrite the rollback. Do not delete local browser data.
- Run the canonical static smoke and an isolated candidate/reload journey. Record the recovery interval and tell affected participants through the existing invitation thread after the owner authorizes that communication. No automatic messages are sent by the app.
- Rehearse by opening a previous immutable deploy and validating a synthetic version-1 export/import locally. This is a safe code/data compatibility rehearsal, not an executed production rollback. Publishing an old artifact is a separate production action.

## Browser data recovery

The app has no server-side scenario database. The exact origin owns localStorage; another deployment subdomain or device has different state. A code rollback does not restore or remove browser data.

1. On a storage warning, keep the tab open. Do not reset or clear site data. Submission is blocked when the new application cannot be persisted; unsaved in-memory edits trigger the browser's leave-page warning.
2. Open **Ustawienia → Eksportuj dane** and save the current scenario. If offered, also download **Poprzedni zapis**. These files contain all typed text; do not attach them to public issues or telemetry.
3. In a disposable browser context on the intended origin, import a synthetic copy, confirm the replacement and reload. Check persona, project, draft/attachment and application. Never overwrite the participant's only copy while diagnosing.
4. If import fails, retain the original file and report the fixed error category/run code. Unsupported or corrupt imports must not overwrite the existing scenario. Use reset only after deliberately preserving the copy.

## Operation and admission

Follow [the three-person test runbook](external-tests.md) for the invitation, support, incident ownership, retention decision and observation criteria. A prepared runbook does not prove a notification was delivered, a quota was checked or a new version was published. The readiness HTML keeps these evidence gaps open.

Before each release, run a fresh dependency audit only with the owner's approval to send dependency names/versions to the npm registry. The owner explicitly approved this transmission on November 18, 2026. That day's runtime audit reported zero advisories; the full audit reported 18 development-tool entries from one unpatched picomatch advisory. The exposure assessment and limits are recorded in [the repair task](tasks/external-test-readiness-repairs.md). Reassess future results; do not call the full audit clean or apply forced tooling downgrades.
