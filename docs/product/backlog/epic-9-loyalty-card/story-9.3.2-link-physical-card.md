### Story 9.3.2: Link a Physical Card with Attempt Limits
**As a** registered customer with a printed loyalty card
**I want** to link it to my account with its card number and secret code
**So that** my physical and digital card share one stamp balance

**References:** UC-044 (Main Flow 1-6, EF-1, EF-2, EF-3, EF-4, BR-1, BR-2, BR-5, BR-6, BR-8), UC-047 (AF-1)

**Priority:** Should (MoSCoW) | **Estimate:** 5 story points

**Acceptance Criteria:**
- [ ] From the loyalty card section of the account (Story 9.2.3) the customer can enter a card number and the secret verification code
- [ ] A valid combination of an issued, unlinked, non-invalid physical card links it to the customer's digital card; the customer sees a confirmation, the linked physical card number, and unchanged stamps (UC-044 steps 5-6)
- [ ] A linked physical card cannot be linked by another customer (UC-044 BR-1)
- [ ] An unknown card number, or a wrong code for a known number, gives the same message "combination not recognised" without saying which is wrong, counts as a failed attempt, and makes no link (UC-044 EF-2)
- [ ] A matching card that is already linked to another customer, or is invalid, gives "this card cannot be linked", counts as a failed attempt, and makes no link (UC-044 EF-3, BR-5)
- [ ] After 5 failed attempts by one customer, the customer is not asked for details and is told to wait 15 minutes (UC-044 EF-1, BR-5); a 6th attempt is refused even with a correct card
- [ ] A customer who is barred gets the barred message before any card check, whatever card number is entered
- [ ] After 15 minutes without new failures the customer can try again; a successful link resets the customer's failure count (UC-044 BR-5)
- [ ] After 10 failed attempts on the same card number, summed across all customers, that number cannot be linked by anyone for 60 minutes; the code is not checked in that period and the message is "cannot be linked at this time" (UC-044 EF-4, BR-6); the count starts again after 60 minutes
- [ ] Failed attempts of customer A and customer B on the same number both count toward the 10 (UC-044 BR-6)
- [ ] An attempt made while the card number is blocked does not count as a failed attempt against the customer and does not extend the card block
- [ ] A successful link by one customer does not reset the failed-attempt count of that card number for other customers
- [ ] The secret code is compared in constant time and is never logged or returned
- [ ] Linking works while the loyalty feature is switched off (UC-044 BR-8)
- [ ] Two simultaneous link requests for the same unlinked card result in exactly one success
- [ ] The limits (5 per 15 minutes per customer, 10 per 60 minutes per card number) are fixed values, not admin settings (UC-044 Implementation Notes)

**Technical Implementation:**
- Backend:
  - `POST /api/account/loyalty-card/physical` (`isAuthenticated`): Zod body `{ cardNumber: string, secretCode: string }`; customer derived from the session; responses 200, 400 `NOT_RECOGNISED`, 409 `CANNOT_LINK`, 429 `CUSTOMER_BARRED` (with retry-after), 423 `CARD_BLOCKED`
  - `loyaltyService.linkPhysicalCard()` (or `loyaltyCardLinkService`): order of checks per UC step 4: customer barred, card number blocked, card exists, code matches (`verifySecretCode`, Story 9.3.1), card status `issued`; link in a transaction with `UPDATE ... WHERE status = 'issued'` (or row lock) so concurrent requests yield one success
  - Attempt counting in SQL (`COUNT(*) WHERE attempted_at > now() - interval`), no in-memory counters (survives restarts and multiple instances); additionally the generic rate limiter from `server/security.ts` on the route
  - Customer window: failures after the customer's last success, within 15 minutes. Card window: failures in the last 60 minutes, all customers, not reset by anyone's success. Attempts rejected as `CARD_BLOCKED` or `CUSTOMER_BARRED` are not recorded as failed attempts
  - `GET /api/account/loyalty-card` (Story 9.2.3) already returns the linked number
- Frontend: `LinkPhysicalCardDialog` in the `LoyaltyTab` of `client/src/pages/storefront/Account.tsx` (React Hook Form + Zod, shows barred state and remaining wait)
- Database: add `linked_digital_card_id` integer self-reference to `loyalty_card`; new table `loyalty_link_attempt` (`id`, `customer_id`, `card_number`, `success` boolean, `attempted_at`) with indexes on (`customer_id`, `attempted_at`) and (`card_number`, `attempted_at`); migration via `npx drizzle-kit generate`
- Unit/integration tests: each EF, boundary counts 4/5/6 and 9/10/11, window expiry, cross-customer sum, blocked attempt not counted or extending the block, barred-before-card-check, success by another customer, race

**Dependencies:** Story 9.3.1 (issued cards and code verification), Story 9.2.3 (loyalty section), Story 9.2.1 (digital card exists)
