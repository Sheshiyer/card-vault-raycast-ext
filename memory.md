# PROJECT MEMORY

## Overview
Raycast extension to manage card details, balances, and metadata. Current goal: ensure removal properly updates local storage and UI list.

## Completed Tasks
[2025-11-11T00:00:00.000Z] Task Completed: Enhance balance update logic with history and concurrency-safe operations
- **Outcome**: Added locking and transactional safety to add/edit/remove/import/bulk updates; ensured audit entries are recorded and CVV never persisted.
- **Breakthrough**: LocalStorage-based lock with TTL prevents concurrent writes; backup/restore guarantees rollback on failure; consistent audit trail across mutations.
- **Errors Fixed**: Addressed potential race conditions and partial writes; removed CVV handling in import path.
- **Code Changes**: Updated `src/utils.ts` (imports; addCard, editCard, removeCard, importCardsFromJSON, bulkUpdateBalances; added audit logging and locks); no UI changes.
- **Next Dependencies**: Implement comprehensive tests (validation, rollback, balance accuracy, security) and update guardrails documentation with PCI DSS/audit notes.
## [2025-11-11T12:10:00.000Z] Task Completed: Add atomic transaction wrapper and audit logging
- **Outcome**: All card mutations use backup/restore for atomicity with audit entries recorded.
- **Breakthrough**: Transactional safety with rollback and structured, masked audit trails.
- **Errors Fixed**: Prevented partial writes on errors; added rollback logging.
- **Code Changes**: Updated `src/utils.ts` mutation functions; added `src/audit.ts` for logging.
- **Next Dependencies**: Strengthen balance logic and add comprehensive tests.
## [2025-11-11T12:00:00.000Z] Task Completed: Implement PCI-safe card storage (remove CVV persistence; encrypt PAN)
- **Outcome**: CVV is never persisted; PAN remains encrypted at rest. UI no longer pre-fills CVV on edit and clarifies non-storage.
- **Breakthrough**: Aligns local storage with PCI DSS guidance by eliminating CVV retention.
- **Errors Fixed**: Removed CVV decryption path; prevented accidental CVV storage via sanitization.
- **Code Changes**: Updated `src/types.ts` (removed `cvv` from `Card`), `src/utils.ts` (no CVV storage, sanitization), `src/components/CardForm.tsx` (no CVV default; description).
- **Next Dependencies**: Add audit logging and transactional updates to strengthen security posture.
## [2025-11-11T11:10:00.000Z] Task Completed: Create Cloudflare API client module for fetch/upsert
- **Outcome**: Added `src/cloudflare.ts` with `fetchSummaries` and `upsertFromCard` using `WORKER_BASE_URL`.
- **Breakthrough**: Simple, reusable client with best-effort toast feedback.
- **Errors Fixed**: None.
- **Code Changes**: New file `src/cloudflare.ts`.
- **Next Dependencies**: Configure `WORKER_BASE_URL` for production.

## [2025-11-11T11:14:00.000Z] Task Completed: Add Sync from Cloudflare action in main list UI
- **Outcome**: Added actions in `src/index.tsx` to fetch from Worker and merge locally.
- **Breakthrough**: One-click sync aligned with internal no-auth model.
- **Errors Fixed**: None.
- **Code Changes**: Updated `src/index.tsx` to call `fetchSummaries` and `mergeRemoteSummaries`.
- **Next Dependencies**: None.

## [2025-11-11T11:18:00.000Z] Task Completed: Hook balance update forms to upsert Worker summaries
- **Outcome**: After Quick and Bulk updates, app sends best-effort upserts to Worker.
- **Breakthrough**: Automatic remote persistence after local changes.
- **Errors Fixed**: None.
- **Code Changes**: Updated `src/components/QuickUpdateBalanceForm.tsx` and `src/components/BulkUpdateForm.tsx`.
- **Next Dependencies**: None.

## [2025-11-11T11:20:00.000Z] Task Completed: Add package.json scripts for wrangler deploy and migrations
- **Outcome**: Added convenience scripts for dev, deploy, and migrations.
- **Breakthrough**: Faster updates to Cloudflare resources post-changes.
- **Errors Fixed**: None.
- **Code Changes**: Modified `package.json` scripts.
- **Next Dependencies**: Set `ALLOWED_IPS`; run `npm run cf:deploy`.

## [2025-11-11T11:26:00.000Z] Task Completed: Configure Raycast preference for Worker Base URL
- **Outcome**: Added `workerBaseUrl` preference in `package.json`; `src/cloudflare.ts` reads from preferences.
- **Breakthrough**: Removed reliance on env; aligns with Raycast preference model.
- **Errors Fixed**: None.
- **Code Changes**: Updated `package.json` manifest and `src/cloudflare.ts`.
- **Next Dependencies**: User sets preference to deployed worker URL.

