# SPEC-001: Webshop Loyalty Stamp Card (Epic 9)

**Status: Draft — awaiting user approval**

## References
- **Epic:** `docs/product/backlog/epic-9-loyalty-card/epic.md` (Open Points are binding, see Scope)
- **Stories:**
  - 9.1.2 `docs/product/backlog/epic-9-loyalty-card/story-9.1.2-admin-configure-rules.md`
  - 9.1.3 `.../story-9.1.3-admin-reward-choice-list.md`
  - 9.2.1 `.../story-9.2.1-earn-stamps-on-paid-order.md`
  - 9.2.2 `.../story-9.2.2-card-full-email.md`
  - 9.2.3 `.../story-9.2.3-view-loyalty-card.md`
  - 9.3.1 `.../story-9.3.1-card-batch-script.md`
  - 9.3.2 `.../story-9.3.2-link-physical-card.md`
  - 9.3.3 `.../story-9.3.3-replace-physical-card.md`
  - 9.4.1 `.../story-9.4.1-redeem-full-card.md`
  - 9.4.2 `.../story-9.4.2-redemption-exceptions.md`
  - (9.1.1 was removed and folded into 9.1.2, 9.1.3, 9.2.1, 9.3.1, 9.3.2; the number stays unused)
- **Use Cases:** UC-043 (earn), UC-044 (link physical card), UC-045 (redeem), UC-046 (configure), UC-047 (view). Touched: UC-015, UC-025, UC-026, UC-027. Supersedes UC-032 and UC-034 for the webshop (already marked in `docs/use-cases/INDEX.md`; verify only).
- **Reference implementation:** `server/roastService.ts` (service owns `db.transaction()`, routes are HTTP only, storage is CRUD). Other patterns: `server/parameterService.ts` (parameters), `server/stockMovementService.ts` (SQL aggregation), `server/checkoutService.ts` (`sendCustomerConfirmation` email pattern), `scripts/fix-all-sequences.ts` (script pattern), Settings `ShippingTab` in `client/src/pages/admin/Settings.tsx` (settings UI pattern).

## Scope

### In scope
Webshop (storefront) and Admin Dashboard only. Digital loyalty card per customer, earning stamps on paid logged-in webshop orders, redeeming a full card for one free product at checkout, card view and history in the account, card-full email, physical card batch script, linking and replacing a physical card, admin rules and reward choice list. Slices:

| Slice | Stories | Outcome |
|---|---|---|
| A | 9.1.2, 9.2.1, 9.2.3 | Admin switches the feature on, logged-in customers earn and see stamps |
| B | 9.1.3, 9.4.1, 9.4.2 | Reward list, redemption at checkout, reservation, reconciliation, exceptions |
| C | 9.3.1, 9.3.2, 9.3.3 | Physical cards: batch script, link, replace |
| D | 9.2.2 | Card-full email |

### Out of scope (binding decisions)
POS stamps and redemption; stamp withdrawal on cancel or refund; gift vouchers; stamp expiry; admin view or block of customer cards; admin UI for payments needing manual follow-up (a log line and a DB status only); any change to the POS or the admin invoice flow.

### Binding decisions (from the epic and the product owner)
1. **Identity only from the authenticated session at order creation.** `POST /api/checkout/create` gets optional authentication; the session customer is stored in nullable `webshop_order.customer_id`. The request email and `isGuest` never select the loyalty customer. No session means no stamps and no redemption, even when the email matches a customer.
2. **Stamps** = `floor(basis / euroPerStamp)`. Basis = product total including VAT, excluding shipping, reward line excluded. Rule values and the feature on/off state **at payment time** decide.
3. **Award and redeem** run in one idempotent step after the sale is marked PAID, and also on the already-PAID webhook path. A failure never rolls back or fails the sale.
4. **Reservation** of N stamps when the order is created (payment start). Released on failed, cancelled or expired. A late "paid" after release deducts N if the card still holds them, otherwise the order is flagged for admin follow-up. Lost webhooks are covered by a reconciliation job.
5. **Reward line** is booked at 0 euro with 0 VAT and is excluded from the VAT, shipping threshold and basis maths. **Pending accountant confirmation** (see Open Questions).
6. **Defaults:** feature off, 10 euro per stamp, 10 stamps per card, empty reward list. Bounds: euro per stamp 0,01 to 500 (two decimals), stamps per card 1 to 100.
7. **Physical cards:** 12-digit card number, 10-character secret code stored only as HMAC-SHA256 with an environment pepper. Attempt limits (fixed): 5 failures per 15 minutes per customer, 10 failures per 60 minutes per card number.
8. **Webshop stock availability:** minimal check, defined below, used **only** for the reward offer and choice.
9. **Cards for existing customers** are created lazily (first card access or first paid order); no retroactive stamps.

## Architecture Summary

### Module map (3 layers)
| Layer | File | Responsibility |
|---|---|---|
| Routes | `server/loyaltyRoutes.ts` (new, `registerLoyaltyRoutes(app)`) | Admin settings, account card, link, offer, reconcile endpoints. Zod, auth, call service, map `LoyaltyError` to HTTP |
| Routes | `server/checkoutRoutes.ts` (new, `registerCheckoutRoutes(app)`) | The four existing `/api/checkout/*` handlers moved verbatim out of `server/routes.ts`, plus optional auth, `rewardProductId`, error mapping (see decision D-1) |
| Routes | `server/routes.ts` | Calls `registerLoyaltyRoutes(app)` and `registerCheckoutRoutes(app)`; no other change |
| Service | `server/loyaltySettingsService.ts` | `getRules()`, `updateRules()`, `setEnabled()`, reward list CRUD (admin configuration) |
| Service | `server/loyaltyService.ts` | Digital card, balance, `awardStampsForOrder()`, `processPaidOrder()`, card view, history, physical batch issue |
| Service | `server/loyaltyRedemptionService.ts` | Reward offer, reserve, release, redeem, late-paid rule |
| Service | `server/loyaltyLinkService.ts` | Link and replace physical card, attempt limits |
| Service | `server/checkoutService.ts` (modified) | Session customer, reward line, reservation in the order transaction, loyalty step after PAID, release on failure, reconciliation |
| Pure helpers | `server/loyaltyCardCodes.ts`, `server/loyaltyMath.ts`, `server/loyaltyErrors.ts`, `shared/loyaltyRules.ts` | No I/O; unit tested |
| Storage | `server/storage.ts` | CRUD and SQL queries only; methods take an optional `executor: DbExecutor = db` so services can run them inside `db.transaction()` |

Story text names `loyaltyService.getRules()`, `redeemReservation()` etc. Mapping to the split above: rules and reward list live in `loyaltySettingsService`; offer, reserve, release, redeem in `loyaltyRedemptionService`; link in `loyaltyLinkService`. The split avoids one 800-line service and prevents import cycles (`loyaltyService` imports `loyaltyRedemptionService`, which imports `loyaltySettingsService` and storage only).

### Known issues not amplified
`docs/architecture/ARCHITECTURAL_ISSUES_SUMMARY.md`: no new business logic in `routes.ts`, no `db.transaction()` outside services, no dynamic imports, no in-memory filtering, no generic "Failed to ..." messages. The 175 try/catch pattern in `routes.ts` is not copied: new routes use Zod plus `LoyaltyError` mapping with a single helper.

### Pre-existing defects found while researching (not fixed here, but they interact)
1. `createOrder()` **trusts the price in the request** (`item.price`). With stamps and a free product at stake this becomes exploitable. This spec adds server-side repricing (Slice A, `repriceItems()`); see D-3.
2. `completeSale()` checks `PAID` outside the transaction, so two concurrent webhooks could both create stock movements. Not touched; the loyalty step is safe against it through unique constraints.
3. `server/security.ts` has no rate limiter (limiters live in `server/index.ts`); story 9.3.2 assumed one. This spec adds `createLoyaltyLinkLimiter()` to `server/security.ts`.

## Cross-Cutting Design

### 1. Session customer resolution
- New `optionalAuth: RequestHandler` in `server/supabaseAuth.ts`: reads `sb-access-token`; on a valid token sets `req.user` like `isAuthenticated`; on missing or invalid token it calls `next()` without `req.user` and **never** returns 401, never clears cookies, never refreshes. (Guests and expired sessions must still be able to check out.)
- `customerService.ensureCustomerForUser(userId: string, email: string): Promise<number>`: `getCustomerByEmail(email)` or insert a minimal customer (first and last name from `users`, same defaults as `updateAccountProfile`), returns the customer id. Used by `checkoutService.createOrder()` and the account loyalty endpoints.
- `checkoutService.createOrder(request, sessionUser?: SessionUser)` where `SessionUser = { id: string; email: string }`. `loyaltyCustomerId = sessionUser ? await customerService.ensureCustomerForUser(...) : null`, stored in `webshop_order.customer_id`. `findOrCreateCustomer(request)` and `sale.customer_id` stay exactly as today (D-2).

### 2. Rules snapshot at payment time
`webshop_order.loyalty_rules_snapshot` (jsonb `{ enabled, euroPerStamp, stampsPerCard }`) is written once by `processPaidOrder()` (`UPDATE ... WHERE loyalty_rules_snapshot IS NULL RETURNING`, otherwise read the stored one). Every retry of the award (webhook retry or reconciliation) therefore uses the rules of the first processing moment, not the moment of the retry. If the very first read fails, the snapshot stays null and a later retry uses the then-current rules (documented limitation).

### 3. The paid-order pipeline
`loyaltyService.processPaidOrder(order: WebshopOrder): Promise<ProcessPaidResult | null>`:
1. `order.customerId == null` -> return `null` (guest: nothing is written).
2. `rules = snapshot ?? getRules()` (see 2).
3. `ensureDigitalCard(order.customerId)`.
4. `db.transaction`: lock the card row (`SELECT ... FOR UPDATE`) -> `redeemReservation(order, tx)` (deduct first; independent of the feature flag because the reward is already on the order) -> `awardStampsForOrder(order, rules, tx)` (only when `rules.enabled`) -> set `webshop_order.loyalty_processed_at = now()`.
5. Returns `{ stampsEarned, becameFull, balance, stampsRequired }`.

Idempotency comes from unique `(webshop_order_id, entry_type)` on `loyalty_stamp_entry` (`onConflictDoNothing`), reservation status transitions with `WHERE status = ...`, and `loyalty_processed_at`. A repeated run inserts nothing, returns `stampsEarned: 0, becameFull: false`.

`checkoutService.completeSale()`:
- After the sale transaction commits, call private `runLoyaltyStep(order)` in its own try/catch (outside the transaction; before the emails).
- The existing early return for an already-PAID sale (`server/checkoutService.ts` ~382) first calls `runLoyaltyStep(order)`, then returns.
- `runLoyaltyStep` logs `[loyalty] stamp processing failed for order <orderNumber>` plus the error name only (no email, no names, no error message that could embed data) and never rethrows.

**Mollie retry behaviour (answer to the epic open point):** Mollie retries a webhook only when the endpoint answers non-2xx. Because a failed award is swallowed and the webhook answers 200, Mollie will not retry. The already-PAID path alone is therefore **not sufficient**. The reconciliation job (below) is the retry mechanism.

### 4. Basis and stamp maths (`server/loyaltyMath.ts`, pure)
- `computeBasisCents(items: ReadonlyArray<{ price: number; quantity: number; isReward?: boolean }>): number` = sum over non-reward items of `Math.round(price * 100) * quantity`. Shipping is never part of `items`. The webshop has no discounts today; if discounts are added, they must be subtracted here (BR-3 "after discounts").
- `euroToCents(value: string): number` (exact, from the validated two-decimal string).
- `computeStamps(basisCents: number, euroPerStampCents: number): number` = `Math.floor(basisCents / euroPerStampCents)`. Integer arithmetic only; 9,99 / 10,00 = 0; 10,00 = 1; 45,00 = 4; 38,00 = 3.
- `stampsStillNeeded(balance: number, n: number): number` = `Math.max(0, n - balance)`.

### 5. Reward line
- The client never sends a reward line. It sends `rewardProductId`; the server builds the line.
- Price pack: the product's valid webshop price (`sales_price.webshop_price = true`, valid today) with `webshop_default = true` preferred, else the lowest `id`. Products without a valid webshop price cannot be offered.
- `webshop_order.items` gets `{ productId, priceId, name, price: 0, unit, quantity: 1, category, isReward: true }`; `CheckoutItem` gets `isReward?: boolean`; the request schema strips any client-sent `isReward` (Zod default object stripping; tested).
- `salesline` gets `is_reward boolean not null default false`; the reward row has `unit_price_*` and `total_*` = 0 and the pack weight/unit, so the existing stock movement loop in `completeSale()` deducts the stock like any other line.
- VAT, `subtotalExclVat`, `vatAmount`, `shipping.calculateShipping(productTotalInclVat, ..., productIds)` and the Mollie amount are computed from paid items only (the product id list passed to shipping also excludes the reward).
- The confirmation email, admin notification email and `OrderConfirmation.tsx` show the reward line as "Gratis (beloning)" instead of a price.

