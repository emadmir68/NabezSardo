CREATE TABLE IF NOT EXISTS app_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_app_state_updated_at
ON app_state(updated_at);

CREATE TABLE IF NOT EXISTS media_meta (
  name TEXT PRIMARY KEY,
  content_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  chunk_count INTEGER NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS media_chunks (
  name TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  chunk_data TEXT NOT NULL,
  PRIMARY KEY(name, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_media_chunks_name
ON media_chunks(name);
