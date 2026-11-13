### Story 9.4.1: Redeem a Full Loyalty Card at Checkout
**As a** registered customer with a full loyalty card
**I want** to choose one free product at checkout
**So that** I receive my reward with my order

**References:** UC-045 (Main Flow 1-12, AF-1, AF-2, AF-3, BR-1 to BR-9), UC-025 (steps 1-14, AF-2, reward extension AF-5), UC-043 (BR-3, BR-6 ordering), UC-015 (free shipping threshold unaffected)

**Priority:** Should (MoSCoW) | **Estimate:** 8 story points

**Acceptance Criteria:**
- [ ] At checkout, a logged-in customer with the feature on, at least N unreserved stamps, at least one active in-stock product on the reward list, and at least one paid product in the cart sees an offer showing current stamps, N, and that one free product can be chosen (UC-045 step 2, BR-1)
- [ ] No offer is shown to guests, when the feature is off, when stamps minus reserved stamps are below N, when the list has no active in-stock product, or when the cart contains no paid product (UC-045 Preconditions, BR-4)
- [ ] Accepting the offer shows the active, in-stock products on the list with name and pack size; inactive, removed, and out-of-stock ones are not selectable (UC-045 steps 3-5, BR-2)
- [ ] Choosing a product adds it to the order summary as a line marked "reward" at 0 euro; the summary shows all lines, shipping costs, and total to pay, which equals paid lines plus shipping (UC-045 step 6)
- [ ] Declining the offer continues without a free product, reserves nothing, deducts nothing, records no redemption, and the order earns stamps normally (UC-045 AF-1)
- [ ] Before confirming, the customer can change the chosen product, which shows the list again (UC-045 AF-2)
- [ ] At most one reward per order; the offer cannot be accepted twice (UC-045 BR-3)
- [ ] An order consisting only of the free product is rejected (client and server, 400 `REWARD_REQUIRES_PAID_PRODUCT`) (UC-045 BR-4)
- [ ] When the order is created, the order and Mollie payment are created for paid lines plus shipping only, and N stamps (N as of that moment) are reserved for the order so another pending order cannot use them (UC-045 step 8, BR-5, BR-7)
- [ ] The free product is stored as a sales line at 0 euro without VAT, flagged as reward in `webshop_order.items`; it does not count in the basis amount and does not change the VAT calculation or the free-shipping threshold judgement (UC-045 BR-8)
- [ ] When Mollie reports paid, N reserved stamps are deducted first (surplus remains), then the stamps earned by the paid part are added, and the redemption is stored as a stamp entry of type 'redeem' (negative N) against the order, visible in the history as a deduction (UC-045 step 11, BR-6, UC-047 Implementation Notes)
- [ ] Stock for the free product is deducted like any other line when the sale is completed
- [ ] A pending payment keeps the reservation and the order continues when Mollie reports the result (UC-045 AF-3, BR-9: the reward does not expire)
- [ ] A later change of N does not alter the reserved or deducted number of a started payment (UC-045 BR-7)
- [ ] The order confirmation page and email list the free product as reward at 0 euro
- [ ] A duplicate paid webhook deducts and awards only once
- [ ] The stamps shown as available in Story 9.2.3 are not altered by a reservation (balance); the checkout offer uses balance minus reserved

**Technical Implementation:**
- Backend:
  - `GET /api/checkout/loyalty-offer` (`isAuthenticated`, input: cart product ids and quantities): returns `{ eligible, stamps, stampsRequired, products: [{ productId, priceId, name, packSize }] }` computed by `loyaltyService.getRewardOffer()`
  - `POST /api/checkout/create`: extend `checkoutRequestSchema` (`server/routes.ts` ~3148) with optional `rewardProductId`; `checkoutService.createOrder()` re-validates everything server-side (feature on, balance minus reservations >= N, product on list, active, in stock, at least one paid line), inserts the 0 euro `salesLines` row, and creates the reservation inside the same transaction as the sale, after the card row is locked (`SELECT ... FOR UPDATE`)
  - `checkoutService.completeSale()`: call `loyaltyService.redeemReservation(order, tx)` before `awardStampsForOrder()` (Story 9.2.1)
  - `CheckoutItem` gets optional `isReward: boolean`; reward lines are excluded from `productTotalInclVat` for basis and VAT maths
  - Stock availability via the existing stock movement data (`stockMovementService`); see Ambiguity note in the epic
- Frontend: `client/src/pages/storefront/Checkout.tsx` - new `LoyaltyRewardOffer` component with accept/decline, product chooser, change-product action, reward line in the summary (`Cart.tsx` summary untouched; the reward line only exists at checkout)
- Database: new table `loyalty_reservation` (`id`, `loyalty_card_id`, `webshop_order_id` unique, `stamps_reserved` integer, `reward_product_id` integer, `status` 'reserved' | 'consumed' | 'released', `creation_date`, `modification_date`); available stamps = balance minus sum of `reserved` rows
- Tests: boundary N-1/N/N+1 stamps, surplus remains, order of deduct then earn, rule change after reservation, only-free-product rejected

**Dependencies:** Story 9.1.1, Story 9.1.2 (feature on), Story 9.1.3 (reward list), Story 9.2.1 (earning and card)
