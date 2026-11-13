### Story 9.1.1: Loyalty Card Data Model and Rule Defaults (Technical Enabler)
**As a** developer
**I want** a loyalty card data model that replaces the unused `loyalty` table, plus a service that reads the loyalty rules with their defaults
**So that** all later loyalty stories (earning, viewing, linking, redeeming, configuring) build on one consistent model

**References:** UC-043 (BR-1, BR-5, BR-7, Implementation Notes), UC-046 (Preconditions defaults, OQ-1, Implementation Notes), UC-044 (Implementation Notes: shared card number space)

**Priority:** Should (MoSCoW) | **Estimate:** 3 story points

**Acceptance Criteria:**
- [ ] The `loyalty` table, `insertLoyaltySchema`, `Loyalty` and `InsertLoyalty` are removed from `shared/schema.ts` (no other code references them) and a generated Drizzle migration drops the table; no data is migrated
- [ ] Table `loyalty_card` exists with a single unique index on `card_number`, so digital and physical card numbers share one number space (UC-044 / UC-043 Implementation Notes)
- [ ] Only one digital card can exist per customer (partial unique index on `customer_id` where `kind = 'digital'`) (UC-043 BR-1)
- [ ] Table `loyalty_stamp_entry` exists with a NOT NULL reference to a webshop order (traceability, UC-043 BR-7), a signed `stamps` integer (positive = earned, negative = redeemed), an `entry_type` ('earn' | 'redeem'), and a unique constraint on (`webshop_order_id`, `entry_type`) so a repeated webhook cannot award twice
- [ ] Table `loyalty_reward_product` exists with a unique `product_id` (UC-046 BR-4) and no cascading foreign key to `products`, so an entry survives a product being deactivated or removed from the catalogue (UC-046 Implementation Notes)
- [ ] `loyaltyService.getRules()` returns `{ enabled: false, euroPerStamp: 10, stampsPerCard: 10 }` when the parameters `loyalty_enabled`, `loyalty_euro_per_stamp`, `loyalty_stamps_per_card` do not exist in `parameter_table`, and returns the stored values (parsed as boolean, number, integer) when they do
- [ ] `loyaltyService.getBalance(cardId)` returns the sum of `loyalty_stamp_entry.stamps` for the card, and 0 when the card has no entries
- [ ] Insert schemas (`createInsertSchema`) and both select and insert types are exported for every new table, per `.claude/rules/database.md`
- [ ] Unit tests cover the default rules, stored rules, and balance with zero, earn-only, and earn plus redeem entries

**Technical Implementation:**
- Backend: new `server/loyaltyService.ts` (`getRules()`, `getBalance(cardId)`), reading parameters through `parameterService.getParameter()` (same pattern as `free_shipping_threshold_incl_vat` in `server/routes.ts` ~1498); defaults are code fallbacks, no seed rows needed
- Frontend: none
- Database (`shared/schema.ts`, replacing the `loyalty` block at ~391):
  - `loyalty_card`: `id` serial, `card_number` varchar unique not null, `kind` ('digital' | 'physical') not null, `customer_id` integer FK `customer.id` (null for an unlinked physical card), `secret_code_hash` text (physical only), `status` ('issued' | 'linked' | 'invalid'; physical only), `linked_digital_card_id` integer self-reference (physical only), `batch_label` text, `creation_date`, `modification_date`
  - `loyalty_stamp_entry`: `id`, `loyalty_card_id` FK, `webshop_order_id` FK `webshop_order.id`, `entry_type`, `stamps` integer, `basis_amount` decimal(10,2) (null for redeem), `creation_date`
  - `loyalty_reward_product`: `id`, `product_id` integer unique (no FK), `creation_date`
  - Rule values stay in `parameterTable` (`loyalty_enabled`, `loyalty_euro_per_stamp`, `loyalty_stamps_per_card`)
- Migration: `npx drizzle-kit generate`, review the SQL before applying

**Dependencies:** None
