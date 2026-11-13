# Story Review — Epic 9 Webshop Loyalty Stamp Card — Round 1

**Date:** 2026-11-13 · **Reviewer:** review agent (independent) · **Skill:** `/review-stories`
**Overall verdict:** NEEDS REVISION (moderate)

| Story | Verdict | Main issue |
|---|---|---|
| 9.1.1 Data model | NEEDS REVISION | Developer persona, horizontal slice — fold into consuming stories |
| 9.1.2 Configure rules | PASS (minor) | Rules + switch conjunction, UI/API leakage |
| 9.1.3 Reward list | PASS (minor) | Depends on 9.1.2 tab |
| 9.2.1 Earn stamps | NEEDS REVISION | Customer identity at checkout; "retriable" AC contradicts hook; BR-6 missing |
| 9.2.2 Card-full email | PASS | Over-specified ACs |
| 9.2.3 View card | PASS (minor) | Conjunction, UI details |
| 9.3.1 Batch script | PASS as labelled enabler | Persona; move card-number helper to 9.2.1 |
| 9.3.2 Link card | PASS (minor) | Size; attempt-counting gaps |
| 9.3.3 Replace card | PASS | UI wording |
| 9.4.1 Redeem | NEEDS REVISION | 8 pts; not shippable without 9.4.2; auth gap |
| 9.4.2 Exceptions | NEEDS REVISION | Three flows bundled; "must ship together" breaks Independent |

## Key findings
1. **Critical — checkout is unauthenticated.** `POST /api/checkout/create` has no auth; `isGuest` is client-supplied and `findOrCreateCustomer()` matches by email. Without session-based identity anyone could earn or redeem another customer's stamps.
2. 9.2.1 "failure is retriable" does not hold: duplicate webhooks return early once the sale is PAID (`checkoutService.ts` ~382).
3. 9.4.1/9.4.2 boundary: reservation release (EF-3) and pending (AF-3) must live in 9.4.1 so it ships alone.
4. No stock check exists in `createOrder()` today; reward line must be excluded from VAT (hard-coded 6%), shipping threshold and basis.
5. Hidden dependency 9.2.1 → 9.3.1 via card-number helper.
6. ACs contain API/DB details (HTTP codes, columns) — move to spec.
7. Missing: UC-043 BR-6 (no expiry) AC; lost-webhook reconciliation for reservations; late "paid" after release needs a business decision.
