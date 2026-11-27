import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { openDatabase } from "../database";

test("creates a persistent SQLite inquiry store with prepared inserts", () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "ajentir-db-"));
  const filename = path.join(dir, "nested", "ajentir.sqlite");
  const store = openDatabase(filename);
  const now = new Date().toISOString();
  store.insertInquiry({
    id: "test-id", lane: "founder", subTrack: "investment", fullName: "A Founder",
    company: "Example Ltd", email: "founder@example.com", website: "", teamSize: "",
    preferredSession: "", message: "Test", status: "new", stageTag: "",
    designPartner: "", notes: "", createdAt: now, updatedAt: now,
  });
  store.close();
  const verify = openDatabase(filename);
  verify.close();
  rmSync(dir, { recursive: true, force: true });
});