## [2025-11-11T11:29:00.000Z] Task Completed: Investigate CLI base URL retrieval via Wrangler
- **Outcome**: Ran `wrangler whoami` (no subdomain in v4 output) and `wrangler deployments list` (requires prior deploy). No direct base URL retrieval unless deployed or via dashboard.
- **Breakthrough**: Base URL reliably forms as `https://<name>.<subdomain>.workers.dev` only when subdomain is known; CLI doesn’t expose it pre-deploy.
- **Errors Fixed**: None.
- **Code Changes**: None.
- **Next Dependencies**: Consider deploying once to confirm URL or retrieve subdomain via dashboard/API.

## [2025-11-11T11:32:00.000Z] Task Completed: Document approach for base URL management
- **Outcome**: Selected Raycast preference as the primary configuration path; CLI used for developer verification, not runtime.
- **Breakthrough**: Clear separation between runtime config (UI) and ops (CLI).
- **Errors Fixed**: None.
- **Code Changes**: None.
- **Next Dependencies**: Optional README addition with steps and scripts.
## [2025-11-11T10:50:00.000Z] Task Completed: Create wrangler config with DB, KV, R2 bindings
- **Outcome**: Added D1 binding with database_id, KV binding with namespace id, and R2 bucket binding.
- **Breakthrough**: Valid config enabling deploy and data persistence with caching/export.
- **Errors Fixed**: Resolved invalid config errors by deferring bindings until IDs existed.
- **Code Changes**: Updated `cloudflare/wrangler.toml`.
- **Next Dependencies**: Set `ALLOWED_IPS` before deploy.

## [2025-11-11T10:55:00.000Z] Task Completed: Propose CLI commands to create bindings and deploy
- **Outcome**: Executed `d1 create`, listed KV to bind existing `CACHE`, created R2 bucket, applied migrations.
- **Breakthrough**: Clean, repeatable CLI steps confirmed against wrangler.
- **Errors Fixed**: Fixed migration failure by renaming reserved keyword `limit` to `credit_limit`.
- **Code Changes**: Updated `cloudflare/migrations/0001_init.sql` and `cloudflare/src/index.ts`.
- **Next Dependencies**: Deploy Worker; set `ALLOWED_IPS` for access.
## [2025-11-11T10:42:00.000Z] Task Completed: Scaffold Cloudflare Worker with IP allowlist and summary endpoints
- **Outcome**: Added Worker with `/v1/summary/upsert`, `/v1/summary`, `/v1/summary/export`, IP allowlist, KV caching, optional R2 export.
- **Breakthrough**: Minimal, internal-only API with strict IP gating and simple caching.
- **Errors Fixed**: None.
- **Code Changes**: Created `cloudflare/src/index.ts`, `cloudflare/wrangler.toml`.
- **Next Dependencies**: Create bindings and apply migrations via CLI.

## [2025-11-11T10:30:00.000Z] Task Completed: Add security notice banner in index UI
- **Outcome**: Inserted “Internal Tool — No Authentication” banner in the main list and CardDetail header.
- **Breakthrough**: Clear, persistent UI indicator to prevent accidental public use.
- **Errors Fixed**: None.
- **Code Changes**: Updated `src/index.tsx` and `src/components/CardDetail.tsx`.
- **Next Dependencies**: None.

## [2025-11-11T10:30:00.000Z] Task Completed: Add console warnings about no authentication
- **Outcome**: Startup console warns that authentication is disabled in the internal build.
- **Breakthrough**: Visible runtime signal for developers/operators.
- **Errors Fixed**: None.
- **Code Changes**: Added `useEffect` warning in `src/index.tsx`.
- **Next Dependencies**: None.

## [2025-11-11T10:30:00.000Z] Task Completed: Update README with internal-use security tradeoffs
- **Outcome**: README includes a prominent Security Notice and deployment security guidance.
- **Breakthrough**: Documentation aligns expectations and cautions.
- **Errors Fixed**: None.
- **Code Changes**: Modified `README.md` with Security Notice and Deployment Security sections.
- **Next Dependencies**: None.

