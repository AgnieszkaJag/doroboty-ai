# Recruiter Profile material hierarchy

## Intent and acceptance

Make the CV, application answer and Project Card clearly distinguishable in the employer's candidate Profile tab. Preserve the single outlined RecordSheet and reuse the kit's paper/white surfaces, restrained pink accent and Geist Serif 400 headings. Each material gets a distinct heading band, complete source content and enough separation from the next material. Project details remain visually subordinate to the Project Card section heading.

Scope styles to the submitted employer Profile composition. Preserve candidate views, other tabs, attachments, immutable snapshots, analysis, notes and recruiting actions. Check prepared/custom CVs, absent/present cards, long content and 320/390/768/1280px layouts. No new state or persistence behavior is intended; FEATURES.md was reviewed and does not require a behavior-register change.

Root is the sole writer; a separate read-only agent reviews the change. Run the project verification gate and record actual results, including any environment limitations. Keep the user's port-3001 tab/data and the immutable reference kit unchanged.

## Result and evidence

- Moved the provenance caption above the material stack and named sections with their headings. This also removes the previous interrupted sibling boundary before CV. Each material has a paper heading band, a 4px pink leading accent and an ink separator/32px gap before the next section. No extra nested panels or state changes were introduced.
- Profile-only Project Card typography now uses a 24px title and smaller sans reading labels, so the three main material sections remain dominant. Other ProjectCardPreview consumers retain their original styles. The existing preview heading elements are structurally unchanged.
- Manual CUA checks on the separate synthetic port-3002 origin covered prepared CV links, submitted answer, full/legacy Project Card content, the absent-card fallback, named section regions, keyboard selection of Analysis, note retention, and the unchanged standalone Answer tab. Source review confirmed that complete custom-CV fallback text and the optional submitted profile snapshot remain intact.
- At 320, 390 and 768px, no profile child was clipped and document width equalled viewport width. Desktop 1280px and mobile 320px were visually inspected, including the lower answer/project sections. Measured main labels use Geist Serif 400 at 26px and paper `#f4f4f0`. Compared source C22 reading surfaces/typography at 1280/390px; heading bands are a scoped host adaptation using the existing palette. Captures are in `artifacts/recruiter-profile-sections/`.
- Separate read-only review found no actionable regression: style scope, submitted sources, file actions, tabs and note ownership remain intact.
- `./scripts/verify` passed formatting, immutable kit integrity/six kit tests, lint, TypeScript, 59 unit tests, participant baseline verification and the static build. All 43 E2E cases failed at browser launch because the provisioned Chromium headless shell is absent; their UI assertions did not run. Log: `/private/tmp/recruiter-profile-sections-verify.log`. No browser dependency was installed.
- The user's port-3001 tab/data were preserved. Temporary QA/reference tabs and servers were closed; viewport overrides were reset.
