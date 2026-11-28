import type { InquiryPreset } from './memorandum';

export const RESEARCH_CATEGORIES = [
  'Workflow Discovery',
  'Agentic Infrastructure',
  'Trust & Authority',
  'Production Scale',
] as const;

export type ResearchCategory = (typeof RESEARCH_CATEGORIES)[number];

export interface ResearchNote {
  id: string;
  title: string;
  category: ResearchCategory;
  publishedLabel: string;
  readTime: string;
  summary: string;
  sectors: string;
  findings: string[];
  body: string;
  published: boolean;
  ctaPreset?: InquiryPreset;
}

/**
 * Curated baseline briefs displayed on the public site.
 * These are conceptual research notes, not claims of completed field studies
 * or measured customer outcomes. Replace or substantiate claims before using
 * them as external evidence in investment decisions.
 */
export const BASELINE_RESEARCH_NOTES: ResearchNote[] = [
  {
    id: 'workflow-discovery-repeatable-demand',
    title: '01. From Workflow Friction to Repeatable Venture Demand',
    category: 'Workflow Discovery',
    publishedLabel: 'Field framework · 2026',
    readTime: '5 min read',
    summary:
      'A practical method for finding agentic software opportunities inside recurring operational work. The central test is whether the same costly workflow appears across independent organisations.',
    sectors: 'SMEs, financial services, logistics, healthcare, professional services',
    findings: [
      'Start with a workflow and its measurable failure modes, not with a preferred AI model.',
      'Separate one-off process pain from repeatable demand across organisations.',
      'Validate willingness to pay and access to operational data before forming a venture.',
    ],
    body: `An organisation rarely experiences its work as a clean sequence of software tasks. Work moves through people, inboxes, spreadsheets, line-of-business systems, approvals and exceptions. The opportunity for agentic software is often hidden in the handoffs between those systems.

Workflow discovery begins by selecting one consequential process and documenting its trigger, inputs, actors, decisions, systems, outputs, exceptions and control points. The map should distinguish the official process from the process people actually follow. Evidence can include process artefacts, anonymised samples, observation and interviews with the people who perform and approve the work.

Each step can then be classified: eliminate unnecessary work, simplify the process, augment a person, delegate a bounded task to software, or redesign the workflow. Agentic execution is appropriate only where the task has sufficiently clear inputs, bounded authority, observable outcomes and a reliable escalation path.

A promising venture opportunity requires more than one organisation describing a similar problem. Test whether the workflow recurs across independent organisations, whether the underlying constraints are materially alike, whether buyers own a budget and whether the proposed product can be deployed without bespoke integration at every customer.

The output is a ranked opportunity hypothesis, not an automatic investment decision. It should state the target user and buyer, the workflow boundary, current cost or delay baseline, expected improvement, required integrations, data constraints, risks and the next validation experiment.`,
    published: true,
    ctaPreset: { lane: 'partner', partnerType: 'discovery' },
  },
  {
    id: 'agentic-infrastructure-execution-boundaries',
    title: '02. Agentic Infrastructure: Separate Intelligence from Authority',
    category: 'Agentic Infrastructure',
    publishedLabel: 'Technical brief · 2026',
    readTime: '6 min read',
    summary:
      'Reliable agentic systems need more than model quality. Their architecture must separate planning from permission, execution and durable state changes.',
    sectors: 'Enterprise software, financial operations, regulated services, IT operations',
    findings: [
      'Treat model output as a proposal, never as proof of permission.',
      'Enforce tool access, budgets and state transitions outside the model.',
      'Make execution observable, bounded, idempotent where possible and reversible where practical.',
    ],
    body: `An agent can produce a plausible plan and still be wrong about its identity, authority, available resources or the consequences of an action. A production architecture must therefore avoid making model confidence the mechanism that authorises consequential operations.

A useful separation is: the model interprets context and proposes an action; a policy layer evaluates the requested operation against identity, scope, resource limits and current state; a trusted executor performs only the authorised operation; and an audit layer records the decision and result. The model may request a tool, but it must not be able to grant itself a permission or silently expand its own scope.

Tool contracts should be narrow and typed. Inputs require validation, outputs require explicit handling, and failures should not be converted into success-shaped responses. High-impact actions need stronger controls such as human approval, transaction limits, dual control or cryptographic attestation. Secrets should remain in a dedicated secret boundary rather than in prompts or agent memory.

State is another security boundary. Durable writes should use explicit schemas, concurrency controls and provenance. Retries need idempotency keys or equivalent protections so that a timeout does not cause duplicate payments, messages or records. Long-running tasks need cancellation, expiry and recovery semantics.

The engineering objective is not to make an agent autonomous at all costs. It is to define the safe envelope within which automation can operate, measure exceptions and increase authority only when evidence justifies it.`,
    published: true,
    ctaPreset: { lane: 'partner', partnerType: 'enterprise' },
  },
  {
    id: 'trust-authority-agentic-controls',
    title: '03. Trust and Authority in Autonomous Workflows',
    category: 'Trust & Authority',
    publishedLabel: 'Governance brief · 2026',
    readTime: '5 min read',
    summary:
      'A governance model for deciding what an autonomous system may read, propose, change and execute, with controls proportionate to the consequence of failure.',
    sectors: 'Financial services, healthcare, public services, enterprise operations',
    findings: [
      'Classify actions by consequence, reversibility and blast radius.',
      'Bind permissions to a principal, purpose, resource and time window.',
      'Preserve evidence of the request, policy decision, approval and execution result.',
    ],
    body: `Trust in an autonomous workflow should be designed as an enforceable operating property. A policy statement that an agent should behave responsibly is not a substitute for a system that technically prevents unauthorised actions.

Begin with an action inventory. For each operation, identify the data it can access, the systems it can affect, the maximum financial or operational consequence, whether the action can be reversed and who is accountable. Read-only retrieval, drafting, internal updates and external commitments should not inherit the same permission level.

Permissions should be explicit and scoped. A useful authorisation decision binds the requesting identity to an action, resource, purpose and time window. It should also account for transaction limits, environment, customer consent and relevant segregation-of-duties rules. A model-generated statement that approval has been obtained is not itself an approval record.

For sensitive operations, require an independent approval channel and verify the approval at execution time. The executor should re-check the policy immediately before acting, because authority or underlying state may have changed since the plan was created. Denials and exceptions should be visible and reviewable rather than silently retried through a different tool.

An audit record should connect the initiating request, relevant context, policy version, decision, approver, tool invocation and resulting state change. Logs must avoid exposing credentials and unnecessary personal data. Retention, access and incident procedures should be defined before deployment.

This framework supports a gradual path from assistance to bounded execution. It does not remove the need for legal, regulatory or sector-specific review; it makes the technical control surface explicit so that review can be meaningful.`,
    published: true,
    ctaPreset: { lane: 'training', trainingFocus: 'governance' },
  },
  {
    id: 'production-scale-pilot-to-operation',
    title: '04. From Agentic Pilot to Production Operation',
    category: 'Production Scale',
    publishedLabel: 'Deployment brief · 2026',
    readTime: '5 min read',
    summary:
      'A deployment path that tests workflow value, integration reliability and operational controls before an agentic system is allowed to handle live work.',
    sectors: 'SME operations, enterprise IT, logistics, financial and customer operations',
    findings: [
      'Establish a baseline and acceptance criteria before the pilot begins.',
      'Progress from offline evaluation to shadow mode, supervised execution and bounded live operation.',
      'Treat monitoring, rollback, incident response and ownership as product requirements.',
    ],
    body: `A successful demonstration is not evidence that an agentic system is ready to operate a business process. Production readiness requires repeatable performance under realistic inputs, safe behaviour when dependencies fail and a clear operating model for people who remain accountable.

Before building, define the process boundary and baseline. Record the current completion time, error and rework patterns, exception rate, service level and human effort where those measures are available. Agree acceptance thresholds with the process owner and identify failure cases that must always be escalated.

Evaluation should use representative and deliberately difficult cases, including incomplete information, conflicting instructions, malformed documents, unavailable tools and attempted prompt injection. Measure task success alongside policy violations, unauthorised actions, escalation quality, latency and cost. A system that completes more tasks by bypassing controls has not improved the process.

A staged rollout reduces exposure. Begin with offline tests, then run in shadow mode against live or representative traffic without taking action. Move to human-reviewed recommendations, then to a narrow set of reversible actions with explicit limits. Expand scope only after operational evidence and approval from the accountable owner.

Production operations need health checks, structured logs, alerting, rate limits, access reviews, versioned prompts and policies, rollback procedures and an incident owner. Teams should know how to pause execution, revoke credentials, inspect a decision trail and restore the prior workflow.

The pilot should end with a decision: stop, redesign, extend validation or deploy within a defined operating envelope. Commercial scale follows only when the product can deliver value consistently across customers without turning every deployment into a bespoke engineering project.`,
    published: true,
    ctaPreset: { lane: 'partner', partnerType: 'enterprise' },
  },
];
