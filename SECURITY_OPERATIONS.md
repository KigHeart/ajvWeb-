# Ajentir security operations and self-hosting plan

## Deployment truth

The live public website remains a static Vite/React application deployed through GitHub Pages. GitHub Pages cannot execute the Express server or provide a database. The browser application still uses Firebase Authentication and Firestore for the existing admin portal and current inquiry flow. Those dependencies have **not** yet been removed; existing production data and controls remain in place during the migration.

The repository now contains a self-hosted Express + SQLite backend foundation. In production mode, Express can serve the built website and API from one origin on a machine Ajentir controls. This backend is not yet connected to the live inquiry form or admin portal. Do not claim that Ajentir is already Firebase-independent or that the self-hosted API is live.

## Self-hosted target

- One Ajentir-controlled host runs Node.js, Express, and SQLite.
- React static assets and API are served from the same origin.
- SQLite data lives outside the web root in a persistent, access-restricted directory.
- The service runs as a non-root OS account. The host firewall exposes only required ports; TLS is terminated by a reverse proxy on the same machine or another Ajentir-controlled machine.
- No Cloudflare, Firebase, hosted database, CAPTCHA vendor, or third-party account is required for this self-hosted target. GitHub remains the source-control and current static deployment system.
- SQLite is a single-host starting point. Do not run multiple API replicas against a local SQLite file. Move to PostgreSQL only when actual concurrency, multi-host, or availability requirements justify it.

## Current self-hosted API controls

- Express disables its identifying header and sets conservative browser security headers.
- JSON request bodies are bounded to 16 KiB.
- Inquiry fields are validated server-side with bounded lengths and strict lane/sub-track combinations.
- SQL writes use prepared statements and database constraints.
- The public inquiry endpoint has a basic five-per-minute per-socket-IP in-memory limiter and a honeypot-compatible field.
- The rate limiter resets on process restart and is process-local. It is abuse friction, not a bot-proof control or distributed limiter.
- The server does not trust `X-Forwarded-For` by default. Do not enable blanket proxy trust. If a reverse proxy is introduced, trust only its exact address range and test client-IP derivation.
- The database directory is excluded from Git. Restrict file permissions and back up the database using a consistent SQLite backup/snapshot procedure.

## Migration sequence

1. **Backend foundation:** build and test Express + SQLite without changing live traffic.
2. **Public inquiry integration:** switch the React inquiry form to same-origin `/api/inquiries`; test persistence, abuse controls, errors, and recovery on a self-hosted staging instance.
3. **Admin identity:** replace Firebase Auth with a locally managed, server-verified authentication system. Use memory-hard password hashing, secure HttpOnly/SameSite cookies, CSRF protection for state-changing requests, session rotation, account lockout/rate limits, and explicit server-side roles. Never trust client-side admin flags.
4. **Admin API:** move inquiry list, triage, deletion, invitations, and site configuration behind authenticated server endpoints. Add authorization checks and append-only audit events for every administrative mutation.
5. **Data migration:** export Firestore records, import into SQLite, and reconcile record counts and stable content hashes. Preserve a read-only backup and a tested rollback path.
6. **Self-hosted deployment:** deploy the complete application to an Ajentir-controlled machine, test TLS, firewall, process supervision, backups, restore, and monitoring. Keep GitHub Pages unchanged until the self-hosted system is verified.
7. **Firebase retirement:** only after cutover and rollback validation remove Firebase client dependencies, configuration, rules, and project-side resources. Do not delete the existing Firebase project or data as part of the foundation phase.
8. **Agentic services:** only after identity, data access, authorization, and audit logging are stable.

## Agentic AI security boundary

Agentic features are not enabled by this backend foundation. The intended design separates intelligence from authority:

- Models propose typed actions; deterministic policy and server authorization decide whether they may execute.
- Tools have narrow schemas, bounded inputs, explicit permissions, timeouts, and per-run budgets.
- Read-only analysis is separate from writes and external actions.
- Human approval is mandatory for financial actions, investor communications, access changes, external commitments, and irreversible writes.
- Retrieved emails, documents, websites, and inquiry messages are untrusted data, never instructions that grant capabilities.
- Record agent identity, model/version, tool, argument hash, authorization decision, approver, result, and correlation ID. Do not log secrets or full sensitive payloads.
- Include cancellation, concurrency limits, circuit breakers, and a global kill switch.
- Never expose model-provider keys, session secrets, or privileged database credentials to the browser or model context.

## Local verification

```powershell
npm install --legacy-peer-deps
npm run lint
npm run test:rules
npm run test:server
npm run build
npm run dev
```

Node.js 22 or newer is required. Local development creates `data/ajentir.sqlite`; the directory is ignored by Git.
