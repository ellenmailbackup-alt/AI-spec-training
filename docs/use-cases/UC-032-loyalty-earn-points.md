# UC-032: Earn Loyalty Points

A loyalty member automatically receives points whenever they complete a purchase, building a balance they can later exchange for rewards. This drives repeat visits and rewards customers for their spending with KRUZE.

## Metadata
- **Domain:** Customer / Loyalty / Sales
- **Primary Actor:** Loyalty User
- **Secondary Actors:** None
- **Priority:** Could
- **Status:** Draft (Future Feature)
- **Interface:** Loyalty App (Mobile/PWA), POS (automatic)

## Preconditions
- Loyalty user has a verified and active account.
- Loyalty account is linked to the customer record.
- A purchase has been completed (POS or webshop).

## Main Flow
1. The loyalty user completes a purchase at the POS or through the webshop.
2. The system identifies the customer as a loyalty member.
3. The system calculates the loyalty points earned based on the purchase amount and the configured earn rate.
4. The system adds the points to the customer's loyalty balance.
5. The loyalty user receives a notification in the Loyalty App confirming the points earned.
6. The system updates the points balance displayed in the app.

## Alternative Flows
- **AF-1: View Purchase History** — The loyalty user views their full purchase history with points earned per transaction.
- **AF-2: Bonus Points** — A special promotion awards bonus points (e.g., double-points weekends).
- **AF-3: Points from Challenge** — Completing a challenge awards bonus points (UC-035).

## Exception Flows
- **EF-1: Unlinked Account** — A purchase is made but the customer's loyalty account is not yet linked. Points are held pending until the account is linked.
- **EF-2: Refund** — If a sale is reversed, the corresponding points are deducted from the balance.

## Postconditions
- Points are added to the loyalty account.
- Purchase history shows the transaction with the points earned.
- The cumulative balance is updated.

## Business Rules
- **BR-1:** Points are earned based on EUR spent (configurable rate, e.g., 1 point per €1).
- **BR-2:** Points are awarded on completed and paid sales only.
- **BR-3:** Refunds deduct the corresponding points.
- **BR-4:** Points feed into the badge and rewards system (UC-033, UC-034).

## Implemented By
- Status: **Not yet implemented** — planned future feature
