import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import type { InquiryPayload } from "./validation";

export type StoredInquiry = InquiryPayload & {
  id: string; status: "new" | "reviewing" | "scheduled" | "archived";
  stageTag: string; designPartner: string; notes: string; createdAt: string; updatedAt: string;
};
export type DeskKind = "venture" | "opportunity" | "task" | "evidence" | "organisation";
export type DeskItem = {
  id: string; kind: DeskKind; title: string; organisation: string; venture: string;
  status: string; owner: string; priority: string; score: number | null; value: number | null;
  dueDate: string; description: string; data: Record<string, unknown>;
  createdAt: string; updatedAt: string;
};
type DeskInput = Partial<Omit<DeskItem, "id" | "createdAt" | "updatedAt" | "data">> & {
  title?: string; data?: Record<string, unknown>;
};

export function openDatabase(filename: string) {
  fs.mkdirSync(path.dirname(path.resolve(filename)), { recursive: true });
  const db = new Database(filename);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE IF NOT EXISTS inquiries (
      id TEXT PRIMARY KEY NOT NULL, lane TEXT NOT NULL CHECK (lane IN ('founder','training','partner')),
      sub_track TEXT NOT NULL, full_name TEXT NOT NULL CHECK (length(full_name) BETWEEN 1 AND 120),
      company TEXT NOT NULL CHECK (length(company) <= 140), email TEXT NOT NULL CHECK (length(email) BETWEEN 3 AND 160),
      website TEXT NOT NULL DEFAULT '' CHECK (length(website) <= 300),
      team_size TEXT NOT NULL DEFAULT '' CHECK (team_size IN ('','1-10 leaders','11-30 leaders','30+ leaders')),
      preferred_session TEXT NOT NULL DEFAULT '' CHECK (length(preferred_session) <= 140),
      message TEXT NOT NULL DEFAULT '' CHECK (length(message) <= 2000),
      status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','reviewing','scheduled','archived')),
      stage_tag TEXT NOT NULL DEFAULT '', design_partner TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS inquiries_created_at_idx ON inquiries(created_at DESC);
    CREATE INDEX IF NOT EXISTS inquiries_status_idx ON inquiries(status, created_at DESC);
    CREATE TABLE IF NOT EXISTS venture_desk_items (
      id TEXT PRIMARY KEY NOT NULL,
      kind TEXT NOT NULL CHECK (kind IN ('venture','opportunity','task','evidence','organisation')),
      title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 180),
      organisation TEXT NOT NULL DEFAULT '', venture TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'active', owner TEXT NOT NULL DEFAULT '',
      priority TEXT NOT NULL DEFAULT 'normal', score REAL, value REAL,
      due_date TEXT NOT NULL DEFAULT '', description TEXT NOT NULL DEFAULT '',
      data_json TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS desk_kind_updated_idx ON venture_desk_items(kind, updated_at DESC);
    CREATE INDEX IF NOT EXISTS desk_status_idx ON venture_desk_items(status, kind);
  `);
  const insert = db.prepare(`
    INSERT INTO inquiries
      (id,lane,sub_track,full_name,company,email,website,team_size,preferred_session,message,created_at,updated_at)
    VALUES (@id,@lane,@subTrack,@fullName,@company,@email,@website,@teamSize,@preferredSession,@message,@createdAt,@updatedAt)
  `);
  const insertDesk = db.prepare(`
    INSERT INTO venture_desk_items
      (id,kind,title,organisation,venture,status,owner,priority,score,value,due_date,description,data_json,created_at,updated_at)
    VALUES (@id,@kind,@title,@organisation,@venture,@status,@owner,@priority,@score,@value,@dueDate,@description,@dataJson,@createdAt,@updatedAt)
  `);
  const selectDesk = db.prepare(`SELECT id,kind,title,organisation,venture,status,owner,priority,score,value,due_date AS dueDate,description,data_json AS dataJson,created_at AS createdAt,updated_at AS updatedAt FROM venture_desk_items ORDER BY updated_at DESC`);
  const mapDesk = (row: any): DeskItem => ({
    id: row.id, kind: row.kind, title: row.title, organisation: row.organisation, venture: row.venture,
    status: row.status, owner: row.owner, priority: row.priority, score: row.score, value: row.value,
    dueDate: row.dueDate, description: row.description, data: JSON.parse(row.dataJson || "{}"),
    createdAt: row.createdAt, updatedAt: row.updatedAt,
  });
  const seed = db.prepare("SELECT COUNT(*) AS count FROM venture_desk_items").get() as { count: number };
  if (seed.count === 0) {
    const now = new Date().toISOString();
    const starter = [
      ["venture","Ajentir Ventures","Parent / venture studio","active","Venture investment, incubation and portfolio operations."],
      ["venture","Tilil Engineering Group","Engineering venture","active","Systems engineering and deep-tech development."],
      ["venture","qØnza Enterprise","Quantum and agentic AI","active","Specialised agentic AI systems for quantum systems design and engineering."],
      ["venture","elDeer Data Group","Data and scientific systems","active","Scientific and technical data systems."],
    ] as const;
    for (const [kind,title,organisation,status,description] of starter) insertDesk.run({
      id: crypto.randomUUID(),kind,title,organisation,venture:"",status,owner:"",priority:"normal",
      score:null,value:null,dueDate:"",description,dataJson:"{}",createdAt:now,updatedAt:now,
    });
  }
  return {
    insertInquiry(record: StoredInquiry) { insert.run({
      id: record.id, lane: record.lane, subTrack: record.subTrack, fullName: record.fullName,
      company: record.company, email: record.email, website: record.website, teamSize: record.teamSize,
      preferredSession: record.preferredSession, message: record.message, createdAt: record.createdAt, updatedAt: record.updatedAt,
    }); },
    listDeskItems(kind?: DeskKind) {
      const rows = kind ? db.prepare("SELECT id,kind,title,organisation,venture,status,owner,priority,score,value,due_date AS dueDate,description,data_json AS dataJson,created_at AS createdAt,updated_at AS updatedAt FROM venture_desk_items WHERE kind=? ORDER BY updated_at DESC").all(kind) : selectDesk.all();
      return rows.map(mapDesk);
    },
    createDeskItem(item: DeskItem) { insertDesk.run({
      id:item.id,kind:item.kind,title:item.title,organisation:item.organisation,venture:item.venture,status:item.status,
      owner:item.owner,priority:item.priority,score:item.score,value:item.value,dueDate:item.dueDate,
      description:item.description,dataJson:JSON.stringify(item.data),createdAt:item.createdAt,updatedAt:item.updatedAt,
    }); return item; },
    updateDeskItem(id: string, patch: DeskInput, updatedAt: string) {
      const current = db.prepare("SELECT id,kind,title,organisation,venture,status,owner,priority,score,value,due_date AS dueDate,description,data_json AS dataJson,created_at AS createdAt,updated_at AS updatedAt FROM venture_desk_items WHERE id=?").get(id);
      if (!current) return null;
      const item = mapDesk(current);
      const next = { ...item, ...patch, data: patch.data ? { ...item.data, ...patch.data } : item.data, id, createdAt:item.createdAt, updatedAt };
      db.prepare(`UPDATE venture_desk_items SET title=@title,organisation=@organisation,venture=@venture,status=@status,owner=@owner,priority=@priority,score=@score,value=@value,due_date=@dueDate,description=@description,data_json=@dataJson,updated_at=@updatedAt WHERE id=@id`).run({
        ...next,dataJson:JSON.stringify(next.data),
      });
      return next;
    },
    deleteDeskItem(id: string) { return db.prepare("DELETE FROM venture_desk_items WHERE id=?").run(id).changes > 0; },
    close() { db.close(); },
  };
}
