/**
 * Venture scorecard. Mirrors src/lib/discovery.ts (SCORECARD_CRITERIA and
 * getScoreThresholdLabel) so agent output lands in the same 100-point scale the
 * partners use. The agent service must not import the Firebase-backed web
 * module, hence the copy; scorecard.test.ts pins the totals and tier texts.
 */
export const SCORECARD_CRITERIA = [
  { key: "severity", label: "Severity of customer problem", max: 15 },
  { key: "repeatability", label: "Repeatability across organisations", max: 15 },
  { key: "willingnessToPay", label: "Willingness to pay", max: 20 },
  { key: "agenticSuitability", label: "Agentic AI suitability", max: 15 },
  { key: "scalability", label: "Commercial scalability", max: 15 },
  { key: "feasibility", label: "Technical feasibility", max: 10 },
  { key: "strategicFit", label: "Strategic fit with Ajentir", max: 10 },
] as const;

export type ScoreKey = (typeof SCORECARD_CRITERIA)[number]["key"];
export type Scores = Record<ScoreKey, number>;

export function totalScore(scores: Scores): number {
  return SCORECARD_CRITERIA.reduce((sum, c) => sum + scores[c.key], 0);
}

export function thresholdTier(score: number, hasPaidDemandEvidence: boolean): { tier: string; warning: string | null } {
  if (score < 50) return { tier: "Below 50 · Reject or research archive", warning: null };
  if (score < 65) return { tier: "50–64 · Investigate further", warning: null };
  if (score < 80) {
    return {
      tier: "65–79 · Eligible for validation & design-partner testing",
      warning: hasPaidDemandEvidence ? null : "Seek paid pilot or signed design-partner commitment.",
    };
  }
  return {
    tier: "80–100 · Priority venture candidate",
    warning: hasPaidDemandEvidence
      ? null
      : "Safeguard: score ≥ 80 still requires evidenced willingness to pay before investment.",
  };
}
