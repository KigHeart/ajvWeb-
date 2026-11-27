# Security Policy

## Reporting a vulnerability

Please do not publish exploitable vulnerability details, credentials, personal data, or proof-of-concept attacks in a public issue.

Use GitHub's private vulnerability reporting / Security Advisories for this repository when available. If private reporting is unavailable, contact the repository maintainer through a verified private channel and include:
- affected URL, component, or commit;
- impact and realistic attack prerequisites;
- minimal reproduction steps;
- any suggested mitigation.

Do not access, alter, download, or retain another person's inquiry data while validating a suspected issue.

## Supported deployment

The supported public deployment is the static GitHub Pages site backed by Firebase Authentication and Cloud Firestore. GitHub Pages does not execute `server.ts`. Report findings against the actual deployed architecture, and distinguish a source-code issue from a service that is not deployed.

## Security expectations

- Firestore Security Rules are the authorization boundary; UI checks are not authorization.
- Never commit API secrets, service-account keys, private keys, tokens, or production exports.
- Never expose privileged credentials through `VITE_*` variables or browser code.
- Changes to Firestore rules require emulator tests and review before production deployment.
- Agentic features must use server-side, least-privilege tools with deterministic policy checks and human approval for consequential actions.
