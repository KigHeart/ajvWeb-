import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { openDatabase } from "../database";

function fixture() {
  const dir = mkdtempSync(path.join(os.tmpdir(), "ajentir-db-"));
  const store = openDatabase(path.join(dir, "nested", "ajentir.sqlite"));
  const now = "2026-11-27T10:00:00.000Z";
  store.insertInquiry({
    id: "test-id", lane: "founder", subTrack: "investment", fullName: "A Founder",
    company: "Example Ltd", email: "founder@example.com", website: "", teamSize: "",
    preferredSession: "", message: "Test", status: "new", stageTag: "",
    designPartner: "", notes: "", createdAt: now, updatedAt: now,
  });
  return { dir, store };
}

test("creates a persistent SQLite inquiry store with prepared inserts", () => {
  const { dir, store } = fixture();
  try {
    assert.equal(store.listInquiries().length, 1);
    store.close();
    const verify = openDatabase(path.join(dir, "nested", "ajentir.sqlite"));
    assert.equal(verify.listInquiries()[0].id, "test-id");
    verify.close();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("lists inquiries newest first and maps database fields to API fields", () => {
  const { dir, store } = fixture();
  try {
    const rows = store.listInquiries();
    assert.equal(rows[0].fullName, "A Founder");
    assert.equal(rows[0].subTrack, "investment");
    assert.equal(rows[0].createdAt, "2026-11-27T10:00:00.000Z");
  } finally {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("updates triage fields without changing inquiry content", () => {
  const { dir, store } = fixture();
  try {
    const changed = store.updateInquiryTriage("test-id", {
      status: "reviewing", stageTag: "MVP", designPartner: "Pilot Co", notes: "Call next week",
    }, "2026-11-27T11:00:00.000Z");
    assert.equal(changed, true);
    const row = store.listInquiries()[0];
    assert.equal(row.status, "reviewing");
    assert.equal(row.stageTag, "MVP");
    assert.equal(row.designPartner, "Pilot Co");
    assert.equal(row.notes, "Call next week");
    assert.equal(row.email, "founder@example.com");
    assert.equal(row.updatedAt, "2026-11-27T11:00:00.000Z");
    assert.equal(store.updateInquiryTriage("missing", {
      status: "new", stageTag: "", designPartner: "", notes: "",
    }), false);
  } finally {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("deletes only the requested inquiry and reports missing IDs", () => {
  const { dir, store } = fixture();
  try {
    assert.equal(store.deleteInquiry("test-id"), true);
    assert.equal(store.deleteInquiry("test-id"), false);
    assert.deepEqual(store.listInquiries(), []);
  } finally {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
