# PostHog browser analytics

## Intent

Add the PostHog JavaScript SDK to the DoRoboty.ai teaching prototype so a configured production build can report pageviews and useful browser interactions. Keep the prototype frontend-only and use only synthetic data. Do not identify personas, transmit scenario state or form content, or record sessions.

## Acceptance criteria

- The PostHog project token and ingestion host come from Vite build-time environment variables. Missing values or a development build leave analytics disabled and make no PostHog requests.
- Pageviews use stable route categories; search query text, record IDs and dynamic slugs do not leave the browser.
- Autocapture is limited to button clicks on public routes. Forms, input values, copied text, element text/attributes and private workspace interactions are excluded.
- Candidate project-card creation buttons emit one explicit event with only a normalized route; no card, offer, profile or form data is attached.
- SDK persistence is in memory, Do Not Track is respected, session replay is disabled, and no user/person identity is assigned.
- The privacy page explains when browser analytics is active and what the prototype does and does not send.
- `FEATURES.md` updates the existing SYS-03/OPS-11 entries without changing their IDs. The participant setup explains how to configure the project token and regional host without committing credentials.
- Focused unit coverage checks route normalization and that private or unknown routes do not enable interaction autocapture.
- Run `./scripts/verify` and perform a separate source review; report actual results and any live-configuration limits.

## Implementation notes

No project credentials belong in Git or participant source packages. The browser project token is a public ingestion key and is supplied only as a production build variable.

## Production configuration

- Netlify project `dorobotyaiaj` publishes `codex/pre-production` automatically.
- `VITE_POSTHOG_PROJECT_TOKEN` and `VITE_POSTHOG_HOST` are configured in the Netlify Production deploy context only. Preview, branch-deploy and local contexts remain unset.
- The host is `https://eu.i.posthog.com`, matching PostHog project 355474.
- Production deploy `6afd3959620f2a58161e42bd` published commit `878d585`.
- PostHog project 355474 has `autocapture_opt_out=false`; session recording remains disabled.
- A live hourly trends query for the last 24 hours showed 12 `$pageview`, 4 `$autocapture` and 2 `project_card_add_clicked` events in the current partial UTC hour. A public offer button click produced a successful PostHog `/i/v0/e/` request (HTTP 200). Counts include the synthetic browser verification session and the current hour is incomplete.
- The project-card action is covered by the explicit `project_card_add_clicked` event; broad Autocapture stays limited to public-route button clicks by design. The candidate project-card buttons on private app routes are excluded from `$autocapture` and emit the normalized custom event instead.

## Validation

- Node.js 24.22.3: Prettier, design-system integrity (67 files and 333 references), six design-system checks, ESLint, TypeScript, 69 unit tests, participant-packet verification and Vite production build passed.
- `./scripts/verify` could not start because `npm` is not available in this shell. The Playwright browser gate also could not start because its web server command invokes `npm run preview`.
- Live PostHog verification observed pageviews, `$autocapture` and the explicit project-card event. A fresh public button click generated an ingestion request that returned HTTP 200, and the events appeared in the project trend query.

## Separate review

Reviewed the final analytics diff for configuration gating, normalized route properties, the explicit project-card event payload and SDK privacy settings. The project-card event contains only the normalized route; development builds stay disabled, and session recording remains off. No blocking source findings.
