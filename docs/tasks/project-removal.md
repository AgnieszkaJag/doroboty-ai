# Remove and detach candidate projects

## Intent and acceptance

The user requested project removal from an application and the profile library. Their unfinished second item was clarified as no further change.

- Provide an explicit removal action for a selected project in an unsent application. Persist the latest application answer/legacy fields, clear selection and consent, and remove the project URL parameter so reload does not reattach it. Keep the project in the library.
- Allow the owner to remove draft or confirmed projects from the profile list and project page, using the existing confirmation dialog. Detach matching project references from all of that candidate's unsent drafts without deleting their text.
- Retain removed projects in a recoverable local collection and provide a compact profile restore action. Restoring a project does not reattach it to drafts.
- Submitted application snapshots remain immutable. Candidate and recruiter copies survive profile removal.
- Keep additive version-1 save/import compatibility, shared controls, Polish UI, Poster People styles, keyboard focus and phone reflow. Only the root agent writes; a separate agent reviews read-only.

## Verification

- `./scripts/verify`: formatting, design-system integrity (67 unchanged files and six renderer tests), lint, types, all 41 unit tests, the 120-journey baseline packet and production build passed. All 42 browser journeys stopped at launch because the provisioned Playwright Chromium executable is absent. No browser installation was attempted. Browser assertions were subsequently scoped to their named materials panel to avoid an inert exiting panel.
- Four added domain regressions cover active/deleted import defaults, removing confirmed and incomplete cards, clearing only matching owned draft references while preserving latest/legacy text, restoration without reattachment, duplicate IDs/owner validation, stale-save rejection and immutable submitted snapshots.
- Manual QA used newly created synthetic candidate data on a separate local origin. Explicit detachment cleared the URL parameter and consent, preserved the latest unsaved answer, and remained detached after reload. Removing the card from its page returned to the application without a dangling choice or lost answer; profile restoration survived reload and did not reattach it.
- Confirmed removal from the library after submitting an application: the active card disappeared while the candidate's submitted Project Card tab retained its complete copy. The domain tests compare the unchanged stored snapshot/report directly.
- Cancel returned focus to the delete trigger. Successful list removal and restoration focused the surviving notice. A separate read-only review found a repeated-message focus issue for identical project names; fresh notification objects fixed it. Manual consecutive removal/restoration of two unnamed drafts confirmed focus after every event, and a dedicated browser regression was added.
- At 320/390/1280px, the added actions fit with no page overflow. The 320px detach button was 49px high within its 250px content area; modal actions were 49px high and its 455.6px-tall content fit the viewport. Compared shared outline actions and the existing confirmation dialog with the running local reference; the immutable kit remains unchanged.
- `FEATURES.md` records recovery, detachment and immutable-copy boundaries. Screenshots are in `artifacts/project-removal/`, including profile controls, deleted projects, mobile confirmation and the reference catalog. Temporary QA/reference tabs, viewport override and servers were cleaned up; port 3001 and user data were retained.
