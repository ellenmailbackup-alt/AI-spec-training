# Story 8.1 — Customer Pricing Admin UI

## User Story 8.1.1: Build Customer Pricing Admin UI

**As an** admin
**I want to** manage customer-specific prices from the customer details
**So that** I can offer negotiated pricing to individual customers

**References:** UC-007 — Set Customer-Specific Prices
**Priority:** HIGH
**Estimate:** ~5 story points

**Context:**
The backend API endpoints for customer pricing already exist and the POS correctly applies customer prices during sales. The admin UI to manage these prices is a placeholder ("coming soon") in `CustomerDetail.tsx`.

**Acceptance Criteria:**
- [ ] Customer prices listed with: product name, variant (weight + unit), custom price excluding VAT, custom price including VAT, valid-from date, valid-until date
- [ ] Add customer price: select a sales price variant (from UC-006), enter prices (excl/incl VAT), set validity dates
- [ ] VAT auto-calculation matching UC-006 behavior
- [ ] Change existing customer prices
- [ ] Remove customer prices with AlertDialog confirmation
- [ ] Placeholder "coming soon" message removed
- [ ] Follows existing patterns from sales pricing UI (UC-006)

**Technical Implementation:**
- Frontend: `client/src/pages/admin/CustomerDetail.tsx` — replace placeholder with pricing CRUD
- Backend: Existing endpoints (no changes needed)
- Database: No schema changes needed

**Dependencies:** None (backend already exists)
