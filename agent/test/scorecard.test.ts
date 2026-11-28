import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { SCORECARD_CRITERIA, thresholdTier, totalScore } from "../scorecard";

test("criteria maxima sum to 100", () => {
  assert.equal(SCORECARD_CRITERIA.reduce((s, c) => s + c.max, 0), 100);
});
test("total adds the seven scores", () => {
  const s = { severity: 1, repeatability: 2, willingnessToPay: 3, agenticSuitability: 4, scalability: 5, feasibility: 6, strategicFit: 7 };
  assert.equal(totalScore(s), 28);
});
test("tiers and the paid-demand safeguard match the web scorecard", () => {
  assert.equal(thresholdTier(49, false).warning, null);
  assert.ok(thresholdTier(70, false).warning);
  assert.equal(thresholdTier(70, true).warning, null);
  assert.ok(thresholdTier(85, false).warning?.includes("Safeguard"));
});
test("agent copy has not drifted from src/lib/discovery.ts", () => {
  const web = fs.readFileSync("src/lib/discovery.ts", "utf8");
  for (const c of SCORECARD_CRITERIA) assert.ok(web.includes(`label: '${c.label}', max: ${c.max}`), `${c.label} differs`);
  for (const score of [49, 55, 70, 85]) {
    const { tier, warning } = thresholdTier(score, false);
    assert.ok(web.includes(tier), `tier text differs: ${tier}`);
    if (warning) assert.ok(web.includes(warning), `warning text differs: ${warning}`);
  }
});
