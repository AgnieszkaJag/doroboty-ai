# Candidate project card — design selection

## User intent

S1/E1: candidates describe a real project with at most three main questions, explicitly separate personal responsibility from team work, respond to at most two AI follow-ups, review and confirm the card, save it on their profile and reuse it in applications. Recruiters will receive source material for future AI summaries.

## Approved implementation

The user selected the single-card layout and explicitly requested implementation of the final plan. All three questions remain visible, personal/team work columns stack below a 640px form container, fields use at least 16px text and controls have at least 44px touch targets. Root is the sole source editor; a separate agent reviews read-only.

Alternatives: step-by-step questions, a single three-question card, and a conversation with a live card preview. These are isolated visual proposals, not an implemented product or evidence of experiment outcomes.

## Acceptance criteria

Implement the chosen layout with person-owned local drafts, explicit approval, optional immutable application snapshots and reuse. Preserve Poster People, existing Base UI controls, hash routes and version-1 save compatibility. Clearly identify any local AI simulation and keep raw answers separate from generated material.

## Validation evidence

Implemented the selected single-card flow in the current workspace and switched the local development server on 127.0.0.1:3001 to this checkout. The previous checkout's source was not modified.

Executed checks:

- Prettier, ESLint, TypeScript and production build passed after the final source changes.
- All 36 unit tests passed, including nine project-card tests covering compatibility, collective versus personal work, ownership, missing evidence, follow-up limits, stale analysis rejection, confirmation invalidation, immutable reused snapshots and storage errors.
- Design-system integrity and its six renderer tests passed; the baseline packet remains 120 journeys.
- `./scripts/verify` reached the browser gate. Its first attempt could not bind the sandboxed preview port. With the local-server permission, Playwright started but all browser cases were blocked at launch because the provisioned Chromium headless executable is absent. No browser binaries or OS dependencies were installed. The three new browser journeys are authored but not reported as passing.

Executed browser QA through the available in-app browser using synthetic data on a separate local origin:

- Profile -> create -> first-error focus -> automatic draft -> reload -> two follow-ups -> actual-source preview -> confirmation -> reload.
- Creating a project from an application preserves the typed application answer on return.
- Attach to AI Product Manager; change the original; reuse the updated card for AI Operations Specialist. The recruiter still sees the original submitted source and follow-up answers.
- At 320/390/768/1280px: no document overflow; contribution columns 1/1/1/2; textarea text 16px; form action heights 49px. The contribution container was also checked at 639px (one column) and 640px (two columns). Long text grows without internal scrolling. Both candidate and employer materials tabs wrap at 320px.
- Reduced-height mobile viewport was inspected, but a physical phone and its real software keyboard were not available. This is not a full accessibility certification.
- Captures are in `artifacts/project-card/` (ignored local QA output).

Independent read-only review found and closed three issues: collective-word false positives, narrow-screen material tabs and stale imported analysis. A follow-up review found no new material issue in the inspected code.

## Operating boundaries

AI remains an explicitly labelled local completeness simulation. Sources and generated reports are stored separately; no provider call, role-fit score, live A/B allocation or experiment outcome is claimed. The global storage warning and card-specific status avoid promising durable saving after a storage error.
