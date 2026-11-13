# Story 7.1 — Order History & Reorder

> **Note:** The order history endpoint bug (querying wrong table) is tracked as [ISS-016](../../ISSUES.md) — must be resolved before this story can be implemented.

## User Story 7.1.1: Quick Reorder from Account Page

**As a** registered user
**I want to** add a previously purchased product directly to my cart from the "Most Ordered" tab
**So that** I can quickly restock items I buy regularly without navigating the full catalogue

**Related UC:** UC-026 — Manage Storefront Account (AF-4)
**Priority:** LOW
**Estimate:** 2 story points

**Acceptance Criteria:**
- [ ] Each product card on the "Meest Besteld" tab has an "Add to Cart" button
- [ ] Clicking the button adds one unit of the product to the cart using the default variant/grind
- [ ] If the product has multiple variants (e.g. grind size), the user is prompted to select one before adding
- [ ] A toast notification confirms the item was added to the cart
- [ ] The cart icon in the header updates to reflect the new quantity
