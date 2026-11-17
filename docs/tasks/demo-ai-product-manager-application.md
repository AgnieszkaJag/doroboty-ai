# Demonstrative AI Product Manager application

## Intent and acceptance

Populate the user's local port-3001 scenario with a confirmed reusable Project Card and a submitted application for an existing synthetic candidate to BrightLabs' AI Product Manager offer. Use clearly labelled fictional demonstration content with distinct personal/team contributions, justified product decisions and measurable outcomes with limitations. Attach the candidate's existing CV and the confirmed card. Verify 90–100% employer overall/project material coverage against the role's actual criteria without changing the scoring algorithm or reducing requirements.

Preserve existing projects, applications and unrelated scenario data. Use ordinary UI operations; do not inject browser persistence or overwrite submitted records. If criteria have not yet been confirmed, review and confirm the offer-derived proposed criteria as the prepared employer. Root performs UI/data changes; an independent read-only agent reviews the narrative and source consistency.

This is scenario authoring, not a product feature or code change. FEATURES.md is unchanged. Verify the saved/attached material and recruiter result in the running UI; code gates from the previous implementation do not establish this example's score.

## Result

- Existing persona: Anna Kowalska (`candidate-anna`). Her existing profile and prepared CV were preserved. The new reusable card is `caecc1cd-c5eb-403d-9916-73ed9e12692e`, titled “DEMO — pilotaż AI w obsłudze faktur B2B”. Every completeness area was described before candidate confirmation.
- Submitted one new application, `496513aa-742d-4d7a-b357-344c4aa122ae`, to offer `20000000-0000-4000-8000-000000000001` (`ai-product-manager`). It contains the approved answer, confirmed card snapshot, profile snapshot and existing `anna-kowalska-cv-v1.pdf` source.
- The role had no confirmed rubric. As the prepared BrightLabs recruiter, reviewed and confirmed all five offer-derived proposed criteria unchanged (version 1). The running list and detailed Analysis show **100% overall / 100% project**, 10/10 points each, covering five of five criteria. Reload preserved those results. No score or algorithm was hardcoded or edited; the legacy candidate scenario Match Score remains separate.
- All content and outcome numbers are explicitly fictional/demo. The narrative uses eight finance users, a twelve-week project, 240 baseline/240 pilot documents, median time 14→9 minutes and corrections 18/240→11/240. It distinguishes the candidate's discovery/product decisions from engineering/design/finance work and states the before/after comparison's causal limits. A separate read-only agent reviewed the narrative for offer coverage, coherence, attribution and arithmetic.

## Verification and recovery

Used normal Profile → add card → completeness review → confirmation → choose recruitment → submit, followed by role selection and criteria confirmation in the recruiter UI. Verified Profile's named sections, exact submitted answer, project title and matching CV link, then reloaded Analysis and checked both scores.

Exported the scenario before and after using Settings. Compared those explicit exports: both previous project cards, the existing application and all unrelated top-level state remain unchanged; exactly one card, one application and one rubric were added. The submitted card equals its confirmed library source, and answer/CV match their intended inputs. Eleven data checks passed. Local ignored recovery/evidence files: `artifacts/demo-ai-product-manager/{before,after,content,checks}.json` and `analysis.jpg`. The export/download event API timed out for the first Blob download, but the ordinary UI download completed and was verified on disk; no import or persistence injection was needed.

No product source changed, so no new code gate or layout audit was needed. The actual submitted data, DOM and reload checks above establish completion of this scenario-authoring request. The final active persona is the prepared BrightLabs recruiter for immediate review.

Later correction: those results were in the in-app browser. The user was testing another existing record in Chrome with separate local data. [Chrome demo correction](chrome-demo-application-correction.md) records the actual requested URL, narrow data import and verified Chrome result; the earlier checks did not establish a Chrome delivery.
