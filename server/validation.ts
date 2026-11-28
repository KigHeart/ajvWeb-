export const MAX_BODY_BYTES = 32_768;

export type InquiryPayload = {
  lane: "founder" | "training" | "partner";
  subTrack: string;
  fullName: string;
  company: string;
  email: string;
  website: string;
  teamSize: string;
  preferredSession: string;
  message: string;
};

export type InquiryTriagePayload = {
  status: "new" | "reviewing" | "scheduled" | "archived";
  stageTag: "" | "Concept" | "MVP" | "Revenue" | "Pilot Ready" | "Credit Pool" | "Cohort";
  designPartner: string;
  notes: string;
};

export type SiteConfigPayload = {
  incubationStatus: "Open" | "By Intro" | "Waitlist";
  nextBriefingLabel: string;
  partnerSandboxNote: string;
};

export type DiscoverySector =
  | "Financial services"
  | "Agriculture"
  | "Logistics"
  | "Healthcare"
  | "Retail & distribution"
  | "Professional services"
  | "Construction"
  | "Other";

export type DiscoveryOrgStatus = "Access" | "Mapping" | "Decomposing" | "Completed";

export type DiscoveryOrgPayload = {
  name: string;
  sector: DiscoverySector;
  size: string;
  operatingModel: string;
  workflowOwners: string;
  workflowsSummary: string;
  status: DiscoveryOrgStatus;
};

export type OpportunityCategory =
  | "A — Internal transformation"
  | "B — Replicable product"
  | "C — New venture";

export type WorkflowIntervention =
  | "Eliminate"
  | "Simplify"
  | "Augment"
  | "Delegate"
  | "Reconstruct";

export type PipelineStage = "Reject" | "Investigate" | "Validate" | "Incubate" | "Invest";

export type VentureOpportunityPayload = {
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
};

const TRACKS: Record<InquiryPayload["lane"], readonly string[]> = {
  founder: ["investment", "incubation"],
  training: ["governance", "workflow", "workshop"],
  partner: ["discovery", "model-provider", "bank", "enterprise"],
};

const TEAM_SIZES = ["", "1-10 leaders", "11-30 leaders", "30+ leaders"];
const INQUIRY_STATUSES = ["new", "reviewing", "scheduled", "archived"] as const;
const STAGE_TAGS = ["", "Concept", "MVP", "Revenue", "Pilot Ready", "Credit Pool", "Cohort"] as const;
const INCUBATION_STATUSES = ["Open", "By Intro", "Waitlist"] as const;
const DISCOVERY_SECTORS: readonly DiscoverySector[] = [
  "Financial services",
  "Agriculture",
  "Logistics",
  "Healthcare",
  "Retail & distribution",
  "Professional services",
  "Construction",
  "Other",
];
const ORG_STATUSES: readonly DiscoveryOrgStatus[] = [
  "Access",
  "Mapping",
  "Decomposing",
  "Completed",
];
const OPPORTUNITY_CATEGORIES: readonly OpportunityCategory[] = [
  "A — Internal transformation",
  "B — Replicable product",
  "C — New venture",
];
const INTERVENTIONS: readonly WorkflowIntervention[] = [
  "Eliminate",
  "Simplify",
  "Augment",
  "Delegate",
  "Reconstruct",
];
const PIPELINE_STAGES: readonly PipelineStage[] = [
  "Reject",
  "Investigate",
  "Validate",
  "Incubate",
  "Invest",
];

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const ID_REGEX = /^[a-zA-Z0-9_-]{1,128}$/;

export function isValidId(value: unknown): value is string {
  return typeof value === "string" && ID_REGEX.test(value);
}

function boundedString(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const clean = value.trim();
  return clean.length <= max ? clean : null;
}

function intInRange(value: unknown, min: number, max: number): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const rounded = Math.round(value);
  return rounded >= min && rounded <= max ? rounded : null;
}