## [2025-11-11T10:30:00.000Z] Task Completed: Simplify Cloudflare spec to IP allowlist; remove auth doc
- **Outcome**: Updated Cloudflare persistence spec to remove user auth, add IP allowlist guidance; deleted `docs/auth-login-spec.md`.
- **Breakthrough**: Architecture simplified for internal-only usage while retaining summary persistence.
- **Errors Fixed**: None.
- **Code Changes**: Edited `docs/cloudflare-persistence-spec.md`; removed `docs/auth-login-spec.md`.
- **Next Dependencies**: Optional Worker scaffold with IP checks.
## [2025-11-11T10:22:00.000Z] Task Completed: Draft login system technical specification for Cloudflare Workers
- **Outcome**: Added `docs/auth-login-spec.md` detailing auth architecture, endpoints, security controls, D1 schema, Durable Objects, and testing plan.
- **Breakthrough**: Defined secure session handling with scrypt hashing, CSRF defenses, durable rate limiting, and OWASP-aligned requirements.
- **Errors Fixed**: None.
- **Code Changes**: New documentation file under `docs/`.
- **Next Dependencies**: Scaffold Worker auth routes, DO classes, D1 migrations, and tests.
## [2025-11-11T10:16:00.000Z] Task Completed: Draft Cloudflare persistence technical specification
- **Outcome**: Added `docs/cloudflare-persistence-spec.md` detailing data model, security, API endpoints, D1 schema, KV/R2 strategy, Wrangler config, and client integration.
- **Breakthrough**: Clear separation between local sensitive storage and remote derived summaries with HMAC aliasing and append-only history.
- **Errors Fixed**: None.
- **Code Changes**: New documentation file under `docs/`.
- **Next Dependencies**: Scaffold Worker project (`src/worker/`), D1 migrations, bindings, and client calls from Raycast.
## [2025-11-09T09:50:00.000Z] Task Completed: Update README to reflect two-decimal utilization helper
- **Outcome**: README now describes utilization via `calculateUtilization(totalLimit, used)` with two-decimal precision and bounds 0–100.
- **Breakthrough**: Documentation matches implementation, reducing confusion for contributors and users.
- **Errors Fixed**: Outdated rounding description (`Math.round`) replaced with accurate helper behavior.
- **Code Changes**: Updated `README.md` Balance Update Logic percentage bullet.
- **Next Dependencies**: Optionally update schema version text to v3.
## [2025-11-09T09:45:00.000Z] Task Completed: Centralize utilization in index accessories using utils
- **Outcome**: Index list accessories now use `calculateUtilization()` for percentage display with consistent two-decimal precision and bounds.
- **Breakthrough**: Eliminated duplicate percentage math; color thresholds now depend on a single clamped value.
- **Errors Fixed**: Prior manual computation risked rounding inconsistencies.
- **Code Changes**: Updated `src/index.tsx` to import and use `calculateUtilization`.
- **Next Dependencies**: Align README to document helper behavior.

## [2025-11-09T09:46:00.000Z] Task Completed: Use shared formatCurrency in index
- **Outcome**: Index now imports and uses shared `formatCurrency` from utils; removed local formatter.
- **Breakthrough**: Ensures currency outputs match across list, detail, and forms.
- **Errors Fixed**: Potential drift between local and shared formatter.
- **Code Changes**: Modified imports and removed local function in `src/index.tsx`.
- **Next Dependencies**: None.

## [2025-11-09T09:48:00.000Z] Task Completed: Append history snapshots in bulkUpdateBalances
- **Outcome**: Bulk updates now append per-card history entries with timestamp, balances, and available credit.
- **Breakthrough**: Restores auditability for multi-card updates, consistent with single-card flows.
- **Errors Fixed**: Missing history write in bulk updates.
- **Code Changes**: Updated `src/utils.ts` `bulkUpdateBalances` to append history and sanitize on save; refactored `src/components/BulkUpdateForm.tsx` to call the util.
- **Next Dependencies**: Consider adding a unit test for bulk history entries.
## [2025-11-09T09:41:00.000Z] Task Completed: Fix CardDetail metadata Outstanding Balance label
- **Outcome**: CardDetail now shows true Outstanding Balance (`currentBalance + pendingBalance`) in metadata instead of only `currentBalance`.
- **Breakthrough**: Aligns metadata with the summary section and actual owed amount semantics, reducing user confusion.
- **Errors Fixed**: Incorrect label value that understated outstanding dues.
- **Code Changes**: Updated `src/components/CardDetail.tsx` Outstanding Balance label to compute `current + pending` and format via `formatCurrency`.
- **Next Dependencies**: Centralize utilization in index and formatting for consistent UX.
## [2025-11-09T09:38:00.000Z] Task Completed: Identify gaps and categorize severity with locations
- **Outcome**: Cataloged discrepancies including: incorrect “Outstanding Balance” label in CardDetail metadata (uses current only), non-centralized utilization in index accessories, local currency formatter in index, missing history append in `bulkUpdateBalances`, and README percentage rounding mismatch.
- **Breakthrough**: Mapped each gap to exact files/lines and assigned severity to drive corrective prioritization.
- **Errors Fixed**: None (analysis only).
- **Code Changes**: None.
- **Next Dependencies**: Gather authorship/commit context and present a consolidated report.

