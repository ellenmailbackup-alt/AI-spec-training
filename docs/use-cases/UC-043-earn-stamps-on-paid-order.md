# UC-043: Earn Stamps on Paid Order

When a registered customer's webshop order is paid, the system adds stamps to the customer's loyalty card based on the amount spent. This drives repeat webshop purchases and supersedes the points-earning use case UC-032 as the simpler stamp card alternative.

## Metadata
- **Domain:** Customer / Storefront
- **Primary Actor:** Registered Customer
- **Secondary Actors:** Payment Provider (Mollie), Email Service (e.g., Resend)
- **Priority:** Should
- **Status:** Draft
- **Interface:** Storefront

## Preconditions
- The customer is registered (see UC-027) and has a digital loyalty card, added at registration (BR-1).
- The loyalty card rules (euro amount per stamp, stamps per full card) are set (see UC-046; defaults apply until the admin changes them).

## Main Flow
1. The registered customer places a webshop order and starts payment (see UC-025, steps 5 to 10).
2. The payment provider reports the order as paid (see UC-025, step 11).
3. The system checks that the loyalty card feature is switched on and determines the basis amount of the order: the product total including VAT, excluding shipping costs, after discounts (BR-3).
4. The system determines the number of stamps earned: the whole multiples of the euro amount per stamp (X) in the basis amount, using the euro amount per stamp in force at the moment of payment (BR-5).
5. The system adds the stamps to the customer's loyalty card and records them against the order.

## Alternative Flows
- **AF-1: Order Amount Earns No Stamp** — At step 4, the basis amount is below the euro amount per stamp. The system awards no stamps. The use case ends.
- **AF-2: Card Becomes Full** — At step 5, the new stamp balance reaches or exceeds the number of stamps required for a full card (N) while the card was not full before. The system keeps the surplus stamps on the card and sends the customer an email that the card is full and the reward can be redeemed (see UC-045). The use case ends.
- **AF-3: Loyalty Card Feature Switched Off** — At step 3, the loyalty card feature is switched off (see UC-046). The system awards no stamps and the balance on the card is kept unchanged. The use case ends.
- **AF-4: Payment Confirmed Later** — At step 2, the payment is still pending (for example a bank transfer, see UC-025 AF-2). No stamps are awarded yet. When the payment provider later reports the order as paid, the flow continues at step 3, with the rules in force at that moment.

## Exception Flows
- **EF-1: Payment Failed or Cancelled** — At step 2, the payment provider reports that the payment failed or was cancelled. The system awards no stamps. The customer can retry payment (see UC-025); stamps are earned only once a payment succeeds. Otherwise the use case ends.

## Postconditions
- The stamps earned by the paid order are on the customer's loyalty card and recorded against the order.
- When the order made the card full, the customer has been informed by email.
- The customer can see the new balance and the stamp history (see UC-047).

## Business Rules
- **BR-1:** A loyalty card is added for a customer at registration (see UC-027). Each customer has exactly one digital loyalty card.
- **BR-2:** One stamp is earned for each whole multiple of X euro in the basis amount of an order. A remainder below X euro lapses and is not carried over. An order below X euro earns no stamp.
- **BR-3:** The basis amount is the product total including VAT, excluding shipping costs, after discounts. Reason: this is consistent with how the free shipping threshold is judged (see UC-015).
- **BR-4:** Stamps are only earned on paid webshop orders. Orders placed through the POS do not earn stamps.
- **BR-5:** The euro amount per stamp and the feature on/off state in force at the moment of payment determine the stamps of that order. A later change never recalculates past orders, and orders paid while the feature was switched off earn no stamps, also not retroactively.
- **BR-6:** Stamps do not expire.
- **BR-7:** Each stamp earned or deducted is traceable to the order that caused it.
- **BR-8:** The customer receives the card-full email only when the card becomes full through a paid purchase, once per transition to full, never per earned stamp.

## Open Questions
- **OQ-1:** Customers registered before this feature exists have no loyalty card. Proposed default: a card is added automatically on their first visit to their loyalty card or at their first paid order; earlier orders do not earn stamps retroactively. To be confirmed.
- **OQ-2:** Webshop orders are linked to customers by email address only. Should an order placed as a visitor with the email address of a registered customer earn stamps for that customer? To be decided.

## Implementation Notes
- Supersedes UC-032 (Earn Loyalty Points) for the webshop. UC-032 and UC-034 remain as documents but are marked as superseded in the index.
- The existing `loyalty` table is replaced by a new loyalty card model. No data migration is performed.
- Webshop orders have no customer reference; they are linked to a customer through the email address on the order. Stamps are tied to the webshop order.
- Stamps are awarded when the payment provider's payment result notification marks the order paid (UC-025 steps 11 to 12).
- The card-full email is sent when the card becomes full through a paid purchase.
- Withdrawing or returning stamps on cancellation or refund is a future use case, dependent on a webshop order cancel/refund capability.
- Out of scope: POS stamps (future use case), gift vouchers.
- Physical card numbers share the card number space of digital cards (see UC-044).

## Implemented By
- Routes: Not yet implemented
- Services: Not yet implemented
- Components: Not yet implemented
- Storage: Not yet implemented
