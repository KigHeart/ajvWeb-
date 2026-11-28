import type { WorkflowMap } from "../workflowMap";

/** A four-step serial invoice-collection line: intake 12, matching 30, approval 45, chasing 20 minutes per unit. */
export function validMap(): WorkflowMap {
  const scores = { severity: 12, repeatability: 12, willingnessToPay: 14, agenticSuitability: 12, scalability: 11, feasibility: 8, strategicFit: 8 };
  return {
    workflow: "Invoice collection",
    steps: [
      { id: "intake", name: "Intake invoices", owner: "Clerk", minutesPerUnit: 12, intervention: "Augment", minutesPerUnitAfter: 4, timeBasis: "stated", rationale: "Extraction from PDFs." },
      { id: "match", name: "Match to purchase orders", owner: "Clerk", minutesPerUnit: 30, intervention: "Reconstruct", minutesPerUnitAfter: 6, timeBasis: "estimated", rationale: "Rules plus model matching." },
      { id: "approve", name: "Manager approval", owner: "Finance manager", minutesPerUnit: 45, intervention: null, minutesPerUnitAfter: 45, timeBasis: "stated", rationale: "Policy requires a human." },
      { id: "chase", name: "Chase late payers", owner: "Clerk", minutesPerUnit: 20, intervention: "Delegate", minutesPerUnitAfter: 2, timeBasis: "estimated", rationale: "Scheduled agent reminders." },
    ],
    opportunities: [{ title: "SME receivables agent", category: "B — Replicable product", problemSummary: "Late payment drains SME cash.", scores }],
  };
}
