import { SCORECARD_CRITERIA, type Scores } from "./scorecard";

export const INTERVENTIONS = ["Eliminate", "Simplify", "Augment", "Delegate", "Reconstruct"] as const;
export type Intervention = (typeof INTERVENTIONS)[number];

export const OPPORTUNITY_CATEGORIES = [
  "A — Internal transformation",
  "B — Replicable product",
  "C — New venture",
] as const;
export type OpportunityCategory = (typeof OPPORTUNITY_CATEGORIES)[number];

/** `stated`: the client gave the figure. `estimated`: the model inferred it; treat as a hypothesis. */
export type TimeBasis = "stated" | "estimated";

export interface WorkflowStep {
  id: string;
  name: string;
  owner: string;
  /** Minutes of cycle time per unit of work today. */
  minutesPerUnit: number;
  /** null means the step is left as is. */
  intervention: Intervention | null;
  /** Cycle time per unit after the intervention; equals minutesPerUnit when intervention is null. */
  minutesPerUnitAfter: number;
  timeBasis: TimeBasis;
  rationale: string;
}

export interface ProposedOpportunity {
  title: string;
  category: OpportunityCategory;
  problemSummary: string;
  scores: Scores;
}

export interface WorkflowMap {
  workflow: string;
  steps: WorkflowStep[];
  opportunities: ProposedOpportunity[];
}

export type ParseResult = { ok: true; value: WorkflowMap } | { ok: false; error: string };

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

function text(v: unknown, field: string, max: number): string | string[] {
  if (typeof v !== "string" || v.trim() === "") return [`${field} must be a non-empty string`];
  if (v.trim().length > max) return [`${field} must be at most ${max} characters`];
  return v.trim();
}

function number(v: unknown, field: string, min: number, max: number): number | string[] {
  if (typeof v !== "number" || !Number.isFinite(v) || v < min || v > max) {
    return [`${field} must be a number between ${min} and ${max}`];
  }
  return v;
}

/**
 * Strict validation of model output. The model is untrusted: anything outside
 * the schema is rejected with a message that is safe to feed back for a retry.
 * Demand evidence is deliberately not part of the schema; only humans can
 * evidence willingness to pay.
 */
export function parseWorkflowMap(input: unknown): ParseResult {
  if (!isRecord(input)) return { ok: false, error: "root must be a JSON object" };
  const errors: string[] = [];
  const take = <T>(r: T | string[]): T | undefined => {
    if (Array.isArray(r)) { errors.push(...r); return undefined; }
    return r as T;
  };

  const workflow = take(text(input.workflow, "workflow", 200));
  if (!Array.isArray(input.steps) || input.steps.length < 2 || input.steps.length > 40) {
    return { ok: false, error: "steps must be an array of 2 to 40 steps" };
  }
  const steps: WorkflowStep[] = [];
  const seen = new Set<string>();
  input.steps.forEach((raw, i) => {
    const at = `steps[${i}]`;
    if (!isRecord(raw)) { errors.push(`${at} must be an object`); return; }
    const id = take(text(raw.id, `${at}.id`, 40));
    const name = take(text(raw.name, `${at}.name`, 140));
    const owner = take(text(raw.owner, `${at}.owner`, 120));
    const rationale = take(text(raw.rationale, `${at}.rationale`, 600));
    const minutesPerUnit = take(number(raw.minutesPerUnit, `${at}.minutesPerUnit`, 0, 100_000));
    const minutesPerUnitAfter = take(number(raw.minutesPerUnitAfter, `${at}.minutesPerUnitAfter`, 0, 100_000));
    let intervention: Intervention | null = null;
    if (raw.intervention !== null) {
      if (typeof raw.intervention === "string" && (INTERVENTIONS as readonly string[]).includes(raw.intervention)) {
        intervention = raw.intervention as Intervention;
      } else errors.push(`${at}.intervention must be null or one of ${INTERVENTIONS.join(", ")}`);
    }
    if (raw.timeBasis !== "stated" && raw.timeBasis !== "estimated") errors.push(`${at}.timeBasis must be "stated" or "estimated"`);
    if (id && seen.has(id)) errors.push(`${at}.id "${id}" is duplicated`);
    if (id) seen.add(id);
    if (minutesPerUnit !== undefined && minutesPerUnitAfter !== undefined) {
      if (intervention === null && minutesPerUnitAfter !== minutesPerUnit) {
        errors.push(`${at}: with no intervention minutesPerUnitAfter must equal minutesPerUnit`);
      }
      if (intervention === "Eliminate" && minutesPerUnitAfter !== 0) errors.push(`${at}: Eliminate must leave 0 minutes`);
      if (minutesPerUnitAfter > minutesPerUnit) errors.push(`${at}: an intervention may not increase cycle time`);
    }
    if (id && name && owner && rationale && minutesPerUnit !== undefined && minutesPerUnitAfter !== undefined) {
      steps.push({ id, name, owner, rationale, minutesPerUnit, minutesPerUnitAfter, intervention, timeBasis: raw.timeBasis as TimeBasis });
    }
  });

  if (!Array.isArray(input.opportunities) || input.opportunities.length > 10) {
    return { ok: false, error: "opportunities must be an array of at most 10 items" };
  }
  const opportunities: ProposedOpportunity[] = [];
  input.opportunities.forEach((raw, i) => {
    const at = `opportunities[${i}]`;
    if (!isRecord(raw)) { errors.push(`${at} must be an object`); return; }
    const title = take(text(raw.title, `${at}.title`, 140));
    const problemSummary = take(text(raw.problemSummary, `${at}.problemSummary`, 1200));
    if (typeof raw.category !== "string" || !(OPPORTUNITY_CATEGORIES as readonly string[]).includes(raw.category)) {
      errors.push(`${at}.category must be one of ${OPPORTUNITY_CATEGORIES.join(" | ")}`);
    }
    const scores = {} as Scores;
    let scoresOk = isRecord(raw.scores);
    if (!scoresOk) errors.push(`${at}.scores must be an object`);
    else for (const c of SCORECARD_CRITERIA) {
      const s = take(number((raw.scores as Record<string, unknown>)[c.key], `${at}.scores.${c.key}`, 0, c.max));
      if (s === undefined || !Number.isInteger(s)) {
        if (s !== undefined) errors.push(`${at}.scores.${c.key} must be an integer`);
        scoresOk = false;
      } else scores[c.key] = s;
    }
    if (title && problemSummary && scoresOk && typeof raw.category === "string") {
      opportunities.push({ title, problemSummary, scores, category: raw.category as OpportunityCategory });
    }
  });

  if (errors.length > 0 || !workflow) return { ok: false, error: errors.slice(0, 8).join("; ") || "invalid workflow map" };
  return { ok: true, value: { workflow, steps, opportunities } };
}
