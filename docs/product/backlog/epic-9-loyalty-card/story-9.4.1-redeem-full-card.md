### Story 9.4.1: Redeem a Full Loyalty Card at Checkout
**As a** logged-in customer with a full loyalty card
**I want** to choose one free product at checkout
**So that** I receive my reward with my order

**References:** UC-045 (Main Flow 1-12, AF-1, AF-2, AF-3, EF-3, BR-1 to BR-9), UC-025 (steps 1-14, AF-2, reward extension AF-5), UC-043 (BR-3, BR-6 ordering), UC-015 (free shipping threshold unaffected)

**Priority:** Should (MoSCoW) | **Estimate:** 8 story points (upper limit for one sprint; stands alone: includes reservation release, so it ships without Story 9.4.2)

**Acceptance Criteria:**

Offer and choice:
- [ ] At checkout, a customer identified by the session, with the feature on, at least N unreserved stamps, at least one active in-stock product on the reward list, and at least one paid product in the cart is offered one free product, with the current stamps and N shown (UC-045 step 2, BR-1)
- [ ] No offer is shown to guests, when the feature is off, when stamps minus reserved stamps are below N, when the list has no active in-stock product, or when the cart contains no paid product (UC-045 Preconditions, BR-4)
- [ ] Accepting the offer shows the active, in-stock products on the list with name and pack size; inactive, removed, and out-of-stock ones cannot be chosen (UC-045 steps 3-5, BR-2)
- [ ] Choosing a product adds it to the order summary as a reward line at 0 euro; the summary shows all lines, shipping costs, and the total to pay (UC-045 step 6)
- [ ] Declining the offer continues without a free product, reserves nothing, deducts nothing, records no redemption, and the order earns stamps normally (UC-045 AF-1)
- [ ] Before confirming, the customer can change the chosen product (UC-045 AF-2)
- [ ] At most one reward per order (UC-045 BR-3)
- [ ] An order consisting only of the free product is refused (UC-045 BR-4)

Customer identity (security):
- [ ] A reward can only be redeemed for the customer identified by the authenticated session at order creation; an order created without a session cannot redeem a reward, even when its email address matches a registered customer, and no stamps are reserved
- [ ] The card used for the reward is always the session customer's card; no card or customer identifier from the request is trusted

Amounts:
- [ ] With a reward line, the total to pay, VAT amounts, shipping costs, free-shipping threshold judgement, and the basis for earning stamps equal the values of the same order without the reward line (paid lines only)

Reservation and payment:
- [ ] When the order is created, the order and Mollie payment cover paid lines plus shipping only, and N stamps (N as of that moment) are reserved for the order so another pending order cannot use them (UC-045 step 8, BR-5, BR-7)
- [ ] The free product is stored as a sales line at 0 euro without VAT, marked as reward (UC-045 BR-8)
- [ ] When the order creation fails after the reservation (for example Mollie payment creation fails), the reservation is not kept
- [ ] When Mollie reports paid, N reserved stamps are deducted first (surplus remains), then the stamps earned by the paid part are added; the redemption is stored against the order and shown in the history as a deduction (UC-045 step 11, BR-6, UC-047 Implementation Notes)
- [ ] Stock for the free product is deducted like any other line when the sale is completed
- [ ] A later change of N does not alter the reserved or deducted number of a started payment (UC-045 BR-7)
- [ ] A pending payment keeps its reservation, a second checkout in that period receives no offer, and the order continues when Mollie reports the result; the reservation has no fixed maximum duration (UC-045 AF-3, BR-5, BR-9)
- [ ] When Mollie reports failed, cancelled, or expired, the reservation is released, no stamps are deducted, and the free product is not granted (UC-045 EF-3, BR-5)
- [ ] Released stamps are immediately available for the offer in another order
- [ ] A retry of payment is possible; the stamps are reserved again when the card is still full and the product is still in stock (when not, the outcomes of Story 9.4.2 apply)
- [ ] When Mollie reports paid for an order whose reservation was already released: if the card still holds at least N stamps they are deducted and the reward is honoured; otherwise the order is logged (order number only) for manual follow-up by the admin (business rule to be confirmed, see epic Open Points)
- [ ] A repeated paid notification deducts and awards only once
- [ ] The order confirmation page and email list the free product as a reward at 0 euro
- [ ] The stamps shown in Story 9.2.3 are the balance and are not altered by a reservation; the checkout offer uses balance minus reserved

