# Ajentir Cloudflare backend foundation

This directory introduces the first independently deployable backend. It does not yet replace Firebase in the live frontend. The current site remains operational while the admin portal and public inquiry client are migrated in later phases.

## Runtime

- Cloudflare Worker: `src/worker.ts`
- Cloudflare D1: relational inquiry store and atomic fixed-window rate-limit counters
- Cloudflare Turnstile: server-verified bot challenge
- No model credentials, database credentials, or Turnstile secret are exposed to the browser

## Provisioning

1. Create a Cloudflare account and select the account that will own Ajentir's infrastructure.
2. From this repository root, run `npx wrangler login`.
3. Create the production database: `npx wrangler d1 create ajentir-production`.
4. Copy the returned database ID into `cloudflare/wrangler.toml`, then uncomment the D1 binding.
5. Apply the schema locally and remotely:
   - `npx wrangler d1 migrations apply ajentir-production --local --config cloudflare/wrangler.toml`
   - `npx wrangler d1 migrations apply ajentir-production --remote --config cloudflare/wrangler.toml`
6. Create a Turnstile widget for the eventual production hostname. Configure its hostname allowlist to the exact production host.
7. Set Worker secrets:
   - `npx wrangler secret put TURNSTILE_SECRET_KEY --config cloudflare/wrangler.toml`
   - `npx wrangler secret put RATE_LIMIT_SALT --config cloudflare/wrangler.toml` (use a random value of at least 32 bytes)
8. Set the non-secret Worker variable `ALLOWED_ORIGINS` to the exact comma-separated website origins, e.g. `https://kigheart.github.io`. Add a local origin only in a separate development environment.
9. Deploy: `npx wrangler deploy --config cloudflare/wrangler.toml`.

Do not put Turnstile's secret key or the rate-limit salt in GitHub variables, frontend environment variables, or source control. Use Worker secrets.

## API contract

### `GET /api/health`
Returns a non-sensitive health response.

### `POST /api/inquiries`
Requires:
- Exact allowed `Origin`
- `Content-Type: application/json`
- Valid lane/sub-track pairing and bounded fields
- A Turnstile token with action `inquiry` and matching hostname
- No more than five requests per hashed client IP per 60-second window

Body fields: `lane`, `subTrack`, `fullName`, `company`, `email`, `website`, `teamSize`, `preferredSession`, `message`, `turnstileToken`. Optional `websiteUrl` is a honeypot; a filled value is silently discarded.

The Worker hashes the Cloudflare-provided client IP with a secret salt before storing a rate-limit key. Raw IP addresses are not persisted. Rate-limit records are partitioned into minute buckets. A scheduled cleanup job should be added before high-volume production use.

## Security boundaries and current limitations

- The Worker does not expose inquiry listing, admin writes, user management, or agent tools yet.
- The admin portal still uses Firebase Authentication and Firestore. Do not disable or delete Firebase resources until the replacement admin identity, authorization, data migration, and rollback are verified.
- Turnstile is mandatory for inquiry writes; missing configuration fails closed.
- The rate limit is an application-level fixed window, not a substitute for Cloudflare WAF or platform-level DDoS protection.
- Add an admin identity provider (recommended: Cloudflare Access with JWT verification) before implementing administrative endpoints.
- All state-changing agentic actions must remain unavailable until a separate authorization/policy layer and human-approval workflow are implemented.
