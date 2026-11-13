### Story 9.3.2: Link a Physical Card with Attempt Limits
**As a** registered customer with a printed loyalty card
**I want** to link it to my account with its card number and secret code
**So that** my physical and digital card share one stamp balance

**References:** UC-044 (Main Flow 1-6, EF-1, EF-2, EF-3, EF-4, BR-1, BR-2, BR-5, BR-6, BR-8), UC-047 (AF-1)

**Priority:** Should (MoSCoW) | **Estimate:** 5 story points

**Acceptance Criteria:**
- [ ] From the loyalty tab (Story 9.2.3) the customer opens a dialog asking for the card number and the secret verification code
- [ ] A valid combination of an issued, unlinked, non-invalid physical card links it to the customer's digital card; the dialog confirms and the tab shows the linked physical card number and the unchanged stamps (UC-044 steps 5-6)
- [ ] After linking, the physical card is `linked` with `linked_digital_card_id` set and cannot be linked by another customer (UC-044 BR-1)
- [ ] An unknown card number, or a wrong code for a known number, shows the same message "combination not recognised" without saying which is wrong, counts as a failed attempt, and makes no link (UC-044 EF-2)
- [ ] A matching card that is already linked to another customer, or is invalid, shows "this card cannot be linked", counts as a failed attempt, and makes no link (UC-044 EF-3, BR-5)
- [ ] After 5 failed attempts by one customer the dialog does not ask for details and states the customer must wait 15 minutes (UC-044 EF-1, BR-5); the 6th request is rejected with 429 even with a correct card
- [ ] After 15 minutes without new failures the customer can try again; the counter is reset by a successful link (UC-044 BR-5)
- [ ] After 10 failed attempts on the same card number, summed across all customers, that number cannot be linked by anyone for 60 minutes; the code is not checked in that period and the message is "cannot be linked at this time" (UC-044 EF-4, BR-6); the counter resets after 60 minutes
- [ ] Failed attempts of customer A and customer B on the same number both count toward the 10 (UC-044 BR-6)
- [ ] The secret code is compared against the stored HMAC in constant time and is never logged or returned
- [ ] Linking works while the loyalty feature is switched off (UC-044 BR-8)
- [ ] Two simultaneous link requests for the same unlinked card result in exactly one success (row lock or conditional update)
- [ ] The limits (5/15 min, 10/60 min) are fixed constants, not admin settings (UC-044 Implementation Notes)

**Technical Implementation:**
- Backend:
  - `POST /api/account/loyalty-card/physical` (`isAuthenticated`): Zod body `{ cardNumber: string, secretCode: string }`; customer derived from the session; responses 200, 400 `NOT_RECOGNISED`, 409 `CANNOT_LINK`, 429 `CUSTOMER_BARRED` (with retry-after), 423 `CARD_BLOCKED`
  - `loyaltyCardLinkService` (or `loyaltyService.linkPhysicalCard()`): order of checks per UC step 4: customer barred, card number blocked, card exists, code matches (`verifySecretCode` from Story 9.3.1), card status `issued`; link in a transaction with `UPDATE ... WHERE status = 'issued'`
  - Attempt counting in SQL (`COUNT(*) WHERE attempted_at > now() - interval`), no in-memory counters (survives restarts and multiple instances); additionally the generic rate limiter from `server/security.ts` on the route
  - `GET /api/account/loyalty-card` (Story 9.2.3) already returns the linked number
- Frontend: `LinkPhysicalCardDialog` in the `LoyaltyTab` of `client/src/pages/storefront/Account.tsx` (React Hook Form + Zod, shows barred state and remaining wait)
- Database: new table `loyalty_link_attempt` (`id`, `customer_id`, `card_number`, `success` boolean, `attempted_at`) with indexes on (`customer_id`, `attempted_at`) and (`card_number`, `attempted_at`); a successful link ends a customer's counting window by counting only failures after the customer's last success
- Unit/integration tests: each EF, boundary counts 4/5/6 and 9/10/11, window expiry, cross-customer sum, race

**Dependencies:** Story 9.3.1 (issued cards and code verification), Story 9.2.3 (loyalty tab), Story 9.2.1 (digital card exists)
