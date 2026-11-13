# UC-043: Collect Stamps on Loyalty Card

A registered customer earns stamps on their loyalty card for every paid webshop order and can follow their progress towards a full card in their account. This drives repeat webshop purchases and supersedes the points-earning use case UC-032 as the simpler stamp card alternative.

## Metadata
- **Domain:** Customer / Storefront
- **Primary Actor:** Registered Customer
- **Secondary Actors:** Payment Provider (Mollie), Email Service (e.g., Resend)
- **Priority:** Should
- **Status:** Draft
- **Interface:** Storefront

## Preconditions
- The customer is registered and logged in (see UC-027).
- The customer has a digital loyalty card, which is added automatically when the customer registers (BR-1).
- The loyalty card rules (euro per stamp, stamps per full card) are configured (see UC-046).

## Main Flow
1. The registered customer places a webshop order and completes payment (see UC-025).
2. The payment provider reports the order as paid.
3. The system determines the number of stamps earned by the order: the product total of the order including VAT and excluding shipping costs, divided by the configured euro amount per stamp, counting whole multiples only.
4. The system adds the stamps to the customer's loyalty card and records them against the order.
5. The registered customer navigates to their account and opens their loyalty card.
6. The system shows the loyalty card: the card number, a QR code representing the card, the current number of stamps, and the number of stamps still needed for a full card.
7. The registered customer opens the stamp history.
8. The system shows, for each order that changed the stamp balance: the order number, the order date, the order amount, and the number of stamps earned or withdrawn.

## Alternative Flows
- **AF-1: Order Cancelled or Fully Refunded** — After step 4, at any later moment, the order is cancelled or refunded in full. The system withdraws all stamps earned by that order and records the withdrawal in the stamp history. The flow continues at step 5, where the customer sees the reduced balance and the withdrawal in the history.
- **AF-2: Order Amount Earns No Stamp** — At step 3, the product total of the order is below the configured euro amount per stamp. The system awards no stamps and the flow continues at step 5.
- **AF-3: Card Becomes Full** — At step 4, the new stamp balance reaches or exceeds the number of stamps required for a full card. The system keeps the surplus stamps on the card and sends the customer an email that the card is full and the reward can be claimed (see UC-045). No email is sent when a card becomes full again because stamps were given back after a cancellation (see AF-1 and UC-045 AF-3). The flow continues at step 5, and at step 6 the system shows that the card is full.
- **AF-4: Order Partially Refunded** — After step 4, at any later moment, part of the order is refunded. The system recalculates the stamps for that order on the remaining product total (including VAT, excluding shipping costs), so that the stamps for the order become the whole multiples of the euro amount per stamp in the remaining amount, and withdraws the difference with the stamps already earned. The withdrawal is recorded in the stamp history. If the order contained a redeemed reward (see UC-045), the stamps deducted for that reward are not given back on a partial refund. The flow continues at step 5.
- **AF-5: Loyalty Card Feature Switched Off** — At step 3, the loyalty card feature is switched off by the admin (see UC-046). The system awards no stamps and the balance on the card is kept unchanged. The flow continues at step 5.

## Exception Flows
- **EF-1: Payment Not Completed** — At step 2, the payment fails, is cancelled, or stays pending. The system awards no stamps. Stamps are awarded once the order is later reported as paid; otherwise the use case ends.

## Postconditions
- The stamps earned by the paid order are on the customer's loyalty card and recorded against the order.
- The customer can see the current stamp balance, the stamps still needed, and the stamp history per order.
- When an order is cancelled or refunded, the stamps it earned (or the part corresponding to the refunded amount) are no longer on the card.
- When the order made the card full, the customer has been informed by email.

## Business Rules
- **BR-1:** Each registered customer has exactly one loyalty card; a customer cannot hold more than one digital loyalty card.
- **BR-2:** One stamp is earned for each whole multiple of the configured euro amount (X euro) in the basis amount of an order. A remainder below X euro lapses and is not carried over to a later order. An order whose basis amount is below X euro earns no stamp.
- **BR-3:** The basis amount of an order is the product total including VAT and excluding shipping costs.
- **BR-4:** Stamps are only earned on paid webshop orders. Orders placed through the POS do not earn stamps.
- **BR-5:** A full card requires the configured number of stamps (N).
- **BR-6:** Stamps do not expire.
- **BR-7:** When an order is cancelled or refunded in full, the stamps earned by that order are withdrawn. When an order is partially refunded, the stamps for that order become the whole multiples of X euro in the remaining basis amount and the difference is withdrawn. Stamps deducted for a redeemed reward are given back only on cancellation or full refund, never on a partial refund (see UC-045). The stamp balance never goes below 0.
- **BR-8:** Each stamp earned or withdrawn is traceable to the order that caused it.
- **BR-9:** While the loyalty card feature is switched off, no stamps are earned and existing balances are kept.
- **BR-10:** The customer receives an email only when the card becomes full through a new paid purchase, never per earned stamp and not when the card becomes full again because stamps were given back after a cancellation.
- **BR-11:** Orders paid while the loyalty card feature was switched off earn no stamps, also not retroactively when the feature is switched on again.

## Implementation Notes
- Supersedes UC-032 (Earn Loyalty Points) for the webshop. UC-032 and UC-034 remain as documents but are marked as superseded in the index.
- The existing `loyalty` table (total, saved and deducted consumption per customer) is replaced by a new loyalty card model. No data migration is performed.
- Each customer record gets a digital card with a unique card number at registration. Customers registered before this feature exists also need a card; the way to provide these is to be decided in the specification.
- Stamps are awarded when the payment provider confirms payment of the webshop order (UC-025, payment result notification), and are tied to the webshop order.
- Cancellation or refund handling needs a hook on the webshop order status change; partial refunds need the remaining basis amount of the order.
- The QR code encodes the card number.
- Physical card numbers are produced by an external script (see UC-044) and use the same card number space as digital cards.
- Out of scope: POS stamps (future use case), gift vouchers.

## Implemented By
- Routes: Not yet implemented
- Services: Not yet implemented
- Components: Not yet implemented
- Storage: Not yet implemented
