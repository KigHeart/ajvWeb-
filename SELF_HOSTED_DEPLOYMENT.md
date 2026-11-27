# Ajentir self-hosted deployment

Ajentir is being moved away from managed application backends. The intended deployment is a single Ajentir-controlled machine running the Node.js application and a local SQLite database. No Cloudflare, Firebase, CAPTCHA vendor, hosted database, or external authentication account is required for this self-hosted target.

## Current scope

- Express serves the API and, in production mode, the built React application from the same origin.
- SQLite stores public inquiries in `data/ajentir.sqlite` (or `AJENTIR_DB_PATH`).
- `POST /api/inquiries` validates bounded fields, enforces a process-local limit of five requests per minute per socket IP, and writes parameterized SQL.
- `GET /api/health` is a non-sensitive health check.
- The database directory must be writable by the service account and backed up.
- The server deliberately does not trust `X-Forwarded-For`. If a reverse proxy is later introduced, configure only its exact trusted IP range; never enable blanket proxy trust.

## Run locally

Requires Node.js 22 or newer.

```powershell
npm install
npm run lint
npm run test:server
npm run build
npm run dev
```

Open http://localhost:3000. The database is created automatically at `data/ajentir.sqlite`.

## Run as a self-hosted production service

Build with `npm run build`, then run with `NODE_ENV=production` and a persistent writable `AJENTIR_DB_PATH`. Put the process behind a TLS-terminating reverse proxy on a machine Ajentir controls. Restrict inbound network access to the proxy and SSH administration; do not expose the Node process directly to the public internet without TLS and host firewall rules.

The repository does not currently include a systemd unit or Windows service wrapper. Those should be added for the actual host OS rather than guessing the target platform.

## Security boundaries and known limitations

- The public inquiry endpoint is unauthenticated by design. It has schema validation, a honeypot-compatible field, body limits, and a basic process-local rate limiter. This is abuse friction, not bot-proofing.
- Rate-limit state resets on process restart and is not shared across multiple server processes. Keep one API process until a shared limiter is deliberately engineered.
- The current admin portal and some public configuration still use Firebase. This commit does not claim Firebase independence. Admin identity, session management, admin APIs, and data migration are separate phases; Firebase must remain intact until those are migrated and verified.
- GitHub Pages remains the existing public deployment while the self-hosted backend is developed. GitHub Pages cannot run this Express server. Do not switch production traffic until a self-hosted host is available and the complete application has passed end-to-end tests.
- SQLite is appropriate for a single-host, modest-write workload. Use PostgreSQL only when measured concurrency, availability, or multi-host requirements justify it.
- Do not add model credentials or agent execution to the public web process. A future agent runtime must be separately permissioned and auditable.

## Data protection

The `data/` directory is excluded from version control. Back up the SQLite database while using SQLite's backup mechanism or a consistent snapshot; test restoration. Restrict file permissions to the service account. Never commit the database, production exports, secrets, or inquiry data.
