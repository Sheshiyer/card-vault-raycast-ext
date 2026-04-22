# PROJECT TODO

## In Progress
 - [ ] Add tests for validation, rollback, balance accuracy, and security assertions
 
## Pending
 - [ ] Add tests for validation, rollback, balance accuracy, and security assertions

## Completed (move to memory.md)
  - [DONE] ~~Scan docs (README, todo.md, memory.md) for claimed features~~
  - [DONE] ~~Search codebase to verify claimed implementations~~
  - [DONE] ~~Identify gaps and categorize severity with locations~~
  - [DONE] ~~Collect git metadata for discrepancies~~
  - [DONE] ~~Compile stakeholder-friendly structured report~~
  - [DONE] ~~Fix CardDetail metadata Outstanding Balance label~~
  - [DONE] ~~Centralize utilization in index accessories using utils~~
  - [DONE] ~~Use shared formatCurrency in index~~
  - [DONE] ~~Append history snapshots in bulkUpdateBalances~~
  - [DONE] ~~Update README to reflect two-decimal utilization helper~~
  - [DONE] ~~Draft Cloudflare persistence technical specification~~
  - [DONE] ~~Draft login system technical specification for Cloudflare Workers~~
  - [DONE] ~~Add security notice banner in index UI~~
  - [DONE] ~~Add console warnings about no authentication~~
  - [DONE] ~~Update README with internal-use security tradeoffs~~
  - [DONE] ~~Simplify Cloudflare spec to IP allowlist; remove auth doc~~
  - [DONE] ~~Scaffold Cloudflare Worker with IP allowlist and summary endpoints~~
  - [DONE] ~~Add D1 migrations for summaries and history tables~~
  - [DONE] ~~Create wrangler config with DB, KV, R2 bindings~~
 - [DONE] ~~Propose CLI commands to create bindings and deploy~~
 - [DONE] ~~Fix Cloudflare Worker TypeScript types for D1/KV/R2~~
 - [DONE] ~~Draft Cloudflare persistence technical specification~~
  - [DONE] ~~Create Cloudflare API client module for fetch/upsert~~
  - [DONE] ~~Add Sync from Cloudflare action in main list UI~~
  - [DONE] ~~Hook balance update forms to upsert Worker summaries~~
  - [DONE] ~~Add package.json scripts for wrangler deploy and migrations~~
  - [DONE] ~~Configure Raycast preference for Worker Base URL~~
  - [DONE] ~~Investigate CLI base URL retrieval via Wrangler~~
  - [DONE] ~~Document approach for base URL management~~
  - [DONE] ~~Reindex codebase resources and integration points~~
  - [DONE] ~~Author guardrails.md documenting resource maps and contracts~~
  - [DONE] ~~Validate build and cross-reference docs links~~
  - [DONE] ~~Implement PCI-safe card storage (remove CVV persistence; encrypt PAN)~~
  - [DONE] ~~Add atomic transaction wrapper and audit logging~~
  - [DONE] ~~Enhance balance update logic with history and concurrency-safe operations~~
  - [DONE] ~~Update guardrails doc with PCI DSS and audit logging notes~~
- [DONE] ~~Index codebase for remove-card logic and persistence paths~~
- [DONE] ~~Wire up Remove Card action to call storage removal~~
- [DONE] ~~Ensure list refreshes after removal via onCardUpdated~~
- [DONE] ~~Verify local storage reflects removal and UI no longer lists~~
 - [DONE] ~~Refactor QuickUpdateBalanceForm to remaining credit workflow~~
 - [DONE] ~~Fix utilization calculation to two decimals and thresholds across UI~~
 - [DONE] ~~Standardize terminology to Outstanding Balance and Available Credit~~
 - [DONE] ~~Format currency with symbol, lakh/crore commas, two decimals~~
 - [DONE] ~~Revise QuickUpdateBalanceForm with Available Credit workflow~~
 - [DONE] ~~Add unit tests for utilization accuracy and edge cases~~
 - [DONE] ~~Update README wording to new terminology and behaviors~~
 - [DONE] ~~Add confirmation dialog for card removal~~
 - [DONE] ~~Update README with security, balance update, and testing~~
 - [DONE] ~~Hide current/pending balance fields on Add Card form~~
 - [DONE] ~~Fix expiry validation to accept correct formats and trim input~~
 - [DONE] ~~Add unit tests for expiry normalization/validation~~
 - [DONE] ~~Document expiry rules and testing in README~~
 - [DONE] ~~Add 4-digit separator formatting to card number input~~