export function validateInquiry(value: unknown): InquiryPayload | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const data = value as Record<string, unknown>;
  const lane = data.lane;
  if (lane !== "founder" && lane !== "training" && lane !== "partner") return null;
  const subTrack = boundedString(data.subTrack, 40);
  const fullName = boundedString(data.fullName, 120);
  const company = boundedString(data.company ?? "", 140);
  const email = boundedString(data.email, 160)?.toLowerCase() ?? null;
  const website = boundedString(data.website ?? "", 300);
  const teamSize = boundedString(data.teamSize ?? "", 40);
  const preferredSession = boundedString(data.preferredSession ?? "", 140);
  const message = boundedString(data.message ?? "", 2000);
  if (!subTrack || !TRACKS[lane].includes(subTrack)) return null;
  if (!fullName || company === null || !email) return null;
  if (!EMAIL_REGEX.test(email)) return null;
  if (website === null || teamSize === null || preferredSession === null || message === null) return null;
  if (!TEAM_SIZES.includes(teamSize) || (lane !== "training" && teamSize !== "")) return null;
  let normalizedWebsite = "";
  if (lane === "founder" && website) {
    try {
      const parsed = new URL(/^https?:\/\//i.test(website) ? website : `https://${website}`);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
      normalizedWebsite = parsed.toString().slice(0, 300);
    } catch {
      return null;
    }
  }
  return {
    lane,
    subTrack,
    fullName,
    company,
    email,
    website: normalizedWebsite,
    teamSize: lane === "training" ? teamSize : "",
    preferredSession,
    message,
  };
}

export function validateInquiryTriage(value: unknown): InquiryTriagePayload | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const data = value as Record<string, unknown>;
  const status = data.status;
  const stageTag = data.stageTag ?? "";
  const designPartner = boundedString(data.designPartner ?? "", 140);
  const notes = boundedString(data.notes ?? "", 2000);
  if (
    typeof status !== "string" ||
    !(INQUIRY_STATUSES as readonly string[]).includes(status)
  ) {
    return null;
  }
  if (
    typeof stageTag !== "string" ||
    !(STAGE_TAGS as readonly string[]).includes(stageTag)
  ) {
    return null;
  }
  if (designPartner === null || notes === null) return null;
  return {
    status: status as InquiryTriagePayload["status"],
    stageTag: stageTag as InquiryTriagePayload["stageTag"],
    designPartner,
    notes,
  };
}

export function validateSiteConfig(value: unknown): SiteConfigPayload | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const data = value as Record<string, unknown>;
  const incubationStatus = data.incubationStatus;
  const nextBriefingLabel = boundedString(data.nextBriefingLabel ?? "", 120);
  const partnerSandboxNote = boundedString(data.partnerSandboxNote ?? "", 160);
  if (
    typeof incubationStatus !== "string" ||
    !(INCUBATION_STATUSES as readonly string[]).includes(incubationStatus)
  ) {
    return null;
  }
  if (nextBriefingLabel === null || partnerSandboxNote === null) return null;
  return {
    incubationStatus: incubationStatus as SiteConfigPayload["incubationStatus"],
    nextBriefingLabel,
    partnerSandboxNote,
  };
}

export function validateDiscoveryOrg(value: unknown): DiscoveryOrgPayload | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const data = value as Record<string, unknown>;
  const name = boundedString(data.name, 140);
  const sector = data.sector;
  const size = boundedString(data.size ?? "", 60);
  const operatingModel = boundedString(data.operatingModel ?? "", 240);
  const workflowOwners = boundedString(data.workflowOwners ?? "", 200);
  const workflowsSummary = boundedString(data.workflowsSummary ?? "", 3000);
  const status = data.status;
  if (!name) return null;
  if (
    typeof sector !== "string" ||
    !(DISCOVERY_SECTORS as readonly string[]).includes(sector)
  ) {
    return null;
  }
  if (
    typeof status !== "string" ||
    !(ORG_STATUSES as readonly string[]).includes(status)
  ) {
    return null;
  }
  if (
    size === null ||
    operatingModel === null ||
    workflowOwners === null ||
    workflowsSummary === null
  ) {
    return null;
  }
  return {
    name,
    sector: sector as DiscoverySector,
    size,
    operatingModel,
    workflowOwners,
    workflowsSummary,
    status: status as DiscoveryOrgStatus,
  };
}

