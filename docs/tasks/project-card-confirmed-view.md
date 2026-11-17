# Confirmed project card and recruitment entry

## Intent and acceptance

- Move CV above projects in both candidate profile views, preserving aligned surfaces and phone reflow.
- Put the darker pink recruitment action before the confirmed card's long content. It opens an offer chooser; a card created for a known application retains its direct return/attachment action.
- Make the offer-choice label prominent and explain reuse: one project card per application, the same card can be used in multiple applications. Preserve owned confirmation requirements and independent submitted snapshots.
- Candidates see the AI completeness report only during the intermediate review before confirmation. Hide it on confirmed profile cards and submitted application materials; retain the report data and the recruiter view.
- Keep the immutable Poster People kit unchanged and use the existing Base UI controls, route/state contracts and scoped darker attachment treatment.

## Verification

- Final `./scripts/verify`: formatting, immutable design-system integrity and six renderer tests, lint, types, all 37 unit tests, the 120-journey baseline packet and production build passed. All 39 browser journeys stopped at launch because the provisioned Playwright Chromium executable is absent. No browser installation was attempted. The gate was rerun after the confirmation-focus refinement.
- Manual browser QA used synthetic data on a separate local origin. Both edit and preview place CV before projects; the three edit surfaces remained 956px wide at 1280px. Confirmed cards expose the dark pink action before the reading sheet. Keyboard Enter opens its chooser, the question is now 18px/600, and the known-application return link also precedes the reading sheet.
- At 390px and 320px the recruitment surface, select and actions fit without horizontal overflow. Buttons measured 49px high and respected the 316px / 246px available content width. Desktop and mobile screenshots were compared with the running local reference catalog; controls retain the existing 18px/ink contour/sans action anatomy, Serif headings and scoped darker pink treatment.
- Report visibility was inspected through the real flow: intermediate review has one report; confirmation removes it and focuses/scrolls the heading so the top action is visible; reloading the confirmed card still has no report. The candidate's submitted Project Card tab contains the source text without a report. The employer's tab retains the same stored report.
- Reused the same confirmed “Prototyp kolejki zgłoszeń” card for a second submitted application (AI Operations Specialist) after its earlier Staff AI Engineer application. Both candidate materials tabs show that card's confirmed copy. Domain reuse and immutable-snapshot unit coverage also passed; the one-card-per-application data contract is unchanged.
- Updated browser regressions cover profile order, the prominent action's position, confirmation focus and report visibility before confirmation, after reload and across both audiences. These browser regressions are authored, not reported as executed by Playwright in this environment.
- Separate read-only review found no material issues. Its copy refinement clarifies “maksymalnie jedną kartę”. `FEATURES.md` and the shared-record documentation record the new presentation boundary without removing any stored analysis.
- Evidence: `artifacts/project-confirmed-view/` contains the profile order, confirmed-card desktop/mobile, candidate/employer submitted cards and reference catalog captures. Temporary browser tabs, viewport override and test/reference servers were cleaned up; the user's original app/data on port 3001 was retained.
