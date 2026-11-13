# Story 1.3 — Monthly Sales Trend Visualization

## User Story 1.3.1: Display Monthly Sales Chart with YoY Overlay

**As a** business owner
**I want to** see a chart of monthly revenue with current year and previous year overlaid
**So that** I can visually spot trends and seasonal patterns

**Priority:** MEDIUM
**Estimate:** 3 story points

**Acceptance Criteria:**
- [ ] Display line chart with months (Jan-Dec) on X-axis, revenue (€) on Y-axis
- [ ] Show two series (lines/bars):
  - Current year (2025) - prominently styled
  - Previous year (2024) - secondary styling
- [ ] Chart includes all 12 months
- [ ] Future months in current year show €0 or empty (no line/bar)
- [ ] Each month's revenue calculated from all sales with status INVOICED or PAID (VAT excluded)
- [ ] Legend clearly identifies which series is which year (e.g., "2025" and "2024")
- [ ] Hover/tooltip shows exact values (e.g., "July 2025: €8,200")
- [ ] Y-axis formatted with € symbol and thousands separator (e.g., "€8,200")
- [ ] Chart responsive (adapts to screen size: desktop, tablet, mobile)
- [ ] All values exclude VAT

**Technical Implementation:**
- **Database Query:**
  ```sql
  SELECT
    MONTH(date) as month,
    YEAR(date) as year,
    SUM(amount_vat_excl) as revenue
  FROM sales
  WHERE status IN ('INVOICED', 'PAID')
    AND YEAR(date) IN (YEAR(CURRENT_DATE), YEAR(CURRENT_DATE) - 1)
  GROUP BY MONTH(date), YEAR(date)
  ORDER BY year, month
  ```
- **Frontend:**
  - Charting library: Recharts (React) or Chart.js
  - Chart type: LineChart with two lines OR grouped BarChart
  - Data transformation: Pivot data into format `[{month: 'Jan', 2025: 5240, 2024: 4890}, ...]`
- **API Endpoint:** `GET /api/dashboards/main`
- **Response Format:**
  ```json
  "monthly_trend": [
    {"month": "Jan", "month_num": 1, "2025": 5240, "2024": 4890},
    {"month": "Feb", "month_num": 2, "2025": 6100, "2024": 5300},
    ...
    {"month": "Dec", "month_num": 12, "2025": 7200, "2024": 6800}
  ]
  ```

**Dependencies:** None

**Testing Notes:**
- Test with full year data (both years have all 12 months)
- Test mid-year (current year has only Jan-Jun, rest should be €0 or empty)
- Test previous year with missing months (should show €0 for those months)
- Verify chart displays correctly on mobile
- Verify tooltip formatting
- Verify VAT excluded amounts
