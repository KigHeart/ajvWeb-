import { authHeaders } from './authSession';

export type DiscoverySector =
  | 'Financial services'
  | 'Agriculture'
  | 'Logistics'
  | 'Healthcare'
  | 'Retail & distribution'
  | 'Professional services'
  | 'Construction'
  | 'Other';

export type DiscoveryOrgStatus = 'Access' | 'Mapping' | 'Decomposing' | 'Completed';

export type OpportunityCategory =
  | 'A — Internal transformation'
  | 'B — Replicable product'
  | 'C — New venture';

export type WorkflowIntervention =
  | 'Eliminate'
  | 'Simplify'
  | 'Augment'
  | 'Delegate'
  | 'Reconstruct';

export type PipelineStage = 'Reject' | 'Investigate' | 'Validate' | 'Incubate' | 'Invest';

export interface DiscoveryOrgRecord {
  id: string;
  name: string;
  sector: DiscoverySector;
  size: string;
  operatingModel: string;
  workflowOwners: string;
  workflowsSummary: string;
  status: DiscoveryOrgStatus;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface VentureOpportunityRecord {
  id: string;
  title: string;
  orgId: string;
  orgName: string;
  category: OpportunityCategory;
  intervention: WorkflowIntervention;
  problemSummary: string;
  validationEvidence: string;
  hasPaidDemandEvidence: boolean;
  scoreSeverity: number;
  scoreRepeatability: number;
  scoreWtp: number;
  scoreAgentic: number;
  scoreScalability: number;
  scoreFeasibility: number;
  scoreFit: number;
  pipelineStage: PipelineStage;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export const DISCOVERY_SECTORS: DiscoverySector[] = [
  'Financial services',
  'Agriculture',
  'Logistics',
  'Healthcare',
  'Retail & distribution',
  'Professional services',
  'Construction',
  'Other',
];

export const ORG_STATUSES: DiscoveryOrgStatus[] = [
  'Access',
  'Mapping',
  'Decomposing',
  'Completed',
];

export const OPPORTUNITY_CATEGORIES: OpportunityCategory[] = [
  'A — Internal transformation',
  'B — Replicable product',
  'C — New venture',
];

export const INTERVENTIONS: WorkflowIntervention[] = [
  'Eliminate',
  'Simplify',
  'Augment',
  'Delegate',
  'Reconstruct',
];

export const PIPELINE_STAGES: PipelineStage[] = [
  'Reject',
  'Investigate',
  'Validate',
  'Incubate',
  'Invest',
];

export const SCORECARD_CRITERIA: {
  key: keyof Pick<
    VentureOpportunityRecord,
    | 'scoreSeverity'
    | 'scoreRepeatability'
    | 'scoreWtp'
    | 'scoreAgentic'
    | 'scoreScalability'
    | 'scoreFeasibility'
    | 'scoreFit'
  >;
  label: string;
  max: number;
}[] = [
  { key: 'scoreSeverity', label: 'Severity of customer problem', max: 15 },
  { key: 'scoreRepeatability', label: 'Repeatability across organisations', max: 15 },
  { key: 'scoreWtp', label: 'Willingness to pay', max: 20 },
  { key: 'scoreAgentic', label: 'Agentic AI suitability', max: 15 },
  { key: 'scoreScalability', label: 'Commercial scalability', max: 15 },
  { key: 'scoreFeasibility', label: 'Technical feasibility', max: 10 },
  { key: 'scoreFit', label: 'Strategic fit with Ajentir', max: 10 },
];

function parseIsoDate(value: unknown): Date | null {
  if (typeof value !== 'string' || !value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function clampInt(val: number, max: number): number {
  const rounded = Math.round(Number.isFinite(val) ? val : 0);
  return Math.max(0, Math.min(max, rounded));
}

export function computeOpportunityScore(
  opp: Pick<
    VentureOpportunityRecord,
    | 'scoreSeverity'
    | 'scoreRepeatability'
    | 'scoreWtp'
    | 'scoreAgentic'
    | 'scoreScalability'
    | 'scoreFeasibility'
    | 'scoreFit'
  >,
): number {
  return (
    clampInt(opp.scoreSeverity, 15) +
    clampInt(opp.scoreRepeatability, 15) +
    clampInt(opp.scoreWtp, 20) +
    clampInt(opp.scoreAgentic, 15) +
    clampInt(opp.scoreScalability, 15) +
    clampInt(opp.scoreFeasibility, 10) +
    clampInt(opp.scoreFit, 10)
  );
}

export function getScoreThresholdLabel(
  score: number,
  hasPaidDemandEvidence: boolean,
): { tier: string; warning: string | null } {
  if (score < 50) {
    return { tier: 'Below 50 · Reject or research archive', warning: null };
  }
  if (score < 65) {
    return { tier: '50–64 · Investigate further', warning: null };
  }
  if (score < 80) {
    return {
      tier: '65–79 · Eligible for validation & design-partner testing',
      warning: hasPaidDemandEvidence ? null : 'Seek paid pilot or signed design-partner commitment.',
    };
  }
  return {
    tier: '80–100 · Priority venture candidate',
    warning: hasPaidDemandEvidence
      ? null
      : 'Safeguard: score ≥ 80 still requires evidenced willingness to pay before investment.',
  };
}

export async function fetchDiscoveryOrgs(): Promise<DiscoveryOrgRecord[]> {
  const res = await fetch('/api/discovery/orgs', { headers: authHeaders() });
  if (!res.ok) {
    throw new Error('Unable to load discovery organisations.');
  }
  const data = (await res.json()) as {
    items: Array<
      Omit<DiscoveryOrgRecord, 'createdAt' | 'updatedAt'> & {
        createdAt: string;
        updatedAt: string;
      }
    >;
  };
  return (data.items ?? []).map((item) => ({
    ...item,
    createdAt: parseIsoDate(item.createdAt),
    updatedAt: parseIsoDate(item.updatedAt),
  }));
}

export async function saveDiscoveryOrg(
  input: Omit<DiscoveryOrgRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
): Promise<string> {
  const payload = {
    name: input.name.trim().slice(0, 140),
    sector: input.sector,
    size: input.size.trim().slice(0, 60),
    operatingModel: input.operatingModel.trim().slice(0, 240),
    workflowOwners: input.workflowOwners.trim().slice(0, 200),
    workflowsSummary: input.workflowsSummary.trim().slice(0, 3000),
    status: input.status,
  };

  if (!payload.name) {
    throw new Error('Organisation name is required.');
  }

  if (input.id) {
    const res = await fetch(`/api/discovery/orgs/${encodeURIComponent(input.id)}`, {
      method: 'PUT',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Unable to update organisation.');
    return input.id;
  }

  const res = await fetch('/api/discovery/orgs', {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Unable to save organisation.');
  const data = (await res.json()) as { item: { id: string } };
  return data.item.id;
}

export async function deleteDiscoveryOrg(orgId: string): Promise<void> {
  const res = await fetch(`/api/discovery/orgs/${encodeURIComponent(orgId)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Unable to remove organisation.');
}

export async function fetchVentureOpportunities(): Promise<VentureOpportunityRecord[]> {
  const res = await fetch('/api/discovery/opportunities', { headers: authHeaders() });
  if (!res.ok) {
    throw new Error('Unable to load venture opportunities.');
  }
  const data = (await res.json()) as {
    items: Array<
      Omit<VentureOpportunityRecord, 'createdAt' | 'updatedAt'> & {
        createdAt: string;
        updatedAt: string;
      }
    >;
  };
  return (data.items ?? []).map((item) => ({
    ...item,
    createdAt: parseIsoDate(item.createdAt),
    updatedAt: parseIsoDate(item.updatedAt),
  }));
}

export async function saveVentureOpportunity(
  input: Omit<VentureOpportunityRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
): Promise<string> {
  const payload = {
    title: input.title.trim().slice(0, 140),
    orgId: input.orgId.trim().slice(0, 128),
    orgName: input.orgName.trim().slice(0, 140),
    category: input.category,
    intervention: input.intervention,
    problemSummary: input.problemSummary.trim().slice(0, 1200),
    validationEvidence: input.validationEvidence.trim().slice(0, 1200),
    hasPaidDemandEvidence: Boolean(input.hasPaidDemandEvidence),
    scoreSeverity: clampInt(input.scoreSeverity, 15),
    scoreRepeatability: clampInt(input.scoreRepeatability, 15),
    scoreWtp: clampInt(input.scoreWtp, 20),
    scoreAgentic: clampInt(input.scoreAgentic, 15),
    scoreScalability: clampInt(input.scoreScalability, 15),
    scoreFeasibility: clampInt(input.scoreFeasibility, 10),
    scoreFit: clampInt(input.scoreFit, 10),
    pipelineStage: input.pipelineStage,
  };

  if (!payload.title) {
    throw new Error('Opportunity title is required.');
  }

  if (input.id) {
    const res = await fetch(`/api/discovery/opportunities/${encodeURIComponent(input.id)}`, {
      method: 'PUT',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Unable to update opportunity.');
    return input.id;
  }

  const res = await fetch('/api/discovery/opportunities', {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Unable to save opportunity.');
  const data = (await res.json()) as { item: { id: string } };
  return data.item.id;
}

export async function deleteVentureOpportunity(oppId: string): Promise<void> {
  const res = await fetch(`/api/discovery/opportunities/${encodeURIComponent(oppId)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Unable to remove opportunity.');
}

function escapeCsvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function exportOpportunitiesToCsv(items: VentureOpportunityRecord[]): void {
  const headers = [
    'Title',
    'Organisation',
    'Category',
    'Intervention',
    'Total Score (/100)',
    'Paid Demand Evidenced',
    'Pipeline Stage',
    'Problem Summary',
    'Validation Evidence',
  ];

  const rows = items.map((item) => [
    item.title,
    item.orgName,
    item.category,
    item.intervention,
    String(computeOpportunityScore(item)),
    item.hasPaidDemandEvidence ? 'Yes' : 'No',
    item.pipelineStage,
    item.problemSummary,
    item.validationEvidence,
  ]);

  const csvContent = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((r) => r.map((cell) => escapeCsvCell(cell ?? '')).join(',')),
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.setAttribute('download', `ajentir-venture-scorecard-${stamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportDiscoveryOrgsToCsv(items: DiscoveryOrgRecord[]): void {
  const headers = [
    'Organisation',
    'Sector',
    'Size',
    'Stage',
    'Workflow Owners',
    'Operating Model',
    'Workflows & Baseline Friction',
  ];

  const rows = items.map((item) => [
    item.name,
    item.sector,
    item.size,
    item.status,
    item.workflowOwners,
    item.operatingModel,
    item.workflowsSummary,
  ]);

  const csvContent = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((r) => r.map((cell) => escapeCsvCell(cell ?? '')).join(',')),
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.setAttribute('download', `ajentir-discovery-orgs-${stamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