### 6. Webshop stock availability (defined here; used only for the reward offer/choice)
A product is **in stock** when `COALESCE(SUM(stock_movement.quantity), 0) > 0`. New `stockMovementService.getProductIdsInStock(productIds: number[]): Promise<Set<number>>` (single SQL: `GROUP BY product_id HAVING SUM(quantity::numeric) > 0`, same aggregation as `getCurrentStock()`). It is **not** applied to paid lines (the shop does not check stock for them today; unchanged). Limitation: `> 0` does not guarantee that the full pack size is available (stock unit is the pack unit, e.g. grams); see Open Questions.

An **active** reward product is `products.webshop_enabled = true AND products.status = '1'` (the same condition `storage.getWebshopProducts()` uses for the catalogue; D-6).

### 7. Reservation lifecycle (`loyalty_reservation.status`)
`reserved` -> `consumed` (paid, N deducted) | `released` (failed, cancelled, expired, or reconciliation) | `needs_followup` (late paid, card no longer holds N).
- **Create:** inside the `createOrder()` transaction (sale, lines, payment, webshop order, reservation all-or-nothing). Card row locked `FOR UPDATE`; `available = balance - SUM(reserved)`; require `available >= N` (N from current rules, stored in `stamps_reserved`); else `REWARD_UNAVAILABLE`.
- **Release:** `handleWebhook()` on `failed`, `cancelled`, `expired` -> `releaseReservation(orderId)` (`UPDATE ... SET status='released' WHERE webshop_order_id=? AND status='reserved'`). If release throws, the webhook answers 500 so Mollie retries (release is idempotent).
- **Mollie creation fails:** the existing cleanup in `createOrder()` additionally deletes the reservation row first (FK), then the order.
- **Late paid after release:** in `redeemReservation()` with status `released`, lock the card; if `balance >= stamps_reserved` insert the redeem entry (-`stamps_reserved`) and set `consumed`; else set `needs_followup` and log `[loyalty] reward needs follow-up for order <orderNumber>`.
- **Pending (bank transfer):** the row stays `reserved` with no maximum duration (UC-045 OQ-1).

### 8. Reconciliation (lost webhooks and failed awards)
`checkoutService.reconcileLoyalty(): Promise<{ checkedReservations: number; checkedPaidOrders: number }>`, processes at most 100 rows per run:
1. `reserved` reservations older than 15 minutes, joined with their order: if the order has a `mollie_payment_id`, call `handleWebhook(molliePaymentId)` (fetches the real status from Mollie and runs the normal paid / release path; `open` and `pending` change nothing, so pending bank transfers keep their reservation). If it has no payment id and is older than 30 minutes, `releaseReservation(orderId)` (the Mollie payment never got created).
2. Orders with `status = 'paid'`, `customer_id IS NOT NULL`, `loyalty_processed_at IS NULL`, `modification_date` older than 10 minutes: `handleWebhook(molliePaymentId)` (already-PAID path runs the loyalty step).
3. Deletes `loyalty_link_attempt` rows older than 7 days.

Trigger: `POST /api/internal/loyalty/reconcile`, protected by `Authorization: Bearer <LOYALTY_RECONCILE_TOKEN>` (constant-time compare; 503 `RECONCILE_NOT_CONFIGURED` when the env var is unset, 401 otherwise). Called every 10 minutes by Cloud Scheduler (infrastructure task, listed in Open Questions; the codebase has no scheduler and Cloud Run instances may scale to zero, so an in-process timer is not used).

## Schema Changes

All in `shared/schema.ts`. Existing tables use `serial` integer primary keys, and the stories specify integer ids, so the new tables follow the existing convention rather than the UUID line in `.claude/rules/database.md` (D-5). Types exported with `InferSelectModel` / `InferInsertModel` for every new table, insert schemas via `createInsertSchema()` with `id`, `creationDate`, `modificationDate` omitted. New imports from `drizzle-orm/pg-core`: `uniqueIndex`, `check`, `AnyPgColumn`.

- [ ] **[A] Remove** `loyalty` table (lines 391-398), `insertLoyaltySchema` (821), `Loyalty` and `InsertLoyalty` (952-953). Verified unused anywhere else in `*.ts`, `*.tsx`, `*.sql`. The generated migration drops the table; no data is migrated (UC-043).
- [ ] **[A]** `loyalty_card`
- [ ] **[A]** `loyalty_stamp_entry`
- [ ] **[A]** `webshop_order`: three new columns
- [ ] **[B]** `loyalty_reservation`, `loyalty_reward_product`, `salesline.is_reward`
- [ ] **[C]** physical-card columns on `loyalty_card`, `loyalty_link_attempt`
- [ ] Migrations: one per slice via `npx drizzle-kit generate` (see the baseline warning below); review SQL before applying; never edit an applied migration.

```ts
// enums
export const loyaltyCardKindEnum = pgEnum("loyalty_card_kind", ["digital", "physical"]);
export const loyaltyCardStatusEnum = pgEnum("loyalty_card_status", ["issued", "linked", "invalid"]);
export const loyaltyEntryTypeEnum = pgEnum("loyalty_entry_type", ["earn", "redeem"]);
export const loyaltyReservationStatusEnum = pgEnum("loyalty_reservation_status",
  ["reserved", "consumed", "released", "needs_followup"]);

// [A]+[C] one number space for digital and physical cards
export const loyaltyCards = pgTable("loyalty_card", {
  id: serial("id").primaryKey(),
  cardNumber: varchar("card_number", { length: 12 }).notNull(),
  kind: loyaltyCardKindEnum("kind").notNull(),
  customerId: integer("customer_id").references(() => customers.id),          // digital: always set; physical: set when linked
  // [C] physical only:
  status: loyaltyCardStatusEnum("status"),                                     // null for digital
  secretCodeHash: text("secret_code_hash"),                                    // HMAC-SHA256 hex; null for digital
  batchLabel: text("batch_label"),
  linkedDigitalCardId: integer("linked_digital_card_id")
    .references((): AnyPgColumn => loyaltyCards.id),
  creationDate: timestamp("creation_date").notNull().default(sql`now()`),
  modificationDate: timestamp("modification_date").notNull().default(sql`now()`),
}, (t) => [
  uniqueIndex("loyalty_card_number_uq").on(t.cardNumber),
  uniqueIndex("loyalty_card_digital_customer_uq").on(t.customerId).where(sql`${t.kind} = 'digital'`), // UC-043 BR-1
  index("loyalty_card_linked_digital_idx").on(t.linkedDigitalCardId),                                  // [C]
  index("loyalty_card_batch_idx").on(t.batchLabel),                                                    // [C]
  check("loyalty_card_shape", sql`(${t.kind} = 'digital' AND ${t.customerId} IS NOT NULL AND ${t.status} IS NULL AND ${t.secretCodeHash} IS NULL)
    OR (${t.kind} = 'physical' AND ${t.status} IS NOT NULL AND ${t.secretCodeHash} IS NOT NULL)`),    // added in the [C] migration
]);

// [A] a stamp balance = SUM(stamps) per digital card
export const loyaltyStampEntries = pgTable("loyalty_stamp_entry", {
  id: serial("id").primaryKey(),
  loyaltyCardId: integer("loyalty_card_id").notNull().references(() => loyaltyCards.id),
  webshopOrderId: integer("webshop_order_id").notNull().references(() => webshopOrders.id), // UC-043 BR-7
  entryType: loyaltyEntryTypeEnum("entry_type").notNull(),
  stamps: integer("stamps").notNull(),                                  // earn > 0, redeem < 0
  basisAmount: decimal("basis_amount", { precision: 10, scale: 2 }),    // null for redeem
  creationDate: timestamp("creation_date").notNull().default(sql`now()`),
}, (t) => [
  uniqueIndex("loyalty_stamp_entry_order_type_uq").on(t.webshopOrderId, t.entryType),
  index("loyalty_stamp_entry_card_idx").on(t.loyaltyCardId, t.creationDate),
  check("loyalty_stamp_entry_sign", sql`(${t.entryType} = 'earn' AND ${t.stamps} > 0) OR (${t.entryType} = 'redeem' AND ${t.stamps} < 0)`),
]);

// [B]
export const loyaltyReservations = pgTable("loyalty_reservation", {
  id: serial("id").primaryKey(),
  loyaltyCardId: integer("loyalty_card_id").notNull().references(() => loyaltyCards.id),
  webshopOrderId: integer("webshop_order_id").notNull().references(() => webshopOrders.id),
  stampsReserved: integer("stamps_reserved").notNull(),                 // N at payment start (UC-045 BR-7)
  rewardProductId: integer("reward_product_id").notNull(),              // no FK: survives product changes
  status: loyaltyReservationStatusEnum("status").notNull().default("reserved"),
  creationDate: timestamp("creation_date").notNull().default(sql`now()`),
  modificationDate: timestamp("modification_date").notNull().default(sql`now()`),
}, (t) => [
  uniqueIndex("loyalty_reservation_order_uq").on(t.webshopOrderId),
  index("loyalty_reservation_card_status_idx").on(t.loyaltyCardId, t.status),
]);

// [B] no FK to product: entries survive deactivation or removal (UC-046)
export const loyaltyRewardProducts = pgTable("loyalty_reward_product", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  creationDate: timestamp("creation_date").notNull().default(sql`now()`),
}, (t) => [uniqueIndex("loyalty_reward_product_product_uq").on(t.productId)]); // UC-046 BR-4

// [C]
export const loyaltyLinkAttempts = pgTable("loyalty_link_attempt", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  cardNumber: varchar("card_number", { length: 12 }),                   // null when the entered number is not 12 digits
  success: boolean("success").notNull(),
  attemptedAt: timestamp("attempted_at").notNull().default(sql`now()`),
}, (t) => [
  index("loyalty_link_attempt_customer_idx").on(t.customerId, t.attemptedAt),
  index("loyalty_link_attempt_card_idx").on(t.cardNumber, t.attemptedAt),
]);

// webshop_order additions [A]
customerId: integer("customer_id").references(() => customers.id),                       // session customer, null for guests
loyaltyRulesSnapshot: jsonb("loyalty_rules_snapshot").$type<LoyaltyRulesSnapshot>(),     // see Cross-Cutting 2
loyaltyProcessedAt: timestamp("loyalty_processed_at"),
// + index("webshop_order_loyalty_pending_idx").on(t.status).where(sql`customer_id IS NOT NULL AND loyalty_processed_at IS NULL`)

// salesline addition [B]
isReward: boolean("is_reward").notNull().default(false),
```

`LoyaltyRulesSnapshot` is `z.infer<typeof loyaltyRulesSchema>` from `shared/loyaltyRules.ts`.

**Migration baseline warning.** `drizzle.config.ts` writes to `./migrations`, but that folder does not exist in the repository, and `server/index.ts` only auto-runs raw SQL from `db/migrations/` (also absent). Running `npx drizzle-kit generate` without a baseline snapshot would emit `CREATE TABLE` for all 50+ existing tables. Before Slice A the implementer must either create a baseline from the production schema (`drizzle-kit pull` snapshot) or trim the generated SQL to the loyalty delta and apply it manually. Decide with the user which deployment path is real (`db:push` vs `migrate`); see Open Questions.

### Parameters (no table change, no seed rows)
`parameter_table` names: `loyalty_enabled` (`"true"`/`"false"`), `loyalty_euro_per_stamp` (`"10.00"`), `loyalty_stamps_per_card` (`"10"`). Missing or unparseable values fall back to `{ enabled: false, euroPerStamp: "10.00", stampsPerCard: 10 }`; an unparseable value logs the parameter name only.

### Shared Zod (`shared/loyaltyRules.ts`, used by server and client form)
```ts
export const loyaltyRulesSchema = z.object({
  enabled: z.boolean(),
  euroPerStamp: z.string().regex(/^\d{1,3}(\.\d{1,2})?$/, "...").refine(v => +v > 0 && +v <= 500, "..."),
  stampsPerCard: z.number().int().min(1).max(100),
});
export const updateLoyaltyRulesSchema = z.object({
  euroPerStamp: loyaltyRulesSchema.shape.euroPerStamp,
  stampsPerCard: loyaltyRulesSchema.shape.stampsPerCard,
  confirmStampsChange: z.boolean().optional(),
});
export type LoyaltyRules = z.infer<typeof loyaltyRulesSchema>;
```
Accepts `500`, `0.01`, `10.5`, `10.55`; rejects `0`, `-1`, `500.01`, `10.123`, `7.5` stamps, `0` and `101` stamps. The admin form converts nl-BE input (`10,5`) with `parseEuropeanNumber()` from `client/src/lib/currency.ts` before validating.

## Backend Changes

