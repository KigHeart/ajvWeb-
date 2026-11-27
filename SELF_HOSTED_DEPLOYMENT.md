# Ajentir self-hosted deployment

Ajentir's self-hosted target is a single application process, a persistent SQLite database, and Caddy for HTTPS. The Docker deployment serves the React website and Express API from the same origin. Public inquiry submissions are built to use SQLite (`VITE_INQUIRY_TRANSPORT=self-hosted`).

## What this deployment provides

- One container runs the production Express server and serves the built React application.
- SQLite persists inquiries in a named Docker volume, independent of container replacement.
- Caddy terminates HTTPS and obtains and renews certificates automatically.
- The application runs as an unprivileged user with a read-only root filesystem, dropped Linux capabilities, and no-new-privileges.
- The API is not published directly to the host; only Caddy exposes ports 80 and 443.
- The app trusts only Caddy's fixed private-network IP for forwarded client addresses, so the rate limiter sees individual client IPs.
- No Firebase, Cloudflare, CAPTCHA provider, managed database, or external authentication service is required for the public inquiry path.

## Host requirements

- A Linux machine you control with Docker Engine and the Docker Compose plugin.
- A DNS name whose A/AAAA records point to that machine.
- Inbound TCP ports 80 and 443 available to Caddy. UDP 443 is optional and enables HTTP/3.
- Persistent Docker volumes for SQLite and Caddy certificate state.
- If `172.30.42.0/24` conflicts with an existing host or VPN network, change the subnet and Caddy fixed IP in `docker-compose.yml`, and update `AJENTIR_TRUSTED_PROXY` to match.

This repository does not provision a machine, domain, DNS records, firewall rules, or hosting account. Those remain under the operator's control.

## First deployment

1. Install Docker Engine and the Docker Compose plugin on the target Linux host.
2. Check out this repository on that host.
3. Copy `.env.example` to `.env`, then set `AJENTIR_DOMAIN` to the DNS name pointing at the host and `ACME_EMAIL` to an address for certificate notices.
4. Ensure ports 80 and 443 reach the host and are not already occupied by another web server.
5. Build and start the stack with `docker compose up -d --build`.
6. Verify `docker compose ps` reports both services healthy/running, then visit `https://YOUR_DOMAIN/api/health`. A healthy API returns `{"ok":true,"service":"ajentir-self-hosted-api"}`.
7. Submit a controlled test inquiry through the public form only after DNS, TLS, and storage have been verified.

Do not place production secrets or real inquiry data in Git. This deployment does not yet expose self-hosted admin login or inquiry-management routes.

## Updates and rollback

- Update the checked-out source to the reviewed commit, then run `docker compose up -d --build`.
- Keep the named `ajentir-data` volume when replacing containers. Never use `docker compose down -v` on a live installation.
- Before upgrades, take and verify a database backup. Keep the previous known-good Git commit available for rollback.
- The GitHub Pages deployment remains independent and unchanged. Do not switch the public domain until the self-hosted instance passes acceptance checks.

## Database backup

Use SQLite's online backup API from the app container so the snapshot is consistent while the service is running:

```sh
docker compose exec -T app node --input-type=commonjs -e "const Database=require('better-sqlite3'); const db=new Database('/app/data/ajentir.sqlite'); db.backup('/app/data/backup-' + new Date().toISOString().replace(/[:.]/g,'-') + '.sqlite').then(()=>db.close()).catch(e=>{console.error(e);process.exit(1)})"
```

Copy completed backup files off the host and periodically test restoration into a separate database. A backup stored only in the same Docker volume is not disaster recovery.

## Existing limitations

- The public inquiry API is unauthenticated by design. It has schema validation, a honeypot-compatible field, request-size limits, and a process-local rate limiter. This is abuse friction, not bot-proofing.
- The rate limiter resets on restart and is not shared across replicas. Keep a single app instance until shared rate limiting is deliberately implemented.
- The admin portal still uses Firebase. This deployment makes the public inquiry path self-hosted; it does not claim complete Firebase independence.
- Owner authentication primitives are being developed separately. No admin HTTP endpoints are exposed by this deployment.
- GitHub Pages cannot run Express or persist SQLite. It remains the current live site until a self-hosted host is deliberately commissioned and verified.
- SQLite is suitable for a single-host, modest-write workload. Move to PostgreSQL only when measured concurrency, availability, or multi-host requirements justify it.
- Do not add model credentials or agent execution to the public web process. A future agent runtime must be separately permissioned and audited.
