# UC-043: Collect Stamps on Loyalty Card

A registered customer earns stamps on their loyalty card for every paid webshop order and can follow their progress towards a full card in their account. This drives repeat webshop purchases and supersedes the points-earning use case UC-032 as the simpler stamp card alternative.

## Metadata
- **Domain:** Customer / Storefront
- **Primary Actor:** Registered Customer
- **Secondary Actors:** Payment Provider (Mollie)
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
3. The system determines the number of stamps earned by the order, based on the order amount and the configured euro amount per stamp.
4. The system adds the stamps to the customer's loyalty card and records them against the order.
5. The registered customer navigates to their account and opens their loyalty card.
6. The system shows the loyalty card: the card number, a QR code representing the card, the current number of stamps, and the number of stamps still needed for a full card.
7. The registered customer opens the stamp history.
8. The system shows, for each order that changed the stamp balance: the order number, the order date, the order amount, and the number of stamps earned or withdrawn.

## Alternative Flows
- **AF-1: Order Cancelled or Refunded** — At step 4 or later, after stamps were earned, the order is cancelled or refunded. The system withdraws the stamps earned by that order and records the withdrawal in the stamp history. The flow continues at step 5, where the customer sees the reduced balance and the withdrawal in the history.
- **AF-2: Order Amount Earns No Stamp** — At step 3, the order amount is below the configured euro amount per stamp. The system awards no stamps and the flow continues at step 5.
- **AF-3: Card Becomes Full** — At step 4, the new stamp balance reaches or exceeds the number of stamps required for a full card. The system keeps the surplus stamps on the card and, at step 6, shows that the card is full and the reward can be claimed (see UC-045). The flow continues at step 6.

## Exception Flows
- **EF-1: Payment Not Completed** — At step 2, the payment fails, is cancelled, or stays pending. The system awards no stamps. Stamps are awarded once the order is later reported as paid; otherwise the use case ends.

## Postconditions
- The stamps earned by the paid order are on the customer's loyalty card and recorded against the order.
- The customer can see the current stamp balance, the stamps still needed, and the stamp history per order.
- When an order is cancelled or refunded, the stamps it earned are no longer on the card.

## Business Rules
- **BR-1:** Every registered webshop customer automatically receives a digital loyalty card at registration (see UC-027).
- **BR-2:** One stamp is earned for each full configured euro amount (X euro) spent on an order.
- **BR-3:** Stamps are only earned on paid webshop orders. Orders placed through the POS do not earn stamps.
- **BR-4:** A full card requires the configured number of stamps (N).
- **BR-5:** Stamps do not expire.
- **BR-6:** When an order is cancelled or refunded, the stamps earned by that order are withdrawn. The stamp balance never goes below 0.
- **BR-7:** An order amount that does not reach the configured euro amount per stamp earns no stamp.
- **BR-8:** Each stamp earned or withdrawn is traceable to the order that caused it.

## Open Questions
- **OQ-1:** Are partial euros carried over to the next order? For example, with 1 stamp per 10 euro, does an order of 25 euro earn 2 stamps and carry 5 euro over, or is the remainder lost?
- **OQ-2:** Is the stamp threshold measured on the order total including shipping or excluding shipping (and on the amount including or excluding VAT)?
- **OQ-3:** If an order is partially refunded, are stamps withdrawn proportionally or only on full cancellation or refund? (Not specified in the agreed scope; confirm before specification.)
- **OQ-4:** Is the customer notified (for example by email) when stamps are earned or when the card is full? (Not specified in the agreed scope; confirm before specification.)

## Implementation Notes
- Supersedes UC-032 (Earn Loyalty Points) for the webshop. UC-032 and UC-034 remain as documents but are marked as superseded in the index.
- The existing `loyalty` table (total, saved and deducted consumption per customer) is replaced by a new loyalty card model. No data migration is performed.
- Each customer record gets a digital card with a unique card number at registration. Customers registered before this feature exists also need a card; the way to provide these is to be decided in the specification.
- Stamps are awarded when the payment provider confirms payment of the webshop order (UC-025, payment result notification), and are tied to the webshop order.
- Cancellation or refund handling needs a hook on the webshop order status change.
- The QR code encodes the card number.
- Physical card numbers are produced by an external script (see UC-044) and use the same card number space as digital cards.
- Out of scope: POS stamps (future use case), gift vouchers.

## Implemented By
- Routes: Not yet implemented
- Services: Not yet implemented
- Components: Not yet implemented
- Storage: Not yet implemented
