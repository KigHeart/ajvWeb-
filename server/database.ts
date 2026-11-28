import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import type {
  DiscoveryOrgPayload,
  InquiryPayload,
  ResearchNotePayload,
  SiteConfigPayload,
  VentureOpportunityPayload,
} from "./validation";

export type InquiryStatus = "new" | "reviewing" | "scheduled" | "archived";
export type InquiryTriage = {
  status: InquiryStatus;
  stageTag: string;
  designPartner: string;
  notes: string;
};

export type StoredInquiry = InquiryPayload & {
  id: string;
  status: InquiryStatus;
  stageTag: string;
  designPartner: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type StoredSiteConfig = SiteConfigPayload & {
  updatedAt: string;
};

export type StoredDiscoveryOrg = DiscoveryOrgPayload & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

export type StoredVentureOpportunity = VentureOpportunityPayload & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

export type StoredResearchNote = ResearchNotePayload & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

export type StoredTeamMember = {
  id: string;
  email: string;
  displayName: string;
  addedBy: string;
  createdAt: string;
};

export type StoredCredential = {
  id: string;
  email: string;
  displayName: string;
  passwordHash: string;
  salt: string;
};

export const DEFAULT_SITE_CONFIG: StoredSiteConfig = {
  incubationStatus: "Open",
  nextBriefingLabel: "Monthly executive briefings · Nairobi & Virtual",
  partnerSandboxNote: "Pilot sandbox slots open for banks and AI model providers",
  updatedAt: "",
};

type InquiryRow = {
  id: string;
  lane: StoredInquiry["lane"];
  sub_track: string;
  full_name: string;
  company: string;
  email: string;
  website: string;
  team_size: string;
  preferred_session: string;
  message: string;
  status: InquiryStatus;
  stage_tag: string;
  design_partner: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

type DiscoveryOrgRow = {
  id: string;
  name: string;
  sector: DiscoveryOrgPayload["sector"];
  size: string;
  operating_model: string;
  workflow_owners: string;
  workflows_summary: string;
  status: DiscoveryOrgPayload["status"];
  created_at: string;
  updated_at: string;
};

type VentureOpportunityRow = {
  id: string;
  title: string;
  org_id: string;
  org_name: string;
  category: VentureOpportunityPayload["category"];
  intervention: VentureOpportunityPayload["intervention"];
  problem_summary: string;
  validation_evidence: string;
  has_paid_demand_evidence: number;
  score_severity: number;
  score_repeatability: number;
  score_wtp: number;
  score_agentic: number;
  score_scalability: number;
  score_feasibility: number;
  score_fit: number;
  pipeline_stage: VentureOpportunityPayload["pipelineStage"];
  created_at: string;
  updated_at: string;
};

function fromRow(row: InquiryRow): StoredInquiry {
  return {
    id: row.id,
    lane: row.lane,
    subTrack: row.sub_track,
    fullName: row.full_name,
    company: row.company,
    email: row.email,
    website: row.website,
    teamSize: row.team_size,
    preferredSession: row.preferred_session,
    message: row.message,
    status: row.status,
    stageTag: row.stage_tag,
    designPartner: row.design_partner,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function fromOrgRow(row: DiscoveryOrgRow): StoredDiscoveryOrg {
  return {
    id: row.id,
    name: row.name,
    sector: row.sector,
    size: row.size,
    operatingModel: row.operating_model,
    workflowOwners: row.workflow_owners,
    workflowsSummary: row.workflows_summary,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function fromOppRow(row: VentureOpportunityRow): StoredVentureOpportunity {
  return {
    id: row.id,
    title: row.title,
    orgId: row.org_id,
    orgName: row.org_name,
    category: row.category,
    intervention: row.intervention,
    problemSummary: row.problem_summary,
    validationEvidence: row.validation_evidence,
    hasPaidDemandEvidence: Boolean(row.has_paid_demand_evidence),
    scoreSeverity: row.score_severity,
    scoreRepeatability: row.score_repeatability,
    scoreWtp: row.score_wtp,
    scoreAgentic: row.score_agentic,
    scoreScalability: row.score_scalability,
    scoreFeasibility: row.score_feasibility,
    scoreFit: row.score_fit,
    pipelineStage: row.pipeline_stage,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

type ResearchNoteRow = {
  id: string;
  title: string;
  category: ResearchNotePayload["category"];
  published_label: string;
  read_time: string;
  summary: string;
  sectors: string;
  findings_json: string;
  body: string;
  published: number;
  created_at: string;
  updated_at: string;
};

function fromResearchRow(row: ResearchNoteRow): StoredResearchNote {
  let findings: string[] = [];
  try {
    const parsed = JSON.parse(row.findings_json) as unknown;
    if (Array.isArray(parsed)) {
      findings = parsed.filter((item): item is string => typeof item === "string");
    }
  } catch {
    findings = [];
  }
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    publishedLabel: row.published_label,
    readTime: row.read_time,
    summary: row.summary,
    sectors: row.sectors,
    findings,
    body: row.body,
    published: Boolean(row.published),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function openDatabase(filename: string) {
  fs.mkdirSync(path.dirname(path.resolve(filename)), { recursive: true });
  const db = new Database(filename);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS inquiries (
      id TEXT PRIMARY KEY NOT NULL,
      lane TEXT NOT NULL CHECK (lane IN ('founder','training','partner')),
      sub_track TEXT NOT NULL,
      full_name TEXT NOT NULL CHECK (length(full_name) BETWEEN 1 AND 120),
      company TEXT NOT NULL CHECK (length(company) <= 140),
      email TEXT NOT NULL CHECK (length(email) BETWEEN 3 AND 160),
      website TEXT NOT NULL DEFAULT '' CHECK (length(website) <= 300),
      team_size TEXT NOT NULL DEFAULT '' CHECK (team_size IN ('','1-10 leaders','11-30 leaders','30+ leaders')),
      preferred_session TEXT NOT NULL DEFAULT '' CHECK (length(preferred_session) <= 140),
      message TEXT NOT NULL DEFAULT '' CHECK (length(message) <= 2000),
      status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','reviewing','scheduled','archived')),
      stage_tag TEXT NOT NULL DEFAULT '',
      design_partner TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS inquiries_created_at_idx ON inquiries(created_at DESC);
    CREATE INDEX IF NOT EXISTS inquiries_status_idx ON inquiries(status, created_at DESC);

    CREATE TABLE IF NOT EXISTS site_config (
      id TEXT PRIMARY KEY NOT NULL,
      incubation_status TEXT NOT NULL CHECK (incubation_status IN ('Open','By Intro','Waitlist')),
      next_briefing_label TEXT NOT NULL CHECK (length(next_briefing_label) <= 120),
      partner_sandbox_note TEXT NOT NULL CHECK (length(partner_sandbox_note) <= 160),
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_credentials (
      id TEXT PRIMARY KEY NOT NULL,
      email TEXT NOT NULL,
      display_name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS team_members (
      id TEXT PRIMARY KEY NOT NULL,
      email TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      added_by TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS discovery_orgs (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 140),
      sector TEXT NOT NULL,
      size TEXT NOT NULL DEFAULT '' CHECK (length(size) <= 60),
      operating_model TEXT NOT NULL DEFAULT '' CHECK (length(operating_model) <= 240),
      workflow_owners TEXT NOT NULL DEFAULT '' CHECK (length(workflow_owners) <= 200),
      workflows_summary TEXT NOT NULL DEFAULT '' CHECK (length(workflows_summary) <= 3000),
      status TEXT NOT NULL CHECK (status IN ('Access','Mapping','Decomposing','Completed')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS discovery_orgs_updated_idx ON discovery_orgs(updated_at DESC);

    CREATE TABLE IF NOT EXISTS venture_opportunities (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 140),
      org_id TEXT NOT NULL DEFAULT '',
      org_name TEXT NOT NULL DEFAULT '' CHECK (length(org_name) <= 140),
      category TEXT NOT NULL,
      intervention TEXT NOT NULL,
      problem_summary TEXT NOT NULL DEFAULT '' CHECK (length(problem_summary) <= 1200),
      validation_evidence TEXT NOT NULL DEFAULT '' CHECK (length(validation_evidence) <= 1200),
      has_paid_demand_evidence INTEGER NOT NULL DEFAULT 0,
      score_severity INTEGER NOT NULL CHECK (score_severity BETWEEN 0 AND 15),
      score_repeatability INTEGER NOT NULL CHECK (score_repeatability BETWEEN 0 AND 15),
      score_wtp INTEGER NOT NULL CHECK (score_wtp BETWEEN 0 AND 20),
      score_agentic INTEGER NOT NULL CHECK (score_agentic BETWEEN 0 AND 15),
      score_scalability INTEGER NOT NULL CHECK (score_scalability BETWEEN 0 AND 15),
      score_feasibility INTEGER NOT NULL CHECK (score_feasibility BETWEEN 0 AND 10),
      score_fit INTEGER NOT NULL CHECK (score_fit BETWEEN 0 AND 10),
      pipeline_stage TEXT NOT NULL CHECK (pipeline_stage IN ('Reject','Investigate','Validate','Incubate','Invest')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS venture_opps_updated_idx ON venture_opportunities(updated_at DESC);

    CREATE TABLE IF NOT EXISTS research_notes (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 140),
      category TEXT NOT NULL CHECK (category IN ('Workflow Discovery','Sector Studies','Agentic Governance')),
      published_label TEXT NOT NULL DEFAULT '2026' CHECK (length(published_label) <= 40),
      read_time TEXT NOT NULL DEFAULT '4 min read' CHECK (length(read_time) <= 24),
      summary TEXT NOT NULL CHECK (length(summary) BETWEEN 1 AND 360),
      sectors TEXT NOT NULL DEFAULT '' CHECK (length(sectors) <= 140),
      findings_json TEXT NOT NULL DEFAULT '[]',
      body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 6000),
      published INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS research_notes_updated_idx ON research_notes(updated_at DESC);
  `);

  const insert = db.prepare(`
    INSERT INTO inquiries
      (id,lane,sub_track,full_name,company,email,website,team_size,preferred_session,message,created_at,updated_at)
    VALUES (@id,@lane,@subTrack,@fullName,@company,@email,@website,@teamSize,@preferredSession,@message,@createdAt,@updatedAt)
  `);
  const list = db.prepare("SELECT * FROM inquiries ORDER BY created_at DESC, id DESC");
  const update = db.prepare(`
    UPDATE inquiries SET status=@status, stage_tag=@stageTag, design_partner=@designPartner,
      notes=@notes, updated_at=@updatedAt WHERE id=@id
  `);
  const remove = db.prepare("DELETE FROM inquiries WHERE id = ?");

  const getSiteStmt = db.prepare("SELECT * FROM site_config WHERE id = 'site'");
  const upsertSiteStmt = db.prepare(`
    INSERT INTO site_config (id, incubation_status, next_briefing_label, partner_sandbox_note, updated_at)
    VALUES ('site', @incubationStatus, @nextBriefingLabel, @partnerSandboxNote, @updatedAt)
    ON CONFLICT(id) DO UPDATE SET
      incubation_status = excluded.incubation_status,
      next_briefing_label = excluded.next_briefing_label,
      partner_sandbox_note = excluded.partner_sandbox_note,
      updated_at = excluded.updated_at
  `);

  const getOwnerStmt = db.prepare("SELECT * FROM admin_credentials WHERE id = 'owner'");
  const claimOwnerStmt = db.prepare(`
    INSERT INTO admin_credentials (id, email, display_name, password_hash, salt, created_at, updated_at)
    SELECT 'owner', @email, @displayName, @passwordHash, @salt, @now, @now
    WHERE NOT EXISTS (SELECT 1 FROM admin_credentials WHERE id = 'owner')
  `);

  const listTeamStmt = db.prepare(
    "SELECT id, email, display_name, added_by, created_at FROM team_members ORDER BY created_at DESC",
  );
  const findTeamByEmailStmt = db.prepare(
    "SELECT id, email, display_name, password_hash, salt FROM team_members WHERE email = ?",
  );
  const insertTeamStmt = db.prepare(`
    INSERT INTO team_members (id, email, display_name, password_hash, salt, added_by, created_at)
    VALUES (@id, @email, @displayName, @passwordHash, @salt, @addedBy, @createdAt)
  `);
  const deleteTeamStmt = db.prepare("DELETE FROM team_members WHERE id = ?");

  const listOrgsStmt = db.prepare(
    "SELECT * FROM discovery_orgs ORDER BY updated_at DESC, id DESC",
  );
  const getOrgStmt = db.prepare("SELECT * FROM discovery_orgs WHERE id = ?");
  const insertOrgStmt = db.prepare(`
    INSERT INTO discovery_orgs
      (id, name, sector, size, operating_model, workflow_owners, workflows_summary, status, created_at, updated_at)
    VALUES (@id, @name, @sector, @size, @operatingModel, @workflowOwners, @workflowsSummary, @status, @createdAt, @updatedAt)
  `);
  const updateOrgStmt = db.prepare(`
    UPDATE discovery_orgs
    SET name=@name, sector=@sector, size=@size, operating_model=@operatingModel,
        workflow_owners=@workflowOwners, workflows_summary=@workflowsSummary, status=@status, updated_at=@updatedAt
    WHERE id=@id
  `);
  const updateOppOrgNamesStmt = db.prepare(
    "UPDATE venture_opportunities SET org_name=@orgName WHERE org_id=@orgId",
  );
  const detachOppsFromOrgStmt = db.prepare(
    "UPDATE venture_opportunities SET org_id = '' WHERE org_id = ?",
  );
  const deleteOrgStmt = db.prepare("DELETE FROM discovery_orgs WHERE id = ?");

  const listOppsStmt = db.prepare(
    "SELECT * FROM venture_opportunities ORDER BY updated_at DESC, id DESC",
  );
  const insertOppStmt = db.prepare(`
    INSERT INTO venture_opportunities
      (id, title, org_id, org_name, category, intervention, problem_summary, validation_evidence,
       has_paid_demand_evidence, score_severity, score_repeatability, score_wtp, score_agentic,
       score_scalability, score_feasibility, score_fit, pipeline_stage, created_at, updated_at)
    VALUES
      (@id, @title, @orgId, @orgName, @category, @intervention, @problemSummary, @validationEvidence,
       @hasPaidDemandEvidence, @scoreSeverity, @scoreRepeatability, @scoreWtp, @scoreAgentic,
       @scoreScalability, @scoreFeasibility, @scoreFit, @pipelineStage, @createdAt, @updatedAt)
  `);
  const updateOppStmt = db.prepare(`
    UPDATE venture_opportunities
    SET title=@title, org_id=@orgId, org_name=@orgName, category=@category, intervention=@intervention,
        problem_summary=@problemSummary, validation_evidence=@validationEvidence,
        has_paid_demand_evidence=@hasPaidDemandEvidence, score_severity=@scoreSeverity,
        score_repeatability=@scoreRepeatability, score_wtp=@scoreWtp, score_agentic=@scoreAgentic,
        score_scalability=@scoreScalability, score_feasibility=@scoreFeasibility,
        score_fit=@scoreFit, pipeline_stage=@pipelineStage, updated_at=@updatedAt
    WHERE id=@id
  `);
  const deleteOppStmt = db.prepare("DELETE FROM venture_opportunities WHERE id = ?");

  const listResearchStmt = db.prepare(
    "SELECT * FROM research_notes ORDER BY updated_at DESC, id DESC",
  );
  const listPublishedResearchStmt = db.prepare(
    "SELECT * FROM research_notes WHERE published = 1 ORDER BY updated_at DESC, id DESC",
  );
  const insertResearchStmt = db.prepare(`
    INSERT INTO research_notes
      (id, title, category, published_label, read_time, summary, sectors, findings_json, body, published, created_at, updated_at)
    VALUES
      (@id, @title, @category, @publishedLabel, @readTime, @summary, @sectors, @findingsJson, @body, @published, @createdAt, @updatedAt)
  `);
  const updateResearchStmt = db.prepare(`
    UPDATE research_notes
    SET title=@title, category=@category, published_label=@publishedLabel, read_time=@readTime,
        summary=@summary, sectors=@sectors, findings_json=@findingsJson, body=@body,
        published=@published, updated_at=@updatedAt
    WHERE id=@id
  `);
  const deleteResearchStmt = db.prepare("DELETE FROM research_notes WHERE id = ?");

  const saveOrgTx = db.transaction(
    (id: string, data: DiscoveryOrgPayload, now: string, isUpdate: boolean) => {
      if (isUpdate) {
        const res = updateOrgStmt.run({ id, ...data, updatedAt: now });
        if (res.changes === 0) return false;
        updateOppOrgNamesStmt.run({ orgId: id, orgName: data.name });
        return true;
      }
      insertOrgStmt.run({ id, ...data, createdAt: now, updatedAt: now });
      return true;
    },
  );

  const deleteOrgTx = db.transaction((id: string) => {
    detachOppsFromOrgStmt.run(id);
    return deleteOrgStmt.run(id).changes === 1;
  });

  return {
    insertInquiry(record: StoredInquiry) {
      insert.run({
        id: record.id,
        lane: record.lane,
        subTrack: record.subTrack,
        fullName: record.fullName,
        company: record.company,
        email: record.email,
        website: record.website,
        teamSize: record.teamSize,
        preferredSession: record.preferredSession,
        message: record.message,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      });
    },
    listInquiries(): StoredInquiry[] {
      return (list.all() as InquiryRow[]).map(fromRow);
    },
    updateInquiryTriage(
      id: string,
      triage: InquiryTriage,
      updatedAt = new Date().toISOString(),
    ): boolean {
      const result = update.run({ id, ...triage, updatedAt });
      return result.changes === 1;
    },
    deleteInquiry(id: string): boolean {
      return remove.run(id).changes === 1;
    },

    getSiteConfig(): StoredSiteConfig {
      const row = getSiteStmt.get() as
        | {
            incubation_status: SiteConfigPayload["incubationStatus"];
            next_briefing_label: string;
            partner_sandbox_note: string;
            updated_at: string;
          }
        | undefined;
      if (!row) return DEFAULT_SITE_CONFIG;
      return {
        incubationStatus: row.incubation_status,
        nextBriefingLabel: row.next_briefing_label,
        partnerSandboxNote: row.partner_sandbox_note,
        updatedAt: row.updated_at,
      };
    },
    saveSiteConfig(config: SiteConfigPayload, updatedAt = new Date().toISOString()): StoredSiteConfig {
      upsertSiteStmt.run({ ...config, updatedAt });
      return { ...config, updatedAt };
    },

    hasOwnerCredential(): boolean {
      return Boolean(getOwnerStmt.get());
    },
    getOwnerCredential(): StoredCredential | null {
      const row = getOwnerStmt.get() as
        | { id: string; email: string; display_name: string; password_hash: string; salt: string }
        | undefined;
      if (!row) return null;
      return {
        id: row.id,
        email: row.email,
        displayName: row.display_name,
        passwordHash: row.password_hash,
        salt: row.salt,
      };
    },
    claimOwnerCredential(input: {
      email: string;
      displayName: string;
      passwordHash: string;
      salt: string;
    }): boolean {
      const now = new Date().toISOString();
      const res = claimOwnerStmt.run({ ...input, now });
      return res.changes === 1;
    },

    listTeamMembers(): StoredTeamMember[] {
      const rows = listTeamStmt.all() as {
        id: string;
        email: string;
        display_name: string;
        added_by: string;
        created_at: string;
      }[];
      return rows.map((r) => ({
        id: r.id,
        email: r.email,
        displayName: r.display_name,
        addedBy: r.added_by,
        createdAt: r.created_at,
      }));
    },
    findTeamMemberByEmail(email: string): StoredCredential | null {
      const row = findTeamByEmailStmt.get(email.toLowerCase()) as
        | { id: string; email: string; display_name: string; password_hash: string; salt: string }
        | undefined;
      if (!row) return null;
      return {
        id: row.id,
        email: row.email,
        displayName: row.display_name,
        passwordHash: row.password_hash,
        salt: row.salt,
      };
    },
    createTeamMember(input: {
      id: string;
      email: string;
      displayName: string;
      passwordHash: string;
      salt: string;
      addedBy: string;
    }): StoredTeamMember {
      const createdAt = new Date().toISOString();
      insertTeamStmt.run({ ...input, createdAt });
      return {
        id: input.id,
        email: input.email,
        displayName: input.displayName,
        addedBy: input.addedBy,
        createdAt,
      };
    },
    deleteTeamMember(id: string): boolean {
      return deleteTeamStmt.run(id).changes === 1;
    },

    listDiscoveryOrgs(): StoredDiscoveryOrg[] {
      return (listOrgsStmt.all() as DiscoveryOrgRow[]).map(fromOrgRow);
    },
    orgExists(id: string): boolean {
      return Boolean(getOrgStmt.get(id));
    },
    createDiscoveryOrg(
      id: string,
      data: DiscoveryOrgPayload,
      now = new Date().toISOString(),
    ): StoredDiscoveryOrg {
      saveOrgTx(id, data, now, false);
      return { id, ...data, createdAt: now, updatedAt: now };
    },
    updateDiscoveryOrg(
      id: string,
      data: DiscoveryOrgPayload,
      now = new Date().toISOString(),
    ): boolean {
      return saveOrgTx(id, data, now, true);
    },
    deleteDiscoveryOrg(id: string): boolean {
      return deleteOrgTx(id);
    },

    listVentureOpportunities(): StoredVentureOpportunity[] {
      return (listOppsStmt.all() as VentureOpportunityRow[]).map(fromOppRow);
    },
    createVentureOpportunity(
      id: string,
      data: VentureOpportunityPayload,
      now = new Date().toISOString(),
    ): StoredVentureOpportunity {
      insertOppStmt.run({
        id,
        ...data,
        hasPaidDemandEvidence: data.hasPaidDemandEvidence ? 1 : 0,
        createdAt: now,
        updatedAt: now,
      });
      return { id, ...data, createdAt: now, updatedAt: now };
    },
    updateVentureOpportunity(
      id: string,
      data: VentureOpportunityPayload,
      now = new Date().toISOString(),
    ): boolean {
      const res = updateOppStmt.run({
        id,
        ...data,
        hasPaidDemandEvidence: data.hasPaidDemandEvidence ? 1 : 0,
        updatedAt: now,
      });
      return res.changes === 1;
    },
    deleteVentureOpportunity(id: string): boolean {
      return deleteOppStmt.run(id).changes === 1;
    },

    listResearchNotes(): StoredResearchNote[] {
      return (listResearchStmt.all() as ResearchNoteRow[]).map(fromResearchRow);
    },
    listPublishedResearchNotes(): StoredResearchNote[] {
      return (listPublishedResearchStmt.all() as ResearchNoteRow[]).map(fromResearchRow);
    },
    createResearchNote(
      id: string,
      data: ResearchNotePayload,
      now = new Date().toISOString(),
    ): StoredResearchNote {
      insertResearchStmt.run({
        id,
        title: data.title,
        category: data.category,
        publishedLabel: data.publishedLabel,
        readTime: data.readTime,
        summary: data.summary,
        sectors: data.sectors,
        findingsJson: JSON.stringify(data.findings),
        body: data.body,
        published: data.published ? 1 : 0,
        createdAt: now,
        updatedAt: now,
      });
      return { id, ...data, createdAt: now, updatedAt: now };
    },
    updateResearchNote(
      id: string,
      data: ResearchNotePayload,
      now = new Date().toISOString(),
    ): boolean {
      const res = updateResearchStmt.run({
        id,
        title: data.title,
        category: data.category,
        publishedLabel: data.publishedLabel,
        readTime: data.readTime,
        summary: data.summary,
        sectors: data.sectors,
        findingsJson: JSON.stringify(data.findings),
        body: data.body,
        published: data.published ? 1 : 0,
        updatedAt: now,
      });
      return res.changes === 1;
    },
    deleteResearchNote(id: string): boolean {
      return deleteResearchStmt.run(id).changes === 1;
    },

    close() {
      db.close();
    },
  };
}
