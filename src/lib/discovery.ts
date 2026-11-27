import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';

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

const ORGS_PATH = 'discovery_orgs';
const OPPS_PATH = 'venture_opportunities';

function toDate(value: unknown): Date | null {
  return value instanceof Timestamp ? value.toDate() : null;
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

export function subscribeToDiscoveryOrgs(
  onData: (items: DiscoveryOrgRecord[]) => void,
  onError: (err: Error) => void,
): Unsubscribe {
  const q = query(collection(db, ORGS_PATH), orderBy('updatedAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: DiscoveryOrgRecord[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: typeof data.name === 'string' ? data.name : '',
          sector: (data.sector as DiscoverySector) ?? 'Financial services',
          size: typeof data.size === 'string' ? data.size : '',
          operatingModel: typeof data.operatingModel === 'string' ? data.operatingModel : '',
          workflowOwners: typeof data.workflowOwners === 'string' ? data.workflowOwners : '',
          workflowsSummary: typeof data.workflowsSummary === 'string' ? data.workflowsSummary : '',
          status: (data.status as DiscoveryOrgStatus) ?? 'Access',
          createdAt: toDate(data.createdAt),
          updatedAt: toDate(data.updatedAt),
        };
      });
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, ORGS_PATH);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    },
  );
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
    updatedAt: serverTimestamp(),
  };

  if (!payload.name) {
    throw new Error('Organisation name is required.');
  }

  if (input.id) {
    try {
      await updateDoc(doc(db, ORGS_PATH, input.id), payload);
      return input.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${ORGS_PATH}/${input.id}`);
    }
  }

  try {
    const ref = await addDoc(collection(db, ORGS_PATH), {
      ...payload,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, ORGS_PATH);
  }
}

export async function deleteDiscoveryOrg(orgId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, ORGS_PATH, orgId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${ORGS_PATH}/${orgId}`);
  }
}

export function subscribeToVentureOpportunities(
  onData: (items: VentureOpportunityRecord[]) => void,
  onError: (err: Error) => void,
): Unsubscribe {
  const q = query(collection(db, OPPS_PATH), orderBy('updatedAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: VentureOpportunityRecord[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          title: typeof data.title === 'string' ? data.title : '',
          orgId: typeof data.orgId === 'string' ? data.orgId : '',
          orgName: typeof data.orgName === 'string' ? data.orgName : '',
          category: (data.category as OpportunityCategory) ?? 'C — New venture',
          intervention: (data.intervention as WorkflowIntervention) ?? 'Reconstruct',
          problemSummary: typeof data.problemSummary === 'string' ? data.problemSummary : '',
          validationEvidence:
            typeof data.validationEvidence === 'string' ? data.validationEvidence : '',
          hasPaidDemandEvidence: Boolean(data.hasPaidDemandEvidence),
          scoreSeverity: typeof data.scoreSeverity === 'number' ? data.scoreSeverity : 0,
          scoreRepeatability:
            typeof data.scoreRepeatability === 'number' ? data.scoreRepeatability : 0,
          scoreWtp: typeof data.scoreWtp === 'number' ? data.scoreWtp : 0,
          scoreAgentic: typeof data.scoreAgentic === 'number' ? data.scoreAgentic : 0,
          scoreScalability:
            typeof data.scoreScalability === 'number' ? data.scoreScalability : 0,
          scoreFeasibility:
            typeof data.scoreFeasibility === 'number' ? data.scoreFeasibility : 0,
          scoreFit: typeof data.scoreFit === 'number' ? data.scoreFit : 0,
          pipelineStage: (data.pipelineStage as PipelineStage) ?? 'Investigate',
          createdAt: toDate(data.createdAt),
          updatedAt: toDate(data.updatedAt),
        };
      });
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, OPPS_PATH);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    },
  );
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
    updatedAt: serverTimestamp(),
  };

  if (!payload.title) {
    throw new Error('Opportunity title is required.');
  }

  if (input.id) {
    try {
      await updateDoc(doc(db, OPPS_PATH, input.id), payload);
      return input.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${OPPS_PATH}/${input.id}`);
    }
  }

  try {
    const ref = await addDoc(collection(db, OPPS_PATH), {
      ...payload,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, OPPS_PATH);
  }
}

export async function deleteVentureOpportunity(oppId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, OPPS_PATH, oppId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${OPPS_PATH}/${oppId}`);
  }
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
