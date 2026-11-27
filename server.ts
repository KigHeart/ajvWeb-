import "dotenv/config";
import express, { type Request, type Response, type NextFunction } from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { openDatabase } from "./server/database";
import { MAX_BODY_BYTES, validateInquiry } from "./server/validation";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === "production";
const DB_PATH = process.env.AJENTIR_DB_PATH || path.resolve(__dirname, "data/ajentir.sqlite");
const store = openDatabase(DB_PATH);
const app = express();
app.disable("x-powered-by");
app.disable("etag");

app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  if (IS_PROD) res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  next();
});

app.get("/api/health", (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.json({ ok: true, service: "ajentir-self-hosted-api" });
});

const windows = new Map<string, { start: number; count: number }>();
function rateLimit(req: Request, res: Response, next: NextFunction) {
  // Do not trust X-Forwarded-For by default; configure a known reverse proxy explicitly if needed.
  const key = req.socket.remoteAddress || "unknown";
  const now = Date.now();
  let bucket = windows.get(key);
  if (!bucket || now - bucket.start >= 60_000) {
    bucket = { start: now, count: 0 };
    windows.set(key, bucket);
  }
  bucket.count += 1;
  if (windows.size > 10_000) {
    for (const [ip, item] of windows) if (now - item.start >= 60_000) windows.delete(ip);
  }
  if (bucket.count > 5) {
    res.setHeader("Retry-After", "60");
    res.status(429).json({ error: "Too many requests" });
    return;
  }
  next();
}

app.post("/api/inquiries", express.json({ limit: MAX_BODY_BYTES, strict: true }), rateLimit, (req, res) => {
  const payload = validateInquiry(req.body);
  if (!payload) {
    res.status(400).json({ error: "Invalid inquiry fields" });
    return;
  }
  if (typeof req.body.websiteUrl === "string" && req.body.websiteUrl.trim()) {
    res.status(202).json({ ok: true });
    return;
  }
  const now = new Date().toISOString();
  const id = randomUUID();
  try {
    store.insertInquiry({
      ...payload, id, status: "new", stageTag: "", designPartner: "", notes: "",
      createdAt: now, updatedAt: now,
    });
    res.status(201).json({ ok: true, id });
  } catch {
    // Never log the inquiry body or personally identifying fields.
    res.status(503).json({ error: "Could not save inquiry" });
  }
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof SyntaxError || (typeof err === "object" && err !== null && "type" in err && err.type === "entity.too.large")) {
    res.status(400).json({ error: "Invalid or oversized request" });
    return;
  }
  res.status(500).json({ error: "Internal server error" });
});

if (!IS_PROD) {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
  app.use(vite.middlewares);
} else {
  const distDir = path.resolve(__dirname, "dist");
  app.use(express.static(distDir, {
    dotfiles: "deny", index: false, maxAge: "1h",
    setHeaders(res, filePath) { if (filePath.endsWith(".html")) res.setHeader("Cache-Control", "no-cache"); },
  }));
  app.get("*", (_req, res) => res.sendFile(path.join(distDir, "index.html")));
}

const httpServer = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Ajentir self-hosted server listening on port ${PORT}`);
});
function shutdown() {
  httpServer.close(() => { store.close(); process.exit(0); });
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
