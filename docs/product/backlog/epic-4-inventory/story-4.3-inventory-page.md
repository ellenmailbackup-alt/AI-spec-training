# Story 4.3 — Inventory Page

## User Story 4.3.1: Create Inventory Dashboard Page

**As a** user
**I want to** navigate to a dedicated Inventory page
**So that** I can manage stock in one place

**Priority:** MEDIUM
**Estimate:** 5 story points

**Acceptance Criteria:**
- [ ] Page accessible at `/inventory` route
- [ ] Navigation link in main menu: "Inventory"
- [ ] Page includes all components:
  1. Stock level table (filterable, searchable, sortable)
  2. Stock movement summary (last 30 days)
  3. Recent stock movements list
- [ ] Page title: "Inventory Overview" (browser tab and page header)
- [ ] Breadcrumb: Dashboard > Inventory
- [ ] Export button to download stock levels as CSV
- [ ] Responsive layout
- [ ] Loading state while fetching data
- [ ] Error state if API fails

**Technical Implementation:**
- **Route:** `/inventory`
- **API Endpoints:**
  - `GET /api/inventory`
  - `GET /api/inventory/movement-summary?days=30`
  - `GET /api/inventory/recent-movements?limit=20`
- **Components:**
  - Inventory (page)
    - StockLevelTable
    - StockMovementSummary
    - RecentMovements
- **Navigation:** Add link to main navigation menu
- **Export:** CSV export of stock levels table

**Dependencies:**
- User Story 4.1.1, 4.1.2 (Stock table)
- User Story 4.2.1, 4.2.2 (Movement summary and history)

**Testing Notes:**
- Test navigation from dashboard
- Test all sections load correctly
- Test export to CSV
- Test responsive layout
- Test loading and error states
- Test breadcrumb navigation
