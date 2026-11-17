# Correct the demo in the user's actual Chrome scenario

## Intent and cause

The user supplied the exact application URL ending in `56856927-1ad4-4518-959a-2219925dcde3?sekcja=analysis`. This record did not exist in the in-app browser scenario used for earlier demo authoring. The browser inventory located that exact URL in the user's Chrome profile. Native Chrome inspection confirmed Anna Kowalska's existing application, 50% overall / 30% project, the “Automatyzacja CX” card and a reviewed stage with two history events.

The earlier same-browser stale-tab finding was real but did not explain this cross-browser mismatch. Chrome and the in-app browser have separate local scenario data; synchronizing tabs does not transfer data between them. The earlier delivery claims only established the in-app browser result. This task corrects the requested existing Chrome record, preserving its URL and unrelated user data.

## Scoped scenario edit

This is a deliberate one-off demonstration-data import, not a product change to submitted-record immutability. Exported the original Chrome scenario through Settings to `doroboty-scenariusz (2).json`, copied it to `artifacts/demo-ai-product-manager/chrome/before.json`, and retained the original submitted material there for recovery through the same import UI.

Prepared `chrome/ready.json` with the domain's project analyze/confirm operations, schema validation and the real shared assessment function. Changes are confined to the target application's answer and confirmed Project Card copy, plus one new reusable confirmed DEMO card in Anna's library (`0ea78304-4f88-452f-bee6-32bec57ff08e`). The existing application ID, CV, stage, history, rubric/criteria, old card/trash, all other applications and all unrelated top-level state were preserved. No missing profile/role snapshots or fabricated history were added. Scoring criteria and algorithms were unchanged.

## Review and executed verification

- A separate read-only agent recursively compared before/ready: only the intended two application fields and one library card differ. The payload is 67,434 bytes and validates through the existing schema. Computed coverage is 100% overall / 100% project against the existing five version-1 criteria.
- Imported through the actual Chrome Settings file picker and confirmation UI. The Chrome selector bridge was unavailable, so used the documented native Chrome app controls; no browser persistence injection or hidden-state access was used.
- Exported again (`doroboty-scenariusz (3).json`) and verified its parsed content equals the reviewed payload exactly. The scenario retains three applications and now has two active library cards.
- Navigated back to the user's exact URL in Chrome and performed a full reload. The page shows 100% overall / 100% project, the new DEMO title/content, the original reviewed stage and original two history events. The browser remains at that exact requested address and its existing 67% zoom.
- Native Chrome proof: `artifacts/demo-ai-product-manager/chrome/confirmed-chrome.png`. Recovery/data/check scripts and exports are in the same ignored artifact directory. No product source changed and code gates were not repeated for this scenario-data operation.

## Durable lesson

Before editing browser-local demo data, bind the user's exact browser/tab and record ID. Ambient in-app context does not establish where the user is testing. A successful result in another browser profile is not delivery to that user's existing local scenario. Cross-tab event support remains limited to the same browser storage partition.
