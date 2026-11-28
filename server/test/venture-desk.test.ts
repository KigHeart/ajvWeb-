import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { openDatabase, type DeskItem } from "../database";

test("Venture Desk seeds the founder's cross-venture portfolio once", () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "venture-desk-"));
  const filename = path.join(dir, "desk.sqlite");
  const store = openDatabase(filename);
  const ventures = store.listDeskItems("venture");
  assert.deepEqual(ventures.map(item => item.title).sort(), [
    "Ajentir Ventures", "Tilil Engineering Group", "elDeer Data Group", "qØnza Enterprise",
  ].sort());
  store.close();
  const reopened = openDatabase(filename);
  assert.equal(reopened.listDeskItems("venture").length, 4);
  reopened.close();
  rmSync(dir, { recursive: true, force: true });
});

test("Venture Desk creates, updates, filters and deletes records", () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "venture-desk-"));
  const store = openDatabase(path.join(dir, "desk.sqlite"));
  const now = new Date().toISOString();
  const item: DeskItem = {
    id: randomUUID(), kind: "opportunity", title: "Supplier reconciliation",
    organisation: "Pilot Distributor", venture: "", status: "captured", owner: "Founder",
    priority: "high", score: 72, value: null, dueDate: "", description: "Repeated manual matching",
    data: { source: "interview" }, createdAt: now, updatedAt: now,
  };
  store.createDeskItem(item);
  assert.equal(store.listDeskItems("opportunity").length, 1);
  assert.equal(store.listDeskItems("venture").length, 4);
  const updated = store.updateDeskItem(item.id, { status: "validating", score: 81, data: { buyerInterviews: 3 } }, new Date().toISOString());
  assert.equal(updated?.status, "validating");
  assert.equal(updated?.score, 81);
  assert.equal(updated?.data.source, "interview");
  assert.equal(updated?.data.buyerInterviews, 3);
  assert.equal(store.deleteDeskItem(item.id), true);
  assert.equal(store.deleteDeskItem(item.id), false);
  store.close();
  rmSync(dir, { recursive: true, force: true });
});
