# UC-045: Redeem Full Loyalty Card for Free Product

A registered customer with a full loyalty card chooses one free product during checkout, which is added to the order at no cost. This supersedes the points-based reward redemption of UC-034 with a simpler stamp card reward.

## Metadata
- **Domain:** Customer / Storefront
- **Primary Actor:** Registered Customer
- **Secondary Actors:** Payment Provider (Mollie)
- **Priority:** Should
- **Status:** Draft
- **Interface:** Storefront

## Preconditions
- The customer is registered and logged in (see UC-027).
- The loyalty card feature is switched on (see UC-046).
- The customer's loyalty card holds at least the number of stamps required for a full card that are not reserved by another pending order (see UC-043).
- The reward choice list contains at least one active product (see UC-046).
- The customer has items in their cart, including at least one paid product, and proceeds to checkout (see UC-025).

## Main Flow
1. The registered customer proceeds to checkout (see UC-025).
2. The system recognises that the customer's loyalty card is full and offers the reward of one free product.
3. The registered customer accepts the offer.
4. The system shows the active products on the reward choice list.
5. The registered customer chooses one product.
6. The system adds the chosen product to the order at a price of 0 euro and shows the updated order summary.
7. The registered customer confirms the order and starts payment with the payment provider.
8. The system reserves the number of stamps required for a full card for this order, so the reward cannot be used in another order while payment is pending.
9. The registered customer completes payment.
10. The payment provider reports the order as paid.
11. The system deducts the reserved stamps from the loyalty card. Surplus stamps remain on the card.
12. The system awards stamps for the paid part of the order as described in UC-043; the free product does not count towards the stamps earned.
13. The system records the redemption in the stamp history against the order and shows the order confirmation.

## Alternative Flows
- **AF-1: Decline the Reward** — At step 3, the customer declines the offer. The order continues without a free product and the stamps remain on the card. The flow continues at step 7 without steps 4 to 6; no stamps are reserved at step 8, nothing is deducted at step 11, and no redemption is recorded at step 13. The order earns stamps as a normal order (see UC-043).
- **AF-2: Change the Chosen Product** — At step 7, before confirming, the customer chooses a different product from the list. The system replaces the free product in the order and the flow continues at step 6.
- **AF-3: Redeemed Order Cancelled or Refunded** — After step 13, at any later moment, the order is cancelled or refunded. The system gives the deducted stamps back to the loyalty card and records this in the stamp history against the order; stamps earned on the paid part of the order are withdrawn as described in UC-043. The use case ends.

## Exception Flows
- **EF-1: Chosen Product Out of Stock** — At step 5, the chosen product is out of stock. The system informs the customer that the product is not available and asks them to choose another product from the list, after which the flow continues at step 6. If no product on the list is available, the order continues without a free product, the stamps remain on the card, and the flow continues at step 7 as in AF-1.
- **EF-2: Order Has No Paid Product** — At step 7, the order no longer contains a paid product (for example because the customer removed the paid products from the cart). The system removes the free product from the order, informs the customer that the reward requires at least one paid product, and the stamps remain on the card. The customer can add a paid product and restart at step 2, or the use case ends.
- **EF-3: Stamps Already Reserved by Another Order** — At step 8, the stamps have in the meantime been reserved by another pending order. The system removes the free product from the order, informs the customer that the reward is no longer available for this order, and the flow continues at step 9 for the remaining paid order.
- **EF-4: Payment Fails or Is Abandoned** — At step 10, the payment fails, is cancelled, or expires without being completed. The system releases the reservation, deducts no stamps, and the free product is not granted. The customer can retry payment from step 7 (see UC-025), in which case the stamps are reserved again if the card is still full.

## Postconditions
- The chosen product is part of the paid order at 0 euro.
- The number of stamps required for a full card is deducted; surplus stamps remain.
- The paid part of the order has earned stamps; the free product has not.
- The redemption is visible in the stamp history.
- When the redeemed order is cancelled or refunded, the deducted stamps are back on the card.

## Business Rules
- **BR-1:** The reward can only be claimed with a full card, that is, at least the configured number of stamps (N) that are not reserved by another order.
- **BR-2:** One free product is chosen from the admin-configured reward choice list; products outside the list and inactive products cannot be chosen.
- **BR-3:** At most one reward can be claimed per order. Surplus stamps (N or more) remain on the card for a later order.
- **BR-4:** An order with a reward must contain at least one paid product; an order consisting only of the free product (total of 0 euro) is not allowed.
- **BR-5:** From the moment payment is started until it is completed or released, the required stamps are reserved and cannot be used for a reward in another order.
- **BR-6:** Stamps are deducted only after successful payment of the order. When payment fails, is cancelled or expires, the reservation is released.
- **BR-7:** Only the required number of stamps is deducted; surplus stamps remain on the card.
- **BR-8:** The reward has no expiry; a full card stays redeemable until it is used.
- **BR-9:** The free product can only be granted when the chosen product is in stock.
- **BR-10:** The reward is only offered when the loyalty card feature is switched on and the choice list contains at least one active product.
- **BR-11:** The paid part of an order with a reward earns stamps as normal (see UC-043); the free product does not count.
- **BR-12:** When an order with a redeemed reward is cancelled or refunded, the deducted stamps are given back.

## Implementation Notes
- Supersedes UC-034 (Redeem Loyalty Rewards) for the webshop. Vouchers with codes, expiry and discounts from UC-034 are not part of this use case.
- The reward choice list is configured in UC-046.
- Stamps are reserved when payment is started and deducted when the payment provider's payment result notification marks the order paid, not when the free product is added. The specification must define when a pending payment counts as expired so the reservation is released.
- Stock availability of the chosen product follows the normal storefront stock rules (see UC-024, UC-025).
- Out of scope: gift voucher as reward (future use case, no voucher system exists), POS redemption.

## Implemented By
- Routes: Not yet implemented
- Services: Not yet implemented
- Components: Not yet implemented
- Storage: Not yet implemented
