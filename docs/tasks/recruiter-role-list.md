# Compact recruiter role list

## Intent

Implement the accepted compact employer proposal in the running React prototype: role → candidates, separate overall/project material coverage, a quiet Profile action and a small pale-pink Analysis action. Preserve the submitted source and recruiting process. The visualization's fictional percentages/profile facts are not product fixtures.

## Acceptance

- Each owned offer links to its candidates, including zero applications. Company-scoped role/search filters live in the hash query and survive detail/back/reload. Foreign/unknown role IDs never select another company's job.
- A single compact reading surface uses divided rows, names and short factual source summaries, separate scores, neutral stage pills and adjacent Profile/Analysis actions. At mobile widths scores retain labels and actions retain 44px targets.
- Scores use a recruiter-confirmed 1–5 criterion rubric, shared by every application to that role. Confirmation saves a version and offer snapshot; editing requires a new confirmation/version. No approved rubric means no calculated percentage. Changed offers explicitly retain the earlier rubric context until reconfirmed.
- Local textual evidence gives 0/1/2 points per criterion. Overall uses the best submitted CV/answer/project evidence per criterion; project uses only the submitted card. Overall is at least project. No card is distinct from a zero score. Labels explain material coverage and local simulation, not verified competence/hiring likelihood.
- List, detailed overall analysis and project analysis use the same rubric. Legacy persona score/summary fields remain importable but do not feed the new employer assessment UI.
- Profile opens all submitted material; Analysis opens its dedicated tab directly. URL-driven tabs preserve unsaved recruiter notes. Existing answer/project/CV tabs, history, actions and candidate views continue to work. Profile information is snapshotted for new applications, never read from today's mutable candidate profile.
- Additive default-empty rubric data and optional profile snapshot retain version-1 import/export compatibility; company ownership and rubric reference/uniqueness/version validation are enforced.

## Implementation and design boundaries

Root is the only writer. Other agents provide read-only reviews. Reuse Base UI Button/Select/Textarea, RecordSheet, CvAttachment, ProjectCardPreview and BackLink; keep the Poster People kit immutable. The accepted user refinement makes only the small Analysis action pale pink in repeated rows, with neutral Profile and stage controls. Preserve the main port-3001 tab/data; use a separate QA origin and synthetic data.

Run focused rubric/evidence/URL regressions, ./scripts/verify, browser checks at 320/390/768/1280px and adjacent layout breakpoints, reference comparison and a separate review. Record actual outcomes and limitations before delivery.

## Verification and review

- Focused unit coverage verifies version-1 import/export, profile snapshots, criterion validation/ownership, stable versions after offer edits, shared 0/1/2 coverage, absent-card versus zero states, exclusion of persona/private/generated fields and safe role/search URLs. The full unit run passed 59 tests across eight files.
- Separate read-only reviews covered the rubric/evidence model and employer navigation/notes/source boundaries. Neither reported a material defect. Root remained the sole writer.
- Browser checks used synthetic data on a separate port-3002 origin; the user's port-3001 application tab and data were preserved. Executed: offer → candidates; criterion validation/confirmation; matching list/detail overall/project results; Profile/Analysis/Answer/CV navigation; End/Home/ArrowRight keyboard tab selection with unsaved note retention; stage/history note; refresh and contextual return; role picker; no-card/no-rubric states; empty search and reset; unknown-role recovery.
- List checks at 320, 390, 768, 1023, 1024 and 1280 CSS pixels found no visible clipping or horizontal overflow. Profile and Analysis reflow were checked at 320/390/768. Employer tabs wrap and targets remain 44px high. A long Polish role name wraps in both heading and selector at 320/390; changing the offer explicitly retains the approved version-1 criteria and the same scores. The original synthetic title was restored after the check.
- Compared desktop and mobile composition with the immutable kit. The workspace uses its paper/white surfaces, one ink contour, Geist Serif 400 headings and Arial controls. The accepted compact row is a host adaptation: 18px container radius, small 13px actions, neutral Profile and stage, pale `#ffe0f7` Analysis; measured row actions are at least 64 × 44px. Captures are in `artifacts/recruiter-role-list/` (ignored local QA artifacts).
- The final verification gate passed formatting, immutable kit integrity and six kit tests, lint, TypeScript, 59 unit tests, participant baseline checks and the static build. The sandbox initially prevented the test server from listening; the authorized retry started it successfully. Browser journeys could not launch: this host lacks the provisioned Playwright Chromium headless shell. The 43 E2E source cases therefore remain unexecuted; manual CUA evidence above is separate. Final log: `/private/tmp/recruiter-role-list-final-verify.log`. No browser binary or system dependency was installed. Temporary QA/reference servers and tabs were closed and viewport overrides reset.

## Limits

This remains a local lexical simulation, explicitly labelled as coverage of submitted material. It does not verify experience or competence, infer private profile facts, rank candidates automatically or call a provider model. Current reports use the latest confirmed role rubric; there is no historical report ledger. Older applications without a profile snapshot expose only the materials actually saved with that application.
