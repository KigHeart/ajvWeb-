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
5. **Protect GitHub.** Require pull requests, at least one independent review where possible, passing CI checks, and no direct pushes to the deployment branch. Dependabot weekly updates and CodeQL TypeScript analysis are configured in this repository; also enable secret scanning/push protection in repository settings. Limit Actions token permissions to the minimum required.
6. **Backups and recovery.** Configure scheduled Firestore exports to a separately controlled storage bucket, restrict access, encrypt and retain them according to policy, and test restoration. A backup that has never been restored is not a verified recovery plan.
7. **Monitoring.** Alert on Firestore permission-denied spikes, unusual inquiry creation rates, admin roster changes, failed sign-ins, and unexpected spend. Keep sensitive inquiry contents out of application logs.

## Agentic AI: security gate before implementation

Agentic features are intentionally not enabled in this phase. Do not put model API keys in React, Vite-exposed variables, the repository, or browser storage. The unused `@google/genai` dependency has been removed. No agent runtime is currently implemented.

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


## Cloudflare independence migration (in progress)

The strategic target is to remove Firebase as an application dependency and operate Ajentir's backend on Cloudflare. This is a staged migration, not a production cutover.

### Phase 1 — backend foundation

- A Cloudflare Worker API is being introduced under `cloudflare/`.
- D1 schema covers inquiries and hashed, time-bucketed rate-limit counters.
- Public inquiry writes require an exact allowed Origin, bounded JSON payload, valid lane/sub-track pairing, Turnstile verification on the server, and a five-per-minute per-client limit.
- Turnstile secrets and the rate-limit salt belong only in Worker secrets.
- The current React application still talks to Firebase. The Worker is not yet deployed or connected to the live form.
- The current Firebase App Check/reCAPTCHA work is superseded by this migration direction. Do not create new Google reCAPTCHA resources for Ajentir.

### Phase 2 — public inquiry cutover

- Add the Turnstile client widget and connect the inquiry form to the Worker.
- Provision D1 and apply migrations in a Cloudflare account controlled by Ajentir.
- Deploy the Worker to a staging hostname, test abuse controls and data persistence, then cut over the public form.
- Keep Firebase data intact until parity and rollback have been verified.

### Phase 3 — admin identity and data migration

- Replace Firebase Authentication with a server-verified identity provider. Cloudflare Access is the initial candidate for the private admin portal.
- Verify Access JWTs in the Worker; never accept browser-provided admin flags or email claims without signature and issuer/audience validation.
- Implement admin-only list, triage, delete, configuration and invitation endpoints with explicit authorization checks and audit records.
- Migrate existing Firestore inquiries and site configuration with a repeatable export/import process and row-count/hash reconciliation.
- Only after production validation should Firebase client dependencies, rules, project configuration and old resources be retired.

### Phase 4 — agentic services

- Add a separate server-side agent orchestration boundary only after identity, data access, audit logging and authorization are established.
- Models may propose typed actions; deterministic policy and authorization decide whether they execute.
- Financial actions, external communications, access changes and irreversible writes require human approval.
- Do not expose model provider keys or privileged database credentials to the browser or model context.

Cloudflare resources, secrets and production routing require access to the Ajentir-owned Cloudflare account. Repository code alone cannot provision or activate those account resources.
