### Story 9.4.2: Redemption Exceptions - Stock, Reservation Conflict, and Payment Failure
**As a** registered customer redeeming a reward
**I want** the checkout to handle an unavailable reward or a failed payment gracefully
**So that** I never lose my stamps or pay for something I did not get

**References:** UC-045 (EF-1, EF-2, EF-3, AF-3, BR-5), UC-025 (AF-2, retry payment)

**Priority:** Should (MoSCoW) | **Estimate:** 5 story points (must ship together with Story 9.4.1, otherwise stamps can stay reserved forever)

**Acceptance Criteria:**
- [ ] When the chosen product is out of stock at the moment payment is started, the free line is removed, no stamps are reserved, no Mollie payment is created, and the customer is informed before payment proceeds (UC-045 EF-1)
- [ ] The customer can then continue with the remaining order (no reward, normal earning) or abandon the checkout; the stamps remain on the card in both cases (UC-045 EF-1)
- [ ] When the stamps were reserved by another pending order in the meantime, the free line is removed and the customer is informed that the reward is no longer available for this order, before payment proceeds (UC-045 EF-2)
- [ ] The customer can then continue without reward or abandon the checkout (UC-045 EF-2)
- [ ] Two simultaneous order creations by the same customer with the same full card result in exactly one reservation (card row lock); the other gets the EF-2 outcome
- [ ] The API signals these cases with a 409 and `code` `REWARD_OUT_OF_STOCK` or `REWARD_UNAVAILABLE`, creating no sale, order, or payment, so the client can show the notice and re-submit without the reward
- [ ] When Mollie reports failed, cancelled, or expired, the reservation is released (status `released`), no stamps are deducted, and the free product is not granted (UC-045 EF-3, BR-5)
- [ ] The released stamps are immediately available for the offer in another order
- [ ] A retry of payment is possible; the stamps are reserved again when the card is still full and the product is still in stock, otherwise EF-1 or EF-2 applies (UC-045 EF-3)
- [ ] A pending payment keeps its reservation: a second checkout in that period does not receive the offer (UC-045 AF-3, BR-5)
- [ ] A late "paid" webhook after a "released" status for the same order is handled consistently (a paid result consumes the reservation if the card still holds N stamps, else it is logged for manual follow-up without PII)
- [ ] A reservation of an order whose Mollie payment creation fails is rolled back with the existing cleanup in `createOrder()`

**Technical Implementation:**
- Backend:
  - `checkoutService.createOrder()`: pre-flight check (stock + reservation) inside the transaction; throw typed errors mapped by the route to 409 with the codes above
  - `checkoutService.handleWebhook()`: on statuses `failed`, `canceled`, `expired` call `loyaltyService.releaseReservation(orderId)` (idempotent)
  - `loyaltyService.reserveStamps(cardId, orderId, tx)` uses the card row lock and re-checks balance minus reserved >= N
- Frontend: `Checkout.tsx` handles the 409: shows a notice dialog with "Continue without reward" (re-submits without `rewardProductId`) and "Back to cart"; the retry path reuses the offer from Story 9.4.1
- Database: uses `loyalty_reservation` (Story 9.4.1)
- Tests: each exception flow, race of two creates, webhook order (failed then paid), duplicate failed webhook

**Dependencies:** Story 9.4.1
