# Card Vault

## Overview
Card Vault is a Raycast extension for managing your credit and debit cards. The latest update standardizes terminology, improves calculation accuracy, and formats all financial values consistently for a professional experience.

### Security Notice (Internal Use Only)
- This build intentionally omits user authentication. It is designed for internal use by a limited set of users and only persists summary data (no sensitive card details).
- Do not expose this extension or any related APIs publicly. If deployed in a networked environment, restrict access via IP allowlists and private networks.
- Tradeoffs: skipping authentication reduces friction but removes protections against unauthorized access. Proceed only if risks are understood and accepted.

## What's New
- Secure storage: AES-256-GCM encryption for `cardNumber` and `cvv`.
- Clean database: Upgrading to schema v2 clears pre-existing card entries to ensure fresh, secure data.
- Refactored Card Form: Improved validation for card fields with clear error messages.
- Manual Balance Update: New interface to input Available Credit and Amount to Pay, auto-calculating credit utilization.
- Confirmation dialog for card removal.

## Usage
- Add cards via the “Add Card” action. Required fields include card number (16 digits), expiry (MM/YY), CVV (3 digits). For credit cards, a total limit is required.
- Update balances using “Quick Update Balance”: enter Available Credit and Amount to Pay. The extension displays Outstanding Balance, Available Credit, and Credit Utilization with two-decimal precision.
- Remove cards via “View Details” → “Remove Card”. A confirmation dialog will appear.

## Technical Details
- Schema Versioning: On startup, the extension checks the stored `schema_version`. If it differs from the current version (`2`), `stored_cards` is reset.
- Encryption:
  - Algorithm: AES-256-GCM with unique 12-byte IV per record.
  - Key: Generated once and stored locally for encryption/decryption. Note: local key storage is for convenience; rotate periodically for stronger security.
  - Fields encrypted: `cardNumber`, `cvv`.
- Balance Update Logic:
  - Inputs: `remainingCredit`, `amountToPay`.
  - Used Amount: `used = totalLimit - remainingCredit` (bounded at 0).
  - Percentage: `calculateUtilization(totalLimit, used)` returns two-decimal precision and is clamped between 0–100.
  - Updates: `currentBalance = used`, `pendingBalance = amountToPay`, `availableBalance = totalLimit - used`.
  - Smart EMI calculations are excluded and acknowledged as an edge case.

### Deployment Security
- If integrating the optional Cloudflare persistence API, use IP allowlists and private routes instead of user login.
- Emit console warnings on startup indicating authentication is disabled.
- Review `docs/cloudflare-persistence-spec.md` for non-auth deployments and IP restriction notes.

## Validation & Error Handling
- Form-level validations for card number, CVV, expiry, total limit, and alert thresholds.
- Balance update input validations cover negative values, non-numeric inputs, and remaining credit greater than total limit.
- All operations provide user feedback via Raycast toasts; destructive actions require confirmation.

## Testing Guide
- Secure Storage: Add a card and restart the extension; confirm stored card numbers are decrypted for UI but persisted encrypted in storage. (Export/import functions operate on decrypted runtime objects.)
- Balance Updates: Try different combinations for Available Credit and Amount to Pay, verify utilization and balances update correctly.
- Percentage Calculations: Validate against known totals (e.g., limit 100, remaining 25 → 75%).
- Persistence Between Sessions: Close and reopen Raycast; cards and balances should persist.
- Edge Cases: Empty inputs, invalid numbers, out-of-range thresholds, confirm alerts for removal.

## Limitations
- Encryption key is stored locally for convenience in this version. For higher security, integrate OS-level key storage.

## Changelog
See `CHANGELOG.md` for version history.

A Raycast extension that helps you securely store and manage your credit/debit card information.

## Features

- Securely store card details
- Quick access to your cards
- Easy management of card information

## Installation

1. Install Raycast from [raycast.com](https://www.raycast.com/)
2. Clone this repository
3. Run `npm install` to install dependencies
4. Run `npm run dev` to start the development server
5. Use Raycast to test the extension

## Building for Production

To build the extension for production, run:

```bash
npm run build
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
### Expiry Validation
- Accepted formats: `MM/YY` (preferred), `M/YY`, `MM-YY`, `MMYY`, and formats with spaces (e.g., `06 / 28`).
- The system normalizes inputs to canonical `MM/YY` and validates:
  - Month must be between `01` and `12`.
  - Expiry is considered valid through the end of the specified month.
  - Past months/years are rejected.
- Error Logging: Validation failures log reasons (format, month range, expired) to the console for diagnostics.

### Testing
- Run `npm run test` to compile and execute unit tests.
- Tests cover normalization and validation across accepted formats and edge cases.