export function validateVentureOpportunity(value: unknown): VentureOpportunityPayload | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const data = value as Record<string, unknown>;
  const title = boundedString(data.title, 140);
  const orgId = boundedString(data.orgId ?? "", 128);
  const orgName = boundedString(data.orgName ?? "", 140);
  const category = data.category;
  const intervention = data.intervention;
  const problemSummary = boundedString(data.problemSummary ?? "", 1200);
  const validationEvidence = boundedString(data.validationEvidence ?? "", 1200);
  const hasPaidDemandEvidence = Boolean(data.hasPaidDemandEvidence);
  const pipelineStage = data.pipelineStage;

  if (!title || orgId === null || orgName === null) return null;
  if (orgId !== "" && !isValidId(orgId)) return null;
  if (
    typeof category !== "string" ||
    !(OPPORTUNITY_CATEGORIES as readonly string[]).includes(category)
  ) {
    return null;
  }
  if (
    typeof intervention !== "string" ||
    !(INTERVENTIONS as readonly string[]).includes(intervention)
  ) {
    return null;
  }
  if (
    typeof pipelineStage !== "string" ||
    !(PIPELINE_STAGES as readonly string[]).includes(pipelineStage)
  ) {
    return null;
  }
  if (problemSummary === null || validationEvidence === null) return null;

  const scoreSeverity = intInRange(data.scoreSeverity, 0, 15);
  const scoreRepeatability = intInRange(data.scoreRepeatability, 0, 15);
  const scoreWtp = intInRange(data.scoreWtp, 0, 20);
  const scoreAgentic = intInRange(data.scoreAgentic, 0, 15);
  const scoreScalability = intInRange(data.scoreScalability, 0, 15);
  const scoreFeasibility = intInRange(data.scoreFeasibility, 0, 10);
  const scoreFit = intInRange(data.scoreFit, 0, 10);

  if (
    scoreSeverity === null ||
    scoreRepeatability === null ||
    scoreWtp === null ||
    scoreAgentic === null ||
    scoreScalability === null ||
    scoreFeasibility === null ||
    scoreFit === null
  ) {
    return null;
  }

  return {
    title,
    orgId,
    orgName,
    category: category as OpportunityCategory,
    intervention: intervention as WorkflowIntervention,
    problemSummary,
    validationEvidence,
    hasPaidDemandEvidence,
    scoreSeverity,
    scoreRepeatability,
    scoreWtp,
    scoreAgentic,
    scoreScalability,
    scoreFeasibility,
    scoreFit,
    pipelineStage: pipelineStage as PipelineStage,
  };
}

export function validateTeamMemberInput(
  value: unknown,
): { email: string; displayName: string; password: string } | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const data = value as Record<string, unknown>;
  const email = boundedString(data.email, 160)?.toLowerCase() ?? null;
  const displayName = boundedString(data.displayName, 120);
  const password = typeof data.password === "string" ? data.password : "";
  if (!email || !EMAIL_REGEX.test(email) || !displayName) return null;
  if (password.length < 8 || password.length > 200) return null;
  return { email, displayName, password };
}

export type ResearchCategory = "Workflow Discovery" | "Sector Studies" | "Agentic Governance";

export type ResearchNotePayload = {
  title: string;
  category: ResearchCategory;
  publishedLabel: string;
  readTime: string;
  summary: string;
  sectors: string;
  findings: string[];
  body: string;
  published: boolean;
};

const RESEARCH_CATEGORIES: readonly ResearchCategory[] = [
  "Workflow Discovery",
  "Sector Studies",
  "Agentic Governance",
];

export function validateResearchNote(value: unknown): ResearchNotePayload | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const data = value as Record<string, unknown>;
  const title = boundedString(data.title, 140);
  const category = data.category;
  const publishedLabel = boundedString(data.publishedLabel ?? "", 40);
  const readTime = boundedString(data.readTime ?? "", 24);
  const summary = boundedString(data.summary ?? "", 360);
  const sectors = boundedString(data.sectors ?? "", 140);
  const body = boundedString(data.body ?? "", 6000);
  const published = data.published !== false;

  if (!title || !summary || !body) return null;
  if (
    typeof category !== "string" ||
    !(RESEARCH_CATEGORIES as readonly string[]).includes(category)
  ) {
    return null;
  }
  if (publishedLabel === null || readTime === null || sectors === null) return null;

  let findings: string[] = [];
  if (Array.isArray(data.findings)) {
    for (const item of data.findings.slice(0, 6)) {
      const clean = boundedString(item, 220);
      if (clean === null) return null;
      if (clean.length > 0) findings.push(clean);
    }
  } else if (data.findings !== undefined) {
    return null;
  }

  return {
    title,
    category: category as ResearchCategory,
    publishedLabel: publishedLabel || "2026",
    readTime: readTime || "4 min read",
    summary,
    sectors,
    findings,
    body,
    published,
  };
}