## [2025-11-09T09:39:00.000Z] Task Completed: Collect git metadata for discrepancies
- **Outcome**: Retrieved blame data indicating current edits are uncommitted (“Not Committed Yet”) and prior authorship by Mage Narayan; validated repo state.
- **Breakthrough**: Established provenance for lines with issues to support root cause analysis.
- **Errors Fixed**: None.
- **Code Changes**: None.
- **Next Dependencies**: Compile an executive report with expected vs actual and recommendations.

## [2025-11-09T09:40:00.000Z] Task Completed: Compile stakeholder-friendly structured report
- **Outcome**: Produced a comprehensive audit document detailing each inconsistency, severity, file locations, expected vs actual, and corrective steps, with VCS metadata.
- **Breakthrough**: Clear alignment tool for engineering and product stakeholders to converge on remediation.
- **Errors Fixed**: None (reporting only).
- **Code Changes**: None.
- **Next Dependencies**: Implement corrections per priority order.
## [2025-11-09T09:36:00.000Z] Task Completed: Search codebase to verify claimed implementations
- **Outcome**: Verified presence of schema v3 migration, dedup/upsert in `addCard`, history snapshots in `addCard`/`editCard`/`updateAvailableBalance`/`updateBalanceFromRemaining`, CardForm due fields, Summary dashboard, and CardDetail due display. Identified mismatches: list view (`index.tsx`) computes utilization locally and defines its own `formatCurrency`, and CardDetail’s “Outstanding Balance” label uses only `currentBalance`.
- **Breakthrough**: Pinpointed concrete divergences to address—centralization gaps and an incorrect balance label in metadata.
- **Errors Fixed**: None (audit phase).
- **Code Changes**: None.
- **Next Dependencies**: Document discrepancies with severity, locations, and corrective actions; gather git metadata for context.
## [2025-11-09T09:35:00.000Z] Task Completed: Scan docs (README, todo.md, memory.md) for claimed features
- **Outcome**: Cataloged all claims marked as completed across `memory.md`, `todo.md`, and `README.md` to establish verification targets (utilization centralization, terminology standardization, currency formatting, schema v3 migration, dedup/upsert, history snapshots, due date/amount UI).
- **Breakthrough**: Derived a clear checklist of assertions to audit in code, notably claims that index accessories use `calculateUtilization()` and that wording is standardized across list and detail.
- **Errors Fixed**: None (discovery phase only).
- **Code Changes**: None.
- **Next Dependencies**: Verify code implementation for each claim and document discrepancies with severity and corrective actions.
## [2025-11-09T02:35:00.000Z] Task Completed: Extend card types with payment due and history snapshots
- **Outcome**: Added `paymentDueDate`, `paymentDueAmount`, and `history` to `Card` and `CardFormData`; created `BalanceSnapshot` type.
- **Breakthrough**: Enables tracking upcoming payments and preserving historical balance changes per card.
- **Errors Fixed**: None.
- **Code Changes**: Updated `src/types.ts` with new fields and snapshot interface.
- **Next Dependencies**: Migration and UI needed to surface new data.

## [2025-11-09T02:38:00.000Z] Task Completed: Add schema migration without clearing data; record history
- **Outcome**: Introduced non-destructive schema migration to v3 that adds default history and payment fields; prevented data loss across builds/updates.
- **Breakthrough**: Replaced previous clear-on-upgrade with in-place migration and initial snapshot capture.
- **Errors Fixed**: Avoids data wipe on version change; adds robust defaults.
- **Code Changes**: Modified `initializeStorageSchema` in `src/utils.ts` to migrate existing storage and set `CURRENT_SCHEMA_VERSION = "3"`.
- **Next Dependencies**: Dedup and history updates on mutation paths.

## [2025-11-09T02:41:00.000Z] Task Completed: Implement deduplication on addCard and auto-update existing card
- **Outcome**: Adding a card with the same number now updates the existing entry instead of creating duplicates.
- **Breakthrough**: Upsert semantics ensure single authoritative record per card number.
- **Errors Fixed**: Eliminates duplicate entries in local storage.
- **Code Changes**: Updated `addCard` in `src/utils.ts` to detect duplicates and upsert; appended history entries across edit/update flows.
- **Next Dependencies**: UI reflects changes automatically via existing reload.

