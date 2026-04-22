# Card Vault — Architecture Guardrails

## Overview
- Internal Raycast extension with optional Cloudflare Worker backend for derived summaries.
- Sensitive card data remains local; worker stores non-sensitive summaries and history.
- Configuration is preference-driven (`Worker Base URL`) and IP-restricted on the worker.

## Resource Map
- Worker: `name = card-vault-summary-api` (`cloudflare/wrangler.toml`).
- D1: binding `DB` → database `card_vault` (`database_id` configured).
- KV: binding `CACHE` → existing namespace id `d5aa9b42b2f948bfa59143d5a56ea58b`.
- R2: binding `ARCHIVE` → bucket `card-vault-exports`.
- Vars: `ALLOWED_IPS` (comma-separated IPv4 list) for IP allowlist.

## Data Contracts
- Summary (D1 `summaries`): `card_alias`, `bank`, `last4`, `balance`, `credit_limit`, `utilization`, `currency`, `updated_at`.
- History (D1 `history`): `id`, `card_alias`, `balance`, `credit_limit`, `utilization`, `currency`, `updated_at`.
- Client payload (Raycast → Worker upsert):
  - `card_alias` = `${bank}:${last4}`.
  - `credit_limit` maps to worker `credit_limit` column.
  - `balance` and `utilization` computed client-side.

## Endpoints
- `POST /v1/summary/upsert` — Upsert summary; append history; invalidate KV `summary:all`.
- `GET /v1/summary` — Return summaries (reads KV `summary:all`, 60s TTL, hydrates from D1 if missing).
- `GET /v1/summary/export` — Return summaries; if `ARCHIVE` bound, write JSON object to R2.

## Client Integration
- Preference: `Worker Base URL` in Raycast manifest; code reads via `getPreferenceValues()`.
- Actions: “Sync from Cloudflare” merges remote summaries into local storage.
- Forms: Quick and Bulk balance updates send best-effort upserts to the worker.

## Migrations & Schema
- File: `cloudflare/migrations/0001_init.sql` defines `summaries` and `history`. Reserved keyword `limit` avoided by `credit_limit`.
- Indexes: `idx_summaries_bank_last4`, `idx_summaries_updated`, `idx_history_alias_time`.

## Deployment & Scripts
- `npm run cf:dev` — local worker.
- `npm run cf:deploy` — deploy worker.
- `npm run cf:migrate` — remote D1 migrations.
- `npm run cf:migrate:local` — local D1 migrations.
- `npm run cf:tail` — worker logs.

## Configuration
- Set `Worker Base URL` preference to workers.dev or custom domain route.
- Set `ALLOWED_IPS` in `wrangler.toml` or via environment before deploy.

## Security Guardrails
- No authentication; strictly internal use. IP allowlist enforced server-side.
- Do not send PAN/CVV or full card numbers; only `bank` and `last4` are transmitted.
- Raycast stores only non-secrets in preferences; avoid CLI tokens in extension runtime.
 - PCI DSS alignment: CVV is never persisted in local storage or backups; PAN is encrypted-at-rest using per-installation key.
 - Audit logging: all mutating operations (add/edit/remove/import/bulk/compute) append an audit event with timestamp and limited, non-sensitive details.
 - Concurrency safety: a short-lived lock prevents simultaneous writes; failed mutations automatically rollback via backup restore.

## Operational Guardrails
- KV caching: keep TTLs short (60s) and invalidate on writes.
- D1 migrations: never use reserved keywords; prefer explicit column names.
- R2 archives optional; ensure bucket exists and binding is configured.

## Testing & Validation
- Build command validates TypeScript and manifest (`npm run build`).
- Unit tests cover expiry and utilization logic.
- Manual validation: run `cf:dev`, test endpoints; apply migrations; deploy.

## Known Limitations
- workers.dev subdomain not discoverable via CLI pre-deploy; set URL via preferences.
- No durable rate limiting or auth; acceptable for internal restricted networks only.

## Change Management
- Update this doc when bindings, endpoints, or schemas change.
- Record operational decisions in `memory.md`; mark tasks in `todo.md`.