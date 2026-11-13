### Story 9.3.1: Script to Generate Physical Card Batches (Technical Enabler, task)
**As the** shop owner who orders printed cards
**I want** a script that generates batches of physical card numbers with secret verification codes
**So that** printed cards can be produced and later linked by customers without readable codes being stored in the database

**References:** UC-044 (Implementation Notes, BR-2, BR-1), UC-043 (Implementation Notes: shared card number space)

**Priority:** Should (MoSCoW) | **Estimate:** 3 story points

**Acceptance Criteria:**
- [ ] Running the script with a count of 500 and a batch label creates 500 physical cards that are issued, belong to no customer, and carry the batch label
- [ ] Each card number is unique across all loyalty cards, digital and physical (shared number space); a collision is resolved by generating a new number
- [ ] The secret codes are unpredictable, long enough to resist guessing, and use characters that cannot be confused when printed
- [ ] Secret codes are never stored in readable form
- [ ] The script produces a file for the printer with card number and secret code per card; this file is the only place where readable codes exist, and codes are never shown in the console output or logs
- [ ] The script refuses to run when the server-side secret is not configured, when the count is not a positive whole number (maximum 10 000 per run), or when the batch label already exists
- [ ] A dry run generates and validates without writing to the database or producing the printer file
- [ ] The batch is stored all-or-nothing: on an error no cards of that run are stored
- [ ] Code generation, hashing, and verification are unit tested, including that the same code hashed with a different server-side secret gives a different result
- [ ] The required configuration setting is listed in `.env.example` and the script is documented in `docs/guides/`

**Technical Implementation:**
- Backend:
  - `scripts/generate-loyalty-cards.ts` (pattern of `scripts/fix-all-sequences.ts`), run as `npx tsx scripts/generate-loyalty-cards.ts --count 500 --batch 2026-11-A [--dry-run]`; no HTTP endpoint, not an admin capability
  - Extends `server/loyaltyCardCodes.ts` (created in Story 9.2.1 with `generateCardNumber()`; reused here, no duplicate implementation) with `generateSecretCode()`, `hashSecretCode(code)`, `verifySecretCode(code, hash)` (constant-time compare); also used by Story 9.3.2
  - Secret code: cryptographically secure random source, at least 10 characters from an unambiguous alphabet (about 50 bits); stored value is HMAC-SHA256 with the server-side secret `LOYALTY_CODE_PEPPER`; CSV (card number, secret code) written to a local output path
  - Insert in a single transaction; batch label uniqueness checked by the script; `--count` capped at 10 000
- Frontend: none
- Database: add physical-card columns to `loyalty_card` (Story 9.2.1): `secret_code_hash` text, `status` ('issued' | 'linked' | 'invalid'; physical only), `batch_label` text; migration via `npx drizzle-kit generate`
- Card number format: reuses the 12 random digits proposed in Story 9.2.1 (epic Open Points)

**Dependencies:** Story 9.2.1 (`loyalty_card` table and `generateCardNumber()` helper)
