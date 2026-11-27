import { MAX_BODY_BYTES, validateInquiry } from "./validation";

interface D1Statement {
  bind(...values: unknown[]): D1Statement;
  first<T>(): Promise<T | null>;
  run(): Promise<{ success: boolean; meta?: { changes?: number } }>;
}
interface D1Database {
  prepare(query: string): D1Statement;
}
interface Env {
  DB: D1Database;
  TURNSTILE_SECRET_KEY: string;
  RATE_LIMIT_SALT: string;
  ALLOWED_ORIGINS: string;
}

const json = (data: unknown, status = 200, extra: HeadersInit = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...extra },
  });

function allowedOrigin(request: Request, env: Env): string | null {
  const origin = request.headers.get("Origin");
  if (!origin) return null;
  return env.ALLOWED_ORIGINS.split(",").map((item) => item.trim()).filter(Boolean).includes(origin)
    ? origin
    : null;
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function consumeRateLimit(request: Request, env: Env): Promise<boolean> {
  const ip = request.headers.get("CF-Connecting-IP");
  if (!ip) return false;
  const key = await sha256(`${env.RATE_LIMIT_SALT}:${ip}`);
  const bucket = Math.floor(Date.now() / 60_000);
  const row = await env.DB.prepare(
    "INSERT INTO rate_limits (key_hash, window_bucket, request_count) VALUES (?, ?, 1) " +
    "ON CONFLICT(key_hash, window_bucket) DO UPDATE SET request_count = request_count + 1 " +
    "RETURNING request_count",
  ).bind(key, bucket).first<{ request_count: number }>();
  // Keep only two hours of buckets; the database stores a salted hash, never the raw IP.
  await env.DB.prepare("DELETE FROM rate_limits WHERE window_bucket < ?").bind(bucket - 120).run();
  return Boolean(row && row.request_count <= 5);
}

async function verifyTurnstile(token: string, request: Request, env: Env): Promise<boolean> {
  if (!env.TURNSTILE_SECRET_KEY || token.length < 10 || token.length > 2048) return false;
  const form = new FormData();
  form.set("secret", env.TURNSTILE_SECRET_KEY);
  form.set("response", token);
  const remoteIp = request.headers.get("CF-Connecting-IP");
  if (remoteIp) form.set("remoteip", remoteIp);

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return false;
    const result = await response.json() as { success?: boolean; action?: string; hostname?: string };
    const origin = request.headers.get("Origin");
    const expectedHost = origin ? new URL(origin).hostname : "";
    return result.success === true && result.action === "inquiry" && result.hostname === expectedHost;
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = allowedOrigin(request, env);
    const cors: HeadersInit = origin ? {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin",
    } : {};

    if (request.method === "OPTIONS") {
      return origin ? new Response(null, { status: 204, headers: cors }) : json({ error: "Origin not allowed" }, 403);
    }

    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/api/health") {
      return json({ ok: true, service: "ajentir-api" }, 200, cors);
    }

    if (url.pathname !== "/api/inquiries" || request.method !== "POST") {
      return json({ error: "Not found" }, 404, cors);
    }
    if (!origin) return json({ error: "Origin not allowed" }, 403);
    if (!request.headers.get("Content-Type")?.toLowerCase().startsWith("application/json")) {
      return json({ error: "Unsupported content type" }, 415, cors);
    }

    const declaredLength = Number(request.headers.get("Content-Length") ?? "0");
    if (declaredLength > MAX_BODY_BYTES) return json({ error: "Request too large" }, 413, cors);
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) return json({ error: "Request too large" }, 413, cors);

    let body: Record<string, unknown>;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid");
      body = parsed as Record<string, unknown>;
    } catch {
      return json({ error: "Invalid JSON" }, 400, cors);
    }

    const inquiry = validateInquiry(body);
    if (!inquiry) return json({ error: "Invalid inquiry fields" }, 400, cors);
    if (typeof body.websiteUrl === "string" && body.websiteUrl.trim() !== "") {
      // Honeypot: respond generically without persisting.
      return json({ ok: true, id: crypto.randomUUID() }, 202, cors);
    }

    try {
      if (!await consumeRateLimit(request, env)) return json({ error: "Too many requests" }, 429, cors);
    } catch {
      return json({ error: "Service temporarily unavailable" }, 503, cors);
    }

    const token = typeof body.turnstileToken === "string" ? body.turnstileToken : "";
    if (!await verifyTurnstile(token, request, env)) {
      return json({ error: "Human verification failed" }, 403, cors);
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    try {
      await env.DB.prepare(
        "INSERT INTO inquiries (id, lane, sub_track, full_name, company, email, website, team_size, preferred_session, message, status, created_at, updated_at) " +
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?)",
      ).bind(
        id, inquiry.lane, inquiry.subTrack, inquiry.fullName, inquiry.company, inquiry.email,
        inquiry.website, inquiry.teamSize, inquiry.preferredSession, inquiry.message, now, now,
      ).run();
      return json({ ok: true, id }, 201, cors);
    } catch {
      return json({ error: "Could not save inquiry" }, 503, cors);
    }
  },
};
