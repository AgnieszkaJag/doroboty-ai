# Recruiter project evidence report

## Intent and scope

Replace the candidate-oriented completeness report in the employer's submitted project tab with a recruiter-oriented account of the project against selected expectations from the actual offer. Keep the candidate's intermediate review unchanged. Separately present a visual proposal for a per-role candidate overview; the user asked for a proposal, so that navigation/scoring flow is not implemented in this change.

## Acceptance

- Employer report leads with a concrete summary, separates individual contribution from team context and results, and links every role observation to a submitted source quote.
- Extract at most five selected expectations verbatim from substantive description sections; clearly distinguish related personal evidence, team/context-only evidence, and missing information. Absence of text is not evidence of missing skill.
- Deterministic local simulation is explicitly labelled. No new fit percentage, hiring recommendation or reuse of fixed persona scores as calculated fit.
- New applications snapshot role title/summary/description alongside the submitted project. Legacy records remain importable and explicitly use the current offer when no snapshot exists. Existing candidate analysis and its import validation remain unchanged.
- Candidate confirmed/submitted views continue to omit AI analysis. Recruiter notes, history and stage actions continue to work.
- Report and source disclosure wrap at 320/390/768/1280px with keyboard-operable controls and no nested scroll area.
- The visual proposal demonstrates a role entry, per-role list, overall-material coverage and project coverage as separate concepts, with missing cards distinguished from a zero result. Proposal numbers are explicitly synthetic.

## Design and validation

Use the local Poster People kit, shared RecordSheet, existing project reading styles and native disclosures. Keep the kit immutable. The new report is a host reading composition rather than a new global primitive. Run focused report/snapshot tests, the required verification gate and a separate read-only review. Record actual browser and gate results below before delivery.

## Evidence

- Ten focused report tests cover verbatim selection, numbered lists, organizational-only descriptions, generic word overlap, past/present first-person attribution, team-only/mixed-actor/negative statements, active/skipped legacy answers, result gaps and role snapshot import/edit continuity.
- Separate read-only review identified numbered-task parsing, missing denial/actor handling and present-tense attribution. All identified cases were corrected and covered by focused regressions. The proposal was checked for overall coverage being at least as high as project coverage under the same criteria.
- CUA checks ran on the independent QA origin at port 3002 using existing synthetic test records. The user's port-3001 tab and data were left untouched. Employer report, source excerpts, legacy-current-offer provenance, Enter-operated source disclosure, note retention across CV/project tabs and stage history/focus were exercised. Candidate submitted project still has one source preview and zero candidate/recruiter AI report elements.
- Report widths 320, 390, 768, 949, 950, 951 and 1280px showed matching document/viewport widths and no report children extending beyond the viewport. Desktop/mobile screenshots are in ignored `artifacts/recruiter-project-report/`. Source reference ran at 8952; source and host use Geist Serif Regular 400, ink contours and white reading surfaces. The existing host RecordSheet uses 34px reading H2 versus the source offer's 36px H2; no global typography was changed.
- The standalone proposal was rendered and inspected at 1280px and 390px. Offer → candidate count, role switching and analysis expansion work locally; narrow rows stack and expose both score labels. The proposal remains separate response content, not an implemented product route or calculated score.
- Automated verification passes formatting, kit integrity/examples, lint, TypeScript, unit tests, baseline packet validation and static build. Browser journeys cannot launch because the configured Playwright Chromium executable is absent. An initial sandbox listen restriction was resolved by an escalated browser-test attempt; the remaining failure is the absent browser binary, not a passing journey. No browser binaries were installed.
- Final gate: 51 unit tests and 120 baseline journeys validated; all 42 browser journeys are blocked at Chromium launch. Log: `/private/tmp/recruiter-project-report-final-verify.log`. The last review also caught self-role attribution (e.g. “Jako inżynier…”); a scoped actor exception and regressions preserve those first-person examples.

## Limits

The report uses conservative lexical associations, not a language-model provider or validated scoring rubric. It highlights related fragments rather than asserting that a multi-part requirement is satisfied. Fixed persona Match Scores and scenario summaries remain unchanged. Older applications have no historical role description and explicitly use the current offer. The per-role overview and a shared recruiter-confirmed scoring rubric are proposals only.

The accepted per-role overview, confirmed rubric and full submitted profile were subsequently implemented in [recruiter-role-list.md](recruiter-role-list.md). Its current behavior supersedes the proposal-only limits above.
