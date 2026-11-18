# PostHog click coverage and event visibility

## Intent

Make public navigation clicks visible in PostHog alongside pageviews. The owner's Activity URL selects `$autocapture` with `after: -1h`; the four existing records were captured on November 18, 2026 at 06:06–06:17 UTC, outside that window. Separately, the application only allows button elements, excluding native links such as job cards and application navigation. Existing aggregate counts therefore do not establish current click coverage.

Use the existing SDK and strict property allowlist. Preserve the current working-tree repair package, hash routes, local domain state, personless analytics and disabled replay. Do not change production settings, publish the branch or attribute technical verification traffic to participants.

## Acceptance criteria

- Capture public native links as `$autocapture`, including keyboard activation and links on offer section URLs, while continuing to capture public buttons.
- Retain only an allowlisted interactive tag (`a` or `button`) in the element chain. Do not send text, hrefs, selectors, DOM IDs/attributes, queries or scenario data. Reject non-click events.
- Keep private/unknown routes and form controls outside automatic capture. Application navigation emits a fixed `application_start_clicked` event before entering the private route; opening an already submitted application must not count as starting one.
- Verify real SDK ingestion packets using the existing fake-token, fully intercepted browser suite; assert public button/link packets, application navigation, private-route exclusions and absence of synthetic private markers.
- Update SYS-03, the Polish privacy disclosure and the operational event-view instructions. Preserve the existing C01 action semantics and C22 reading composition; no style or reference-kit changes.
- Run `./scripts/verify` and perform a separate review. Report actual validation and distinguish local fixes from deployment and live receipt.

## Investigation

PostHog project 355474 has interaction autocapture enabled. Direct record inspection found four existing `$autocapture` clicks on the canonical offer route; all predate the owner's one-hour Activity window. Browser inventory exposed that filter in the current tab URL. Browser control could list tabs but interaction calls failed, so no filter change or fresh production click is claimed.

## Executed validation

- The extended real-SDK regression initially reproduced the missing navigation event: the public search button was captured, but keyboard activation of the job link produced no link autocapture. Its mock configuration now explicitly enables autocapture, matching the inspected live project; the test waits for SDK initialization before the first interaction.
- After repair, the SDK packet check passed for the search button, keyboard job navigation, both offer section links and anonymous/candidate application entry. Packets retain the public ingestion token, personless flag and optional random research code, and exclude private markers, persona names and private-route autocapture.
- `./scripts/verify` exited 0 under Node 24.22.3 / npm 12.2.2: formatting, kit integrity (67 files / 333 local references), six kit checks, lint, types, 99 unit tests, participant packet, production build, 51 Chromium journeys and two isolated SDK checks. The final browser runs used zero retries; the optimized SDK payload check completed in 11.7 seconds. Production analytics was blank during the gate; the SDK suite used a fake token and intercepted all external traffic.
- Chromium was already provisioned under `/private/tmp/doroboty-preflight-tools/browsers`; no browser or system packages were installed. An initial sandboxed test could not bind localhost (`EPERM`); the subsequent authorized local runs completed. Existing Zod annotation and large-chunk build warnings remain non-blocking.
- The privacy copy passed the existing keyboard, Axe and 320/390/1280px reflow journey. The 390px screenshot was inspected. C01 link semantics, C22 structure, styles, routes and the immutable kit are unchanged; this is not a new visual-system acceptance audit.

## Separate review pass

Reviewed the final sanitizer, public route matcher, both application-entry handlers, privacy disclosure and real-SDK assertions separately from implementation. Confirmed that only `click` events with an allowed `a`/`button` ancestor survive automatic capture, element attributes are reconstructed away, private routes remain excluded, and an already submitted application cannot emit the new start event. Optional SDK failures remain isolated from local domain operations. No blocking findings.

Reviewed and updated SYS-03 and its source/test references in FEATURES.md. OPS-11 needs no change because the test-guide flow is unchanged. Added the Activity time-window and event-name instructions to the deployment runbook.

This is a local, uncommitted change on the existing repair worktree. No provider setting, Activity filter, production deployment, external notification or session recording was changed. The existing working tree contains earlier unpublished repairs; publishing this checkout requires the owner's separate release decision and applies that combined package, not only this analytics delta. Live receipt of the new link/start events remains a post-deployment check.

## Authorized publication — November 18, 2026

The owner explicitly requested publication of the current version to Netlify after being told that it includes the earlier unpublished repair package. Publish the reviewed `codex/pre-production` checkout through its existing GitHub/Netlify integration. Preserve the currently published `878d585` / `6afd3959620f2a58161e42bd` artifact as the rollback target. Do not expand replay, account access or notification settings.

Release acceptance: the hosted gate succeeds for the exact release commit; the canonical site serves the new asset; static smoke and an isolated synthetic candidate/reload journey pass; fresh public link and application-start events arrive in PostHog without private text. Record the commit, deploy/asset identity and actual checks. FEATURES.md was reviewed; publication itself does not change the behavior already registered in SYS-03.