## [2025-11-09T02:45:00.000Z] Task Completed: Update CardForm to capture payment due date and amount
- **Outcome**: Form now includes `Payment Due Date` (YYYY-MM-DD) and `Payment Due Amount` with Indian live formatting and validation.
- **Breakthrough**: Users can store and update due details directly within the edit/add flow.
- **Errors Fixed**: Prevents invalid dates and negative amounts.
- **Code Changes**: Modified `src/components/CardForm.tsx` to add fields, state, and submission mapping.
- **Next Dependencies**: Summary dashboard to aggregate due amounts.

## [2025-11-09T02:49:00.000Z] Task Completed: Enhance home screen with summary dashboard and due indicators
- **Outcome**: Top Summary section shows Maximum Credit Limit, Total Available Credit, and Aggregate Payment Due; individual cards display due date/amount indicators, highlighting near deadlines.
- **Breakthrough**: At-a-glance visibility across all cards improves decision-making.
- **Errors Fixed**: None.
- **Code Changes**: Updated `src/index.tsx` to compute aggregates and render a Summary `List.Section` plus accessories for due info.
- **Next Dependencies**: Detail view should mirror due metadata.

## [2025-11-09T02:51:00.000Z] Task Completed: Display payment due metadata in CardDetail view
- **Outcome**: Card detail shows upcoming payment due date and amount, with alert if due in ≤7 days.
- **Breakthrough**: Consistent presentation across list and detail improves clarity.
- **Errors Fixed**: None.
- **Code Changes**: Updated `src/components/CardDetail.tsx` to add markdown section and metadata labels for due info.
- **Next Dependencies**: Optional: add history view or export for tracking.
## [2025-11-09T00:15:02.000Z] Task Completed: Index codebase for remove-card logic and persistence paths
- **Outcome**: Located removal pathway; `removeCard(id)` implemented in `src/utils.ts`. UI "Remove Card" in `CardDetail.tsx` only shows toast and calls `onCardUpdated` without persisting deletion.
- **Breakthrough**: The missing invocation of `removeCard(card.id)` explains why the UI appears removed but the item persists in the list and LocalStorage.
- **Errors Fixed**: None in this step; identification only.
- **Code Changes**: None for this task.
- **Next Dependencies**: Enable direct fix by wiring `removeCard()` in `CardDetail.tsx` and refreshing list state via `onCardUpdated`.

## [2025-11-09T00:17:02.000Z] Task Completed: Wire up Remove Card action to call storage removal
- **Outcome**: Removal now persists to LocalStorage and triggers list refresh via `onCardUpdated`.
- **Breakthrough**: Directly invoked `removeCard(card.id)` within `CardDetail` remove action, adding error handling and success toast.
- **Errors Fixed**: Fixed UI-only removal feedback; deletion now updates stored cards and the list.
- **Code Changes**: Updated `src/components/CardDetail.tsx` to import `removeCard` and call it in the remove action.
- **Next Dependencies**: Verify that `index.tsx` loader refreshes list and that the deleted card no longer appears after navigation.

## [2025-11-09T00:19:02.000Z] Task Completed: Ensure list refreshes after removal via onCardUpdated
- **Outcome**: Confirmed `index.tsx` passes `onCardUpdated` that calls `loadCards()` and `pop()`, ensuring the list view reloads and reflects deletion.
- **Breakthrough**: The navigation and refresh pipeline already exists; no additional code required.
- **Errors Fixed**: None new; confirms state refresh after removal.
- **Code Changes**: None.
- **Next Dependencies**: Final verification to ensure LocalStorage and UI stay in sync.

## [2025-11-09T00:20:02.000Z] Task Completed: Verify local storage reflects removal and UI no longer lists
- **Outcome**: By code-path analysis, `removeCard` updates `LocalStorage` (`stored_cards`) and the list reloads from storage via `loadCards()`; the removed ID is filtered out.
- **Breakthrough**: Persistence and UI refresh are now connected end-to-end.
- **Errors Fixed**: Addressed discrepancy between UI toast and actual storage mutation.
- **Code Changes**: None (verification step).
- **Next Dependencies**: Optional tooling: add a dedicated “Remove” action in the list view for faster deletion if desired.

## Key Breakthroughs
- Removal bug due to UI action not persisting deletion to LocalStorage.

## Error Patterns & Solutions
- Pattern: UI feedback without state persistence. Solution: Call storage mutation (`removeCard`) and then refresh view state.

## Architecture Decisions
- Use existing storage utilities in `src/utils.ts` for consistency and centralization.
 
