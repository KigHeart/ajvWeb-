import "dotenv/config";
import express, { type Request, type Response, type NextFunction } from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID, timingSafeEqual } from "node:crypto";
import { openDatabase, type DeskKind, type DeskItem } from "./server/database";
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
  const key = req.socket.remoteAddress || "unknown";
  const now = Date.now();
  let bucket = windows.get(key);
  if (!bucket || now - bucket.start >= 60_000) { bucket = { start: now, count: 0 }; windows.set(key, bucket); }
  bucket.count += 1;
  if (windows.size > 10_000) for (const [ip, item] of windows) if (now - item.start >= 60_000) windows.delete(ip);
  if (bucket.count > 5) { res.setHeader("Retry-After", "60"); res.status(429).json({ error: "Too many requests" }); return; }
  next();
}

app.post("/api/inquiries", express.json({ limit: MAX_BODY_BYTES, strict: true }), rateLimit, (req, res) => {
  const payload = validateInquiry(req.body);
  if (!payload) { res.status(400).json({ error: "Invalid inquiry fields" }); return; }
  if (typeof req.body.websiteUrl === "string" && req.body.websiteUrl.trim()) { res.status(202).json({ ok: true }); return; }
  const now = new Date().toISOString();
  try {
    store.insertInquiry({ ...payload, id: randomUUID(), status: "new", stageTag: "", designPartner: "", notes: "", createdAt: now, updatedAt: now });
    res.status(201).json({ ok: true });
  } catch { res.status(503).json({ error: "Could not save inquiry" }); }
});

const DESK_KINDS: DeskKind[] = ["venture","opportunity","task","evidence","organisation"];
const MAX_TEXT: Record<string, number> = { title:180, organisation:180, venture:180, status:40, owner:120, priority:20, dueDate:20, description:4000 };
function deskAuth(req: Request, res: Response, next: NextFunction) {
  res.setHeader("Cache-Control", "no-store");
  const expected = process.env.VENTURE_DESK_KEY || "";
  if (expected.length < 32) { res.status(503).json({ error: "Venture Desk is locked. Configure VENTURE_DESK_KEY with at least 32 characters." }); return; }
  const supplied = req.header("authorization")?.replace(/^Bearer\s+/i, "") || "";
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) { res.status(401).json({ error: "Authentication required" }); return; }
  next();
}
function validKind(value: unknown): value is DeskKind { return typeof value === "string" && DESK_KINDS.includes(value as DeskKind); }
function cleanDeskInput(body: unknown): Record<string, unknown> | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const source = body as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(MAX_TEXT)) {
    if (source[key] === undefined) continue;
    if (typeof source[key] !== "string") return null;
    const value = source[key].trim();
    if (value.length > MAX_TEXT[key]) return null;
    result[key] = value;
  }
  for (const key of ["score","value"]) {
    if (source[key] === undefined) continue;
    if (source[key] !== null && (typeof source[key] !== "number" || !Number.isFinite(source[key]))) return null;
    result[key] = source[key];
  }
  if (source.data !== undefined) {
    if (!source.data || typeof source.data !== "object" || Array.isArray(source.data) || JSON.stringify(source.data).length > 8000) return null;
    result.data = source.data;
  }
  return result;
}
app.use("/api/venture-desk", express.json({ limit: "16kb", strict: true }), deskAuth);
app.get("/api/venture-desk", (req, res) => {
  const kind = req.query.kind;
  if (kind !== undefined && !validKind(kind)) { res.status(400).json({ error: "Invalid item type" }); return; }
  res.json({ items: store.listDeskItems(kind as DeskKind | undefined) });
});
app.post("/api/venture-desk", (req, res) => {
  const kind = req.body?.kind;
  const input = cleanDeskInput(req.body);
  if (!validKind(kind) || !input || typeof input.title !== "string" || !input.title) { res.status(400).json({ error: "A valid item type and title are required" }); return; }
  const now = new Date().toISOString();
  const item: DeskItem = {
    id: randomUUID(), kind, title: input.title as string, organisation: (input.organisation as string) || "",
    venture: (input.venture as string) || "", status: (input.status as string) || "active",
    owner: (input.owner as string) || "", priority: (input.priority as string) || "normal",
    score: (input.score as number | null) ?? null, value: (input.value as number | null) ?? null,
    dueDate: (input.dueDate as string) || "", description: (input.description as string) || "",
    data: (input.data as Record<string, unknown>) || {}, createdAt: now, updatedAt: now,
  };
  res.status(201).json({ item: store.createDeskItem(item) });
});
app.patch("/api/venture-desk/:id", (req, res) => {
  const patch = cleanDeskInput(req.body);
  if (!patch || Object.keys(patch).length === 0) { res.status(400).json({ error: "No valid fields supplied" }); return; }
  const item = store.updateDeskItem(req.params.id, patch, new Date().toISOString());
  if (!item) { res.status(404).json({ error: "Item not found" }); return; }
  res.json({ item });
});
app.delete("/api/venture-desk/:id", (req, res) => {
  if (!store.deleteDeskItem(req.params.id)) { res.status(404).json({ error: "Item not found" }); return; }
  res.status(204).end();
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof SyntaxError || (typeof err === "object" && err !== null && "type" in err && err.type === "entity.too.large")) {
    res.status(400).json({ error: "Invalid or oversized request" }); return;
  }
  res.status(500).json({ error: "Internal server error" });
});

if (!IS_PROD) {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
  app.use(vite.middlewares);
} else {
  const distDir = path.resolve(__dirname, "dist");
  app.use(express.static(distDir, { dotfiles: "deny", index: false, maxAge: "1h",
    setHeaders(res, filePath) { if (filePath.endsWith(".html")) res.setHeader("Cache-Control", "no-cache"); },
  }));
  app.get("*", (_req, res) => res.sendFile(path.join(distDir, "index.html")));
}

const httpServer = app.listen(PORT, "0.0.0.0", () => console.log(`Ajentir self-hosted server listening on port ${PORT}`));
function shutdown() { httpServer.close(() => { store.close(); process.exit(0); }); }
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
