import test from "node:test";
import assert from "node:assert/strict";
import { analyzeConstraints } from "../constraints";
import { validMap } from "./fixtures";
import type { WorkflowStep } from "../workflowMap";

const step = (id: string, before: number, after: number): WorkflowStep => ({
  id, name: id, owner: "o", rationale: "r", timeBasis: "stated",
  minutesPerUnit: before, minutesPerUnitAfter: after, intervention: after < before ? "Augment" : null,
});

test("peels constraints one at a time and exposes the next", () => {
  const a = analyzeConstraints([step("A", 10, 4), step("B", 8, 2), step("C", 6, 6)]);
  assert.deepEqual(a.fixSequence, [
    { bottleneckId: "A", cycleMinutes: 10, cycleMinutesAfterFix: 8 },
    { bottleneckId: "B", cycleMinutes: 8, cycleMinutesAfterFix: 6 },
  ]);
  assert.equal(a.before.bottleneckId, "A");
  assert.equal(a.after.bottleneckId, "C");
  assert.equal(a.throughputGain, 10 / 6);
  assert.deepEqual(a.strandedGains, []);
});
test("automating a non-bottleneck buys no throughput", () => {
  const a = analyzeConstraints([step("A", 10, 10), step("B", 5, 1)]);
  assert.deepEqual(a.fixSequence, []);
  assert.deepEqual(a.strandedGains, ["B"]);
  assert.equal(a.throughputGain, 1);
});
test("a tie with an unimprovable step leaves both improvements stranded, in any order", () => {
  const one = analyzeConstraints([step("A", 10, 3), step("B", 10, 10)]);
  const two = analyzeConstraints([step("B", 10, 10), step("A", 10, 3)]);
  assert.deepEqual(one.strandedGains, ["A"]);
  assert.deepEqual(two.strandedGains, ["A"]);
  assert.equal(one.throughputGain, 1);
});
test("eliminating every step gives unbounded gain", () => {
  assert.equal(analyzeConstraints([step("A", 5, 0), step("B", 3, 0)]).throughputGain, Infinity);
});
test("the invoice fixture: approval is the binding constraint and caps the gain", () => {
  const a = analyzeConstraints(validMap().steps);
  assert.equal(a.before.bottleneckId, "approve");
  assert.equal(a.throughputGain, 1);
  assert.deepEqual(a.strandedGains.sort(), ["chase", "intake", "match"]);
});
test("rejects an empty workflow", () => assert.throws(() => analyzeConstraints([])));