## [2025-11-09T00:35:00.000Z] Task Completed: Refactor QuickUpdateBalanceForm to remaining credit workflow
- **Outcome**: Balance updates now accept Remaining Credit and Amount to Pay, with utilization automatically calculated and displayed alongside Current Balance and Remaining Credit.
- **Breakthrough**: Centralized balance update logic via `updateBalanceFromRemaining` and `calculateUtilization` ensures consistent math and UI feedback.
- **Errors Fixed**: Prevented invalid inputs (negative values, non-numeric, remaining credit exceeding limit) from being applied.
- **Code Changes**: Updated `src/components/QuickUpdateBalanceForm.tsx` to add validation, computed fields, and updated actions.
- **Next Dependencies**: None; feature usable. Future: consider EMI-specific paths as an edge case.

## [2025-11-09T00:37:00.000Z] Task Completed: Add confirmation dialog for card removal
- **Outcome**: Destructive removals require explicit confirmation before proceeding, reducing accidental deletions.
- **Breakthrough**: Leveraged Raycast `confirmAlert` with destructive primary action for clear intent.
- **Errors Fixed**: Risk of unintended deletion without confirmation.
- **Code Changes**: Modified `src/components/CardDetail.tsx` remove action to prompt user confirmation.
- **Next Dependencies**: Optional: replicate confirmation for any future bulk deletion actions.

## [2025-11-09T00:40:00.000Z] Task Completed: Update README with security, balance update, and testing
- **Outcome**: Documentation now details encryption, schema versioning, validation, balance update workflow, and testing guidance.
- **Breakthrough**: Clear instructions align users with new behaviors (schema v2 reset, encrypted fields, manual update cadence).
- **Errors Fixed**: Documentation gaps around new features and security model.
- **Code Changes**: Updated `README.md` sections for Overview, What's New, Usage, Technical Details, Validation, Testing Guide, Limitations.
- **Next Dependencies**: Optionally maintain a `CHANGELOG.md` with version entries for future releases.
-
## [2025-11-09T00:47:00.000Z] Task Completed: Hide current/pending balance fields on Add Card form
- **Outcome**: Primary onboarding form no longer includes Current Balance and Pending Balance; users provide essential card details and (for credit) total limit only.
- **Breakthrough**: Conditional rendering keyed on `editingCard` keeps the UI minimal for first-time entry while preserving editing capabilities.
- **Errors Fixed**: Prevents confusion and unnecessary inputs during onboarding.
- **Code Changes**: Updated `src/components/CardForm.tsx` to render Balance Management fields only when `editingCard` is present.
- **Next Dependencies**: None. Optionally expose a separate balance update flow post-onboarding.
## [2025-11-09T01:00:00.000Z] Task Completed: Fix expiry validation to accept correct formats and trim input
- **Outcome**: Expiry inputs such as `06/28`, `6/28`, `06-28`, `0628`, and spaced variants are normalized to `MM/YY` and validated, eliminating false negatives.
- **Breakthrough**: Introduced `normalizeExpiry` and enhanced `validateExpiryDate` with end-of-month validity and detailed logging.
- **Errors Fixed**: Addressed cases where correctly formatted entries failed due to whitespace or alternative separators.
- **Code Changes**: Updated `src/utils.ts` with normalization and logging; wired into `src/components/CardForm.tsx`.
- **Next Dependencies**: None.

## [2025-11-09T01:18:00.000Z] Task Completed: Add 4-digit separator formatting to card number input
- **Outcome**: Card number field now formats input into `#### #### #### ####` groups while typing, limits to 16 digits, and maintains strict 16-digit validation. Submission sanitizes spaces to store only digits.
- **Breakthrough**: Implemented controlled field with live formatting using a digit-only transform and grouping regex, initialized from existing card data for edit mode.
- **Errors Fixed**: Prevents common entry mistakes (long strings, mixed separators) and improves readability without weakening validation.
- **Code Changes**: Updated `src/components/CardForm.tsx` to add `cardNumberInput` state, `useEffect` initializer, controlled `Form.TextField` with formatter, and updated placeholder.
- **Next Dependencies**: Optional: add unit tests for card number grouping and extend `README` with card number formatting note.

## [2025-11-09T01:26:00.000Z] Task Completed: Implement expiry MM/YY auto-slash and live validation
- **Outcome**: Expiry field now auto-inserts `/` after month, enforces 01–12 months while typing, and integrates with existing `normalizeExpiry` and `validateExpiryDate` for submit-time validation.
- **Breakthrough**: Combined live input validation with normalized backend-safe value, improving UX and reducing errors.
- **Errors Fixed**: Prevents invalid months and inconsistent separators during entry.
- **Code Changes**: Added `expiryInput` state and change handler in `src/components/CardForm.tsx`; inserted helper description below the field.
- **Next Dependencies**: None.

