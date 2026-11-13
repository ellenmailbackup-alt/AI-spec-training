### Story 9.3.1: Script to Generate Physical Card Batches (Technical)
**As a** business owner
**I want** a script that generates batches of physical card numbers with secret verification codes
**So that** printed cards can be produced and later linked by customers without exposing readable codes in the database

**References:** UC-044 (Implementation Notes, BR-2, BR-1), UC-043 (Implementation Notes: shared card number space)

**Priority:** Should (MoSCoW) | **Estimate:** 3 story points

**Acceptance Criteria:**
- [ ] `npx tsx scripts/generate-loyalty-cards.ts --count 500 --batch 2026-11-A` inserts 500 rows in `loyalty_card` with `kind = 'physical'`, `status = 'issued'`, no customer, and the given batch label
- [ ] Each card number is unique across all `loyalty_card` rows, digital and physical (shared number space); a collision is retried with a new number
- [ ] The secret code is generated with a cryptographically secure random source (at least 10 characters from an unambiguous alphabet, about 50 bits) and is never stored in readable form: only an HMAC-SHA256 with the server-side secret `LOYALTY_CODE_PEPPER` is stored in `secret_code_hash`
- [ ] The script writes a CSV (card number, secret code) to a local output path for the printer and never prints codes to the console log; the CSV is the only place the readable code exists
- [ ] The script refuses to run when `LOYALTY_CODE_PEPPER` is missing, when `--count` is not a positive integer (maximum 10 000 per run), or when the batch label already exists
- [ ] `--dry-run` generates and validates without writing to the database or the CSV
- [ ] The insert runs in a single transaction: on an error no rows are stored
- [ ] The exported helpers `generateCardNumber()`, `generateSecretCode()`, `hashSecretCode(code)` and `verifySecretCode(code, hash)` (constant-time compare) are unit tested, including that the hash of the same code with another pepper differs
- [ ] `LOYALTY_CODE_PEPPER` is added to `.env.example`; the script is documented in `docs/guides/`

**Technical Implementation:**
- Backend: `scripts/generate-loyalty-cards.ts` (follows the pattern of `scripts/fix-all-sequences.ts`), shared helpers in `server/loyaltyCardCodes.ts` (also used by Story 9.3.2 and by the digital card generator in Story 9.2.1 for the card number format); no HTTP endpoint, not an admin capability
- Frontend: none
- Database: uses `loyalty_card` (Story 9.1.1); `batch_label` has a unique-per-batch check done by the script
- Proposed card number format: 12 digits, random (to be confirmed, UC does not define it)

**Dependencies:** Story 9.1.1
