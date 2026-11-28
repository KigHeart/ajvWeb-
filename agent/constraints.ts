import type { WorkflowStep } from "./workflowMap";

export interface FixStage {
  /** The step that limits throughput at this stage. */
  bottleneckId: string;
  cycleMinutes: number;
  /** Cycle time of the whole line once this step has had its intervention applied. */
  cycleMinutesAfterFix: number;
}

export interface ConstraintAnalysis {
  before: { bottleneckId: string; cycleMinutes: number };
  after: { bottleneckId: string; cycleMinutes: number };
  /** before / after cycle time; Infinity only if the whole line is eliminated. */
  throughputGain: number;
  /** Fixing the binding constraint in turn exposes the next one; stops when a step has no improvement left. */
  fixSequence: FixStage[];
  /** Steps whose intervention shortens them but which never limit the line at the moment they are fixed: automation that buys no throughput. */
  strandedGains: string[];
}

/**
 * Deterministic bottleneck analysis for a serial workflow.
 *
 * Model assumption (CONJECTURE, flagged in reports): work flows through the
 * steps in series, so line throughput is set by the slowest step. Parallel
 * branches, batching and queue effects are not modelled; the inputs are
 * per-step estimates and inherit their uncertainty.
 */
export function analyzeConstraints(steps: WorkflowStep[]): ConstraintAnalysis {
  if (steps.length === 0) throw new Error("analyzeConstraints needs at least one step");
  const slowest = (cycle: (s: WorkflowStep) => number) =>
    steps.reduce((best, s) => (cycle(s) > cycle(best) ? s : best), steps[0]);

  const bottleneckBefore = slowest((s) => s.minutesPerUnit);
  const bottleneckAfter = slowest((s) => s.minutesPerUnitAfter);

  // Current cycle time of each step while we peel constraints off one at a time.
  const current = new Map(steps.map((s) => [s.id, s.minutesPerUnit]));
  const lineCycle = () => Math.max(...current.values());
  const fixSequence: FixStage[] = [];
  const fixed = new Set<string>();
  const stranded: string[] = [];

  for (;;) {
    const cycle = lineCycle();
    const tied = steps.filter((s) => !fixed.has(s.id) && current.get(s.id) === cycle);
    // If any step at the limit cannot improve, the line is stuck there whatever order we fix in.
    if (tied.length === 0 || tied.some((s) => s.minutesPerUnitAfter >= cycle)) break;
    const limiting = tied[0];
    current.set(limiting.id, limiting.minutesPerUnitAfter);
    fixed.add(limiting.id);
    fixSequence.push({ bottleneckId: limiting.id, cycleMinutes: cycle, cycleMinutesAfterFix: lineCycle() });
  }

  for (const s of steps) {
    if (s.intervention !== null && s.minutesPerUnitAfter < s.minutesPerUnit && !fixed.has(s.id)) stranded.push(s.id);
  }

  return {
    before: { bottleneckId: bottleneckBefore.id, cycleMinutes: bottleneckBefore.minutesPerUnit },
    after: { bottleneckId: bottleneckAfter.id, cycleMinutes: bottleneckAfter.minutesPerUnitAfter },
    throughputGain: bottleneckAfter.minutesPerUnitAfter === 0 ? Infinity : bottleneckBefore.minutesPerUnit / bottleneckAfter.minutesPerUnitAfter,
    fixSequence,
    strandedGains: stranded,
  };
}
