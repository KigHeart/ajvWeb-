# Security operations and agentic-AI readiness

## Current deployment boundary

The public site is a Vite/React static application deployed to GitHub Pages. GitHub Pages does not execute `server.ts`, so Express routes are not part of the live site's backend. The browser communicates directly with Firebase Authentication and Cloud Firestore. Firestore Security Rules are therefore the authoritative data-access boundary.

The Express process is retained only as a minimal local/self-hosted web server. The public `/api/notify` endpoint and generic outbound webhook dispatcher have been removed. Do not restore browser-triggered email or webhook dispatch: a public browser cannot safely hold a server credential. When notifications are required, implement a trusted Firebase Cloud Function/Cloud Run worker triggered by a validated Firestore create event, with idempotency, abuse controls, timeouts, and server-only credentials.

## Required production controls

These controls require access to the Firebase and GitHub project consoles; repository changes alone cannot enable them.

1. **Deploy the Firestore rules to the exact production database.** Confirm the database ID in `firebase-applet-config.json` before deployment. Review the rules diff and run the emulator suite first. Do not deploy rules to a different database by accident.
2. **Enable Firebase App Check for the web app.** Register the production web app with reCAPTCHA v3, configure `VITE_RECAPTCHA_SITE_KEY` as a GitHub Actions repository variable (it is a public site key, not a secret), deploy, observe valid traffic, then enforce App Check for Cloud Firestore in Firebase Console. The current checked-in configuration has no reCAPTCHA site key; until App Check is configured and enforcement is enabled, do not claim App Check protection.
3. **Restrict the Firebase API key by HTTP referrer** to the production site origins and only the required Google APIs, after validating sign-in and Firestore traffic. A Firebase web API key is public configuration, not an authorization secret; Security Rules and App Check remain essential.
4. **Harden administrator identities.** Require verified email, protect the owner Google account with phishing-resistant MFA/passkeys, keep the admin roster minimal, review invitations periodically, and remove access promptly when roles change. Never treat a client-side admin flag as authorization.
5. **Protect GitHub.** Require pull requests, at least one independent review where possible, passing CI checks, and no direct pushes to the deployment branch. Enable Dependabot alerts/security updates and secret scanning/push protection. Limit Actions token permissions to the minimum required.
6. **Backups and recovery.** Configure scheduled Firestore exports to a separately controlled storage bucket, restrict access, encrypt and retain them according to policy, and test restoration. A backup that has never been restored is not a verified recovery plan.
7. **Monitoring.** Alert on Firestore permission-denied spikes, unusual inquiry creation rates, admin roster changes, failed sign-ins, and unexpected spend. Keep sensitive inquiry contents out of application logs.

## Agentic AI: security gate before implementation

Agentic features are intentionally not enabled in this phase. Do not put model API keys in React, Vite-exposed variables, the repository, or browser storage. The `@google/genai` browser-facing dependency has been removed until a server-side AI service is designed and reviewed.

The eventual architecture should have:

- A server-side orchestration service with secrets held only in a managed secret store.
- A narrow, explicit tool registry. Each tool has a typed schema, bounded inputs, an authorization policy, and a timeout.
- Separate identities and least-privilege capabilities for read-only analysis versus writes or external actions.
- Models that propose structured actions; a deterministic policy/authorization layer decides whether an action is allowed.
- Human approval for investor communications, financial decisions, access changes, external commitments, and irreversible writes.
- Tenant- and record-scoped data access; no unrestricted Firestore admin credential passed to a model.
- Prompt-injection isolation: retrieved emails, documents, websites, and inquiry messages are untrusted data, never instructions that can grant tools or authority.
- Append-only audit records for agent identity, model/version, tool, arguments hash, authorization decision, approver, result, and correlation ID. Do not log secrets or full sensitive payloads.
- Rate limits, per-run budgets, concurrency limits, circuit breakers, cancellation, and a global kill switch.
- Adversarial evaluations for prompt injection, data exfiltration, privilege escalation, replay, confused-deputy behavior, and tool argument manipulation before production rollout.

## Local verification

Install dependencies, then run:

```sh
npm install --legacy-peer-deps
npm run lint
npm run test:rules
npm run build
```

The rules tests use the Firestore Emulator and isolated `demo-ajentir-security` project. They do not access production data.

## Known limitations

- GitHub Pages is static hosting. It does not deploy or operate the Express process.
- App Check enforcement, API-key restrictions, MFA, GitHub branch protection, backups, and monitoring must be configured in their respective consoles.
- The browser's Firebase configuration is public by design. Security depends on correct server-enforced Firestore rules and App Check enforcement.
- Email delivery is intentionally disabled until a trusted backend trigger is deployed.
