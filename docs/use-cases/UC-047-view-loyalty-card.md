# UC-047: View Loyalty Card and Stamp History

A registered customer opens their loyalty card in their account to see their card details, how many stamps they have and still need, and which orders earned or used stamps. This keeps the customer informed about progress towards a full card.

## Metadata
- **Domain:** Customer / Storefront
- **Primary Actor:** Registered Customer
- **Secondary Actors:** None
- **Priority:** Should
- **Status:** Draft
- **Interface:** Storefront

## Preconditions
- The customer is registered and logged in (see UC-027).
- The customer has a digital loyalty card (see UC-043 BR-1).

## Main Flow
1. The registered customer navigates to their account and opens their loyalty card (see UC-026).
2. The system shows the loyalty card: the digital card number, a QR code representing the card, the linked physical card number (if one is linked), the current number of stamps, the number of stamps still needed for a full card (0 when the card is full), and whether the card is full.
3. The registered customer opens the stamp history.
4. The system shows, for each order that changed the stamp balance: the order number, the order date, the basis amount (see UC-043 BR-3), and the number of stamps earned or deducted.

## Alternative Flows
- **AF-1: Link a Physical Card** — At step 2, the customer indicates they want to link a printed card. The use case continues as UC-044 and ends here.
- **AF-2: No Stamp History Yet** — At step 4, no order has changed the stamp balance yet. The system shows an empty history. The use case ends.

## Exception Flows
- **EF-1: Session Expired** — At step 1, the customer's session has expired. The system redirects the customer to the login page with a return address, so they can continue after logging in again (see UC-026 EF-2).

## Postconditions
- The customer has seen their current stamps, the stamps still needed, and the stamp history per order.

## Business Rules
- **BR-1:** A customer can only see their own loyalty card and stamp history.
- **BR-2:** The number of stamps still needed is never negative; it is 0 when the card holds the number of stamps required for a full card or more.

## Presentation Guidelines
- **PG-1:** The loyalty card and its history remain visible while the loyalty card feature is switched off; the balance is unchanged (see UC-046).

## Implementation Notes
- The QR code encodes the card number.
- Stamps deducted appear when a reward is redeemed (see UC-045).
- Withdrawing or returning stamps on cancellation or refund is a future use case, dependent on a webshop order cancel/refund capability.

## Implemented By
- Routes: Not yet implemented
- Services: Not yet implemented
- Components: Not yet implemented
- Storage: Not yet implemented
