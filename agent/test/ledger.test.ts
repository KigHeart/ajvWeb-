import test from "node:test";
import assert from "node:assert/strict";
import { canonicalJson, GENESIS_HASH, openLedger } from "../ledger";

test("canonical JSON ignores key order", () => {
  assert.equal(canonicalJson({ b: 1, a: { d: 2, c: [3, { y: 1, x: 2 }] } }), canonicalJson({ a: { c: [3, { x: 2, y: 1 }], d: 2 }, b: 1 }));
});
test("appends form a verifiable chain from genesis", () => {
  const l = openLedger(":memory:", () => "2026-11-28T00:00:00.000Z");
  const first = l.append("r1", "run_started", "t", { a: 1 });
  const second = l.append("r1", "run_completed", "t", { b: 2 });
  assert.equal(first.prevHash, GENESIS_HASH);
  assert.equal(second.prevHash, first.hash);
  assert.deepEqual(l.verify(), { ok: true, events: 2, head: second.hash });
  assert.equal(l.events("r1").length, 2);
  assert.equal(l.events("other").length, 0);
});
test("an empty ledger verifies at genesis", () => {
  assert.deepEqual(openLedger(":memory:").verify(), { ok: true, events: 0, head: GENESIS_HASH });
});
test("update and delete are refused", () => {
  const l = openLedger(":memory:");
  l.append("r", "run_started", "t");
  assert.throws(() => l.unsafeDatabase.prepare("UPDATE events SET actor='x'").run(), /append-only/);
  assert.throws(() => l.unsafeDatabase.prepare("DELETE FROM events").run(), /append-only/);
});
test("verify pinpoints a record altered around the triggers", () => {
  const l = openLedger(":memory:");
  l.append("r", "run_started", "t", { n: 1 });
  l.append("r", "tool_allowed", "t", { n: 2 });
  l.append("r", "run_completed", "t", { n: 3 });
  l.unsafeDatabase.exec("DROP TRIGGER events_no_update");
  l.unsafeDatabase.prepare("UPDATE events SET payload=? WHERE seq=2").run('{"n":99}');
  const v = l.verify();
  assert.equal(v.ok, false);
  assert.equal(v.brokenAt, 2);
});
test("verify detects a deleted record", () => {
  const l = openLedger(":memory:");
  for (let i = 0; i < 3; i++) l.append("r", "tool_allowed", "t", { i });
  l.unsafeDatabase.exec("DROP TRIGGER events_no_delete");
  l.unsafeDatabase.prepare("DELETE FROM events WHERE seq=2").run();
  assert.equal(l.verify().ok, false);
});
