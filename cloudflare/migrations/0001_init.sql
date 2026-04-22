-- D1 (SQLite) initial schema for card vault summaries
CREATE TABLE IF NOT EXISTS summaries (
  card_alias TEXT PRIMARY KEY,
  bank TEXT NOT NULL,
  last4 TEXT NOT NULL,
  balance REAL NOT NULL,
  credit_limit REAL NOT NULL,
  utilization REAL NOT NULL,
  currency TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_summaries_bank_last4 ON summaries (bank, last4);
CREATE INDEX IF NOT EXISTS idx_summaries_updated ON summaries (updated_at);

CREATE TABLE IF NOT EXISTS history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_alias TEXT NOT NULL,
  balance REAL NOT NULL,
  credit_limit REAL NOT NULL,
  utilization REAL NOT NULL,
  currency TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_history_alias_time ON history (card_alias, updated_at);