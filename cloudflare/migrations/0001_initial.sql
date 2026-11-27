PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS inquiries (
  id TEXT PRIMARY KEY NOT NULL,
  lane TEXT NOT NULL CHECK (lane IN ('founder', 'training', 'partner')),
  sub_track TEXT NOT NULL,
  full_name TEXT NOT NULL CHECK (length(full_name) BETWEEN 1 AND 120),
  company TEXT NOT NULL CHECK (length(company) <= 140),
  email TEXT NOT NULL CHECK (length(email) BETWEEN 3 AND 160),
  website TEXT NOT NULL DEFAULT '' CHECK (length(website) <= 300),
  team_size TEXT NOT NULL DEFAULT '' CHECK (team_size IN ('', '1-10 leaders', '11-30 leaders', '30+ leaders')),
  preferred_session TEXT NOT NULL DEFAULT '' CHECK (length(preferred_session) <= 140),
  message TEXT NOT NULL DEFAULT '' CHECK (length(message) <= 2000),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'scheduled', 'archived')),
  stage_tag TEXT NOT NULL DEFAULT '' CHECK (stage_tag IN ('', 'Concept', 'MVP', 'Revenue', 'Pilot Ready', 'Credit Pool', 'Cohort')),
  design_partner TEXT NOT NULL DEFAULT '' CHECK (length(design_partner) <= 140),
  notes TEXT NOT NULL DEFAULT '' CHECK (length(notes) <= 2000),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS inquiries_created_at_idx ON inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS inquiries_status_idx ON inquiries(status, created_at DESC);

CREATE TABLE IF NOT EXISTS rate_limits (
  key_hash TEXT NOT NULL,
  window_bucket INTEGER NOT NULL,
  request_count INTEGER NOT NULL CHECK (request_count > 0),
  PRIMARY KEY (key_hash, window_bucket)
);
