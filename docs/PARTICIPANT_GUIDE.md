# Participant guide

## Start

Use the prepared baseline package and Node.js 24 with npm.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3001. If Node or registry access is blocked by your organization, ask your instructor/IT rather than bypassing the policy.

## Try a complete flow

1. Choose Anna Kowalska and browse offers.
2. Save an offer, edit the profile, write your application answer and approve it before submitting. A confirmed project card can optionally be attached.
3. Choose Karolina Wiśniewska for BrightLabs and review its candidates.
4. Record review, invitation, conversation and the next decision.
5. Return to Anna and inspect the application history.

Karolina and Tomasz see their respective companies in the interface; this is role simulation. All data is local and synthetic. CVs are prepared text examples, not real uploads. AI proposals and scores simulate the scenario.

## Save, share and recover

Changes survive reload in this browser. Settings can export a JSON file, import a scenario or reset to fixtures. Import/reset asks before replacing state. If a save is incompatible, download the original before resetting. Storage failure is shown explicitly; export before closing the tab.

Application answers save immediately as local drafts, including incomplete or empty text. Returning to an offer or reloading does not grant submission consent; approve the current text explicitly. When storage fails, the app warns before leaving and does not confirm a new application as sent.

## External usability test

For the three-person unmoderated round, open the deployed `/#/testy` guide. It provides the Polish task, synthetic-data boundary, prepared persona, stop instructions and feedback route. Starting a test optionally creates a random code for this tab; downloaded run summaries contain only that code, checkpoint times and a declared outcome. Reply to the inviter yourself; the app does not send feedback. A full scenario export contains all typed text and should be kept private.

Tabs opened at the same address and port synchronize saved scenario changes. If an action discovers a change from another tab, review the updated view before retrying. If this tab has unsaved changes and another tab changes the saved scenario, saving pauses; export your unsaved copy before deciding which scenario to keep. An unreadable external save is also protected from automatic overwrite. Use one editing tab at a time because simultaneous writes are not guaranteed to be atomic. Explicit import/reset replaces the shared scenario and updates the other tabs, so close them before importing or resetting.

A URL shares the interface, not your local changes. To transfer a scenario, share the exported file and import it in the other browser. Exports include all personas, applications and notes; never enter real personal data.

## Static build

Run npm run build. Serve dist/ through any static HTTP host. No provider account is needed for local development. Do not open index.html via file://; ES modules need HTTP. Hash links work without route rewrite configuration.

## Verification

Run ./scripts/verify or npm run check. Browser tests require provisioned Playwright Chromium; a missing test browser does not prevent npm run dev. Do not let an agent install system dependencies automatically.
