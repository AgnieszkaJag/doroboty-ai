# Three-person unmoderated test operation

## Scope and admission

The owner plans three independent external participants, each receiving a link and instructions. Use synthetic data and the candidate journey only. Persona selection is not authentication; applications are local simulations. No real CV, customer data, paid upgrade, public source package, session recording or automatic feedback transmission is part of this test.

Invite only after the repaired Netlify artifact has passed the hosted gate, canonical smoke and live safe-event check. Keep the approved deploy locked during the window. Do one internal rehearsal first. Record its code as an internal rehearsal; never count it among the three participants. Existing historical baseline data is not research evidence for this release.

## Owner and support

The project owner sending the invitations is also the incident owner and publication/rollback decision maker. On November 18, 2026, the owner explicitly accepted handling reports through replies to her invitations. Before sending, she states the monitored test window and when participants can expect a reply; no response-time promise is silently made by code. If availability changes, pause invitations.

Stop invitations on any blocked core journey, data-loss warning, wrong-person data exposure, unexpected private telemetry, unavailable site or repeated uncategorized failure. Record deploy, approximate time, safe run code, affected step and error category. Preserve local exports privately only when necessary. Use the [rollback/recovery procedure](deployment.md); require a successful rehearsal of the fix before restarting. No external messages are authorized or sent by this document.

## Invitation content for the owner

Send each participant the canonical `/#/testy` link after deployment and the agreed completion date. The Polish in-app guide provides the task, prepared Anna persona, synthetic-project example, approximate 15-minute duration, local-state limits, stop/recovery instructions and feedback questions. Use one tab per participant. Do not send the instructor repository or historical case materials.

Ask participants to return: run code if used, whether the task was completed, confusing step, missing information, device/browser and approximate failure time. They can attach the safe downloaded run summary. The summary contains only a random code, checkpoint timestamps and a declared outcome. It does not include the scenario or form text. They can test without a research code; DNT/ad blockers/network failures can prevent analytics, so a missing event is not proof of abandonment.

## Evidence and privacy

- `research_test_started` / `research_test_completed` / `research_test_blocked`: voluntary lifecycle and declared outcome.
- `project_card_add_clicked` / `project_card_confirmed` / `application_submitted`: attempted creation and successful persisted domain checkpoints. A click is not a successful submission. A completed participant declaration is not independent proof of both checkpoints.
- `prototype_error`: fixed category (`storage_read`, `storage_write`, `storage_conflict`, `invalid_action`, `render`, `uncaught`, `unhandled_rejection`) and normalized route, with no raw message, stack, text or object IDs.
- All payloads use an explicit property allowlist. No `identify`, person properties, persistent SDK identity, DOM text/attributes or replay. The optional random run code is session-scoped and persists across reloads in the same tab.
- A browser's local scenario persists until reset/site-data removal; it is not a research backup. After feedback is safely received, participants may reset their synthetic scenario or clear the site data. They should preserve a copy before doing so if troubleshooting is still open.

On November 18, 2026, the owner accepted deleting links between invitations, feedback and run codes within 30 days after the last test. She handles the invitation replies and keeps these research records private; retain only anonymized themes afterwards. State the resulting calendar deadline in the invitation once the final test date is scheduled. No research record was deleted by this preparation work.

PostHog has a separate event lifecycle. Read-only `events-retention-get` on November 18, 2026 returned no project or organization override, a 12-month default/plan period and `default_period_deletes=true`. Query filtering is not yet active (`retention_months=null`); the first cleanup pass is March 3, 2027 and no project-specific deletion is currently scheduled. Describe this as a 12-month default with provider-scheduled cleanup, never an immediate or exact 30-day deletion guarantee. The organization currently has one member with the owner role; project access control is off, so organization membership governs access. Reassess access when inviting a collaborator. The client records no replay or person profiles. These are inspected existing settings, not changes made by this repair. [PostHog event-retention reference](https://posthog.com/docs/data/events-retention).

The Polish privacy page discloses the separate 30-day research-link policy and 12-month default event period. Resetting browser data removes the local scenario; it does not delete provider events or feedback already sent to the owner.

## Capacity, cost and diagnostics

This is a finite three-person pilot with local domain work, no server mutation API, no provider AI and no binary upload. Do not perform a load test, raise quotas or upgrade plans. Before admission, the owner checks the Netlify build/bandwidth/credit allowance and the PostHog product-events allowance/current usage; record actual numbers and billing protections in the readiness report. Their account limits cannot be inferred from the public site or from three local browser contexts. Stop the test if budget protections or the available allowance are unclear.

Read-only account inspection on November 18, 2026 found Netlify Free at $0 with 239.3/300 credits remaining, 60.7 consumed (60 from four production deploys), one concurrent build and no overage charges according to the account UI. A later PostHog Billing read reported a free account with no active paid subscription, Product analytics 51/1,000,000 events, a 1,000,000 free allocation, `no_billing_limit=false` and no exceeded limit. These are account snapshots, not a future guarantee or an invoice; recheck after publishing and after the three attempts. No billing setting or plan was changed.

For this small round, the incident owner checks the canonical URL and PostHog immediately before inviting, after the first completed attempt and at the end of the announced window. Run `npm run smoke -- https://dorobotyaiaj.netlify.app/`; inspect `prototype_error` and successful checkpoints by run code and time. A local analytics-unavailable test verifies that blocked telemetry cannot prevent drafting or submission; it cannot establish ingestion reliability.

Netlify can notify about failed deploys through **Project configuration → Notifications → Deploy notifications** ([official reference](https://docs.netlify.com/deploy/deploy-notifications/)). Configure a recipient only with the owner's authorization and verify a delivered test notification before claiming alert readiness. No external recipient or notification was configured by this repair. Manual checks are documented support coverage; they do not prove an automatic alert exists or was delivered.

Prepared alert specification for review: **DoRoboty prototype errors**, count `prototype_error` on the canonical normalized site URL, hourly insight intervals and hourly checks of the ongoing interval, upper bound 0. Notify the current project owner by email only after that recipient/delivery is authorized. Use a fixed threshold rather than an AI detector; do not upgrade to a faster paid cadence. Create/reuse one saved insight, inspect existing alerts to avoid duplication, simulate the threshold and verify an authorized delivered test. Until then this remains a specification and the alert requirement stays unverified. [PostHog alert documentation](https://posthog.com/docs/alerts).

## Observation completion

Keep a private three-row log (participant alias, run code or “no code”, device/browser, start/end, result, issue, follow-up). Do not create participant records in source or commit names/feedback. After all three attempts and returned feedback:

1. Reconcile manual outcomes with safe checkpoints, noting missing telemetry and interrupted/repeated attempts explicitly.
2. Record every blocking defect; stop the next round until fixed and rechecked. Qualitative findings from three participants do not establish conversion rates or statistical effects.
3. Inspect actual Netlify/PostHog usage and cost changes for the test window; compare with the recorded allowance and budget.
4. Update the observation stage of the readiness HTML with actual evidence. A local test, an internal rehearsal or an older deployment cannot pass these observation requirements.