**Technical Implementation:**
- Backend:
  - `GET /api/checkout/loyalty-offer` (`isAuthenticated`, input: cart product ids and quantities): returns `{ eligible, stamps, stampsRequired, products: [{ productId, priceId, name, packSize }] }` computed by `loyaltyService.getRewardOffer()`
  - `POST /api/checkout/create` (optional auth introduced in Story 9.2.1): extend `checkoutRequestSchema` (`server/routes.ts` ~3148) with optional `rewardProductId`; a request with `rewardProductId` and no session returns 401 `REWARD_REQUIRES_LOGIN` and creates nothing; `checkoutService.createOrder()` re-validates everything server-side (session customer, feature on, balance minus reservations >= N, product on list, active, in stock, at least one paid line; a reward-only order returns 400 `REWARD_REQUIRES_PAID_PRODUCT`), inserts the 0 euro `salesLines` row, and creates the reservation inside the same transaction as the sale, after the session customer's card row is locked (`SELECT ... FOR UPDATE`)
  - Reservation cleanup when Mollie payment creation fails uses the existing cleanup in `createOrder()`
  - `checkoutService.completeSale()`: call `loyaltyService.redeemReservation(order, tx)` before `awardStampsForOrder()` (Story 9.2.1); the award step stays idempotent and failure-isolated as defined there
  - `checkoutService.handleWebhook()`: on `failed`, `canceled`, `expired` call `loyaltyService.releaseReservation(orderId)` (idempotent)
  - Late paid after release: `redeemReservation()` checks the status; if `released` and balance >= N it re-consumes and deducts, else logs the order number for admin follow-up (no PII)
  - Reconciliation (spec to define): reservations whose Mollie notification never arrives must not block stamps forever, for example a scheduled job that releases `reserved` rows older than the payment's expiry (check the payment status at Mollie before releasing)
  - `CheckoutItem` gets optional `isReward: boolean`; reward lines are excluded from `productTotalInclVat` for basis, VAT (currently a fixed 6% rate), and the shipping threshold
  - Stock: webshop stock availability does not exist today (`createOrder()` has no stock check); the spec must define it, proposed: product stock computed from stock movements > 0 (`stockMovementService`); see epic Open Points
- Frontend: `client/src/pages/storefront/Checkout.tsx` - new `LoyaltyRewardOffer` component with accept/decline, product chooser, change-product action, reward line in the summary (`Cart.tsx` summary untouched; the reward line only exists at checkout); the checkout request must send the session
- Database: new table `loyalty_reservation` (`id`, `loyalty_card_id`, `webshop_order_id` unique, `stamps_reserved` integer, `reward_product_id` integer, `status` 'reserved' | 'consumed' | 'released', `creation_date`, `modification_date`); available stamps = balance minus sum of `reserved` rows; the reward line is a flagged entry in `webshop_order.items` and a 0 euro `salesLines` row
- Tests: boundary N-1/N/N+1 stamps, surplus remains, deduct before earn, rule change after reservation, reward-only order refused, no-session order with reward refused (also with matching registered email), totals equal paid-only values, failed/cancelled/expired release, retry, late paid after release (balance enough / not enough), duplicate paid webhook

**Dependencies:** Story 9.1.2 (feature on), Story 9.1.3 (reward list), Story 9.2.1 (card, earning, optional auth on checkout)
