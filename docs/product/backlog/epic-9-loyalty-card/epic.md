# Epic 9 — Webshop Loyalty Stamp Card

**Goal:** Reward repeat webshop customers with a stamp card: stamps are earned on paid webshop orders, a full card is redeemed for one free product at checkout, customers see and extend their card in their account (including a linked printed card), and the admin tunes the rules. Replaces the unused `loyalty` table (supersedes UC-032 and UC-034 for the webshop).

**Priority:** Should (MoSCoW)

**Scope:** Storefront + Admin Dashboard, webshop channel only (no POS). Out of scope: stamp withdrawal on cancel/refund (future), POS stamps/redemption, gift vouchers, admin view/block of customer cards.

**Total Estimated Points:** ~45 points

**Source Use Cases:** UC-043, UC-044, UC-045, UC-046, UC-047 (touched: UC-015, UC-025, UC-026, UC-027)

**Revision:** Revised after story review round 1 (`docs/reviews/epic-9-loyalty-card-story-review-1.md`). Story 9.1.1 (technical data model story) was folded into 9.1.2, 9.1.3, 9.2.1, 9.3.1 and 9.3.2; its number is left as a gap and nothing was renumbered.

## Stories

| Story | Title | Points | MoSCoW | UC References | Status |
|-------|-------|--------|--------|---------------|--------|
| ~~Story 9.1.1~~ | Removed (folded into 9.1.2, 9.1.3, 9.2.1, 9.3.1, 9.3.2); number intentionally unused | - | - | - | Removed |
| [Story 9.1.2](story-9.1.2-admin-configure-rules.md) | Admin Configures Loyalty Card Rules | 5 | Should | UC-046 (Main, AF-3, EF-1) | Not Started |
| [Story 9.1.3](story-9.1.3-admin-reward-choice-list.md) | Admin Manages the Reward Choice List | 3 | Should | UC-046 (AF-1, AF-2) | Not Started |
| [Story 9.2.1](story-9.2.1-earn-stamps-on-paid-order.md) | Digital Card and Earning Stamps on a Paid Webshop Order | 8 | Should | UC-043 (Main, AF-1, AF-3, AF-4, EF-1, BR-6) | Not Started |
| [Story 9.2.2](story-9.2.2-card-full-email.md) | Card-Full Email | 2 | Could | UC-043 (AF-2, BR-8) | Not Started |
| [Story 9.2.3](story-9.2.3-view-loyalty-card.md) | View Loyalty Card and Stamp History | 5 | Should | UC-047, UC-026 | Not Started |
| [Story 9.3.1](story-9.3.1-card-batch-script.md) | Script to Generate Physical Card Batches (Technical Enabler, task) | 3 | Should | UC-044 (Impl. Notes) | Not Started |
| [Story 9.3.2](story-9.3.2-link-physical-card.md) | Link a Physical Card with Attempt Limits | 5 | Should | UC-044 (Main, EF-1 to EF-4) | Not Started |
| [Story 9.3.3](story-9.3.3-replace-physical-card.md) | Replace a Linked Physical Card | 3 | Could | UC-044 (AF-1) | Not Started |
| [Story 9.4.1](story-9.4.1-redeem-full-card.md) | Redeem a Full Loyalty Card at Checkout | 8 | Should | UC-045 (Main, AF-1 to AF-3, EF-3) | Not Started |
| [Story 9.4.2](story-9.4.2-redemption-exceptions.md) | Redemption Exceptions at Checkout: Stock Lost and Reservation Conflict | 3 | Should | UC-045 (EF-1, EF-2) | Not Started |

**Total: 10 stories / 45 points** (story 9.1.1 removed; was 11 stories / 47 points)

## Slices (Use-Case 3.0)
- **Slice A (smallest usable system):** 9.1.2, 9.2.1, 9.2.3 - admin switches on, logged-in customers earn and see stamps
- **Slice B (reward):** 9.1.3, 9.4.1 (ships alone, handles payment failure/pending), then 9.4.2 (checkout-time exceptions)
- **Slice C (physical card):** 9.3.1, 9.3.2, then 9.3.3
- **Slice D (polish):** 9.2.2

## Dependencies
- 9.1.2 -> 9.1.3 (shared settings section and `loyaltyService`), 9.2.1 (`getRules()` and defaults), 9.4.1
- 9.2.1 -> 9.2.2, 9.2.3, 9.3.1 (shares `loyalty_card` table and `generateCardNumber()` helper), 9.4.1 (card, earning, optional auth on checkout)
- 9.1.3 -> 9.4.1 (reward list)
- 9.3.1 -> 9.3.2 -> 9.3.3 (9.3.2 also needs 9.2.3)
- 9.4.1 -> 9.4.2 (9.4.1 is shippable without 9.4.2)
- Existing: `server/checkoutService.ts` (Mollie webhook `completeSale()`), `server/parameterService.ts`, `Account.tsx`, `Checkout.tsx`, `Settings.tsx`

## Open Points (assumptions used in the stories)

From the use cases:
- UC-043 OQ-1: cards for existing customers are created lazily (first card access or first paid order), no retroactive stamps
- UC-043 OQ-2 (refined): stamps are earned and rewards redeemed only for the customer identified by the authenticated session at order creation. `POST /api/checkout/create` gets optional authentication; the customer is never taken from the request email or the `isGuest` flag. Orders without a session (guests) earn nothing and cannot redeem, even when the email matches a registered customer. The session customer is stored in nullable `webshop_order.customer_id`. Reason: checkout is unauthenticated today and `findOrCreateCustomer()` matches by email, so email-based identity would let anyone earn or redeem another customer's stamps (Stories 9.2.1, 9.4.1)
- UC-044 OQ-2: 10 failed attempts / 60 minutes per card number as proposed
- UC-045 OQ-1: reservation lasts until Mollie reports paid, failed, cancelled or expired (no fixed maximum)
- UC-045 OQ-2: reward line booked at 0 euro with 0 VAT, to be confirmed with the accountant
- UC-046 OQ-1/OQ-2: defaults (off, 10 euro, 10 stamps) and bounds (500 euro, 100 stamps) as proposed
- Card number format is not defined in the UCs: 12 random digits proposed (helper created in Story 9.2.1, reused in 9.3.1)

Added by story review round 1:
- **Webshop stock availability does not exist yet** (`createOrder()` has no stock check; UC-024/UC-025 define no stock rules). The spec must define it; proposed: product stock computed from stock movements > 0. Affects Stories 9.4.1 and 9.4.2
- **Late "paid" after the reservation was released (product owner to confirm):** assumed rule is that if the card still holds N stamps they are deducted and the reward is honoured, otherwise the order is logged for manual follow-up by the admin (Story 9.4.1)
- **Lost webhook reconciliation:** reservations whose Mollie notification never arrives must not hold stamps forever; the spec defines a reconciliation (for example release reservations older than the payment's expiry after checking Mollie) (Story 9.4.1)
- **Award retry mechanism:** the stamp award is idempotent and repeated on the already-paid webhook path; the spec confirms Mollie's retry behaviour is sufficient or defines an additional sweep (Story 9.2.1)
- The reward line is booked outside VAT maths; the hard-coded 6% VAT in checkout must not be applied to it (Story 9.4.1)
- The review round 1 optional splits (9.1.2 rules vs switch, 9.2.3 card vs history) were not applied; "I want" lines were reworded to a single capability
