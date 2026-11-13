# Story 3.5 — Sales Analysis Page

## User Story 3.5.1: Create Sales Analysis Page

**As a** user
**I want to** navigate to a dedicated Sales Analysis page
**So that** I can perform deep-dive analysis of revenue trends

**Priority:** MEDIUM
**Estimate:** 5 story points

**Acceptance Criteria:**
- [ ] Page accessible at `/analytics/sales` route
- [ ] Navigation link in main menu: "Sales Analysis" or "Analytics"
- [ ] Page includes all components:
  1. Month-by-month comparison table (with export)
  2. Multi-year line chart
  3. Lifetime statistics section
  4. Channel performance over time
- [ ] Page title: "Sales Analysis" (browser tab and page header)
- [ ] Breadcrumb: Dashboard > Sales Analysis
- [ ] Year selector (multi-select) applies to all charts/tables
- [ ] Export functionality for all data tables
- [ ] Responsive layout
- [ ] Loading state while fetching data
- [ ] Error state if API fails

**Technical Implementation:**
- **Route:** `/analytics/sales`
- **API Endpoints:**
  - `GET /api/analytics/sales/monthly-comparison?years=2022,2023,2024,2025`
  - `GET /api/analytics/sales/lifetime-stats`
  - `GET /api/analytics/sales/channel-trends?years=2023,2024,2025`
- **Components:**
  - SalesAnalysis (page)
    - YearSelector (multi-select)
    - MonthlyComparisonTable
    - MultiYearChart
    - LifetimeStats
    - ChannelTrends
- **Navigation:** Add link to main navigation menu

**Dependencies:**
- User Story 3.1.1, 3.2.1, 3.3.1, 3.4.1

**Testing Notes:**
- Test navigation from dashboard
- Test all sections load correctly
- Test year selector (verify all components update)
- Test export functionality
- Test responsive layout
- Test loading and error states
- Test breadcrumb navigation
