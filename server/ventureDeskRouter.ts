import express, { type Request, type Response, type NextFunction } from "express";
import { randomUUID, timingSafeEqual } from "node:crypto";
import { openDatabase, type DeskKind, type DeskInput } from "./ventureDeskDatabase";

const KINDS: DeskKind[] = ["venture", "opportunity", "task", "evidence", "organisation"];
const MAX_TEXT: Record<string, number> = {
  title: 180, organisation: 180, venture: 180, status: 40, owner: 120,
  priority: 20, dueDate: 20, description: 4000,
};

function rateLimit() {
  const buckets = new Map<string, { start: number; count: number }>();
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.socket.remoteAddress || "unknown";
    const now = Date.now();
    let bucket = buckets.get(key);
    if (!bucket || now - bucket.start >= 60_000) {
      bucket = { start: now, count: 0 };
      buckets.set(key, bucket);
    }
    bucket.count += 1;
    if (buckets.size > 10_000) {
      for (const [ip, item] of buckets) if (now - item.start >= 60_000) buckets.delete(ip);
    }
    if (bucket.count > 120) {
      res.setHeader("Retry-After", "60");
      res.status(429).json({ error: "Too many requests" });
      return;
    }
    next();
  };
}

function cleanInput(body: unknown): DeskInput | null {
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
  for (const key of ["score", "value"]) {
    if (source[key] === undefined) continue;
    if (source[key] !== null && (typeof source[key] !== "number" || !Number.isFinite(source[key]))) return null;
    result[key] = source[key];
  }
  const statuses = ["active","incubating","paused","exited","captured","investigating","validating","validated","rejected","todo","in_progress","blocked","done","unverified","observed","documented","commercial","prospect","engaged","design_partner","customer","inactive"];
  if (result.status && !statuses.includes(result.status as string)) return null;
  if (result.priority && !["low","normal","high","critical"].includes(result.priority as string)) return null;
  if (typeof result.score === "number" && (result.score < 0 || result.score > 100)) return null;
  if (typeof result.value === "number" && result.value < 0) return null;
  if (source.data !== undefined) {
    if (!source.data || typeof source.data !== "object" || Array.isArray(source.data) || JSON.stringify(source.data).length > 8000) return null;
    result.data = source.data;
  }
  return result as DeskInput;
}

export function createVentureDeskRouter() {
  const dbPath = process.env.VENTURE_DESK_DB_PATH?.trim() || "data/venture-desk.sqlite";
  const store = openDatabase(dbPath);
  const router = express.Router();
  router.use(express.json({ limit: "16kb", strict: true }));
  router.use(rateLimit());
  router.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader("Cache-Control", "no-store");
    const expected = process.env.VENTURE_DESK_KEY?.trim() || "";
    if (expected.length < 32) {
      res.status(503).json({ error: "Venture Desk is locked. Configure VENTURE_DESK_KEY with at least 32 characters." });
      return;
    }
    const supplied = req.header("authorization")?.replace(/^Bearer\\s+/i, "") || "";
    const a = Buffer.from(supplied);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    next();
  });

  router.get("/", (req, res) => {
    const kind = req.query.kind;
    if (kind !== undefined && (typeof kind !== "string" || !KINDS.includes(kind as DeskKind))) {
      res.status(400).json({ error: "Invalid item type" });
      return;
    }
    res.json({ items: store.listDeskItems(kind as DeskKind | undefined) });
  });
  router.post("/", (req, res) => {
    const kind = req.body?.kind;
    const input = cleanInput(req.body);
    if (typeof kind !== "string" || !KINDS.includes(kind as DeskKind) || !input || typeof input.title !== "string" || !input.title) {
      res.status(400).json({ error: "A valid item type and title are required" });
      return;
    }
    const now = new Date().toISOString();
    const item = {
      id: randomUUID(), kind: kind as DeskKind, title: input.title,
      organisation: input.organisation || "", venture: input.venture || "",
      status: input.status || "active", owner: input.owner || "", priority: input.priority || "normal",
      score: input.score ?? null, value: input.value ?? null, dueDate: input.dueDate || "",
      description: input.description || "", data: input.data || {}, createdAt: now, updatedAt: now,
    };
    res.status(201).json({ item: store.createDeskItem(item) });
  });
  router.patch("/:id", (req, res) => {
    const patch = cleanInput(req.body);
    if (!patch || Object.keys(patch).length === 0) {
      res.status(400).json({ error: "No valid fields supplied" });
      return;
    }
    const item = store.updateDeskItem(req.params.id, patch, new Date().toISOString());
    if (!item) {
      res.status(404).json({ error: "Item not found" });
      return;
    }
    res.json({ item });
  });
  router.delete("/:id", (req, res) => {
    if (!store.deleteDeskItem(req.params.id)) {
      res.status(404).json({ error: "Item not found" });
      return;
    }
    res.status(204).end();
  });
  return { router, close: () => store.close() };
}
