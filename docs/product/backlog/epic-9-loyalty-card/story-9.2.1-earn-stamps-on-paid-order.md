### Story 9.2.1: Digital Card and Earning Stamps on a Paid Webshop Order
**As a** registered customer
**I want** to earn stamps on my digital loyalty card when my logged-in webshop order is paid
**So that** I am rewarded for repeat purchases

**References:** UC-043 (Main Flow 1-5, AF-1, AF-3, AF-4, EF-1, BR-1 to BR-7, OQ-1, OQ-2), UC-025 (steps 5-12), UC-027 (registration), UC-015 (BR-3 basis consistent with free shipping threshold)

**Priority:** Should (MoSCoW) | **Estimate:** 8 story points (was 5: now includes the card data model, balance, and session-based customer identity)

**Acceptance Criteria:**

Customer identity (security):
- [ ] Stamps are earned only for the customer identified by the authenticated session at the moment the order is created; the customer is never derived from the email address or a guest indicator in the request
- [ ] An order created without a valid session (a guest) earns no stamps, even when its email address matches a registered customer
- [ ] An order created with a valid session is linked to that session's customer, and stamps go to that customer's card, also when the request carries a different email address
- [ ] POS sales earn no stamps (UC-043 BR-4)

Card:
- [ ] A digital loyalty card with a unique card number is created when a registered customer record is created; each customer has exactly one digital card (UC-043 BR-1)
- [ ] A registered customer without a card (registered before this feature) gets one automatically at the first card access or first paid order; earlier orders earn no stamps retroactively (UC-043 OQ-1 default)
- [ ] A card's balance is the sum of its stamp entries, and 0 when it has none
- [ ] Stamps never expire (UC-043 BR-6)
- [ ] Surplus stamps above a full card are kept on the card (UC-043 AF-2)

Earning:
- [ ] When Mollie reports the order as paid and the feature is on, the stamps are `floor(basisAmount / euroPerStamp)`, where the basis amount is the product total including VAT, excluding shipping costs, after discounts (UC-043 BR-2, BR-3)
- [ ] Example: basis 45,00 with 10 euro per stamp gives 4 stamps; basis 9,99 gives 0 stamps and no entry; basis exactly 10,00 gives 1 stamp (UC-043 AF-1, BR-2); the remainder lapses and is not carried over
- [ ] Shipping costs are excluded: product total 38,00 plus shipping 6,95 earns 3 stamps, not 4
- [ ] The stamps are stored as an entry linked to the order, with the basis amount; the balance increases by that number (UC-043 Main Flow 5, BR-7)
- [ ] The euro amount per stamp in force at the moment the payment is reported paid is used; a later rule change does not alter existing entries (UC-043 BR-5)
- [ ] When the feature is off at the moment of payment, no stamps are awarded, and the order never earns stamps later, also not after the feature is switched on again (UC-043 AF-3, BR-5)
- [ ] A pending payment (for example bank transfer) awards nothing; when Mollie later reports paid, stamps are awarded with the rules in force at that moment (UC-043 AF-4)
- [ ] A failed, cancelled, or expired payment awards no stamps; a retry that succeeds awards them once (UC-043 EF-1)

Reliability:
- [ ] Awarding runs as its own idempotent step after the sale is marked paid: running it twice for the same order awards the stamps once
- [ ] The award step is also run when a payment-paid notification arrives for an order that is already marked paid, so a Mollie retry safely repeats a previously failed award without awarding twice
- [ ] A failure while awarding never rolls back or fails the sale completion
- [ ] A failed award is logged with the order number only (no personal data), so it can be followed up

**Technical Implementation:**
- Backend:
  - `POST /api/checkout/create` gets optional authentication (a middleware variant that resolves the session user when a valid session exists and continues without one otherwise; not `isAuthenticated`, which would block guests). When a session exists, the customer is resolved from the session user (same approach as `/api/account/profile`, `server/routes.ts` ~3245) and passed to `checkoutService.createOrder()`; `isGuest` and the request email are never used to pick the loyalty customer. `findOrCreateCustomer()` keeps its existing contact-data behaviour but does not decide loyalty identity. Refines UC-043 OQ-2 (see epic Open Points)
  - `checkoutService.createOrder()` stores the session customer in `webshop_order.customer_id` (null for guests)
  - `loyaltyService.ensureDigitalCard(customerId)`: creates the card with a random unique card number via `generateCardNumber()` (retry on unique violation); called from the customer-creation path for registrations, and lazily from `loyaltyService.getCardForCustomer()` and the award step
  - `generateCardNumber()` lives in `server/loyaltyCardCodes.ts` (created here, later extended by Story 9.3.1); proposed format 12 random digits (epic Open Points)
  - `loyaltyService.getBalance(cardId)`: sum of `loyalty_stamp_entry.stamps`, 0 when none
  - `loyaltyService.awardStampsForOrder(order, tx?)`: no-op when `order.customer_id` is null; reads `getRules()`; computes the basis from `order.items` (price x quantity, reward lines excluded, shipping excluded); inserts the entry with `onConflictDoNothing` on (`webshop_order_id`, `entry_type`); returns `{ stampsEarned, becameFull, balance }`
  - `checkoutService.completeSale()`: mark the sale paid first, then call the award step in a separate try/catch (outside the sale transaction); also call it on the already-PAID early-return path (~382 in `server/checkoutService.ts`, `handleWebhook()`/`completeSale()`) so a repeated webhook retries a failed award; non-paid statuses stay ignored (EF-1)
  - No new endpoint; the webhook `POST /api/checkout/webhook` is reused
- Frontend: none (visibility in Story 9.2.3). The storefront checkout must send the session cookie with `POST /api/checkout/create` (check `credentials` handling in the checkout request)
- Database (`shared/schema.ts`):
  - Remove the unused `loyalty` table, `insertLoyaltySchema`, `Loyalty`, `InsertLoyalty` (no other references; generated Drizzle migration drops the table; no data migrated)
  - `loyalty_card`: `id` serial, `card_number` varchar not null with one unique index (shared number space for digital and physical cards, UC-044/UC-043 Implementation Notes), `kind` ('digital' | 'physical') not null, `customer_id` integer FK `customer.id` nullable, `creation_date`, `modification_date`; partial unique index on `customer_id` where `kind = 'digital'` (UC-043 BR-1). Physical-card columns are added by Stories 9.3.1 and 9.3.2
  - `loyalty_stamp_entry`: `id`, `loyalty_card_id` FK, `webshop_order_id` FK `webshop_order.id` not null (UC-043 BR-7), `entry_type` ('earn' | 'redeem'), `stamps` signed integer (positive earned, negative redeemed), `basis_amount` decimal(10,2) (null for redeem), `creation_date`; unique constraint on (`webshop_order_id`, `entry_type`)
  - `webshop_order`: add nullable `customer_id` integer FK `customer.id` (~451)
  - Insert schemas and select/insert types exported for each new table per `.claude/rules/database.md`; migration via `npx drizzle-kit generate`, review the SQL before applying
- Unit tests: floor/remainder maths, shipping exclusion, off-switch, duplicate webhook, repeated webhook after a failed award, award failure does not fail the sale, guest order with matching registered email, session customer with a different request email, balance with zero/earn-only/earn plus redeem entries

**Dependencies:** Story 9.1.2 for `getRules()` and its defaults (the feature is off until an admin switches it on)
