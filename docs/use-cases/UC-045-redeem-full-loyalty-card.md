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
- The customer's loyalty card holds at least the number of stamps required for a full card (see UC-043).
- The reward choice list contains at least one available product (see UC-046).
- The customer has items in their cart and proceeds to checkout (see UC-025).

## Main Flow
1. The registered customer proceeds to checkout (see UC-025).
2. The system recognises that the customer's loyalty card is full and offers the reward of one free product.
3. The registered customer accepts the offer.
4. The system shows the products on the reward choice list.
5. The registered customer chooses one product.
6. The system adds the chosen product to the order at a price of 0 euro and shows the updated order summary.
7. The registered customer confirms the order and completes payment with the payment provider.
8. The payment provider reports the order as paid.
9. The system deducts the number of stamps required for a full card from the loyalty card. Surplus stamps remain on the card.
10. The system records the redemption in the stamp history against the order and shows the order confirmation.

## Alternative Flows
- **AF-1: Decline the Reward** — At step 3, the customer declines the offer. The order continues without a free product, the stamps remain on the card, and the flow continues at step 7 without steps 4 to 6 and without the deduction at step 9.
- **AF-2: Change the Chosen Product** — At step 7, before confirming, the customer chooses a different product from the list. The system replaces the free product in the order and the flow continues at step 6.

## Exception Flows
- **EF-1: Chosen Product Out of Stock** — At step 5, the chosen product is out of stock. The system informs the customer that the product is not available and asks them to choose another product; if none is available, the order continues without a free product and no stamps are deducted.
- **EF-2: Payment Fails** — At step 8, the payment fails or is cancelled. The system deducts no stamps, the free product is not granted, and the customer can retry payment (see UC-025). The reward remains available.

## Postconditions
- The chosen product is part of the paid order at 0 euro.
- The number of stamps required for a full card is deducted; surplus stamps remain.
- The redemption is visible in the stamp history.

## Business Rules
- **BR-1:** The reward can only be claimed with a full card, that is, at least the configured number of stamps (N).
- **BR-2:** One free product is chosen from the admin-configured reward choice list; products outside the list cannot be chosen.
- **BR-3:** Stamps are deducted only after successful payment of the order.
- **BR-4:** Only the required number of stamps is deducted; surplus stamps remain on the card.
- **BR-5:** The reward has no expiry; a full card stays redeemable until it is used.
- **BR-6:** The free product can only be granted when the chosen product is in stock.

## Open Questions
- **OQ-1:** Can an order that redeems a reward also earn stamps on its paid part (see UC-043)?
- **OQ-2:** If the card holds enough stamps for multiple full cards (2N or more), can several rewards be claimed in one order, or only one per order?
- **OQ-3:** Can the reward be claimed on an order that otherwise consists only of the free product (order total of 0 euro, possibly plus shipping)? Is a minimum order amount required?
- **OQ-4:** If the stamps are claimed by a pending payment and the customer abandons the order, how long is the reward considered reserved (if at all)?
- **OQ-5:** If a redeemed order is later cancelled or refunded, are the deducted stamps given back to the customer?

## Implementation Notes
- Supersedes UC-034 (Redeem Loyalty Rewards) for the webshop. Vouchers with codes, expiry and discounts from UC-034 are not part of this use case.
- The reward choice list is configured in UC-046.
- Stamps are deducted when the payment provider's payment result notification marks the order paid, not when the free product is added.
- Stock availability of the chosen product follows the normal storefront stock rules (see UC-024, UC-025).
- Out of scope: gift voucher as reward (future use case, no voucher system exists), POS redemption.

## Implemented By
- Routes: Not yet implemented
- Services: Not yet implemented
- Components: Not yet implemented
- Storage: Not yet implemented
