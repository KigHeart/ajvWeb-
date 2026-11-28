import test from "node:test";
import assert from "node:assert/strict";
import { openLedger } from "../ledger";
import { createToolbox, ToolDeniedError } from "../policy";

function setup(allowed: ("read" | "write-internal" | "external")[]) {
  const ledger = openLedger(":memory:");
  const sent: string[] = [];
  const box = createToolbox({ ledger, agent: "t", allowedScopes: allowed });
  box.register({ name: "lookup", scope: "read", async run(x: string) { return x.toUpperCase(); } });
  box.register({ name: "sendEmail", scope: "external", async run(to: string) { sent.push(to); } });
  return { ledger, box, sent };
}
const kinds = (l: ReturnType<typeof openLedger>) => l.events().map((e) => e.kind);

test("allowed scope runs and is recorded", async () => {
  const { ledger, box } = setup(["read"]);
  assert.equal(await box.call("r", "lookup", "ok"), "OK");
  assert.deepEqual(kinds(ledger), ["tool_allowed"]);
});
test("a scope the agent was never granted is denied before running", async () => {
  const { ledger, box, sent } = setup(["read"]);
  await assert.rejects(box.call("r", "sendEmail", "a@b.co", { approvedBy: "Kiprop", note: "ok" }), ToolDeniedError);
  assert.deepEqual(sent, []);
  assert.deepEqual(kinds(ledger), ["tool_denied"]);
});
test("external tools need a named approval, recorded before they run", async () => {
  const { ledger, box, sent } = setup(["read", "external"]);
  await assert.rejects(box.call("r", "sendEmail", "a@b.co"), /named human approval/);
  await assert.rejects(box.call("r", "sendEmail", "a@b.co", { approvedBy: " ", note: "x" }), ToolDeniedError);
  assert.deepEqual(sent, []);
  await box.call("r", "sendEmail", "a@b.co", { approvedBy: "Kiprop arap Yego", note: "reply to a@b.co" });
  assert.deepEqual(sent, ["a@b.co"]);
  assert.deepEqual(kinds(ledger).slice(-2), ["approval_granted", "tool_allowed"]);
  assert.equal(ledger.events().find((e) => e.kind === "approval_granted")?.actor, "Kiprop arap Yego");
});
test("unknown tools are denied and duplicates cannot be registered", async () => {
  const { box } = setup(["read"]);
  await assert.rejects(box.call("r", "nope", 1), /unknown tool/);
  assert.throws(() => box.register({ name: "lookup", scope: "read", async run() {} }), /already registered/);
});
