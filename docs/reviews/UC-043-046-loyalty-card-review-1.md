# Use Case Review — UC-043 to UC-046 (Webshop Loyalty Stamp Card) — Round 1

**Date:** 2026-11-13
**Reviewer:** review agent (independent, read-only)
**Skill:** `/review-use-case`

## Overall Summary

| UC | Title | Critical | Warnings | Suggestions | Verdict |
|---|---|---|---|---|---|
| UC-043 | Collect Stamps on Loyalty Card | 2 | 6 | 5 | NEEDS REVISION |
| UC-044 | Link Physical Loyalty Card | 0 | 5 | 5 | NEEDS REVISION |
| UC-045 | Redeem Full Loyalty Card for Free Product | 2 | 8 | 5 | NEEDS REVISION |
| UC-046 | Configure Loyalty Card Rules | 0 | 8 | 4 | NEEDS REVISION |

## Codebase Facts Found
- `webshopOrders` (`shared/schema.ts:451`) has no `customerId`/`userId`; orders are linked to customers only via email.
- No cancel/refund capability for paid webshop orders exists (only Mollie `canceled` mapping in `server/checkoutService.ts:329`); no UC covers it.
- UC-024/UC-025 contain no stock rules, although UC-045 refers to them.
- UC-026 (account) has no loyalty section; UC-025 has no reward extension; UC-015 does not list loyalty settings; UC-027 does not add a card on registration.
- `parameterTable` + `parameterService` (`server/routes.ts` ~1498) fit the UC-046 configuration approach.

## UC-043 — Collect Stamps on Loyalty Card
**Critical**
1. Rule 1/23 — Earning stamps (steps 1–4, system-triggered on payment) and viewing card/history (steps 5–8, separate session) are two capabilities. Split into "Earn Stamps on Paid Order" and "View Loyalty Card and Stamp History".
2. AF-1/AF-4/BR-7 depend on a cancel/refund capability with no actor, no UC and no code.

**Warnings**
- EF-1 contradicts step 1 ("completes payment" vs. payment fails/pending); move pending to an AF.
- Basis incl. VAT conflicts with "report without VAT" convention — confirm deliberate; specify effect of discounts.
- Card creation at registration not stated as a rule; pre-existing customers deferred to spec → Open Question.
- BR duplication (BR-2/BR-3, BR-5 definition, BR-9/BR-11, BR-10/AF-3).
- Step 6/8 display data vague (which amount; "card full" indicator).
- Refund recalculation uses current euro-per-stamp, contradicting UC-046 BR-5 (past orders never recalculated).

## UC-044 — Link Physical Loyalty Card
**Warnings**
- EF-3 (lockout) should be detected at step 2, not after entry at step 5.
- BR-6 not testable without concrete values (attempts, waiting period, counter reset).
- Per-account limit can be bypassed by registering multiple accounts → add per-card limit.
- Failed replacement must keep the currently linked card valid.
- Step 1 reference to UC-043 steps 5–6 must be repointed after split; UC-026 has no loyalty section.

## UC-045 — Redeem Full Loyalty Card for Free Product
**Critical**
1. Splices into UC-025 (Approved) without UC-025 having a reward extension, €0 line, or VAT handling for the free line → extend UC-025.
2. AF-3/AF-4/BR-12 depend on the non-existent cancel/refund capability.

**Warnings**
- EF-1 out-of-stock: filter vs. exception unclear; no handling for stock lost between choice and payment; stock rules don't exist in UC-024/025.
- EF-2 (no paid product) is a filtered-out condition (precondition) — remove or restate as recheck.
- Vague displays in steps 2, 4, 6.
- Precondition 5 duplicates step 1; AF-2 should rejoin at step 4.
- Heavy BR duplication (BR-3, 8, 10, 11, 12, 13, 14).
- Reservation on pending (bank transfer) payments may lock stamps for days → define expiry.
- EF-3 removes free product after customer confirmed → inform customer before payment proceeds.

## UC-046 — Configure Loyalty Card Rules
**Warnings**
- AF steps unnumbered → EF-2 detection step ambiguous.
- EF-2 (duplicate product) is filtered-out if only non-listed products are offered.
- EF-3 (admin does not confirm) is a choice, not an exception.
- Step 10 rejoin text inaccurate after AF-1..3.
- "Orders placed after the change" vs. UC-043 "paid" — contradiction.
- Name the basis amount for euro-per-stamp; BR-5/7/8/9 are effects, not constraints.
- Unclear whether settings live in UC-015 settings or a separate page; defaults on first use not stated.

## Cross-Document
- Contradictions: euro-per-stamp on refund; placed vs. paid.
- Biggest gap: cancel/refund capability for webshop orders.
- Duplicated rules (no-email-on-return, feature-off) across 3 docs — keep one owner.
- Related UCs needing extension: UC-025, UC-026, UC-015, UC-027.
- Terminology: use "redeem" consistently (not "claimed"/"chosen").
- Deferred decisions to move into Open Questions: cards for pre-existing customers, defaults, reservation expiry, attempt-limit values, VAT on free product.
