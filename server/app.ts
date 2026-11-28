import { randomUUID } from "node:crypto";
import path from "node:path";
import express, { type ErrorRequestHandler, type NextFunction, type Request, type RequestHandler, type Response } from "express";
import type { InquiryDatabase } from "./database";
import { dispatchAlerts, parseNotifyPayload } from "./notify";
import { createRateLimiter, type RateLimiter } from "./rateLimit";
import { MAX_BODY_BYTES, validateInquiry } from "./validation";

export const SERVICE_NAME = "ajentir-self-hosted-api";

export interface AppOptions {
  database: InquiryDatabase;
  /** Directory of the built site; omit in development, where Vite serves it. */
  staticDir?: string;
  /** Value for Express `trust proxy`. Leave unset unless behind a known proxy. */
  trustedProxy?: string;
  inquiryLimiter?: RateLimiter;
  notifyLimiter?: RateLimiter;
}

function limit(limiter: RateLimiter): RequestHandler {
  return (req, res, next) => {
    const decision = limiter.check(req.ip ?? "unknown");
    if (decision.limited) {
      res.setHeader("Retry-After", String(decision.retryAfterSeconds));
      res.status(429).json({ ok: false, error: "Too many requests" });
      return;
    }
    next();
  };
}

function apiHeaders(_req: Request, res: Response, next: NextFunction) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  next();
}

const jsonErrors: ErrorRequestHandler = (error, _req, res, _next) => {
  const status = typeof error?.status === "number" && error.status >= 400 && error.status < 500 ? error.status : 500;
  res.status(status).json({ ok: false, error: status === 413 ? "Payload too large" : status === 500 ? "Internal error" : "Bad request" });
};

export function createApp({ database, staticDir, trustedProxy, inquiryLimiter, notifyLimiter }: AppOptions) {
  const app = express();
  app.disable("x-powered-by");
  // Trust forwarded client addresses only from a named proxy; `true` would let any client spoof its IP.
  app.set("trust proxy", trustedProxy || false);

  const inquiryRate = limit(inquiryLimiter ?? createRateLimiter({ windowMs: 60_000, max: 5 }));
  const notifyRate = limit(notifyLimiter ?? createRateLimiter({ windowMs: 15 * 60_000, max: 10 }));
  const json = express.json({ limit: MAX_BODY_BYTES });

  app.use("/api", apiHeaders);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: SERVICE_NAME });
  });

  // Rate limiting runs before body parsing so malformed bodies are counted too.
  app.post("/api/inquiries", inquiryRate, json, (req, res) => {
    const body = req.body as Record<string, unknown> | undefined;
    // Honeypot: real visitors never see this field. Accept quietly, store nothing.
    if (body && typeof body.websiteUrl === "string" && body.websiteUrl.trim() !== "") {
      res.status(202).json({ ok: true });
      return;
    }
    const payload = validateInquiry(body);
    if (!payload) {
      res.status(400).json({ ok: false, error: "Invalid inquiry" });
      return;
    }
    const now = new Date().toISOString();
    const id = randomUUID();
    database.insertInquiry({
      ...payload, id, status: "new", stageTag: "", designPartner: "", notes: "", createdAt: now, updatedAt: now,
    });
    res.status(201).json({ ok: true, id });
  });

  // Legacy alert relay used by the Firebase transport; unchanged behaviour.
  app.post("/api/notify", notifyRate, json, async (req, res) => {
    const payload = parseNotifyPayload(req.body);
    if (!payload) {
      res.status(400).json({ ok: false, error: "Invalid inquiry notification payload" });
      return;
    }
    res.json({ ok: true, ...(await dispatchAlerts(payload)) });
  });

  app.use("/api", (_req, res) => {
    res.status(404).json({ ok: false, error: "Not found" });
  });

  if (staticDir) {
    app.use(express.static(staticDir));
    // Express 4 SPA fallback (the old `*all` pattern is Express 5 syntax).
    app.use((req, res, next) => {
      if (req.method !== "GET" && req.method !== "HEAD") return next();
      res.sendFile(path.join(staticDir, "index.html"));
    });
  }

  app.use(jsonErrors);
  return app;
}
