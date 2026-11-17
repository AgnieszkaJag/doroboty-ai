# Private pre-production deployment

## Intent

Deploy the tested `codex/pre-production` branch as an owner-private AIPH3 teaching prototype using Sites. The user authorized deployment after the local readiness work and GitHub push. No hosting was configured in the repository or GitHub deployment history.

## Acceptance criteria

- Preserve the application from commit `ec95b20356e10d126c9620cc4b33da192eb51929`, including hash routing, synthetic baseline data and browser-local persistence.
- Track the returned Sites identity and serve only the built static output from `dist`.
- Confirm owner-only access before publishing. Keep participant admission separate from this private deployment.
- Run `./scripts/verify`, review the deployment configuration separately, and build/package the exact source pushed to the Site repository.
- Confirm the native deployment result and attempt the main journey at the returned HTTPS address. Record any authentication or browser limitation accurately.
- Update the existing readiness checklist with actual source, configuration and deployment identities and unresolved operational requirements.
- Push deployment configuration and documentation to `codex/pre-production` on GitHub.

## Review

`FEATURES.md` was reviewed. Hosting does not change product behavior, so its behavior entries require no update. A new origin starts an independent local scenario; existing browser state must be exported and deliberately imported if needed. Production deployment does not turn persona selection into authentication or synchronize data across devices.

## Evidence

Execution results and deployment identifiers belong in `docs/production-readiness.html`; this note records the authorized scope and acceptance criteria.
