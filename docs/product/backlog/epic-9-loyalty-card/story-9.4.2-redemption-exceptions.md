### Story 9.4.2: Redemption Exceptions at Checkout - Stock Lost and Reservation Conflict
**As a** logged-in customer redeeming a reward
**I want** to be told clearly when my chosen reward is no longer available when I start paying
**So that** I can continue without it or stop, without losing stamps or paying for something I did not get

**References:** UC-045 (EF-1, EF-2, BR-5), UC-025 (AF-2)

**Priority:** Should (MoSCoW) | **Estimate:** 3 story points (builds on Story 9.4.1, which already ships alone and handles failed, cancelled, expired, and pending payments)

**Acceptance Criteria:**
- [ ] When the chosen product has run out of stock at the moment the customer starts paying, the customer is informed before payment proceeds that the free product is no longer available; no stamps are reserved and no payment is started (UC-045 EF-1)
- [ ] The customer can then continue with the remaining order (no reward, normal stamp earning) or abandon the checkout; the stamps remain on the card in both cases (UC-045 EF-1)
- [ ] When the customer's stamps were reserved by another pending order in the meantime, the customer is informed that the reward is no longer available for this order, before payment proceeds; no payment is started (UC-045 EF-2)
- [ ] The customer can then continue without reward or abandon the checkout (UC-045 EF-2)
- [ ] Two simultaneous order creations by the same customer with the same full card result in exactly one reservation; the other gets the reservation-conflict outcome above
- [ ] In both cases no sale, order, or payment is created for the failed attempt, so continuing without the reward creates exactly one order

**Technical Implementation:**
- Backend:
  - `checkoutService.createOrder()`: pre-flight check (stock + reservation) inside the transaction; typed errors mapped by the route to 409 with `code` `REWARD_OUT_OF_STOCK` or `REWARD_UNAVAILABLE`, creating no sale, order, or payment
  - `loyaltyService.reserveStamps(cardId, orderId, tx)` (introduced in Story 9.4.1) uses the card row lock and re-checks balance minus reserved >= N
  - Stock check relies on the webshop stock definition the spec must provide (epic Open Points; proposed: stock from stock movements > 0)
- Frontend: `Checkout.tsx` handles the 409 with a notice offering "Continue without reward" (re-submits without `rewardProductId`) and "Back to cart"
- Database: none (uses `loyalty_reservation` from Story 9.4.1)
- Tests: each exception flow, race of two creates

**Dependencies:** Story 9.4.1