### Shared building blocks (all slices)
- [ ] `server/db.ts` — export `type DbExecutor = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0]` (the same derivation `customerService.ts` already uses locally).
- [ ] `server/loyaltyErrors.ts` — `type LoyaltyErrorCode = "INVALID_INPUT" | "CONFIRMATION_REQUIRED" | "PRODUCT_NOT_FOUND" | "PRODUCT_INACTIVE" | "ALREADY_LISTED" | "NOT_RECOGNISED" | "CANNOT_LINK" | "CUSTOMER_BARRED" | "CARD_BLOCKED" | "REWARD_REQUIRES_LOGIN" | "REWARD_REQUIRES_PAID_PRODUCT" | "REWARD_OUT_OF_STOCK" | "REWARD_UNAVAILABLE" | "PRICE_CHANGED"`; `class LoyaltyError extends Error { constructor(readonly code: LoyaltyErrorCode, message: string, readonly details?: Record<string, string | number | boolean | number[]>) }`; `LOYALTY_HTTP_STATUS: Record<LoyaltyErrorCode, number>` = 400, 409, 404, 400, 409, 400, 409, 429, 423, 401, 400, 409, 409, 409 in that order. This replaces the `details?: any` of `RoastServiceError` (no `any`).
- [ ] `server/loyaltyRoutes.ts` — `sendLoyaltyError(res, err)` writes `{ error: err.message, code, ...details }`; non-`LoyaltyError` returns 500 `{ error: "Loyalty operation failed: <operation>", code: "INTERNAL" }` after logging the error name only.

### Slice A

#### Story 9.1.2 — rules
- [ ] `server/loyaltySettingsService.ts`
  - `getRules(): Promise<LoyaltyRules>` reads the three parameters through `parameterService.getParameter()` (same as `free_shipping_threshold_incl_vat`, `server/routes.ts` ~1498) and applies the fallbacks.
  - `updateRules(input: UpdateLoyaltyRulesInput): Promise<LoyaltyRules>`: if `input.stampsPerCard !== current.stampsPerCard` and `confirmStampsChange !== true` throw `LoyaltyError("CONFIRMATION_REQUIRED")`; then `setParameter` for both values. It never touches stamp entries (balances unchanged; past orders not recalculated).
  - `setEnabled(enabled: boolean, confirmed: boolean): Promise<LoyaltyRules>`: `confirmed !== true` -> `CONFIRMATION_REQUIRED`; allowed with an empty reward list (UC-046 BR-6).
  - The two writes in `updateRules` are separate parameter writes (not atomic); both values are validated before the first write.
- [ ] `server/loyaltyRoutes.ts` (all `isAdmin`; 401 unauthenticated, 403 non-admin from the middleware)
  - `GET /api/settings/loyalty-rules` -> `getRules()`
  - `PUT /api/settings/loyalty-rules` body `updateLoyaltyRulesSchema`; Zod failure -> 400 `{ error: "Invalid value for <field>: <reason>", code: "INVALID_INPUT", field }`; returns the new rules
  - `PUT /api/settings/loyalty-rules/enabled` body `{ enabled: boolean, confirmed: boolean }` -> `setEnabled()`

#### Story 9.2.1 — card and earning
- [ ] `server/loyaltyCardCodes.ts` (this slice: `generateCardNumber()`): 12 digits from `crypto.randomInt(0, 10)` per digit (leading zeros allowed, stored as varchar). Extended in Slice C.
- [ ] `server/loyaltyMath.ts` — see Cross-Cutting 4.
- [ ] `server/supabaseAuth.ts` — `optionalAuth` (Cross-Cutting 1).
- [ ] `server/customerService.ts` — `ensureCustomerForUser()`; `updateAccountProfile()` calls `loyaltyService.ensureDigitalCard(newCustomerId)` after its transaction when it created the customer (the insert uses `.returning({ id })`).
- [ ] `server/loyaltyService.ts`
  - `ensureDigitalCard(customerId: number): Promise<LoyaltyCard>`: select by customer (`kind = 'digital'`); else insert with `generateCardNumber()`; retry up to 5 times on `card_number` unique violation; on `customer` unique violation (concurrent creation) re-select.
  - `getBalance(cardId, executor?)`: `COALESCE(SUM(stamps), 0)` via storage.
  - `awardStampsForOrder(order: WebshopOrder, rules: LoyaltyRules, tx: DbExecutor): Promise<{ stampsEarned: number; becameFull: boolean; balance: number }>`: `basis = computeBasisCents(order.items)`; `stamps = computeStamps(basis, euroToCents(rules.euroPerStamp))`; 0 stamps -> no row; else `insertStampEntry({ type: "earn", stamps, basisAmount })` with `onConflictDoNothing` (empty result -> `stampsEarned: 0, becameFull: false`); `becameFull = balanceBefore < N && balanceAfter >= N`.
  - `processPaidOrder(order)` — Cross-Cutting 3.
  - Exported pure helper types: `ProcessPaidResult`.
- [ ] `server/checkoutService.ts` (Slice A parts)
  - `CheckoutRequest` unchanged; `createOrder(request, sessionUser?)` stores `customerId`; the `webshop_order` insert moves **into** the existing sale transaction (needed so Slice B can create the reservation atomically; cleanup on Mollie failure unchanged).
  - `repriceItems(items)` (D-3): one SQL load of `sales_price` rows by `priceId`; each must match `productId`, have `webshop_price = true`, be valid today, and belong to a `webshop_enabled` product, else 400 `INVALID_ITEM`; compare `b2c_price_with_vat` with the request price (tolerance 0.005): mismatch -> `LoyaltyError("PRICE_CHANGED")` (409, `details.productIds`); on match the **database price** is used for totals, lines and the stored `items`.
  - `runLoyaltyStep(order)`, `completeSale()` changes (Cross-Cutting 3), new `loyalty_processed_at` and snapshot handled by `processPaidOrder`.
  - `findOrCreateCustomer()`: after inserting a new non-guest customer call `ensureDigitalCard()` in a try/catch (lazy creation remains the fallback). Admin (`POST /api/customers`) and POS-created customers are not hooked.
- [ ] `server/checkoutRoutes.ts` (new; see D-1) — verbatim move of `GET /api/checkout/customer-data`, `POST /api/checkout/create`, `POST /api/checkout/webhook`, `GET /api/checkout/order/:orderNumber`, with `checkoutRequestSchema` and the Mollie webhook schema. Changes: `POST /api/checkout/create` gets `optionalAuth`, passes `req.user` as `sessionUser`, and maps `LoyaltyError` via `sendLoyaltyError` (the existing generic 500 branch stays for other errors).
- [ ] `server/storage.ts` (additions to `IStorage` and `DatabaseStorage`; every method takes `executor: DbExecutor = db` as the last parameter)
  - `getCardByCustomerId(customerId)`, `getCardById(cardId)`, `getCardByNumber(cardNumber)`, `insertDigitalCard(customerId, cardNumber): Promise<LoyaltyCard | undefined>` (`onConflictDoNothing`)
  - `lockCardForUpdate(cardId)` (`SELECT ... FOR UPDATE`)
  - `getCardBalance(cardId)`, `insertStampEntry(entry): Promise<LoyaltyStampEntry | undefined>` (`onConflictDoNothing`)
  - `getEffectiveRulesSnapshot(orderId, rulesNow)` (`UPDATE ... WHERE snapshot IS NULL RETURNING`, else select), `markLoyaltyProcessed(orderId)`, `listUnprocessedPaidOrders(olderThan: Date, limit: number)`
  - `getWebshopOrderByMolliePaymentId(paymentId)` (if not present)
- [ ] `server/loyaltyRoutes.ts` — see Story 9.2.3.

#### Story 9.2.3 — view card and history
- [ ] `server/loyaltyService.ts`
  - `getCardView(userId: string, email: string): Promise<CardView>` where `CardView = { cardNumber: string; physicalCardNumber: string | null; stamps: number; stampsRequired: number; stampsStillNeeded: number; isFull: boolean; enabled: boolean }`: customer via `ensureCustomerForUser`, card via `ensureDigitalCard` (lazy creation), N from current `getRules()` (a changed N re-judges fullness, balances unchanged), physical number = card with `linked_digital_card_id = digital.id AND status = 'linked'`. Reserved stamps are not subtracted.
  - `getHistory(userId, email, page: number): Promise<{ entries: HistoryEntry[]; page: number; hasMore: boolean }>`; page size 20; `HistoryEntry = { entryId: number; orderNumber: string; orderDate: string; entryType: "earn" | "redeem"; basisAmount: string | null; stamps: number }`; a redemption and an earn on the same order are two entries.
- [ ] `server/storage.ts` — `getPhysicalCardForDigital(digitalCardId)`, `listStampHistory(cardId, limit, offset)` (single query: entries INNER JOIN `webshop_order`, `ORDER BY entry.creation_date DESC, entry.id DESC LIMIT limit+1 OFFSET offset`).
- [ ] `server/loyaltyRoutes.ts` (`isAuthenticated`; the customer comes from `req.user`; no card or customer id is read from query, params or body)
  - `GET /api/account/loyalty-card` -> `getCardView(req.user.id, req.user.email)`
  - `GET /api/account/loyalty-card/history?page=` Zod `z.coerce.number().int().min(1).default(1)` -> `getHistory()`

### Slice B

#### Story 9.1.3 — reward list
- [ ] `server/loyaltySettingsService.ts`: `listRewards(): Promise<RewardListItem[]>` with `RewardListItem = { productId: number; name: string | null; status: "active" | "inactive" | "removed"; packSize: string | null }` (`removed` -> `name: null`, UI shows "Product unavailable"); `listCandidates(): Promise<CandidateItem[]>` (`{ productId, name }`); `addReward(productId: number)`: product missing -> `PRODUCT_NOT_FOUND`, not active -> `PRODUCT_INACTIVE`, duplicate (pre-check or unique violation `23505`) -> `ALREADY_LISTED`; `removeReward(productId: number)` (idempotent).
- [ ] `server/storage.ts`: `listRewardEntries()` (entries LEFT JOIN `product`, `active`/`inactive`/`removed` derived in SQL; pack size via `selectDistinctOn` on the webshop default price), `listRewardCandidates()` (`webshop_enabled AND status='1' AND id NOT IN (SELECT product_id FROM loyalty_reward_product)` in SQL), `getProductForReward(productId)`, `insertReward(productId)`, `deleteReward(productId)`.
- [ ] `server/loyaltyRoutes.ts` (`isAdmin`): `GET /api/settings/loyalty-rewards`, `GET /api/settings/loyalty-rewards/candidates`, `POST /api/settings/loyalty-rewards` body `{ productId: z.number().int().positive() }`, `DELETE /api/settings/loyalty-rewards/:productId` (`parseIdParam` from `server/security.ts`).
- Deleting a product is not blocked (no FK).

#### Story 9.4.1 — redeem at checkout
- [ ] `server/stockMovementService.ts` — `getProductIdsInStock(productIds)` (Cross-Cutting 6).
- [ ] `server/loyaltyRedemptionService.ts`
  - `getRewardOffer(userId, email, cartProductIds: number[]): Promise<RewardOffer>` with `RewardOffer = { eligible: boolean; reason?: "FEATURE_OFF" | "NOT_ENOUGH_STAMPS" | "NO_REWARD_AVAILABLE" | "EMPTY_CART"; stamps: number; availableStamps: number; stampsRequired: number; products: { productId: number; priceId: number; name: string; packSize: string }[] }`. Eligible when: feature on, `balance - reserved >= N`, at least one active in-stock list product (active reward products intersected with `getProductIdsInStock`), `cartProductIds.length > 0`. `stamps` is the balance (not minus reserved); eligibility uses `availableStamps`.
  - `prepareReward(customerId: number | null, rewardProductId: number)`: `null` customer -> `REWARD_REQUIRES_LOGIN`; feature off, product not on list, not active, no valid price -> `REWARD_UNAVAILABLE`; returns the `CheckoutItem` reward line.
  - `reserveStamps(customerId, orderId, rewardProductId, tx)`: stock check first (not in stock -> `REWARD_OUT_OF_STOCK`), then `ensureDigitalCard` + `lockCardForUpdate`, then `available >= N` else `REWARD_UNAVAILABLE`, then insert the reservation (`stampsReserved = N`).
  - `releaseReservation(orderId)`, `deleteReservation(orderId, tx?)`, `redeemReservation(order, tx)` (deduct entry `-stampsReserved`, `consumed`; `released` -> late-paid rule; `consumed` or `needs_followup` -> no-op; no reservation -> no-op), `listStaleReservations(olderThan, limit)`.
