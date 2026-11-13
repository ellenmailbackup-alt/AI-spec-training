### Story 9.2.1: Digital Card and Earning Stamps on a Paid Webshop Order
**As a** registered customer
**I want** to receive stamps on my loyalty card when my webshop order is paid
**So that** I am rewarded for repeat purchases

**References:** UC-043 (Main Flow 1-5, AF-1, AF-3, AF-4, EF-1, BR-1 to BR-7, OQ-1, OQ-2), UC-025 (steps 5-12), UC-027 (registration), UC-015 (BR-3 basis consistent with free shipping threshold)

**Priority:** Should (MoSCoW) | **Estimate:** 5 story points

**Acceptance Criteria:**
- [ ] A digital loyalty card with a unique card number is created for a customer when a registered (non-guest) customer record is created; each customer has exactly one digital card (UC-043 BR-1)
- [ ] A registered customer without a card (registered before this feature) gets a card automatically at the first card access or first paid order; earlier orders earn no stamps retroactively (UC-043 OQ-1 default)
- [ ] When Mollie reports the order as paid and the feature is on, the stamps are `floor(basisAmount / euroPerStamp)` where the basis amount is the product total including VAT, excluding shipping costs, after discounts (UC-043 BR-2, BR-3)
- [ ] Example: basis 45,00 with 10 euro per stamp gives 4 stamps; basis 9,99 gives 0 stamps and no entry; basis exactly 10,00 gives 1 stamp (UC-043 AF-1, BR-2); the remainder lapses and is not carried over
- [ ] Shipping costs are excluded: product total 38,00 plus shipping 6,95 earns 3 stamps, not 4
- [ ] The stamps are stored as a `loyalty_stamp_entry` of type 'earn' linked to the order, with the basis amount; the balance increases by that number (UC-043 Main Flow 5, BR-7)
- [ ] The euro amount per stamp in force at the moment the payment is reported paid is used; a later rule change does not alter existing entries (UC-043 BR-5)
- [ ] When the feature is off at the moment of payment, no stamps are awarded, the balance is unchanged, and the order never earns stamps later, also not after the feature is switched on again (UC-043 AF-3, BR-5)
- [ ] A pending payment (for example bank transfer) awards nothing; when Mollie later reports paid, stamps are awarded with the rules in force at that moment (UC-043 AF-4)
- [ ] A failed, cancelled, or expired payment awards no stamps; a retry that succeeds awards them once (UC-043 EF-1)
- [ ] A duplicate Mollie webhook for an already paid order awards stamps only once (idempotent, unique constraint from Story 9.1.1)
- [ ] Orders placed as a guest (visitor) earn no stamps, and POS sales earn none (UC-043 BR-4; OQ-2 assumption, see Technical Implementation)
- [ ] Surplus stamps above a full card are kept on the card (UC-043 AF-2)
- [ ] An error while awarding stamps does not fail or roll back the sale completion and is logged without PII (log the order number only); the failure is retriable

**Technical Implementation:**
- Backend:
  - `loyaltyService.ensureDigitalCard(customerId)`: creates the card with a random unique card number (retry on unique violation; format proposed in Story 9.3.1 and shared with the script); called from `checkoutService.findOrCreateCustomer()` (non-guest create path), from the customer-creation path for storefront registrations, and lazily from `loyaltyService.getCardForCustomer()`
  - `loyaltyService.awardStampsForOrder(order, tx?)`: reads `getRules()`, computes the basis amount from `order.items` (price x quantity, excluding reward lines; shipping excluded), inserts the entry with `onConflictDoNothing` on (`webshop_order_id`, `entry_type`)
  - Hook in `server/checkoutService.ts` `completeSale()` after the PAID idempotency check, so pending-then-paid (AF-4) and retried payments go through the same path; the existing `handleWebhook()` already ignores non-paid statuses (EF-1)
  - Order to customer link: `checkoutService.createOrder()` stores `customer_id` on the order for non-guest requests (assumption for UC-043 OQ-2: visitor orders earn nothing even when the email matches a registered customer)
  - No new HTTP endpoint (webhook `POST /api/checkout/webhook` is reused)
- Frontend: none (visibility in Story 9.2.3)
- Database: add nullable `customer_id` integer FK `customer.id` to `webshop_order` in `shared/schema.ts` (~451); uses tables from Story 9.1.1
- Unit tests: floor/remainder maths, shipping exclusion, off-switch, duplicate webhook, guest order, rule change between order and payment

**Dependencies:** Story 9.1.1 (model and rules); works with defaults without Story 9.1.2, but the feature is off until an admin switches it on
