# Pink project creation action in the application form

## Intent

Highlight “Dodaj nowy projekt” in the optional Project Card section of `/#/aplikuj/:slug`, as requested during review of the Netlify deployment.

## Acceptance criteria

- Reuse the shared Base UI Button's existing primary/default variant: Poster People C01 action pink `#ff90e8`, ink text, existing contour/radius, and hover pink `#ffacef`.
- Reuse the application action typography for this button: Arial 14px/600, 21px line height and normal tracking, matching C01.
- Keep the Polish label, button semantics, disabled state, draft preservation, project creation and return/attachment behavior.
- Leave the immutable reference kit and shared control definitions unchanged.
- Compare the affected control with the source catalog at desktop/mobile widths; check 1280, 851/850, 390 and 320px, keyboard focus/activation, and the application with a selected confirmed project.
- Extend the existing application-to-project E2E journey, run `./scripts/verify`, and perform a separate review before committing.
- Push the reviewed change to `codex/pre-production`; verify that the existing Netlify project publishes that exact commit and that the deployed action is pink.

## Design and behavior review

Read the project design-system guide, agent entry point, component API, human C01 reference, implementation rules, host catalog, record contracts, current status and acceptance checklist. The shared `Button` already implements the required primary colors and interaction states. Change the call site's variant and include it in the existing application action typography rule, preserving shared primitive definitions.

`FEATURES.md` was reviewed. No behavior-register update is needed because this change only adjusts the existing action's visual hierarchy, without changing a route, operation, state boundary or flow.

## Validation

- `./scripts/verify` passed on Node.js 24.22.3: formatting, lint, TypeScript, 66 unit tests, participant-packet verification, production build and all 44 Chromium E2E journeys. The immutable reference check verified 67 files and 333 local references; its six renderer tests passed.
- The extended application journey checks the primary color, ink text, 14px/600 typography, 21px line height, normal tracking, 18px radius and horizontal fit at 1280, 851, 850, 390 and 320px. It also checks hover, the existing 3px keyboard focus indicator, Enter activation, preserved answer text and automatic attachment after creating a confirmed project.
- Compared computed primary-button styles with the reference catalog at 1280 and 390px. Inspected the captured application form at desktop and mobile widths. Screenshots are local verification artifacts under `artifacts/project-create-action/`.
- An initial new assertion incorrectly expected a 2px focus outline. The documented host and reference use 3px; corrected the assertion without changing the product's focus styling. The final full gate passed without retries.

## Separate review

Reviewed the final diff after the passing gate. The product change is limited to this button's existing default variant and inclusion in the existing application action typography rule. The label, explicit `type="button"`, disabled condition, click handler, draft preservation and routing remain intact. No shared primitive, reference-kit file, dependency or domain operation changed. The extended existing journey still creates, confirms and attaches a project while retaining the application answer. No blocking findings.

## Release

Release target: the existing Netlify production project `dorobotyaiaj`, automatically publishing `codex/pre-production`. After pushing this reviewed change, verify the published commit in Netlify and inspect the live button at https://dorobotyaiaj.netlify.app. Deployment evidence is recorded separately from the local gate results.