- [ ] `server/checkoutService.ts` (Slice B parts)
  - `CheckoutRequest.rewardProductId?: number`, `CheckoutItem.isReward?: boolean`.
  - In `createOrder()`: `rewardLine = rewardProductId ? await prepareReward(loyaltyCustomerId, rewardProductId) : null`; paid items must be non-empty with a positive total, else `REWARD_REQUIRES_PAID_PRODUCT` (defensive; the schema's `items.min(1)` and positive prices already make a reward-only order unreachable); totals, VAT, shipping and Mollie amount from paid items only; the reward `salesline` (`is_reward = true`, zero prices); the order insert and `reserveStamps()` inside the same transaction; cleanup on Mollie failure calls `deleteReservation()` before deleting the order.
  - `handleWebhook()`: after the status update, for `failed`, `cancelled`, `expired` look up the order by payment id and call `releaseReservation(order.id)`.
  - `reconcileLoyalty()` (Cross-Cutting 8).
  - Confirmation and admin emails: reward line text "Gratis (beloning)".
- [ ] `server/storage.ts`: `getReservedStamps(cardId)`, `insertReservation()`, `getReservationByOrderId(orderId)`, `updateReservationStatus(id, from: Status[], to: Status)` (returns affected rows), `deleteReservationByOrderId(orderId)`, `listStaleReservations(olderThan, limit)` (JOIN `webshop_order`), `getActiveRewardProducts()` (entries INNER JOIN active products and valid webshop price, one price per product via `selectDistinctOn`).
- [ ] `server/loyaltyRoutes.ts`:
  - `GET /api/checkout/loyalty-offer?productIds=1,2,3` (`isAuthenticated`; Zod: comma-separated positive integers, 1 to 50 entries) -> `getRewardOffer()`. The story names "ids and quantities"; quantities do not influence eligibility, so only ids are sent (D-7).
  - `POST /api/internal/loyalty/reconcile` (bearer token, Cross-Cutting 8) -> `checkoutService.reconcileLoyalty()`.
- [ ] `server/checkoutRoutes.ts`: `checkoutRequestSchema` gains `rewardProductId: z.number().int().positive().optional()`. A request with `rewardProductId` and no `req.user` returns 401 `REWARD_REQUIRES_LOGIN` and creates nothing (enforced in the service, so it holds for any caller).

#### Story 9.4.2 — exceptions
- [ ] `loyaltyRedemptionService.reserveStamps()` already raises `REWARD_OUT_OF_STOCK` / `REWARD_UNAVAILABLE` inside the `createOrder()` transaction, which rolls back sale, lines, payment, order and reservation; no Mollie payment is started because the Mollie call happens after the transaction. `sendLoyaltyError` maps both to 409 with the `code`. No new file; this story is covered by the 9.4.1 code plus its tests and the checkout UI.

### Slice C

#### Story 9.3.1 — batch script
- [ ] `server/loyaltyCardCodes.ts` (extended)
  - `SECRET_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"` (32 characters, no `0 1 I O`); `generateSecretCode(): string` = 10 characters via `crypto.randomInt(0, 32)` (50 bits).
  - `normalizeSecretCode(input: string): string` (trim, strip spaces and dashes, uppercase).
  - `getPepper(): string` reads `LOYALTY_CODE_PEPPER`; throws `"LOYALTY_CODE_PEPPER is not set or shorter than 32 characters"` when missing or short.
  - `hashSecretCode(code: string, pepper = getPepper()): string` = `createHmac("sha256", pepper).update(normalizeSecretCode(code)).digest("hex")`.
  - `verifySecretCode(code: string, storedHash: string, pepper = getPepper()): boolean` with `timingSafeEqual` on equal-length buffers (length mismatch returns `false` without throwing).
  - `parseBatchArgs(argv: string[]): { count: number; batchLabel: string; dryRun: boolean; outPath: string }`: `--count` positive integer, at most 10 000; `--batch` matches `/^[A-Za-z0-9._-]{1,50}$/`; `--out` default `./loyalty-cards-<batch>.csv`; throws descriptive errors.
  - `formatCardsCsv(cards: { cardNumber: string; secretCode: string }[]): string`.
- [ ] `server/loyaltyService.ts` — `issuePhysicalCardBatch(params: { batchLabel: string; count: number; dryRun: boolean; beforeCommit: (cards: IssuedCard[]) => Promise<void> }): Promise<{ created: number }>` where `IssuedCard = { cardNumber: string; secretCode: string }`. One `db.transaction`: `pg_advisory_xact_lock(hashtext('loyalty-batch:' || label))`; refuse when `batch_label` already exists; generate in memory; insert `kind='physical', status='issued', customer_id=NULL, secret_code_hash=<HMAC>, batch_label` in chunks of 500 with `ON CONFLICT (card_number) DO NOTHING RETURNING` and top up with new numbers until `count` rows exist (collision handling across digital and physical); call `beforeCommit(cards)` last; when `dryRun` run everything (including a rollback-only transaction) and roll back, calling `beforeCommit` never. Any throw rolls everything back.
- [ ] `scripts/generate-loyalty-cards.ts` (pattern of `scripts/fix-all-sequences.ts`; run `npx tsx scripts/generate-loyalty-cards.ts --count 500 --batch 2026-11-A [--dry-run] [--out file.csv]`): validates args and pepper first; `beforeCommit` writes the CSV with `fs.open(path, "wx", 0o600)` (never overwrites) and flushes before the transaction commits; if the commit fails the file is deleted; console output contains only counts, the batch label and the output path, never numbers or codes. No HTTP endpoint.
- [ ] `package.json` — script `"loyalty:cards": "tsx scripts/generate-loyalty-cards.ts"`.
- [ ] `.env.example` — `LOYALTY_CODE_PEPPER=[GENERATE-32+-RANDOM-CHARS]` and `LOYALTY_RECONCILE_TOKEN=[GENERATE-A-RANDOM-TOKEN]` with comments (the pepper must never change once cards are printed: changing it invalidates every unlinked card).
- [ ] `docs/guides/LOYALTY_CARD_BATCHES.md` — how to run, dry run, pepper handling, printer file handling.

#### Story 9.3.2 / 9.3.3 — link and replace
- [ ] `server/loyaltyLinkService.ts` — `linkPhysicalCard(userId: string, email: string, input: { cardNumber: string; secretCode: string; confirmReplace?: boolean }): Promise<CardView>`:
  1. Resolve customer and digital card (`ensureCustomerForUser`, `ensureDigitalCard`). Normalise the number (strip spaces and dashes); a number that is not `^\d{12}$` is treated as unknown (recorded with `card_number = NULL`).
  2. `db.transaction`: `pg_advisory_xact_lock(hashtext('loyalty-link:' || customerId))`, then `lockCardForUpdate(digitalCard.id)`.
  3. **Customer barred?** `getFailureWindow({ customerId }, 15 min)`: barred when at least 5 failures lie within the 15 minutes ending at the customer's most recent failure that is **after the customer's last success**, and `now < lastFailure + 15 min`. Throw `CUSTOMER_BARRED` with `retryAfterSeconds`. Nothing is recorded. Runs before any card check.
  4. If a physical card is linked and `confirmReplace !== true` -> `CONFIRMATION_REQUIRED` (nothing recorded).
  5. **Card blocked?** same rule with scope `cardNumber`, 10 failures, 60 minutes, all customers, **not** reset by any success. Throw `CARD_BLOCKED`; nothing recorded; the code is not checked.
  6. Load the physical card by number. Unknown card or code mismatch (`verifySecretCode`; when the card is unknown, hash against a dummy hash so timing is equal) -> record failure, throw `NOT_RECOGNISED` (the same message for both).
  7. Card status not `issued` (already linked to anyone, including this customer, or invalid) -> record failure, throw `CANNOT_LINK`.
  8. Link: `UPDATE loyalty_card SET status='linked', customer_id=?, linked_digital_card_id=? WHERE id=? AND status='issued' RETURNING`; no row (lost a race) -> record failure, throw `CANNOT_LINK`. For a replacement, in the same transaction set the previous card `status='invalid'`. Record success. Return `getCardView`.
  9. Failures are recorded inside the same transaction, which commits normally when the service returns an error result; the service throws **after** commit by returning a discriminated result internally and throwing outside the transaction, so a recorded failure is never rolled back.
  - Counting is done in SQL (`storage.getFailureWindow(scope, windowMinutes)` returns `{ failureCount, lastFailureAt }`, with the customer scope filtering `attempted_at > last success`), no in-memory counters; the limits are constants in the service (`CUSTOMER_MAX_FAILURES = 5`, `CUSTOMER_WINDOW_MIN = 15`, `CARD_MAX_FAILURES = 10`, `CARD_WINDOW_MIN = 60`), not settings.
  - Linking works while the feature is off (the service never reads `enabled`).
  - Never logs or returns the code; logs only `customerId` and the outcome code.
- [ ] `server/storage.ts`: `insertLinkAttempt()`, `getFailureWindow()`, `markPhysicalLinked()`, `invalidatePhysicalCard()`, `deleteLinkAttemptsOlderThan()`, `batchLabelExists()`, `insertPhysicalCards()`.
- [ ] `server/security.ts` — `createLoyaltyLinkLimiter()` (express-rate-limit, 30 requests per 15 minutes per IP) used on the link route in addition to the DB-backed limits.
- [ ] `server/loyaltyRoutes.ts` — `POST /api/account/loyalty-card/physical` (`isAuthenticated`, `createLoyaltyLinkLimiter()`); body `{ cardNumber: string max 32, secretCode: string max 32, confirmReplace?: boolean }`; responses 200 (`CardView`), 400 `NOT_RECOGNISED` (also for Zod failures it returns 400 `INVALID_INPUT`), 409 `CANNOT_LINK`, 409 `CONFIRMATION_REQUIRED`, 429 `CUSTOMER_BARRED` (`Retry-After` header and `retryAfterSeconds`), 423 `CARD_BLOCKED`.

### Slice D

#### Story 9.2.2 — card-full email
- [ ] `server/checkoutService.ts` — private `sendCardFullEmail(customerId: number, balance: number, stampsRequired: number)`, modelled on `sendCustomerConfirmation`: loads the customer's email by id (the card owner, not the order email), skips when absent, `getResendClient()`, plain text Dutch: subject `Je Kruze-spaarkaart is vol!`; body states the card is full, current stamps and N, that one free product can be chosen at the next checkout while logged in. Called from `runLoyaltyStep()` only when `result.becameFull === true`, in its own try/catch; failure logs `[loyalty] card-full email failed for order <orderNumber>` (no address). A failed send is not retried (stamps are already stored; the repeated award reports `becameFull = false`).

## Frontend Changes
Design: `docs/design/design_guidelines.md` (brand palette, Inter/Playfair, nl-BE: `formatCurrency()` and `formatNumber()` from `client/src/lib/currency.ts` giving `€ 26,40`; dates with `toLocaleDateString("nl-BE")`; storefront colours `COLORS`, `fontSerif`, `fontSans` from `@/components/storefront/StorefrontLayout`). Admin UI text in English like the existing `Settings.tsx`; storefront text in Dutch. Forms use React Hook Form + Zod; data with TanStack Query. The shared query client has `staleTime: Infinity`, so loyalty queries set `staleTime: 0` and mutations invalidate them explicitly.

### Slice A
- [ ] `client/src/components/admin/LoyaltyRulesSettings.tsx` — shows status badge, euro per stamp (`€ 10,00`), stamps per card; yellow **Edit** button opens the form (Zod from `shared/loyaltyRules.ts`, field errors from the 400 `field`); **Save** opens an AlertDialog (AlertTriangle) with the confirmation, which for a changed N states "applies immediately to all customer cards, so customers may suddenly have, or no longer have, a full card" and then sends `confirmStampsChange: true`; a `Switch` toggle opens an AlertDialog stating the effect ("when off: no stamps are earned, no rewards are offered, balances are preserved"); cancel changes nothing; note "No reward is offered until a product is added" when the list is empty (the list size comes from the reward query of Slice B; before Slice B the note is always shown); shows the updated rules after saving.
- [ ] `client/src/pages/admin/Settings.tsx` — `TabsTrigger value="loyalty"` (`data-testid="tab-loyalty"`, `Gift` icon) and `TabsContent value="loyalty"` rendering `<LoyaltyRulesSettings />` (and `<RewardChoiceListSettings />` from Slice B).
- [ ] `client/src/lib/apiError.ts` — `parseApiError(error: unknown): { status: number | null; code?: string; message?: string; field?: string; retryAfterSeconds?: number }` parsing the `"<status>: <json body>"` message that `apiRequest` throws.
- [ ] `client/src/hooks/useLoyaltyCard.ts` — `useLoyaltyCard()` (`GET /api/account/loyalty-card`), `useStampHistory(page)`, `useLinkPhysicalCard()` mutation (Slice C).
- [ ] `client/src/components/storefront/loyalty/LoyaltyCardPanel.tsx` — card number, QR code (`QRCodeSVG` from `qrcode.react`, value = digital card number), `{stamps}` of `{stampsRequired}`, "Nog {n} stempels nodig" or "Je kaart is vol", linked physical number when present, "Fysieke kaart koppelen" button when none (opens the Slice C dialog; hidden until Slice C ships).
- [ ] `client/src/components/storefront/loyalty/StampHistoryList.tsx` — rows: order number, date, basis `€ x,xx` (or "-" for a redemption), `+n` or `-n` stamps; newest first; "Meer laden" button while `hasMore`; empty state "Je hebt nog geen stempels verdiend."
- [ ] `client/src/pages/storefront/Account.tsx` — `TABS` and `TabKey` get `{ key: "loyalty", label: "Spaarkaart", shortLabel: "Spaarkaart", icon: Gift }`; tab bar grid `grid-cols-3` -> `grid-cols-4`; the last-tab border condition (`tab.key !== "top-products"`) becomes `tab.key !== "loyalty"`; `LoyaltyTab` (in this file) composes the two components and, when a loyalty query returns 401, redirects to `/login?returnTo=` + `encodeURIComponent("/account?tab=loyalty")`; the initial tab is read from `?tab=` (`profile|orders|top-products|loyalty`); the existing unauthenticated redirect keeps the tab in `returnTo`. `Login.tsx` already redirects to `returnTo`.

### Slice B
- [ ] `client/src/components/admin/RewardChoiceListSettings.tsx` — shadcn `Table` (name or "Product unavailable", status badge Active / Inactive / Removed), empty-state text "No reward is offered until a product is added", **Add product** `Dialog` listing `candidates` (name) with select, destructive **Remove** button opening an `AlertDialog` with `AlertTriangle` (`text-destructive`); after removing the last product the message about no reward is shown.
- [ ] `client/src/hooks/useLoyaltyOffer.ts` — `useLoyaltyOffer(productIds)` (enabled only when authenticated and the cart is non-empty; `staleTime: 0`, `refetchOnMount: "always"`).
- [ ] `client/src/components/storefront/loyalty/LoyaltyRewardOffer.tsx` — props `{ offer: RewardOffer; selectedProductId: number | null; onSelect(id: number | null): void }`: shows "Je hebt {stamps} van {N} stempels", **Kies je gratis product** / **Nee, bedankt**; product chooser (name, pack size); change-product action; renders nothing when `!offer.eligible`.
- [ ] `client/src/components/storefront/loyalty/RewardUnavailableNotice.tsx` — shown on 409 `REWARD_OUT_OF_STOCK` / `REWARD_UNAVAILABLE`: explains the reward is no longer available; buttons **Doorgaan zonder beloning** (clears `rewardProductId`, resubmits) and **Terug naar winkelwagen** (`/shop/cart`).
- [ ] `client/src/pages/storefront/Checkout.tsx` — state `rewardProductId`; renders `LoyaltyRewardOffer` for authenticated users; summary shows the reward line "Gratis (beloning) - € 0,00" while the total, VAT and shipping stay those of the paid lines (`Cart.tsx` untouched); submit adds `rewardProductId` to the `POST /api/checkout/create` body (`apiRequest` already sends `credentials: "include"`, so the session reaches the endpoint; no change needed there); error handling via `parseApiError`: 409 reward codes -> notice, 409 `PRICE_CHANGED` -> toast "Prijzen zijn gewijzigd, vernieuw je winkelwagen", 401 `REWARD_REQUIRES_LOGIN` -> `/login?returnTo=/shop/checkout`.
- [ ] `client/src/pages/storefront/OrderConfirmation.tsx` (and the item list in `Account.tsx` `OrdersTab` if it prints per-item prices) — `isReward` lines display "Gratis (beloning)" instead of `€0.00`.

### Slice C
- [ ] `client/src/components/storefront/loyalty/LinkPhysicalCardDialog.tsx` — fields card number and secret code (React Hook Form + Zod), submit -> `useLinkPhysicalCard()`; error states by `code`: `NOT_RECOGNISED` "Deze combinatie is niet herkend.", `CANNOT_LINK` "Deze kaart kan niet gekoppeld worden.", `CARD_BLOCKED` "Deze kaart kan op dit moment niet gekoppeld worden.", `CUSTOMER_BARRED` "Je hebt te veel pogingen gedaan. Probeer opnieuw over {minuten} minuten." (the form is replaced by this message, no fields shown); on success a confirmation, the new physical number and unchanged stamps. When `physicalCardNumber` is set the panel offers **Kaart vervangen**, which first opens an `AlertDialog` with `AlertTriangle` stating the current card becomes invalid; only after confirming does the dialog send `confirmReplace: true`.

## Security Considerations
- **Auth and roles:** Admin endpoints (`/api/settings/loyalty-*`): `isAdmin` (401 / 403). Customer endpoints (`/api/account/loyalty-card*`, `/api/checkout/loyalty-offer`): `isAuthenticated`; the customer is derived from `req.user` only and no card or customer id is accepted from query, params or body. `POST /api/checkout/create`: `optionalAuth` (guests allowed, never a 401 from the middleware). `POST /api/checkout/webhook`: unchanged (Mollie id is verified by fetching the payment from Mollie). `POST /api/internal/loyalty/reconcile`: bearer token, constant-time compare, 503 when unset.
- **Identity integrity:** the loyalty customer never comes from the request email or `isGuest`; `rewardProductId` without a session is a 401 and creates nothing; the card used for a reward is always the session customer's; a test covers "guest with matching registered email" for both earning and redemption.
- **Input validation (Zod on all writes):** rules and enabled body, reward add body, `productId` param via `parseIdParam`, offer query, history `page`, link body (max lengths), checkout schema (`rewardProductId`, `isReward` stripped). All server-side; the UI validation is advisory (acceptance criteria require rejection of non-UI requests).
- **Price integrity:** server-side repricing of every checkout item (D-3) so client-sent prices cannot inflate stamps or totals.
- **Secrets:** `LOYALTY_CODE_PEPPER` (at least 32 characters) and `LOYALTY_RECONCILE_TOKEN` from the environment only, listed in `.env.example`, never logged; secret codes are stored only as HMAC-SHA256, compared with `timingSafeEqual`, never logged or returned; the script never prints codes; the printer CSV is created with mode 0600 and never overwrites. Changing the pepper invalidates all unlinked cards.
- **Rate limiting:** DB-backed limits (5 per 15 minutes per customer, 10 per 60 minutes per card number; fixed, SQL counted, survive restarts and multiple instances) plus `createLoyaltyLinkLimiter()` (30 per 15 minutes per IP) on the link route; the global `apiLimiter` already covers `/api`. Attempts rejected as barred or blocked are not recorded, so a block cannot be extended by hammering. An advisory lock per customer prevents parallel requests from overshooting the 5-failure limit; the guarded `UPDATE ... WHERE status='issued'` gives exactly one winner for concurrent links.
- **Enumeration:** unknown number and wrong code give the identical response; a blocked card number is reported without checking the code; digital card numbers are in the same number space but have no secret hash and can never be linked.
- **Concurrency:** card row `FOR UPDATE` serialises reservation and redemption per card; unique constraints make award, redeem and reservation idempotent.
- **No PII in logs:** logs contain order numbers, customer ids, error names and codes only; never email, names, card numbers, secret codes or Mollie payload bodies. Error responses never expose stack traces or DB errors.
- **Helmet/CORS:** unchanged (`server/index.ts`); no CSRF tokens added (JWT cookie auth per project rules).
- **Dependencies:** run `npm audit` before adding `qrcode.react`, `supertest` and the Testing Library packages.

## Test Plan (TDD — tests are written BEFORE implementation)

Conventions (match existing tests and `.claude/rules/testing.md`): Vitest with `globals: true` and `happy-dom` (`vitest.config.ts`); server tests are co-located `server/<name>.test.ts` and mock `./db`, `./storage`, `@shared/schema`, `drizzle-orm` with `vi.mock` like `server/parameterService.test.ts` and `server/salesService.test.ts`; client tests are co-located like `client/src/lib/currency.test.ts`. Every test is named `[<story> AC<n>] ...` and annotated `// Story: 9.x.y | UC: UC-0nn`. Route tests use supertest against a small Express app with `registerLoyaltyRoutes` / `registerCheckoutRoutes` and `vi.mock("./supabaseAuth")` (fake `isAuthenticated`, `isAdmin`, `optionalAuth` driven by a test header). Component tests use React Testing Library with `vi.mock("@/lib/queryClient")`.

**New test dependencies** (not in `package.json` today): `supertest`, `@types/supertest`, `@testing-library/react`, `@testing-library/user-event` (all devDependencies, pinned at install, `npm audit` first). The two SQL-level concerns that mocks cannot prove (counting windows, row locks, unique-constraint idempotency, concurrent races) are covered by `server/loyalty.integration.test.ts`, which runs against `TEST_DATABASE_URL` (schema applied with `npx drizzle-kit push`) and is skipped via `describe.skipIf(!process.env.TEST_DATABASE_URL)` when no test database exists. Rows marked **(int)** below use it.

### Acceptance Criteria → Test Cases

#### Story 9.1.2 — Admin configures rules
| Acceptance Criterion | Test Type | Test Description | File |
|---|---|---|---|
| AC1 Section shows status, euro per stamp, stamps per card | component | Renders badge Off/On, `€ 10,00`, `10` from mocked GET | `client/src/components/admin/LoyaltyRulesSettings.test.tsx` |
| AC2 Defaults off / 10 euro / 10 stamps when nothing stored, also for other readers | service | `getRules()` with no parameters returns `{ enabled:false, euroPerStamp:"10.00", stampsPerCard:10 }`; garbage values fall back | `server/loyaltySettingsService.test.ts` |
| AC2 (same defaults elsewhere) | service | `processPaidOrder()` with no stored rules awards nothing (feature off) | `server/loyaltyService.test.ts` |
| AC3 Euro amount bounds | unit | accepts `0.01`, `10.5`, `500`; rejects `0`, `-1`, `500.01`, `10.123`, `abc` | `shared/loyaltyRules.test.ts` |
| AC4 Stamps bounds | unit | accepts 1 and 100; rejects 0, 101, 7.5 | `shared/loyaltyRules.test.ts` |
| AC5 Invalid value names the field, nothing recorded, rejected from any client | route | PUT with `euroPerStamp:"500.01"` returns 400 `INVALID_INPUT` with `field:"euroPerStamp"`; `updateRules` not called | `server/loyaltyRoutes.test.ts` |
| AC5 Admin can correct input | component | Field error shown under the invalid field, form stays editable, no PUT sent | `client/src/components/admin/LoyaltyRulesSettings.test.tsx` |
| AC6 Confirm before saving; cancel leaves values | component | Save opens AlertDialog; Cancel sends no PUT and shows old values; Confirm sends PUT | `client/src/components/admin/LoyaltyRulesSettings.test.tsx` |
| AC7 Stamps change states immediate effect on all cards; not saved without confirmation | component | Dialog text mentions "all customer cards" only when N changed; PUT includes `confirmStampsChange:true` | `client/src/components/admin/LoyaltyRulesSettings.test.tsx` |
| AC7 (server side) | service | `updateRules` with changed N and no flag throws `CONFIRMATION_REQUIRED`, `setParameter` not called | `server/loyaltySettingsService.test.ts` |
| AC7 (HTTP) | route | PUT changed N without flag returns 409 `CONFIRMATION_REQUIRED`; with flag 200 | `server/loyaltyRoutes.test.ts` |
| AC8 Balances unchanged after N change | service | `updateRules` makes no stamp-entry write; `getCardView` with balance 12 after N 10 -> 15 returns stamps 12, still needed 3, not full | `server/loyaltyService.test.ts` |
| AC9 Euro change not recalculated; applies to later orders | service | Order with stored snapshot `euroPerStamp "10.00"` awards with 10 even after current rules say 5; a new order uses the snapshot taken at its own payment | `server/loyaltyService.test.ts` |
| AC10 On/off needs confirmation stating the effect | component | Toggle opens AlertDialog with "no stamps are earned, no rewards are offered, balances are preserved" when switching off; Cancel leaves status | `client/src/components/admin/LoyaltyRulesSettings.test.tsx` |
| AC10 (server side) | service + route | `setEnabled(true,false)` throws `CONFIRMATION_REQUIRED`; PUT enabled without `confirmed:true` returns 409 | `server/loyaltySettingsService.test.ts`, `server/loyaltyRoutes.test.ts` |
| AC11 On with empty reward list allowed, with note | service + component | `setEnabled(true,true)` succeeds with no rewards; note "No reward is offered until a product is added" rendered | `server/loyaltySettingsService.test.ts`, `client/src/components/admin/LoyaltyRulesSettings.test.tsx` |
| AC12 Updated rules shown after saving | component | After successful PUT the displayed values equal the response | `client/src/components/admin/LoyaltyRulesSettings.test.tsx` |
| AC13 Only admins read/change | route | Each of the 3 endpoints: 401 without session, 403 as customer, 200 as admin | `server/loyaltyRoutes.test.ts` |

#### Story 9.1.3 — Reward choice list
| Acceptance Criterion | Test Type | Test Description | File |
|---|---|---|---|
| AC1 List shows name and active/inactive | component | Rows show name and badge Active / Inactive | `client/src/components/admin/RewardChoiceListSettings.test.tsx` |
| AC1 (data) | service | `listRewards()` maps storage rows to `active` / `inactive` / `removed` | `server/loyaltySettingsService.test.ts` |
| AC2 Default list empty with statement | component | Empty list shows "No reward is offered until a product is added" | `client/src/components/admin/RewardChoiceListSettings.test.tsx` |
| AC3 Only webshop-enabled, not-yet-listed products offered | service + int | `listCandidates()` calls the SQL-filtered storage method; real query excludes listed and disabled products (int) | `server/loyaltySettingsService.test.ts`, `server/loyalty.integration.test.ts` |
| AC4 Choosing adds and shows updated list | component | Picker select triggers POST then refetch; new row visible | `client/src/components/admin/RewardChoiceListSettings.test.tsx` |
| AC5 Inactive or duplicate cannot be added, also outside the UI | route | POST inactive product 400 `PRODUCT_INACTIVE`; duplicate 409 `ALREADY_LISTED`; unknown 404 `PRODUCT_NOT_FOUND`; invalid body 400 | `server/loyaltyRoutes.test.ts` |
| AC5 (service) | service | `addReward` rejects inactive, duplicate, and maps unique violation `23505` | `server/loyaltySettingsService.test.ts` |
| AC6 Removal requires confirmation; cancel leaves list | component | Remove opens AlertDialog with AlertTriangle; Cancel sends no DELETE | `client/src/components/admin/RewardChoiceListSettings.test.tsx` |
| AC7 Removing the last product states no reward | component | After last removal the no-reward message is shown | `client/src/components/admin/RewardChoiceListSettings.test.tsx` |
| AC8 Disabled product stays, shows inactive | int | Disable product, entry still listed with status `inactive` | `server/loyalty.integration.test.ts` |
| AC9 Deleted product stays, shows removed; deletion not blocked | int + component | Entry without product row returns `removed`, name null; product row can be deleted while listed (no FK); UI shows "Product unavailable" | `server/loyalty.integration.test.ts`, `client/src/components/admin/RewardChoiceListSettings.test.tsx` |
| AC10 Only admins | route | 401 / 403 / 200 for GET list, GET candidates, POST, DELETE | `server/loyaltyRoutes.test.ts` |

#### Story 9.2.1 — Digital card and earning
| Acceptance Criterion | Test Type | Test Description | File |
|---|---|---|---|
| AC1 Stamps only for session customer | service | `createOrder(request, undefined)` stores `customerId: null`; with session stores that session's customer; request email/`isGuest` ignored | `server/checkoutService.test.ts` |
| AC2 Guest with matching registered email earns nothing | service | Guest order with email of a registered customer: `customer_id` null, `processPaidOrder` returns null, no stamp entry, no card created | `server/checkoutService.test.ts`, `server/loyaltyService.test.ts` |
| AC3 Session customer receives stamps even with different request email | service | Session customer 7, request email other: order `customerId 7`, entry on customer 7's card | `server/checkoutService.test.ts`, `server/loyaltyService.test.ts` |
| AC3 (HTTP) | route | `POST /api/checkout/create` with and without session passes `req.user` / `undefined` to the service; an expired token does not give 401 | `server/checkoutRoutes.test.ts`, `server/supabaseAuth.test.ts` |
| AC4 POS earns nothing | service | `posService` path does not call `processPaidOrder` (grep-style spy: no import of loyalty in `server/posService.ts`) | `server/loyaltyService.test.ts` |
| AC5 Card created with unique number; one per customer | service + int | `ensureDigitalCard` inserts with generated number, retries on number collision, re-selects on customer collision; unique partial index rejects a second digital card (int); `findOrCreateCustomer` and `updateAccountProfile` call it for new customers | `server/loyaltyService.test.ts`, `server/loyalty.integration.test.ts`, `server/checkoutService.test.ts` |
| AC5 (number format) | unit | `generateCardNumber()` is 12 digits, random across calls | `server/loyaltyCardCodes.test.ts` |
| AC6 Existing customer gets card lazily, no retro stamps | service | `getCardView` and `processPaidOrder` create the card on demand; no earn entries for earlier orders | `server/loyaltyService.test.ts` |
| AC7 Balance = sum of entries, 0 when none | service + int | Zero / earn only / earn plus redeem entries give 0, +n, n-N | `server/loyaltyService.test.ts`, `server/loyalty.integration.test.ts` |
| AC8 Stamps never expire | service | Balance ignores entry age (entry 5 years old still counted) | `server/loyaltyService.test.ts` |
| AC9 Surplus kept | service | Balance 12 with N 10 stays 12; redemption removes only 10 | `server/loyaltyService.test.ts`, `server/loyaltyRedemptionService.test.ts` |
| AC10 Floor(basis/rate) when paid and feature on | unit + service | `computeStamps` table; `awardStampsForOrder` inserts `floor` stamps | `server/loyaltyMath.test.ts`, `server/loyaltyService.test.ts` |
| AC11 Examples 45,00 -> 4; 9,99 -> 0 no entry; 10,00 -> 1; remainder lapses | unit | `computeStamps(4500,1000)=4`, `(999,1000)=0`, `(1000,1000)=1`; zero stamps inserts nothing | `server/loyaltyMath.test.ts`, `server/loyaltyService.test.ts` |
| AC12 Shipping excluded: 38,00 + 6,95 -> 3 | unit | Basis from `items` only equals 38,00 -> 3 stamps | `server/loyaltyMath.test.ts` |
| AC13 Entry linked to order with basis; balance increases | service | Entry has `webshopOrderId`, `basisAmount "38.00"`, `stamps 3` | `server/loyaltyService.test.ts` |
| AC14 Rate at payment time; later change does not alter entries | service | Snapshot written on first processing, retry uses snapshot; changing parameter later leaves old entries (see 9.1.2 AC9) | `server/loyaltyService.test.ts` |
| AC15 Feature off at payment: nothing, never later | service | `enabled:false` snapshot -> no entry, `loyalty_processed_at` set; a later run with feature on still uses the snapshot and awards nothing | `server/loyaltyService.test.ts` |
| AC16 Pending awards nothing; later paid uses rules at that moment | service | `handleWebhook` with status `open`: no `processPaidOrder`; later `paid`: snapshot taken then | `server/checkoutService.test.ts` |
| AC17 Failed/cancelled/expired awards nothing; retry earns once | service | Non-paid statuses never call `processPaidOrder`; the retry is a new order that earns once | `server/checkoutService.test.ts` |
| AC18 Idempotent award | service + int | Running `processPaidOrder` twice inserts one earn entry (unique `(order, type)`) | `server/loyaltyService.test.ts`, `server/loyalty.integration.test.ts` |
| AC19 Award also on already-PAID webhook | service | Sale already PAID: `completeSale` calls `runLoyaltyStep` before returning; previously failed award is now stored once | `server/checkoutService.test.ts` |
| AC20 Award failure does not fail sale | service | `processPaidOrder` rejects: `handleWebhook` resolves, sale stays PAID, emails still sent | `server/checkoutService.test.ts` |
| AC21 Failed award logged with order number only | service | `console.error` called with order number and error name; assertion that email, names and error message are not in the logged arguments | `server/checkoutService.test.ts` |
| (design) Reconciliation retries missed awards | service | `reconcileLoyalty` calls `handleWebhook` for paid, unprocessed, customer orders older than 10 min; skips guests | `server/checkoutService.test.ts` |
| (design) Repricing | service | Client price != DB price -> `PRICE_CHANGED`; matching price uses DB price; invalid `priceId` -> 400 | `server/checkoutService.test.ts` |

#### Story 9.2.2 — Card-full email
| Acceptance Criterion | Test Type | Test Description | File |
|---|---|---|---|
| AC1 One email when balance crosses N | service | before 8, earn 3, N 10 -> `becameFull` true -> one `resend.emails.send` to the card owner | `server/checkoutService.test.ts`, `server/loyaltyService.test.ts` |
| AC2 None when already full | service | before 12, earn 2 -> `becameFull` false, no email | `server/loyaltyService.test.ts`, `server/checkoutService.test.ts` |
| AC3 One email for several stamps | service | Order earning 5 stamps crossing N sends exactly one email | `server/checkoutService.test.ts` |
| AC4 New email after redeem then full again | service | Redeem drops below N; later crossing sends again (second email) | `server/loyaltyService.test.ts` |
| AC5 0 stamps sends none | service | Basis 9,99 -> no entry, no email | `server/checkoutService.test.ts` |
| AC6 Sent after storing; failure does not fail anything; log has no address | service | `send` rejects: webhook resolves, entry stays, `console.error` args contain no `@`; send is invoked only after `processPaidOrder` resolved | `server/checkoutService.test.ts` |
| AC7 Repeated notification sends no second email | service | Second `completeSale` (already PAID) returns `becameFull:false`, no send | `server/checkoutService.test.ts` |
| AC8 Dutch plain text with stamps and N | service | Subject and text are Dutch, no `html` key, contain balance and N | `server/checkoutService.test.ts` |

#### Story 9.2.3 — View card and history
| Acceptance Criterion | Test Type | Test Description | File |
|---|---|---|---|
| AC1 Loyalty section next to Profile, Orders, Top products | component | Tab bar shows 4 tabs incl. `tab-loyalty`; grid is 4 columns | `client/src/pages/storefront/Account.loyalty.test.tsx` |
| AC2 Shows card number, QR, stamps, still needed, full | component | Renders number, QR svg whose value equals the number, `3 van 10`, "Nog 7 stempels nodig" | `client/src/components/storefront/loyalty/LoyaltyCardPanel.test.tsx` |
| AC3 Still needed = max(0, N - balance) | unit + component | balance 12, N 10 -> 0 and "vol" | `server/loyaltyMath.test.ts`, `client/src/components/storefront/loyalty/LoyaltyCardPanel.test.tsx` |
| AC4 Physical number shown only when linked | component + service | Number shown when present, absent when null; `getCardView` returns it only for status `linked` | `client/src/components/storefront/loyalty/LoyaltyCardPanel.test.tsx`, `server/loyaltyService.test.ts` |
| AC5 Entry point to link when none linked | component | "Fysieke kaart koppelen" visible when no physical card | `client/src/components/storefront/loyalty/LoyaltyCardPanel.test.tsx` |
| AC6 History rows: order number, date, basis, stamps +/- | component + service | Row shows `WS-...`, nl-BE date, `€ 38,00`, `+3`; redeem row `-10` with "-" basis | `client/src/components/storefront/loyalty/StampHistoryList.test.tsx`, `server/loyaltyService.test.ts` |
| AC7 Newest first, browse beyond 20 | service + route + int | `getHistory` uses limit 21 / offset, `hasMore`; page 2 returns entries 21 to 40; ordering newest first (int) | `server/loyaltyService.test.ts`, `server/loyaltyRoutes.test.ts`, `server/loyalty.integration.test.ts` |
| AC8 Empty state | component | No entries shows "Je hebt nog geen stempels verdiend." | `client/src/components/storefront/loyalty/StampHistoryList.test.tsx` |
| AC9 Only own card; no id from client | route | Endpoints ignore `?customerId=`, `?cardId=` and body ids; service receives `req.user.id` / email | `server/loyaltyRoutes.test.ts` |
| AC10 Pre-feature customer gets card on first open | service | `getCardView` for customer without card creates it | `server/loyaltyService.test.ts` |
| AC11 Feature off: card and history stay, balance unchanged | service + route | `enabled:false`: view still returns stamps and `enabled:false`; history returned | `server/loyaltyService.test.ts`, `server/loyaltyRoutes.test.ts` |
| AC12 Expired session -> login with return address | component + route | Query 401 -> `setLocation("/login?returnTo=%2Faccount%3Ftab%3Dloyalty")`; unauthenticated redirect keeps the tab; routes return 401 without session | `client/src/pages/storefront/Account.loyalty.test.tsx`, `server/loyaltyRoutes.test.ts` |
| AC13 nl-BE amounts and locale dates | component | `€ 1.250,00`, date `13/11/2026`-style via `nl-BE` | `client/src/components/storefront/loyalty/StampHistoryList.test.tsx` |

#### Story 9.3.1 — Batch script
| Acceptance Criterion | Test Type | Test Description | File |
|---|---|---|---|
| AC1 500 cards issued, no customer, with batch label | service + int | `issuePhysicalCardBatch({count:500,batchLabel})` inserts 500 rows `status issued`, `customer_id null`, label set (int against real table) | `server/loyaltyService.test.ts`, `server/loyalty.integration.test.ts` |
| AC2 Unique across digital and physical; collision regenerates | service + int | Mock insert returns fewer rows on conflict -> top-up until count; real unique index shared with a digital card (int) | `server/loyaltyService.test.ts`, `server/loyalty.integration.test.ts` |
| AC3 Unpredictable, long enough, unambiguous alphabet | unit | `generateSecretCode()` length 10, only alphabet characters, no `0 1 I O`, 1000 samples distinct | `server/loyaltyCardCodes.test.ts` |
| AC4 Never stored readable | service | Inserted rows contain only the 64-hex hash, not the code | `server/loyaltyService.test.ts` |
| AC5 Printer file only place; nothing in console | service | `beforeCommit` receives codes; `console.*` spies never see a code or number | `server/loyaltyService.test.ts` |
| AC6 Refuses without pepper, bad count, duplicate label | unit + service | `getPepper()` throws unset or short; `parseBatchArgs` rejects 0, -1, 1.5, `abc`, 10001; duplicate label throws | `server/loyaltyCardCodes.test.ts`, `server/loyaltyService.test.ts` |
| AC7 Dry run writes nothing and no file | service + int | `dryRun:true`: transaction rolled back, `beforeCommit` not called, row count unchanged (int) | `server/loyaltyService.test.ts`, `server/loyalty.integration.test.ts` |
| AC8 All-or-nothing | service + int | `beforeCommit` throws -> no cards stored; insert failure on chunk 2 -> none stored (int) | `server/loyaltyService.test.ts`, `server/loyalty.integration.test.ts` |
| AC9 Generation, hashing, verification tested incl. different pepper | unit | Same code hashed with pepper A vs B differs; verify true for right code, false for wrong; case/dash normalisation; length-mismatch hash returns false | `server/loyaltyCardCodes.test.ts` |
| AC10 `.env.example` and guide | review | `.env.example` contains `LOYALTY_CODE_PEPPER`; `docs/guides/LOYALTY_CARD_BATCHES.md` exists (checked in PR review, no automated test) | n/a (checklist in PR) |

#### Story 9.3.2 — Link physical card
| Acceptance Criterion | Test Type | Test Description | File |
|---|---|---|---|
| AC1 Customer can enter number and code from the loyalty section | component | Dialog opens from the panel, both fields present | `client/src/components/storefront/loyalty/LinkPhysicalCardDialog.test.tsx` |
| AC2 Valid combination links; confirmation, number, unchanged stamps | service + component | Issued card with right code: status `linked`, `linked_digital_card_id` set, returned view has the physical number and same stamps; UI shows confirmation | `server/loyaltyLinkService.test.ts`, `client/src/components/storefront/loyalty/LinkPhysicalCardDialog.test.tsx` |
| AC3 Linked card cannot be linked by another customer | service | Card status `linked` -> `CANNOT_LINK`, failure recorded | `server/loyaltyLinkService.test.ts` |
| AC4 Unknown number or wrong code: same message, counted, no link | service + component | Both give `NOT_RECOGNISED` with identical message; failure recorded; UI shows "Deze combinatie is niet herkend." | `server/loyaltyLinkService.test.ts`, `client/src/components/storefront/loyalty/LinkPhysicalCardDialog.test.tsx` |
| AC5 Already linked / invalid: "cannot be linked", counted | service | `linked` and `invalid` cards -> `CANNOT_LINK`, failure recorded, no link | `server/loyaltyLinkService.test.ts` |
| AC6 5 failures then barred; 6th refused even with correct card | service + int | Boundaries 4 allowed, 5th failure then barred, 6th with a valid card throws `CUSTOMER_BARRED` (int with real windows) | `server/loyaltyLinkService.test.ts`, `server/loyalty.integration.test.ts` |
| AC7 Barred before any card check | service | When barred, `getCardByNumber` is never called whatever number is given | `server/loyaltyLinkService.test.ts` |
| AC8 Retry after 15 minutes; success resets customer count | int + service | Fake clock +15 min: attempt allowed; after success the customer count restarts | `server/loyalty.integration.test.ts`, `server/loyaltyLinkService.test.ts` |
| AC9 10 failures on a number blocks it 60 minutes; code not checked | service + int | Boundaries 9/10/11; `verifySecretCode` not called when blocked; count restarts after 60 min (int) | `server/loyaltyLinkService.test.ts`, `server/loyalty.integration.test.ts` |
| AC10 Customer A and B failures both count | int | A fails 5, B fails 5 on the same number -> blocked | `server/loyalty.integration.test.ts` |
| AC11 Blocked attempt not counted and does not extend block | service + int | `CARD_BLOCKED` / `CUSTOMER_BARRED` outcomes call no `insertLinkAttempt`; block end time unchanged | `server/loyaltyLinkService.test.ts`, `server/loyalty.integration.test.ts` |
| AC12 Success by one customer does not reset card count for others | int | A links card X; card Y failure counts of B remain | `server/loyalty.integration.test.ts` |
| AC13 Constant-time compare; never logged or returned | unit + service | `verifySecretCode` uses `timingSafeEqual` (spy); no `console` call or response body contains the code | `server/loyaltyCardCodes.test.ts`, `server/loyaltyLinkService.test.ts` |
| AC14 Works with feature off | service | Link succeeds with `enabled:false`; `getRules` never called | `server/loyaltyLinkService.test.ts` |
| AC15 Two simultaneous links give exactly one success | int | `Promise.all` of two customers on the same issued card: one success, one `CANNOT_LINK` | `server/loyalty.integration.test.ts` |
| AC16 Limits fixed, not settings | service + route | Constants 5/15/10/60; no parameter read; route has no settings endpoint for them | `server/loyaltyLinkService.test.ts`, `server/loyaltyRoutes.test.ts` |
| (HTTP contract) | route | Codes 200, 400, 409, 423, 429 with `Retry-After`, 401 without session, 400 invalid body | `server/loyaltyRoutes.test.ts` |
| (HTTP limiter) | unit | `createLoyaltyLinkLimiter()` returns 429 after 30 requests | `server/security.test.ts` |
| (UI barred state) | component | `CUSTOMER_BARRED` replaces the form with the wait message and minutes | `client/src/components/storefront/loyalty/LinkPhysicalCardDialog.test.tsx` |

#### Story 9.3.3 — Replace physical card
| Acceptance Criterion | Test Type | Test Description | File |
|---|---|---|---|
| AC1 "Replace card" offered with confirmation that current card becomes invalid | component | With a linked number the panel shows "Kaart vervangen"; click opens AlertDialog with AlertTriangle and the invalidation text | `client/src/components/storefront/loyalty/LinkPhysicalCardDialog.test.tsx` |
| AC2 Not confirmed -> nothing changes | component | Cancel sends no request | `client/src/components/storefront/loyalty/LinkPhysicalCardDialog.test.tsx` |
| AC3 Not carried out without confirmation, also outside the UI | service + route | No `confirmReplace` while a card is linked -> 409 `CONFIRMATION_REQUIRED`, nothing recorded or changed | `server/loyaltyLinkService.test.ts`, `server/loyaltyRoutes.test.ts` |
| AC4 Same checks, limits and counting as linking | service | Replacement with wrong code counts a failure; barred and blocked behave identically | `server/loyaltyLinkService.test.ts` |
| AC5 New linked and old invalid as one step | int | After success exactly one `linked` card for the digital card; old is `invalid`; a failing second step leaves old `linked` (transaction rollback) | `server/loyalty.integration.test.ts` |
| AC6 Account shows new number, stamps unchanged | service + component | View returns new number and same balance | `server/loyaltyLinkService.test.ts`, `client/src/components/storefront/loyalty/LinkPhysicalCardDialog.test.tsx` |
| AC7 Invalidated card cannot be linked again | service | Linking the old (now `invalid`) card -> `CANNOT_LINK` | `server/loyaltyLinkService.test.ts` |
| AC8 Failed replacement leaves current card linked | service + int | Not recognised, already linked, invalid, blocked: old card still `linked` | `server/loyaltyLinkService.test.ts`, `server/loyalty.integration.test.ts` |
| AC9 Replacing with the same card counts as unusable | service | Same card number as the linked one -> `CANNOT_LINK`, failure recorded, card stays linked | `server/loyaltyLinkService.test.ts` |

#### Story 9.4.1 — Redeem at checkout
| Acceptance Criterion | Test Type | Test Description | File |
|---|---|---|---|
| AC1 Offer when eligible, with stamps and N | service + component | Session customer, feature on, available >= N, one active in-stock reward, cart non-empty -> `eligible:true`; UI shows "10 van 10" | `server/loyaltyRedemptionService.test.ts`, `client/src/components/storefront/loyalty/LoyaltyRewardOffer.test.tsx` |
| AC2 No offer in each blocking case | service + component | Reason `FEATURE_OFF`, `NOT_ENOUGH_STAMPS` (balance minus reserved < N, N-1 boundary), `NO_REWARD_AVAILABLE`, `EMPTY_CART`; component renders nothing; route 401 for guests | `server/loyaltyRedemptionService.test.ts`, `client/src/components/storefront/loyalty/LoyaltyRewardOffer.test.tsx`, `server/loyaltyRoutes.test.ts` |
| AC3 Chooser lists active in-stock products with name and pack size; others excluded | service + int + component | Inactive, removed and out-of-stock excluded; stock query is `SUM > 0` (int) | `server/loyaltyRedemptionService.test.ts`, `server/stockMovementService.test.ts`, `server/loyalty.integration.test.ts`, `client/src/components/storefront/loyalty/LoyaltyRewardOffer.test.tsx` |
| AC4 Choice adds reward line at 0; summary shows all lines, shipping, total | component | Selecting shows "Gratis (beloning) € 0,00"; total equals paid-only total | `client/src/pages/storefront/Checkout.loyalty.test.tsx` |
| AC5 Declining reserves nothing, deducts nothing, earns normally | service + component | Request without `rewardProductId`: no reservation row, no redeem entry, earn entry created; "Nee, bedankt" keeps `rewardProductId` undefined | `server/checkoutService.test.ts`, `client/src/pages/storefront/Checkout.loyalty.test.tsx` |
| AC6 Change chosen product before confirming | component | Change action selects another id; submitted body has the new id | `client/src/components/storefront/loyalty/LoyaltyRewardOffer.test.tsx`, `client/src/pages/storefront/Checkout.loyalty.test.tsx` |
| AC7 At most one reward per order | service + int | One reservation per order (unique `webshop_order_id`); schema accepts a single `rewardProductId` | `server/checkoutService.test.ts`, `server/loyalty.integration.test.ts` |
| AC8 Reward-only order refused | service | Paid items empty / zero total with a reward -> `REWARD_REQUIRES_PAID_PRODUCT`, nothing created; client-sent `isReward` stripped by the schema | `server/checkoutService.test.ts`, `server/checkoutRoutes.test.ts` |
| AC9 No session cannot redeem, even with matching email; nothing reserved | service + route | `rewardProductId` without `req.user` -> 401 `REWARD_REQUIRES_LOGIN`, `createOrder` creates no sale, order or reservation, also when the email belongs to a customer with a full card | `server/checkoutRoutes.test.ts`, `server/checkoutService.test.ts` |
| AC10 Card used is the session customer's | service | Reservation `loyaltyCardId` equals the session customer's card; request carrying another customer's ids has no effect | `server/loyaltyRedemptionService.test.ts` |
| AC11 Totals, VAT, shipping, threshold, basis equal the paid-only order | service | Same cart with and without reward: identical `totalInclVat`, `vatAmount`, `subtotalExclVat`, shipping cost (threshold crossing identical), Mollie amount, basis; `calculateShipping` receives paid total and paid product ids only | `server/checkoutService.test.ts` |
| AC12 Order and Mollie cover paid lines plus shipping; N reserved | service | Mollie `amount.value` is paid total plus shipping; reservation `stampsReserved = N` created in the same transaction | `server/checkoutService.test.ts` |
| AC13 Free product stored as sales line at 0, without VAT, marked reward | service | Inserted `salesline` has `isReward:true`, all price fields `"0.00000"`, pack weight and unit | `server/checkoutService.test.ts` |
| AC14 Reservation not kept when creation fails after reserving | service + int | Mollie `fetch` not ok: reservation, order, payment, lines and sale deleted; reservation row gone (int) | `server/checkoutService.test.ts`, `server/loyalty.integration.test.ts` |
| AC15 Paid: deduct N first (surplus stays), then earn; redemption in history | service + int | Balance 12, N 10, order earns 3: entries `-10` then `+3`, balance 5; redeem entry exists against the order | `server/loyaltyRedemptionService.test.ts`, `server/loyaltyService.test.ts`, `server/loyalty.integration.test.ts` |
| AC16 Stock deducted like any other line | service | `completeSale` creates a negative stock movement for the reward line (weight x amount) | `server/checkoutService.test.ts` |
| AC17 Later change of N does not alter reserved or deducted number | service | Reserve with N=10, rules change to 5 before paid: entry is `-10` | `server/loyaltyRedemptionService.test.ts` |
| AC18 Pending keeps reservation; second checkout gets no offer; no max duration | service + int | Status `open` leaves `reserved`; second `getRewardOffer` -> `NOT_ENOUGH_STAMPS`; `reconcileLoyalty` leaves pending reservations untouched | `server/loyaltyRedemptionService.test.ts`, `server/checkoutService.test.ts` |
| AC19 Failed / cancelled / expired releases, no deduction, no free product | service | `handleWebhook` with each status calls `releaseReservation`; release failure makes the webhook throw (Mollie retries) | `server/checkoutService.test.ts` |
| AC20 Released stamps immediately available | service + int | After release `getRewardOffer` is eligible again | `server/loyaltyRedemptionService.test.ts`, `server/loyalty.integration.test.ts` |
| AC21 Retry reserves again when card still full and product in stock | service | A new `createOrder` after release reserves again; otherwise the 9.4.2 outcomes | `server/checkoutService.test.ts` |
| AC22 Late paid after release: deduct if card holds N, else log for follow-up | service + int | `released` + balance >= N: entry `-N`, `consumed`; balance < N: status `needs_followup`, log has the order number only | `server/loyaltyRedemptionService.test.ts`, `server/loyalty.integration.test.ts` |
| AC23 Repeated paid deducts and awards once | service + int | Second `processPaidOrder` and second webhook add no entries | `server/loyaltyRedemptionService.test.ts`, `server/loyalty.integration.test.ts` |
| AC24 Confirmation page and email list reward at 0 | component + service | `OrderConfirmation` shows "Gratis (beloning)"; email text contains "Gratis (beloning)" for the reward line | `client/src/pages/storefront/OrderConfirmation.loyalty.test.tsx`, `server/checkoutService.test.ts` |
| AC25 Reservation does not alter shown stamps; offer uses balance minus reserved | service | `getCardView` ignores reservations; `getRewardOffer.availableStamps = balance - reserved` | `server/loyaltyService.test.ts`, `server/loyaltyRedemptionService.test.ts` |
| (design) Lost webhook reconciliation | service + route | Stale `reserved` rows: Mollie `expired` -> released, `paid` -> processed, `open` -> kept; no payment id older than 30 min -> released; route 401 / 503 / 200 | `server/checkoutService.test.ts`, `server/loyaltyRoutes.test.ts` |

#### Story 9.4.2 — Exceptions
| Acceptance Criterion | Test Type | Test Description | File |
|---|---|---|---|
| AC1 Out of stock at payment start: informed, no reservation, no payment | service + route | Stock query empty -> `REWARD_OUT_OF_STOCK`, 409 with the code; Mollie `fetch` not called; no reservation | `server/checkoutService.test.ts`, `server/checkoutRoutes.test.ts` |
| AC2 Continue without reward or abandon; stamps stay | component | Notice offers "Doorgaan zonder beloning" and "Terug naar winkelwagen"; stamps unchanged (no entries written) | `client/src/pages/storefront/Checkout.loyalty.test.tsx`, `server/checkoutService.test.ts` |
| AC3 Stamps reserved elsewhere in the meantime: informed before payment | service + route | `available < N` under the lock -> `REWARD_UNAVAILABLE` 409; no Mollie call | `server/loyaltyRedemptionService.test.ts`, `server/checkoutRoutes.test.ts` |
| AC4 Continue without reward or abandon | component | Same notice for `REWARD_UNAVAILABLE`; continue resubmits without `rewardProductId` | `client/src/pages/storefront/Checkout.loyalty.test.tsx` |
| AC5 Two simultaneous creations: exactly one reservation | int | `Promise.all` of two `createOrder` for the same full card: one reservation, other `REWARD_UNAVAILABLE` | `server/loyalty.integration.test.ts` |
| AC6 No sale/order/payment for the failed attempt; continuing creates exactly one | service + int | After either error, `sales`, `webshop_order`, `sale_payment`, `loyalty_reservation` row counts unchanged (transaction rolled back); resubmitting without reward creates one order | `server/checkoutService.test.ts`, `server/loyalty.integration.test.ts` |

#### Cross-cutting infrastructure tests
| Concern | Test Type | Test Description | File |
|---|---|---|---|
| Stock availability (design 6) | service | `getProductIdsInStock` returns only products with `SUM > 0`; none for empty input | `server/stockMovementService.test.ts` |
| `optionalAuth` | middleware | Valid token sets `req.user`; missing / invalid token calls `next()` without `req.user`, no 401, no cookie changes | `server/supabaseAuth.test.ts` |
| `parseApiError` | unit | Parses `"409: {\"code\":\"REWARD_UNAVAILABLE\"}"`, plain text bodies, network errors | `client/src/lib/apiError.test.ts` |
| Checkout routes move is behaviour-neutral | route | Existing four endpoints keep status codes and response shapes (webhook 400 on bad id, order lookup 404) | `server/checkoutRoutes.test.ts` |

### Service Tests (Vitest, mock storage)
Covered in the tables above; minimum per file: `loyaltySettingsService` (defaults, parse fallbacks, confirmations, reward list errors), `loyaltyService` (card creation retry, balance, award maths, snapshot, becameFull transitions, view, history paging, batch issue), `loyaltyRedemptionService` (offer matrix, reserve conflicts, deduct-before-earn, late paid, idempotency), `loyaltyLinkService` (check order, failure recording, windows, replace), `checkoutService` (customer identity, repricing, reward totals, cleanup, webhook branches, reconcile, emails).

### Route Tests (supertest)
`server/loyaltyRoutes.test.ts` and `server/checkoutRoutes.test.ts`: 401 without auth, 403 for non-admin, 400 invalid input (with `code`), 409 / 423 / 429 mappings, 200 valid requests, no card or customer id accepted from the client.

### Component Tests (React Testing Library)
`LoyaltyRulesSettings`, `RewardChoiceListSettings`, `LoyaltyCardPanel`, `StampHistoryList`, `LinkPhysicalCardDialog`, `LoyaltyRewardOffer`, `Account.loyalty`, `Checkout.loyalty`, `OrderConfirmation.loyalty`: render, interaction, confirmation dialogs, error states, nl-BE formatting.

### Implementation Order
Each slice follows the same loop; the next slice starts only when the previous one is green. The feature flag defaults to off, so every slice can be deployed without behaviour change for customers until an admin switches it on.

0. **Foundation** (no behaviour): add test devDependencies; `DbExecutor` in `server/db.ts`; `server/loyaltyErrors.ts`; `shared/loyaltyRules.ts` with `shared/loyaltyRules.test.ts` written first; resolve the migration baseline question.
1. **Slice A** (9.1.2, 9.2.1, 9.2.3)
   1. Schema edits (remove `loyalty`; add card, entry, order columns) and `npx drizzle-kit generate`; review SQL.
   2. Write all failing Slice A tests from the Test Plan (math, card codes `generateCardNumber`, settings service, loyalty service, checkout service identity / repricing / loyalty step, routes, `optionalAuth`, components).
   3. Implement in this order: `loyaltyMath`, `loyaltyCardCodes.generateCardNumber`, storage methods, `loyaltySettingsService`, `loyaltyService`, `optionalAuth`, `customerService.ensureCustomerForUser`, `checkoutService` changes, move to `checkoutRoutes.ts`, `loyaltyRoutes.ts`, then UI (`apiError`, `LoyaltyRulesSettings`, `Settings.tsx`, hooks, `LoyaltyCardPanel`, `StampHistoryList`, `Account.tsx`).
   4. Refactor with tests green; run `npm run check` and `npm run test`; add `qrcode.react` (after `npm audit`).
2. **Slice B** (9.1.3, 9.4.1, 9.4.2)
   1. Schema (`loyalty_reservation`, `loyalty_reward_product`, `salesline.is_reward`) + migration.
   2. Failing tests (reward list, stock, redemption service, checkout reward / reservation / release / reconcile, integration races, components).
   3. Implement: reward list service and UI; `getProductIdsInStock`; redemption service; `createOrder` reward path with the reservation inside the transaction; `handleWebhook` release; `reconcileLoyalty` and the reconcile route; checkout UI, notice, confirmation page and emails.
   4. Refactor; set up the Cloud Scheduler job (every 10 minutes) and `LOYALTY_RECONCILE_TOKEN` before enabling the feature in production.
3. **Slice C** (9.3.1, 9.3.2, 9.3.3)
   1. Schema (physical columns, `loyalty_link_attempt`, check constraint) + migration.
   2. Failing tests (codes, batch issue, link service windows and races, limiter, dialog).
   3. Implement: `loyaltyCardCodes` extensions, `issuePhysicalCardBatch`, script and guide, `.env.example`, link service, route with limiter, dialog and replace flow. Generate and print the first batch only after the pepper is set in the production environment and backed up.
   4. Refactor.
4. **Slice D** (9.2.2): failing email tests, `sendCardFullEmail`, wire into `runLoyaltyStep`, refactor.
5. **Wrap-up:** update the "Implemented By" sections of UC-043 to UC-047, verify `docs/use-cases/INDEX.md` still marks UC-032 and UC-034 as superseded; propose `/generate-tests` gaps review, `/security-audit` (new endpoints), `/review-pr`.

## Decisions Taken in This Spec (not in the stories or use cases)
- **D-1** Move the four `/api/checkout/*` handlers verbatim into `server/checkoutRoutes.ts` so they can be tested with supertest and `routes.ts` does not grow; the loyalty endpoints live in `server/loyaltyRoutes.ts`. Alternative: keep everything in `routes.ts` (route tests then need the whole app).
- **D-2** `sale.customer_id` and `findOrCreateCustomer()` stay unchanged; only `webshop_order.customer_id` carries the session customer. A logged-in user ordering with another email therefore can have sale and loyalty customers that differ.
- **D-3** Server-side repricing of checkout items (409 `PRICE_CHANGED` on mismatch) because the current code trusts client prices and stamps and rewards would make that exploitable. Changes behaviour for all webshop orders (stale carts get a message).
- **D-4** Rules snapshot and `loyalty_processed_at` on `webshop_order`, and the reconciliation endpoint, because Mollie does not retry after a 200 response.
- **D-5** Integer `serial` keys for the new tables (existing convention and story text) instead of the UUID rule in `.claude/rules/database.md`.
- **D-6** "Active" product = `webshop_enabled = true AND status = '1'` (catalogue condition), stricter than the UC wording "enabled in the webshop".
- **D-7** Offer endpoint takes product ids only (quantities are irrelevant to eligibility).
- **D-8** Reward is a product, not a pack; the pack is the product's webshop default price (see Cross-Cutting 5). Products without a valid webshop price are not offered.
- **D-9** Redemption deduction does not depend on the feature flag at payment time (the reward is already on the order); earning does.
- **D-10** `needs_followup` reservation status plus a log line is the only admin follow-up mechanism (no admin UI).
- **D-11** Services split into settings, card, redemption and link services; `DbExecutor` storage parameter pattern.
- **D-12** Link attempt windows: barred while at least 5 failures fall within the 15 minutes ending at the latest failure after the last success; blocked card number likewise 10 / 60. Malformed card numbers count against the customer only (stored with null number). Digital card numbers can be entered but are always "not recognised".
- **D-13** Physical card carries `customer_id` when linked; stamps always live on the digital card.
- **D-14** Customer rows are created lazily for logged-in users without one (`ensureCustomerForUser`); admin and POS customers are not hooked.
- **D-15** A redemption and an earn on the same order are two history rows.
- **D-16** Integration tests against `TEST_DATABASE_URL` (skipped when absent) and new devDependencies (`supertest`, Testing Library) because mocks cannot prove SQL windows, locks and races.
- **D-17** `qrcode.react` is the QR library (no QR dependency exists in `package.json`); pin the exact version (4.x line, React 18 compatible) after `npm audit`.

## Open Questions
1. **Accountant:** is the free product line at 0 euro with 0 VAT acceptable (UC-045 OQ-2)? Spec assumes yes.
2. **Late paid after release:** is "deduct N if the card still holds them, else flag for follow-up" correct? Is a log line plus `needs_followup` status enough, or does the admin need a screen?
3. **Stock rule:** is `stock > 0` enough, or should it be at least the pack size of the reward? (Spec follows `> 0`.)
4. **Repricing (D-3):** approve rejecting stale prices with `PRICE_CHANGED`, or silently use database prices, or leave client-trusted prices (not recommended)?
5. **Schema deployment:** how are schema changes applied in production (`db:push`, drizzle migrations, or SQL in `db/migrations/`)? There is no migrations baseline in the repository (see warning above).
6. **Scheduler:** can a Cloud Scheduler job (every 10 minutes, bearer token) be set up for `/api/internal/loyalty/reconcile`? Without it lost webhooks and failed awards are never repaired.
7. **Test database:** is a throwaway PostgreSQL (`TEST_DATABASE_URL`) available for the integration tests, and may new devDependencies (`supertest`, Testing Library) be added?
8. **Pepper custody:** who stores `LOYALTY_CODE_PEPPER` and its backup? Losing or changing it invalidates every unlinked printed card.
9. **Card-full email retry:** acceptable that a failed send is never retried?
10. **Pre-existing double-stock-deduction risk** in `completeSale()` for concurrent webhooks: fix separately?