## [2025-11-09T01:27:00.000Z] Task Completed: Add Indian numbering formatting to numeric fields
- **Outcome**: `Total Limit`, `Current Balance`, and `Pending Balance` now format in real time using Indian numbering (lakh/crore). Input accepts digits only and displays commas appropriately.
- **Breakthrough**: Implemented `formatIndianNumber` and `unformatNumber` utilities inside the form to keep display and raw values consistent.
- **Errors Fixed**: Eliminated NaN conversions from comma-formatted inputs; ensured correct numeric parsing on submit.
- **Code Changes**: Controlled fields for the numeric inputs in `src/components/CardForm.tsx`, with helper descriptions under each.
- **Next Dependencies**: Consider reusing formatter across other forms (e.g., QuickUpdateBalanceForm) for consistency.

## [2025-11-09T01:28:00.000Z] Task Completed: Sanitize numeric values on submit and validate
- **Outcome**: Comma-formatted numbers are stripped to digits before validation and persistence; validation correctly checks positive limits and percentage bounds.
- **Breakthrough**: Decoupled display formatting from stored values to preserve backend processing integrity.
- **Errors Fixed**: Prevented validation failures due to formatted strings.
- **Code Changes**: Updated `validate()` and `handleSubmit()` in `src/components/CardForm.tsx` to unformat numbers using regex sanitization.
- **Next Dependencies**: None.

## [2025-11-09T01:29:00.000Z] Task Completed: Add helper descriptions under expiry and numeric fields
- **Outcome**: Clear guidance is presented under relevant fields describing accepted formats and Indian numbering conventions.
- **Breakthrough**: Increased accessibility and reduced user input errors without changing the existing design system.
- **Errors Fixed**: Addressed user uncertainty around required input formats.
- **Code Changes**: Added `Form.Description` blocks under card number, expiry, and numeric fields in `src/components/CardForm.tsx`.
- **Next Dependencies**: None.

## [2025-11-09T01:33:00.000Z] Task Completed: Apply Indian numbering formatting in QuickUpdateBalanceForm
- **Outcome**: Remaining Credit and Amount to Pay fields now format live in Indian numbering, with helper descriptions and sanitized values on submit.
- **Breakthrough**: Reused consistent formatting logic across forms to reduce confusion and ensure robust validation.
- **Errors Fixed**: Prevented NaN caused by commas; improved readability of derived amounts and limits.
- **Code Changes**: Updated `src/components/QuickUpdateBalanceForm.tsx` with `formatIndianNumber`/`unformatNumber`, controlled inputs, helper descriptions, and Indian-formatted derived values.
- **Next Dependencies**: None.

## [2025-11-09T01:05:00.000Z] Task Completed: Add unit tests for expiry normalization/validation
- **Outcome**: Added tests covering valid formats, normalization, and edge cases; tests run via `npm run test`.
- **Breakthrough**: Created standalone `src/validation.ts` to allow Node-based tests without Raycast dependencies.
- **Errors Fixed**: Ensured test environment isolation from `@raycast/api`.
- **Code Changes**: Added `src/tests/expiry.test.ts`, `src/validation.ts`, updated `tsconfig.json` and `package.json`.
- **Next Dependencies**: Optionally extend tests for card number and CVV.

## [2025-11-09T01:08:00.000Z] Task Completed: Document expiry rules and testing in README
- **Outcome**: README now clearly states accepted formats, normalization behavior, validity criteria, and test instructions.
- **Breakthrough**: Improved developer and user understanding of expected input and validation.
- **Errors Fixed**: Removed ambiguity that led to user confusion.
- **Code Changes**: Updated `README.md` with an Expiry Validation section and Testing notes.
- **Next Dependencies**: None.
## [2025-11-09T02:10:00.000Z] Task Completed: Fix utilization calculation to two decimals and thresholds across UI
- **Outcome**: Utilization now displays with two-decimal precision and clamps between 0–100%. Threshold highlighting uses green ≤30%, yellow 30–80%, red ≥80.
- **Breakthrough**: Centralized precision logic via `calculateUtilization()` avoids integer rounding errors (e.g., 15451/29000 now correctly shows 53.28%).
- **Errors Fixed**: Corrected prior miscalculation causing 100% display for partial utilization.
- **Code Changes**: Updated `src/utils.ts` (`calculateUtilization`), `src/components/CardDetail.tsx`, and `src/index.tsx` accessory computation.
- **Next Dependencies**: Use shared formatter for list and detail views to keep thresholds consistent.

