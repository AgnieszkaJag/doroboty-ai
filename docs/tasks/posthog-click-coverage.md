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

### First hosted gate and repair scope

Release commit `e7675c552449b0786183279832ce10e90528b7a5` reached Netlify deploy `6afd79512bf105dd8231116a`, which failed its real `check:release` browser gate (49 passed / 2 failed). Production remained on `878d585`. The failures were a public-navigation right edge of 827.89px at a 768px viewport, and an unscoped CV text locator matching both the departing Profile panel and the current CV panel.

Stabilize measurements after viewport changes as required by VERIFICATION.md, scope the CV assertion to its named panel, and fix any reproduced navigation overflow using the existing C11/C01 host composition and account entry. Preserve tests and zero retries. Record the behavior-register decision, rerun the focused regressions and full gate, separately review the release repair and publish the corrected commit under the existing authorization.

Both stabilized checks passed locally on macOS. The Linux-hosted overflow remains valid evidence of a platform-dependent width issue: the candidate header showed all account shortcuts from 768px. Extend its existing compact presentation through 1023px; retain the core public links and the visible “Moje konto” entry, and show the secondary application/profile/person-switch shortcuts from 1024px. This is a scoped C11 host adaptation using unchanged C01 controls, not a new reference-kit variant. The CV change only scopes the assertion; it does not alter tab content, transitions or timing.

The corrected `./scripts/verify` exited 0 with `CI=true` (two journey workers): formatting, kit checks, lint, types, 99 unit tests, production build, 51 Chromium journeys and two isolated SDK checks. The expanded navigation check covers 320, 390, 640, 767, 768, 850, 1023 and 1024px. Production analytics was blank and no browser dependencies were installed. Log: `/private/tmp/doroboty-netlify-release-repair-verify.log`.

A separate review confirmed that the three breakpoint changes preserve the account entry and destination routes, the CV assertions still require visible content in the correct named panel, and the expanded geometry assertion retains its original strict bounds. SYS-01 now records the account-shortcut breakpoint. No blocking findings; publish this repair through the existing gate without bypassing tests.

### Live SDK representation mismatch

Commit `477bdb72b1d2be7015e1210b3d5316420d1dac05` was published as Netlify deploy `6afd7d2951ddae32696c4182` at 10:28:17 UTC. The hosted gate passed 99 unit tests, 51 journeys and two SDK checks; both canonical and immutable-deploy static smoke passed. The first isolated live run (`f421a1ad-3d61-421e-93f8-329e01d7e258`) delivered pageviews and research start, but no automatic clicks. It is technical verification traffic, not a participant.

The actual SDK JSON configuration returns `autocapture_opt_out: false` and `elementsChainAsString: true`. The existing mock omitted the latter flag, and the sanitizer only recognized array-form `$elements`. Extend the real SDK regression to the observed serialized form, reproduce the failure, then accept only an allowlisted tag from either representation and reconstruct the same attribute-free payload. Quoted attribute content must not create a false tag match. Preserve private-route exclusions, replay restrictions and safe custom events; update SYS-03, rerun the complete gate and review before republishing under the same authorization. Live receipt remains required.

The real-SDK regression reproduced zero clicks with the serialized flag before the repair; it passed after adding tag-only parsing. The final regression runs the same assertions with both flag values. Additional unit cases reject quoted fake tags (including escaped quotes), malformed quotes and custom tag-name prefixes. The parser never forwards the serialized input. The [PostHog RemoteConfig reference](https://posthog.com/docs/references/posthog-js/types/RemoteConfig) documents the representation flag; [the element-chain guide](https://posthog.com/tutorials/hogql-autocapture) describes element separation.

Separate review: only public `click` events reach the chain parser; quoted delimiters are skipped, unterminated quotes are rejected, and only exact `a`/`button` tags can be retained. Every outgoing click is reconstructed as the same minimal `$elements` array. The original serialized chain, attributes and text cannot be forwarded. Replay, DNT, route categories and explicit event semantics are unchanged. SYS-03 records both accepted SDK representations. No blocking findings.

The final `CI=true ./scripts/verify` exited 0: formatting, kit integrity/checks, lint, types, 107 unit tests, participant packet, build, 51 Chromium journeys and three SDK checks (both chain formats plus unavailable analytics), with zero retries. Log: `/private/tmp/doroboty-string-chain-verify.log`. Production analytics stayed blank during the gate; all SDK requests used the fake token and were intercepted. An initial run caught an unnecessary escape in a test literal; it was fixed before this successful complete run.
