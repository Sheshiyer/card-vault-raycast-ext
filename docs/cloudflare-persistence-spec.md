# Cloudflare Summary Persistence — Technical Specification

## Goals
- Persist ONLY derived card summaries for shared visibility (no PAN/CVV).
- Provide append-only history for auditability and trend analysis.
- Ensure strong consistency on writes, fast global reads, and low ops overhead.

## Data Model
- Summary fields per card-alias:
  - `card_alias` (TEXT, primary key): HMAC-SHA256 of local `card.id` using shared secret; non-reversible.
  - `bank_name` (TEXT, optional, if not sensitive)
  - `total_limit` (REAL)
  - `outstanding_balance` (REAL) — `currentBalance + pendingBalance`
  - `available_credit` (REAL) — `max(0, total_limit - outstanding_balance)`
  - `utilization_pct` (REAL) — result of `calculateUtilization(total_limit, outstanding_balance)` (two-decimal, clamped 0–100)
  - `payment_due_amount` (REAL)
  - `payment_due_date` (TEXT ISO-8601)
  - `last_updated` (TEXT ISO-8601)

- History snapshots (append-only):
  - `id` (INTEGER, auto)
  - `card_alias` (TEXT)
  - `outstanding_balance` (REAL)
  - `available_credit` (REAL)
  - `utilization_pct` (REAL)
  - `payment_due_amount` (REAL)
  - `timestamp` (TEXT ISO-8601)

## Database: Cloudflare D1 (SQLite)
```sql
-- summaries table
CREATE TABLE IF NOT EXISTS summaries (
  card_alias TEXT PRIMARY KEY,
  bank_name TEXT,
  total_limit REAL NOT NULL,
  outstanding_balance REAL NOT NULL,
  available_credit REAL NOT NULL,
  utilization_pct REAL NOT NULL,
  payment_due_amount REAL DEFAULT 0,
  payment_due_date TEXT,
  last_updated TEXT NOT NULL
);

-- history table
CREATE TABLE IF NOT EXISTS history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_alias TEXT NOT NULL,
  outstanding_balance REAL NOT NULL,
  available_credit REAL NOT NULL,
  utilization_pct REAL NOT NULL,
  payment_due_amount REAL DEFAULT 0,
  timestamp TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_history_alias_ts ON history(card_alias, timestamp);
```

## API Endpoints (Workers — Internal, No Authentication)
- `POST /v1/summary/upsert`
  - No user authentication; access restricted via IP allowlist and private network.
  - Body (JSON): `{ card_alias, bank_name?, total_limit, outstanding_balance, available_credit, utilization_pct, payment_due_amount?, payment_due_date?, last_updated }`
  - Behavior:
    - Validate types and bounds (no negatives; utilization 0–100).
    - `UPSERT` into `summaries`.
    - `INSERT` snapshot into `history` with `timestamp = last_updated` (or now if absent).
    - Invalidate/refresh KV cache keys: `summary:all`, `summary:card:${card_alias}`.
  - Responses: `200 OK` `{ ok: true }`; `400` on validation errors.

- `GET /v1/summary`
  - No user authentication; access restricted via IP allowlist and private network.
  - Behavior: Return aggregated totals and per-card summaries.
  - Caching: Read from KV `summary:all` if fresh (<60s); otherwise hydrate from D1 and write-through.

- `GET /v1/summary/export`
  - No user authentication; access restricted via IP allowlist and private network.
  - Behavior: Stream JSON `{ summaries, history }` and write a dated object to R2 bucket `exports/card-vault/YYYY-MM-DD.json`.

## Security (Internal-Only)
- Card data never sent: Only derived fields listed above.
- `card_alias`: `HMAC_SHA256(secret, localCardId)`; store alias only.
- No user authentication; enforce IP allowlist and private network scope for endpoints.
- CSRF: Not applicable unless adding a browser UI.
- Rate limiting: token bucket per IP using Durable Objects (or KV counters). Enforce limits (e.g., 60 writes/min, 600 reads/min).
- Console warnings: The client should log that authentication is disabled.

## KV Cache
- Keys:
  - `summary:all` — JSON of all summaries + aggregates; TTL ~60s.
  - `summary:card:${card_alias}` — per-card cached JSON; TTL ~300s.
- Invalidate on upsert; refresh on reads with stale TTL.

## R2 Archives (optional)
- Bucket `card-vault-exports`.
- Nightly Worker cron writes `{ summaries, history since last }` to `exports/card-vault/YYYY-MM-DD.json`.

## Wrangler Configuration
```toml
name = "card-vault-summary-api"
main = "src/worker/index.ts"
compatibility_date = "2024-11-01"

[vars]
CARD_ALIAS_SECRET = "" # set via wrangler secret

[durable_objects]
bindings = [
  { name = "RATE_LIMITER", class_name = "RateLimiter" }
]

[[kv_namespaces]]
binding = "CACHE"
id = "<kv_namespace_id>"

[[d1_databases]]
binding = "DB"
database_name = "card_vault"
database_id = "<d1_db_id>"

[[r2_buckets]]
binding = "ARCHIVE"
bucket_name = "card-vault-exports"

[[queues.producers]]
binding = "EVENTS"
queue = "card-vault-events"

[[triggers.crons]]
crons = ["0 2 * * *"] # nightly export at 02:00 UTC
```

## Worker Implementation Outline (TypeScript)
- `RateLimiter` Durable Object: per-client counters; token bucket refill per minute.
- `index.ts`:
  - Middleware: auth verification (HMAC/JWT), rate limiting, JSON parsing, validation.
  - Handlers: `upsertSummary`, `getSummaries`, `exportSummaries` implementing D1 queries, KV cache usage, and R2 writes.

## Client Integration (Raycast Extension)
- Compute derived fields locally post-update (we already do in `utils.ts`).
- Hash `card.id` → `card_alias` using shared secret stored locally.
- Send `POST /v1/summary/upsert` (without user auth) only from trusted network contexts; optional IP checks server-side.
- Add a “Share Summary” action: opens internal viewer URL restricted by network/IP rules.

## Non-Functional Requirements
- Latency: sub-500ms for reads (KV cached) and writes (D1 + minimal work).
- Observability: log structured events (`EVENTS` queue) for upserts/exports.
- Backups: R2 nightly archives; D1 backups via dashboard as needed.

## Testing Strategy
- Unit: auth HMAC/JWT, validation schema, rate limiter logic.
- Integration: D1 migrations, upsert/read/export flows, KV cache invalidation.
- Load: read-heavy scenarios with cache hits/misses; write bursts within rate limits.

## Migration & Deployment
- `wrangler d1 execute` to apply schema.
- Store secrets: `wrangler secret put CARD_ALIAS_SECRET`.
- Deploy: `wrangler deploy` with appropriate bindings.