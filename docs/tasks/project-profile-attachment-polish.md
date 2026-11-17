# Profile alignment and reusable project attachment

## Intent and acceptance

- Align the profile identity form, projects and CV surfaces to the same full desktop width; retain phone reflow.
- Remove the redundant project empty-state heading and explanation.
- Rename the first project section to “Nazwa projektu”, preserving the context/role source field and its accessible labels.
- After an explicit draft save, expose choosing a recruitment with a darker pink action. Drafts must still pass through the existing AI review and candidate confirmation before attachment.
- Offer existing confirmed cards and unfinished project drafts on every new application for the selected candidate, preserving application answers through project editing and return.
- Preserve the immutable design-system kit, shared Base UI controls, owned local state and submitted snapshots. The darker attachment action is a user-requested scoped host treatment, not a new reference-kit variant.

## Verification

- `./scripts/verify`: formatting, design-system integrity (67 immutable files and six renderer tests), lint, types, 37 unit tests, the 120-journey baseline packet and production build passed. All 39 browser journeys stopped at launch because the provisioned Playwright Chromium executable is absent. No browser binaries were installed. The corrected descendant selector was formatted after the gate; browser execution remains blocked by the same environment limitation.
- Manual browser verification used synthetic data on a separate local test origin. Explicit draft save revealed the offer selector and dark pink review action; review, confirmation and return selected the card on the chosen application. Independently opening another offer through the listing exposed the same confirmed card. Selection and the written answer survived application draft save/reload. Completing an existing project draft from that application preserved its answer. Submission and the submitted Project Card tab showed the actual reused card copy.
- At 1280 / 390 / 320 CSS px, the identity form, projects and CV had equal widths of 956 / 354 / 284px, with matching left edges, 24px radii and no page overflow. At 390 / 320px, the draft attachment action fit its container and measured 49 / 70px high; the longer label wrapped on the narrowest phone.
- Keyboard Enter saved the draft, ArrowDown/Enter selected an offer, and Enter on the review action with incomplete fields showed inline errors and focused the project-name input. Incomplete cards were not attached.
- Compared the running reference catalog with the host controls: both retain 18px action radii, Arial 14px/600 and one ink contour. The darker attachment color (#e34db8, hover #ee7ad0) is the scoped user-requested exception. Profile headings remain Geist Serif 400.
- Independent read-only code and selector review found no material issues. The profile-width selector was corrected after manual inspection to account for the route wrapper. `FEATURES.md` records the behavior changes.
- Evidence is in `artifacts/project-profile-attachment/`: `saved-draft-mobile.jpg`, `profile-desktop.jpg` and `reference-desktop.jpg`. Temporary test/reference tabs and servers were closed; the original port-3001 app and its user data were retained.
