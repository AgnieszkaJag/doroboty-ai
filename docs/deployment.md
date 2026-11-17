# Private AIPH3 deployment

## Target and boundaries

- Source branch: `codex/pre-production` in `AgnieszkaJag/doroboty-ai`.
- Provider: Sites; identity and static output directory are in `.openai/hosting.json`.
- Address: <https://doroboty-ai-aiph3-preproduction.allegro-chat-6137.chatgpt.site>.
- Audience: the Site owner only. Changing access requires an explicit audience decision.
- The application needs no backend, database, runtime environment variables or external API credentials. Only synthetic data is allowed.
- Browser state belongs to the exact origin. Before moving a scenario, export it from the old origin and deliberately import it at the new address. A shared URL does not share scenario state.

## Release procedure

1. Inspect the branch and the existing `.openai/hosting.json`; reuse its Site ID.
2. Use Node.js 24 and the committed npm lockfile. Run `npm ci` when dependency inputs change or the checkout is fresh.
3. Run `./scripts/verify` and separately review the release changes. Preserve the actual outcome; a local pass does not establish remote CI success.
4. Obtain a source repository write credential for this Site through the Sites connector. Never put credentials in files, shell arguments, URLs or logs.
5. Run the installed Sites `scripts/site-workflow.mjs --project-id <manifest project_id>` helper. Supply the credential through its hidden stdin, the remaining build command `["node", "<sites-plugin-root>/scripts/build-site.mjs"]`, and an absolute archive path outside the source checkout.
6. Use the helper's verified source commit and unchanged archive to save and deploy the version. Confirm access with `get_site`; use the private operation only while owner-only access is confirmed.
7. Wait for a terminal deployment result and record the version, deployment ID, configuration revision and HTTPS URL in the readiness report. Push the final configuration/documentation to the GitHub branch.

The deployment archive contains the hosting manifest and built assets, not source history, instructor documents, task notes, node_modules or browser test reports. Inspect the archive before publication.

## Deployment smoke check

At the returned HTTPS address, use a disposable synthetic scenario:

1. Confirm the application loads, local assets work and a hash deep link survives reload.
2. Open the job list, use a filter and open an offer.
3. Select a candidate, submit a synthetic application, reload and confirm persistence.
4. Select the matching employer and confirm the submitted application is visible.
5. Check browser errors and failed requests; restore the disposable scenario after the check.

Owner-only Sites access may require signing in. A login page is not evidence that the application journey passed. Keep unresolved checks visible before admitting participants.

## Recovery and operation

- The Site owner controls publication and access through Sites. Course incident contacts and support arrangements must be agreed before participant admission.
- The first deployment has no previous hosted version. Keep it owner-private if the smoke check fails; repair and publish a new version before inviting users.
- For a later regression, select the previously verified saved version from Sites version history, deploy that version and repeat the smoke check. Record its version/deployment IDs. Rolling back application code does not restore a browser's scenario data.
- Use validated scenario export/import for browser data recovery. Hosting does not provide backups of localStorage.
- Do not collect application answers, CV contents or other private free text in logs. Monitoring, alert delivery, capacity/cost limits and a named incident response arrangement remain separate admission requirements until evidenced.

## Dependency advisory assessed for this release

The 2026-11-17 pre-deployment audit reports 18 high-severity dependency entries caused by one [picomatch ReDoS advisory](https://github.com/advisories/GHSA-fc5q-39xc-vjpf), updated that day. The registry's latest version is 4.0.7 and the advisory lists no patched version. These entries are confined to development tools; `npm audit --omit=dev` reports zero vulnerabilities and `npm ls picomatch --omit=dev --all` has no dependency entries.

This release serves prebuilt static assets. It does not deploy Node.js, Vite's development server, node_modules or a glob-processing endpoint. The application imports no picomatch/glob tool and accepts no glob patterns for a server. Build only reviewed source with trusted local configuration. Reassess the advisory before the next build; do not use a forced major downgrade or claim the full dependency audit is clean. This assessment does not establish the safety of a future server deployment or untrusted build inputs.
