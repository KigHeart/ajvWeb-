import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import type { InquiryPayload } from "./validation";

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

type InquiryRow = {
  id: string; lane: StoredInquiry["lane"]; sub_track: string; full_name: string;
  company: string; email: string; website: string; team_size: string;
  preferred_session: string; message: string; status: InquiryStatus;
  stage_tag: string; design_partner: string; notes: string;
  created_at: string; updated_at: string;
};

function fromRow(row: InquiryRow): StoredInquiry {
  return {
    id: row.id, lane: row.lane, subTrack: row.sub_track, fullName: row.full_name,
    company: row.company, email: row.email, website: row.website, teamSize: row.team_size,
    preferredSession: row.preferred_session, message: row.message, status: row.status,
    stageTag: row.stage_tag, designPartner: row.design_partner, notes: row.notes,
    createdAt: row.created_at, updatedAt: row.updated_at,
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
  return {
    insertInquiry(record: StoredInquiry) {
      insert.run({
        id: record.id, lane: record.lane, subTrack: record.subTrack, fullName: record.fullName,
        company: record.company, email: record.email, website: record.website, teamSize: record.teamSize,
        preferredSession: record.preferredSession, message: record.message,
        createdAt: record.createdAt, updatedAt: record.updatedAt,
      });
    },
    listInquiries(): StoredInquiry[] { return (list.all() as InquiryRow[]).map(fromRow); },
    updateInquiryTriage(id: string, triage: InquiryTriage, updatedAt = new Date().toISOString()): boolean {
      const result = update.run({ id, ...triage, updatedAt });
      return result.changes === 1;
    },
    deleteInquiry(id: string): boolean { return remove.run(id).changes === 1; },
    close() { db.close(); },
  };
}

export type InquiryDatabase = ReturnType<typeof openDatabase>;
