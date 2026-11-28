import test from "node:test";
import assert from "node:assert/strict";
import { parseWorkflowMap } from "../workflowMap";
import { validMap } from "./fixtures";

const clone = () => JSON.parse(JSON.stringify(validMap()));
const reject = (mutate: (m: any) => void, fragment: string) => {
  const m = clone(); mutate(m);
  const r = parseWorkflowMap(m);
  assert.equal(r.ok, false);
  if (!r.ok) assert.ok(r.error.includes(fragment), `expected "${fragment}" in "${r.error}"`);
};

test("accepts a valid map", () => assert.equal(parseWorkflowMap(clone()).ok, true));
test("rejects non-objects and too few steps", () => {
  assert.equal(parseWorkflowMap("x").ok, false);
  reject((m) => { m.steps = m.steps.slice(0, 1); }, "2 to 40");
});
test("rejects unknown interventions and bad time basis", () => {
  reject((m) => { m.steps[0].intervention = "Automate"; }, "intervention");
  reject((m) => { m.steps[0].timeBasis = "guess"; }, "timeBasis");
});
test("enforces cycle-time consistency", () => {
  reject((m) => { m.steps[2].minutesPerUnitAfter = 10; }, "must equal minutesPerUnit");
  reject((m) => { m.steps[0].minutesPerUnitAfter = 99; }, "may not increase");
  reject((m) => { m.steps[0].intervention = "Eliminate"; m.steps[0].minutesPerUnitAfter = 1; }, "Eliminate must leave 0");
});
test("rejects duplicate ids, negative and non-finite minutes", () => {
  reject((m) => { m.steps[1].id = m.steps[0].id; }, "duplicated");
  reject((m) => { m.steps[0].minutesPerUnit = -1; }, "minutesPerUnit");
  reject((m) => { m.steps[0].minutesPerUnit = null; }, "minutesPerUnit");
});
test("rejects out-of-range, fractional and missing scores and bad categories", () => {
  reject((m) => { m.opportunities[0].scores.willingnessToPay = 21; }, "willingnessToPay");
  reject((m) => { m.opportunities[0].scores.severity = 7.5; }, "integer");
  reject((m) => { delete m.opportunities[0].scores.feasibility; }, "feasibility");
  reject((m) => { m.opportunities[0].category = "D — Other"; }, "category");
});
test("ignores a smuggled demand-evidence flag", () => {
  const m = clone(); m.opportunities[0].hasPaidDemandEvidence = true;
  const r = parseWorkflowMap(m);
  assert.ok(r.ok);
  if (r.ok) assert.equal("hasPaidDemandEvidence" in r.value.opportunities[0], false);
});
