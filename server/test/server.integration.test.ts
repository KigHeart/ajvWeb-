import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import test from "node:test";
import { openDatabase } from "../database";

async function unusedPort(): Promise<number> {
  const server = net.createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const port = address.port;
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  return port;
}

async function waitForServer(child: ChildProcess, url: string): Promise<void> {
  const deadline = Date.now() + 12_000;
  let lastError: unknown;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`Server exited early with code ${child.exitCode}`);
    try { const response = await fetch(`${url}/api/health`); if (response.ok) return; }
    catch (error) { lastError = error; }
    await delay(150);
  }
  throw new Error(`Server did not become healthy: ${String(lastError)}`);
}

test("HTTP API validates, stores, filters and rate-limits inquiries", async (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "ajentir-http-test-"));
  const databasePath = path.join(directory, "integration.sqlite");
  const port = await unusedPort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, ["node_modules/tsx/dist/cli.mjs", "server.ts"], {
    cwd: process.cwd(),
    env: { ...process.env, NODE_ENV: "production", PORT: String(port), AJENTIR_DB_PATH: databasePath },
    stdio: "ignore",
  });
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill("SIGTERM");
      await Promise.race([once(child, "exit"), delay(4_000)]);
    }
    for (const suffix of ["", "-wal", "-shm"]) fs.rmSync(`${databasePath}${suffix}`, { force: true });
    fs.rmSync(directory, { recursive: true, force: true });
  });

  await waitForServer(child, baseUrl);
  const health = await fetch(`${baseUrl}/api/health`);
  assert.deepEqual(await health.json(), { ok: true, service: "ajentir-self-hosted-api" });
  assert.equal(health.headers.get("cache-control"), "no-store");
  assert.equal(health.headers.get("x-content-type-options"), "nosniff");

  const payload = { lane: "founder", subTrack: "investment", fullName: "Integration Test", company: "",
    email: "INTEGRATION@example.com", website: "", teamSize: "", preferredSession: "",
    message: "CI-only integration test inquiry" };
  const post = (body: unknown) => fetch(`${baseUrl}/api/inquiries`, { method: "POST",
    headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const postRaw = (body: string) => fetch(`${baseUrl}/api/inquiries`, { method: "POST",
    headers: { "content-type": "application/json" }, body });

  const malformed = await postRaw("{");
  assert.equal(malformed.status, 400, "malformed JSON should be rejected");
  const invalid = await post({ ...payload, lane: "admin" });
  assert.equal(invalid.status, 400, "invalid inquiry must be rejected");
  const honeypot = await post({ ...payload, websiteUrl: "https://spam.invalid" });
  assert.equal(honeypot.status, 202, "honeypot submissions should be quietly accepted");
  const accepted = await post(payload);
  assert.equal(accepted.status, 201, "valid inquiry should be stored");
  const acceptedBody = await accepted.json() as { ok: boolean; id: string };
  assert.equal(acceptedBody.ok, true);
  assert.ok(acceptedBody.id);

  const database = openDatabase(databasePath);
  try {
    const records = database.listInquiries();
    assert.equal(records.length, 1, "only the legitimate inquiry should reach SQLite");
    assert.equal(records[0].id, acceptedBody.id);
    assert.equal(records[0].email, "integration@example.com", "email should be normalized");
    assert.equal(records[0].status, "new");
    assert.equal(records[0].message, "CI-only integration test inquiry");
  } finally { database.close(); }

  assert.equal((await post(payload)).status, 201);
  const limited = await post(payload);
  assert.equal(limited.status, 429, "sixth request, including malformed submissions, must be rate-limited");
  assert.equal(limited.headers.get("retry-after"), "60");
});