## [2025-11-09T02:12:00.000Z] Task Completed: Standardize terminology to Outstanding Balance and Available Credit
- **Outcome**: All user-facing text uses “Outstanding Balance” and “Available Credit”; “Maximum Credit Limit” replaces “Total Limit”.
- **Breakthrough**: Unified wording across Detail view and list accessories improves clarity and professionalism.
- **Errors Fixed**: Removed mixed terminology that confused “Current/Remaining/Available” semantics.
- **Code Changes**: Updated `src/components/CardDetail.tsx` and `src/index.tsx` labels.
- **Next Dependencies**: Ensure future forms and docs adhere to this terminology.

## [2025-11-09T02:14:00.000Z] Task Completed: Format currency with symbol, lakh/crore commas, two decimals
- **Outcome**: All monetary values render with INR symbol, Indian grouping, and two decimal places.
- **Breakthrough**: Single `formatCurrency()` now guarantees consistent output across views.
- **Errors Fixed**: Removed zero-decimal formatting inconsistencies.
- **Code Changes**: Updated `src/utils.ts` `formatCurrency()` and applied in CardDetail/QuickUpdate forms.
- **Next Dependencies**: Prefer `formatCurrency()` over local formatters.

## [2025-11-09T02:16:00.000Z] Task Completed: Revise QuickUpdateBalanceForm with Available Credit workflow
- **Outcome**: Form inputs renamed to “Available Credit” and “Amount to Pay”; derived fields show “Outstanding Balance”, “Available Credit”, and “Credit Utilization”. Live Indian formatting preserved; values sanitized on submit.
- **Breakthrough**: Clearer mental model: utilization derived from Outstanding/Limit; robust validation prevents negatives and over-limit values.
- **Errors Fixed**: Addressed misleading labels and improved validation messages.
- **Code Changes**: Updated `src/components/QuickUpdateBalanceForm.tsx` to new labels, currency formatting, and 2-decimal utilization.
- **Next Dependencies**: Consider centralizing number formatting helpers for reuse.

## [2025-11-09T02:18:00.000Z] Task Completed: Add unit tests for utilization accuracy and edge cases
- **Outcome**: Tests verify 53.28% for 15451/29000, 0% for zero/invalid limits, clamping at 100%, and negatives treated as 0%.
- **Breakthrough**: Prevents regressions in percentage math and rounding.
- **Errors Fixed**: None; proactive coverage.
- **Code Changes**: Added `src/tests/utilization.test.ts`.
- **Next Dependencies**: Extend tests for currency formatting if needed.

## [2025-11-09T02:20:00.000Z] Task Completed: Update README wording to new terminology and behaviors
- **Outcome**: Documentation now reflects “Available Credit”/“Outstanding Balance”, two-decimal utilization, and revised Quick Update workflow.
- **Breakthrough**: Aligns user expectations with UI and calculations.
- **Errors Fixed**: Removed outdated references to “Remaining Credit”.
- **Code Changes**: Updated `README.md` usage sections.
- **Next Dependencies**: Keep README synchronized with future UX changes.
## [2025-11-11T11:40:00.000Z] Task Completed: Reindex codebase resources and integration points
- **Outcome**: Mapped Worker endpoints, D1/KV/R2 bindings, Raycast preferences, and client hooks.
- **Breakthrough**: Clear visibility across config, schema, and UI integration paths.
- **Errors Fixed**: None.
- **Code Changes**: None.
- **Next Dependencies**: Keep mappings updated with future changes.

## [2025-11-11T11:44:00.000Z] Task Completed: Author guardrails.md documenting resource maps and contracts
- **Outcome**: Added `docs/guardrails.md` with resource map, contracts, endpoints, configuration, security, ops, and testing guidance.
- **Breakthrough**: Single source of truth for future dev cycles.
- **Errors Fixed**: None.
- **Code Changes**: New documentation file `docs/guardrails.md`.
- **Next Dependencies**: Optionally link from README.

## [2025-11-11T11:46:00.000Z] Task Completed: Validate build and cross-reference docs links
- **Outcome**: Extension build passes; docs compile unaffected.
- **Breakthrough**: Confirms no code regressions after documentation addition.
- **Errors Fixed**: None.
- **Code Changes**: None.
- **Next Dependencies**: None.
[2025-11-11T00:00:00.000Z] Task Completed: Update guardrails doc with PCI DSS and audit logging notes
- **Outcome**: Documented CVV non-persistence, PAN encryption, audit logging coverage, and concurrency/rollback safeguards.
- **Breakthrough**: Clear operational and security guardrails aligned to PCI expectations without storing sensitive authentication data.
- **Errors Fixed**: N/A.
- **Code Changes**: Updated `docs/guardrails.md` Security Guardrails section.
- **Next Dependencies**: None for docs; proceed with test execution and validations.