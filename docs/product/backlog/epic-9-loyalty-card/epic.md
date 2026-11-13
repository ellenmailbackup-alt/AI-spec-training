# Epic 9 — Webshop Loyalty Stamp Card

**Goal:** Reward repeat webshop customers with a stamp card: stamps are earned on paid webshop orders, a full card is redeemed for one free product at checkout, customers see and extend their card in their account (including a linked printed card), and the admin tunes the rules. Replaces the unused `loyalty` table (supersedes UC-032 and UC-034 for the webshop).

**Priority:** Should (MoSCoW)

**Scope:** Storefront + Admin Dashboard, webshop channel only (no POS). Out of scope: stamp withdrawal on cancel/refund (future), POS stamps/redemption, gift vouchers, admin view/block of customer cards.

**Total Estimated Points:** ~47 points

**Source Use Cases:** UC-043, UC-044, UC-045, UC-046, UC-047 (touched: UC-015, UC-025, UC-026, UC-027)

## Stories

| Story | Title | Points | MoSCoW | UC References | Status |
|-------|-------|--------|--------|---------------|--------|
| [Story 9.1.1](story-9.1.1-loyalty-data-model.md) | Loyalty Card Data Model and Rule Defaults (technical enabler) | 3 | Should | UC-043, UC-044, UC-046 | Not Started |
| [Story 9.1.2](story-9.1.2-admin-configure-rules.md) | Admin Configures Loyalty Card Rules and Feature Switch | 5 | Should | UC-046 (Main, AF-3, EF-1) | Not Started |
| [Story 9.1.3](story-9.1.3-admin-reward-choice-list.md) | Admin Manages the Reward Choice List | 3 | Should | UC-046 (AF-1, AF-2) | Not Started |
| [Story 9.2.1](story-9.2.1-earn-stamps-on-paid-order.md) | Digital Card and Earning Stamps on a Paid Webshop Order | 5 | Should | UC-043 (Main, AF-1, AF-3, AF-4, EF-1) | Not Started |
| [Story 9.2.2](story-9.2.2-card-full-email.md) | Card-Full Email | 2 | Could | UC-043 (AF-2, BR-8) | Not Started |
| [Story 9.2.3](story-9.2.3-view-loyalty-card.md) | View Loyalty Card and Stamp History | 5 | Should | UC-047, UC-026 | Not Started |
| [Story 9.3.1](story-9.3.1-card-batch-script.md) | Script to Generate Physical Card Batches (technical) | 3 | Should | UC-044 (Impl. Notes) | Not Started |
| [Story 9.3.2](story-9.3.2-link-physical-card.md) | Link a Physical Card with Attempt Limits | 5 | Should | UC-044 (Main, EF-1 to EF-4) | Not Started |
| [Story 9.3.3](story-9.3.3-replace-physical-card.md) | Replace a Linked Physical Card | 3 | Could | UC-044 (AF-1) | Not Started |
| [Story 9.4.1](story-9.4.1-redeem-full-card.md) | Redeem a Full Loyalty Card at Checkout | 8 | Should | UC-045 (Main, AF-1 to AF-3) | Not Started |
| [Story 9.4.2](story-9.4.2-redemption-exceptions.md) | Redemption Exceptions: Stock, Reservation Conflict, Payment Failure | 5 | Should | UC-045 (EF-1 to EF-3) | Not Started |

**Total: 11 stories / 47 points**

## Slices (Use-Case 3.0)
- **Slice A (smallest usable system):** 9.1.1, 9.1.2, 9.2.1, 9.2.3 - admin switches on, customers earn and see stamps
- **Slice B (reward):** 9.1.3, 9.4.1, 9.4.2 - ship 9.4.1 and 9.4.2 together
- **Slice C (physical card):** 9.3.1, 9.3.2, then 9.3.3
- **Slice D (polish):** 9.2.2

## Dependencies
- 9.1.1 -> everything else
- 9.1.2 -> 9.1.3 (shared settings tab), 9.4.1
- 9.2.1 -> 9.2.2, 9.2.3, 9.4.1
- 9.3.1 -> 9.3.2 -> 9.3.3 (9.3.2 also needs 9.2.3)
- 9.4.1 -> 9.4.2
- Existing: `server/checkoutService.ts` (Mollie webhook `completeSale()`), `server/parameterService.ts`, `Account.tsx`, `Checkout.tsx`, `Settings.tsx`

## Open Points from the Use Cases (assumptions used in the stories)
- UC-043 OQ-1: cards for existing customers are created lazily (first card access or first paid order), no retroactive stamps
- UC-043 OQ-2: visitor (guest) orders earn no stamps; orders get a `customer_id` for non-guest checkouts
- UC-044 OQ-2: 10 failed attempts / 60 minutes per card number as proposed
- UC-045 OQ-1: reservation lasts until Mollie reports paid, failed, cancelled or expired (no fixed maximum)
- UC-045 OQ-2: reward line booked at 0 euro with 0 VAT, to be confirmed with the accountant
- UC-046 OQ-1/OQ-2: defaults (off, 10 euro, 10 stamps) and bounds (500 euro, 100 stamps) as proposed
- UC-024/UC-025 define no stock rules: reward product availability follows stock movement data, to be settled in the spec
- Card number format is not defined in the UCs: 12 random digits proposed (Story 9.3.1)
