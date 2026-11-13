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
- The customer's loyalty card holds at least the number of stamps required for a full card (N) that are not reserved by another pending order (see UC-043, UC-047).
- The reward choice list contains at least one active product that is in stock (see UC-046). A product is active when it is enabled in the webshop.
- The customer's cart contains at least one paid product (BR-4).

## Main Flow
1. The registered customer proceeds to checkout (see UC-025, step 1).
2. The system recognises that the customer's loyalty card is full and offers the reward of one free product, showing the customer's current number of stamps, the number of stamps required for a full card, and that one free product can be chosen.
3. The registered customer accepts the offer.
4. The system shows the active, in-stock products on the reward choice list, each with its name and pack size.
5. The registered customer chooses one product.
6. The system adds the chosen product to the order at a price of 0 euro and shows the updated order summary: all order lines with their quantities and prices (the free product marked as reward at 0 euro), the shipping costs, and the total to pay.
7. The registered customer provides the order details and confirms the order to proceed to payment (see UC-025, steps 2 to 5).
8. The system records the order, starts payment with the payment provider (see UC-025, steps 6 to 9), and reserves the number of stamps required for a full card for this order, so the reward cannot be used in another order while payment is pending.
9. The registered customer completes payment (see UC-025, step 10).
10. The payment provider reports the order as paid (see UC-025, step 11).
11. The system deducts the reserved stamps from the loyalty card (surplus stamps remain), then awards the stamps earned by the paid part of the order (see UC-043), and records the redemption in the stamp history against the order.
12. The system shows the order confirmation (see UC-025, step 14).

## Alternative Flows
- **AF-1: Decline the Reward** — At step 3, the customer declines the offer. The order continues without a free product and the stamps remain on the card. The flow continues at step 7 without steps 4 to 6; no stamps are reserved at step 8, and no stamps are deducted and no redemption is recorded at step 11. The order earns stamps as a normal order (see UC-043).
- **AF-2: Change the Chosen Product** — At step 7, before confirming, the customer indicates they want a different free product. The flow continues at step 4, where the system shows the list again.
- **AF-3: Payment Pending** — At step 9, the payment is not confirmed immediately (for example a bank transfer, see UC-025 AF-2). The reservation stays in place. The flow continues at step 10 when the payment provider reports the payment result; a failed, cancelled or expired payment is handled by EF-3.

## Exception Flows
- **EF-1: Chosen Product Out of Stock at Payment Start** — At step 8, the chosen product is no longer in stock. The system removes the free product from the order, reserves no stamps, and informs the customer before payment proceeds. The customer can continue with the remaining order (the flow continues at step 7 without a reward) or abandon the checkout, in which case the use case ends. The stamps remain on the card.
- **EF-2: Stamps Already Reserved by Another Order** — At step 8, the stamps have in the meantime been reserved by another pending order. The system removes the free product from the order and informs the customer that the reward is no longer available for this order, before payment proceeds. The customer can continue with the remaining order (the flow continues at step 7 without a reward) or abandon the checkout, in which case the use case ends.
- **EF-3: Payment Fails, Is Cancelled or Expires** — At step 10, the payment fails, is cancelled, or expires without being completed. The system releases the reservation, deducts no stamps, and the free product is not granted. The customer can retry payment from step 7 (see UC-025); the stamps are then reserved again if the card is still full and the product is still in stock, otherwise EF-1 or EF-2 applies.

## Postconditions
- The chosen product is part of the paid order at 0 euro.
- The number of stamps required for a full card is deducted; surplus stamps remain.
- The paid part of the order has earned stamps; the free product has not.
- The redemption is visible in the stamp history (see UC-047).

## Business Rules
- **BR-1:** The reward can only be redeemed with a full card: at least N stamps that are not reserved by another order, while the loyalty card feature is switched on.
- **BR-2:** One free product is chosen from the reward choice list (see UC-046); only active, in-stock products on the list can be chosen. Active means enabled in the webshop.
- **BR-3:** At most one reward can be redeemed per order. Surplus stamps remain on the card for a later order.
- **BR-4:** An order with a reward must contain at least one paid product; an order consisting only of the free product is not allowed.
- **BR-5:** From the moment payment is started until it is completed or released, the required stamps are reserved and cannot be used for a reward in another order. A reservation is released when the payment fails, is cancelled, or expires according to the payment provider.
- **BR-6:** Stamps are deducted only after payment is confirmed. Only N stamps are deducted; surplus stamps remain. The stamps are deducted before the stamps earned by the same order are added.
- **BR-7:** The number of stamps deducted is N as it was when payment was started. A later change of N (see UC-046) does not alter the reserved or deducted number for that order.
- **BR-8:** The free product is an order line at 0 euro with 0 VAT and does not count towards the stamps earned by the order (see UC-043 BR-3).
- **BR-9:** The reward has no expiry; a full card stays redeemable until it is used.

## Open Questions
- **OQ-1:** Is a fixed maximum duration for a stamp reservation needed, for example for bank transfers that stay pending for days? Default: the reservation lasts until the payment provider reports the payment as paid, failed, cancelled or expired.
- **OQ-2:** The free product line is booked at 0 euro with 0 VAT. To be confirmed with the accountant.

## Implementation Notes
- Supersedes UC-034 (Redeem Loyalty Rewards) for the webshop. Vouchers with codes, expiry and discounts from UC-034 are not part of this use case.
- The reward choice list is configured in UC-046. UC-025 contains the reward extension that links to this use case (AF-5).
- Stamps are reserved when payment is started and deducted when the payment provider's payment result notification marks the order paid, not when the free product is added.
- UC-024 and UC-025 describe no stock rules; availability of the chosen product follows its current webshop stock.
- Withdrawing or returning stamps on cancellation or refund is a future use case, dependent on a webshop order cancel/refund capability.
- Out of scope: gift voucher as reward (future use case, no voucher system exists), POS redemption.

## Implemented By
- Routes: Not yet implemented
- Services: Not yet implemented
- Components: Not yet implemented
- Storage: Not yet implemented
