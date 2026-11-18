# External user test readiness audit

## Intent

Assess the current prototype and its Netlify production deployment before external usability tests. Distinguish observed defects, missing evidence and deliberate simulation boundaries. Use synthetic data and isolated browser state; preserve the owner's existing production scenario.

## Acceptance criteria

- Inspect the current behavior register, domain/state code, delivery configuration and existing checks.
- Run the complete `./scripts/verify` gate using the already provisioned Node.js 24, npm and Playwright tools; report actual failures.
- Reassess dependency advisories and the exposure of public artifacts without uploading source or secrets to scanners.
- Verify the deployed source identity, HTTPS/assets, representative candidate/project/employer journeys, reload persistence, narrow screens, keyboard access and visible errors with safe synthetic data.
- Assess analytics, replay availability, data recovery, participant instructions, release/recovery procedures and remaining operational decisions.
- Refresh the schema-2 offline readiness report with evidence tied to the current source and deployment, preserving prior completed audits.
- Give a prioritized plain-language recommendation for external testing and identify unverified areas honestly.

## Boundaries

This task authorizes an audit and local verification, not deployment, production setting changes, paid services or a change to the synthetic-data/no-authentication contract. Broad product repairs will be proposed as a concrete package after the initial audit.

`FEATURES.md` was reviewed. This audit does not change application behavior and therefore requires no behavior-register update. The durable audit results and history belong in `docs/production-readiness.html`.
