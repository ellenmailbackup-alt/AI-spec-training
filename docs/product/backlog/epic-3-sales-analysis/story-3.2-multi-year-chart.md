# Story 3.2 — Multi-Year Line Chart

## User Story 3.2.1: Display Multi-Year Revenue Trend Chart

**As a** business owner
**I want to** see a line chart with multiple years overlaid
**So that** I can visually spot seasonal patterns and growth trends

**Priority:** MEDIUM
**Estimate:** 3 story points

**Acceptance Criteria:**
- [ ] Line chart with:
  - X-axis: Months (Jan - Dec)
  - Y-axis: Revenue (€, VAT excluded)
  - Multiple lines (one per year): 2025, 2024, 2023, 2022
- [ ] Each line color-coded with clear legend
- [ ] Legend shows year and color (e.g., "2025 (blue)", "2024 (green)")
- [ ] Hover tooltip shows exact value (e.g., "July 2024: €8,200")
- [ ] Future months in current year: Line ends at current month (no extrapolation)
- [ ] Y-axis formatted with € symbol and appropriate scale
- [ ] Chart responsive and readable on all screen sizes
- [ ] Option to toggle years on/off (click legend to hide/show year line)
- [ ] All values exclude VAT

**Technical Implementation:**
- **API Endpoint:** Same as User Story 3.1.1 (`GET /api/analytics/sales/monthly-comparison`)
- **Frontend:**
  - Recharts LineChart component
  - Multiple Line components (one per year)
  - Legend with click-to-toggle functionality
- **Data Format:**
  ```json
  [
    {"month": "Jan", "2025": 5240, "2024": 4890, "2023": 4120, "2022": 3850},
    {"month": "Feb", "2025": 6100, "2024": 5300, "2023": 4900, "2022": 4200},
    ...
  ]
  ```

**Dependencies:**
- User Story 3.1.1 (same data source)

**Testing Notes:**
- Test chart displays all years
- Test legend toggle (hide/show years)
- Test tooltip values
- Test responsive behavior (mobile, tablet, desktop)
- Test future months (current year line should stop at current month)
- Verify Y-axis formatting
- Verify VAT excluded amounts
