import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

export type LedgerKind =
  | "run_started"
  | "model_request"
  | "model_response"
  | "validation_failed"
  | "tool_allowed"
  | "tool_denied"
  | "approval_granted"
  | "run_completed"
  | "run_failed";

export interface LedgerEvent {
  seq: number;
  runId: string;
  kind: LedgerKind;
  actor: string;
  payload: unknown;
  at: string;
  prevHash: string;
  hash: string;
}

export const GENESIS_HASH = "0".repeat(64);

/** JSON with sorted keys, so a hash does not depend on property order. */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(",")}}`;
}

function hashEvent(e: Omit<LedgerEvent, "hash">): string {
  return createHash("sha256")
    .update(`${e.prevHash}\n${canonicalJson({ seq: e.seq, runId: e.runId, kind: e.kind, actor: e.actor, payload: e.payload, at: e.at })}`)
    .digest("hex");
}

export interface Verification {
  ok: boolean;
  events: number;
  /** seq of the first event whose hash or link does not check out. */
  brokenAt?: number;
  head: string;
}

/**
 * Append-only, hash-chained event log in SQLite. Triggers refuse UPDATE and
 * DELETE; the chain makes any change made around them detectable by verify().
 * Tamper-evident, not tamper-proof: someone with write access to the file can
 * rewrite the whole chain, so anchor the head hash somewhere they cannot reach.
 */
export function openLedger(filename: string, now: () => string = () => new Date().toISOString()) {
  if (filename !== ":memory:") fs.mkdirSync(path.dirname(path.resolve(filename)), { recursive: true });
  const db = new Database(filename);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      seq INTEGER PRIMARY KEY,
      run_id TEXT NOT NULL,
      kind TEXT NOT NULL,
      actor TEXT NOT NULL,
      payload TEXT NOT NULL,
      at TEXT NOT NULL,
      prev_hash TEXT NOT NULL,
      hash TEXT NOT NULL UNIQUE
    );
    CREATE INDEX IF NOT EXISTS events_run_idx ON events(run_id, seq);
    CREATE TRIGGER IF NOT EXISTS events_no_update BEFORE UPDATE ON events
      BEGIN SELECT RAISE(ABORT, 'ledger is append-only'); END;
    CREATE TRIGGER IF NOT EXISTS events_no_delete BEFORE DELETE ON events
      BEGIN SELECT RAISE(ABORT, 'ledger is append-only'); END;
  `);

  type Row = { seq: number; run_id: string; kind: LedgerKind; actor: string; payload: string; at: string; prev_hash: string; hash: string };
  const fromRow = (r: Row): LedgerEvent => ({
    seq: r.seq, runId: r.run_id, kind: r.kind, actor: r.actor, payload: JSON.parse(r.payload),
    at: r.at, prevHash: r.prev_hash, hash: r.hash,
  });
  const last = db.prepare("SELECT seq, hash FROM events ORDER BY seq DESC LIMIT 1");
  const insert = db.prepare("INSERT INTO events (seq, run_id, kind, actor, payload, at, prev_hash, hash) VALUES (?,?,?,?,?,?,?,?)");
  const all = db.prepare("SELECT * FROM events ORDER BY seq ASC");
  const forRun = db.prepare("SELECT * FROM events WHERE run_id = ? ORDER BY seq ASC");

  // IMMEDIATE transaction: two writers cannot read the same head and fork the chain.
  const appendTx = db.transaction((runId: string, kind: LedgerKind, actor: string, payload: unknown): LedgerEvent => {
    const head = last.get() as { seq: number; hash: string } | undefined;
    const base = {
      seq: (head?.seq ?? 0) + 1, runId, kind, actor,
      payload: JSON.parse(canonicalJson(payload)) as unknown, at: now(), prevHash: head?.hash ?? GENESIS_HASH,
    };
    const event: LedgerEvent = { ...base, hash: hashEvent(base) };
    insert.run(event.seq, runId, kind, actor, canonicalJson(event.payload), event.at, event.prevHash, event.hash);
    return event;
  });

  return {
    append(runId: string, kind: LedgerKind, actor: string, payload: unknown = {}): LedgerEvent {
      return appendTx.immediate(runId, kind, actor, payload);
    },
    events(runId?: string): LedgerEvent[] {
      return ((runId ? forRun.all(runId) : all.all()) as Row[]).map(fromRow);
    },
    verify(): Verification {
      let prev = GENESIS_HASH;
      let count = 0;
      for (const e of (all.all() as Row[]).map(fromRow)) {
        const { hash, ...rest } = e;
        if (e.prevHash !== prev || e.seq !== count + 1 || hashEvent(rest) !== hash) {
          return { ok: false, events: count, brokenAt: e.seq, head: prev };
        }
        prev = hash;
        count += 1;
      }
      return { ok: true, events: count, head: prev };
    },
    /** Raw handle for tests that need to simulate tampering. */
    unsafeDatabase: db,
    close() { db.close(); },
  };
}

export type Ledger = ReturnType<typeof openLedger>;
