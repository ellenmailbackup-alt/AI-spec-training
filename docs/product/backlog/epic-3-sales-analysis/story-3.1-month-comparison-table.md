# Story 3.1 — Month-by-Month Comparison Table

## User Story 3.1.1: Display Month-by-Month Revenue Table with Multi-Year Comparison

**As a** business owner
**I want to** see a table of monthly revenue for multiple years
**So that** I can compare performance across years without switching views

**Priority:** MEDIUM
**Estimate:** 4 story points

**Acceptance Criteria:**
- [ ] Display table with:
  - Rows: Months (Jan - Dec) + Total row
  - Columns: 2025, 2024, 2023, 2022, Change (2025 vs 2024)
- [ ] Each cell shows revenue for that month/year (€, VAT excluded)
- [ ] Change column shows:
  - Absolute difference (€)
  - Percentage difference (%)
  - Visual indicator for growth/decline
- [ ] Bottom row "TOTAL" shows annual sum for each year
- [ ] Highlight current month (bold or background color)
- [ ] Future months in current year show "€0" or "-" or grayed out
- [ ] Years selectable via dropdown or checkboxes (default: show 2025, 2024, 2023, 2022)
- [ ] Export button to download table as CSV or Excel
- [ ] All values exclude VAT
- [ ] Values formatted with € symbol and thousands separator

**Technical Implementation:**
- **API Endpoint:** `GET /api/analytics/sales/monthly-comparison?years=2022,2023,2024,2025`
- **Database Query:**
  ```sql
  SELECT
    MONTH(date) as month,
    YEAR(date) as year,
    SUM(amount_vat_excl) as revenue
  FROM sales
  WHERE status IN ('INVOICED', 'PAID')
    AND YEAR(date) IN (2022, 2023, 2024, 2025)
  GROUP BY MONTH(date), YEAR(date)
  ORDER BY year, month
  ```
- **Frontend:**
  - Pivot data into table format
  - Year selector (multi-select dropdown)
  - Export functionality (use library like `xlsx` or `csv-export`)
- **Response Format:**
  ```json
  {
    "months": [
      {"month": "Jan", "2025": 5240, "2024": 4890, "2023": 4120, "2022": 3850},
      {"month": "Feb", "2025": 6100, "2024": 5300, "2023": 4900, "2022": 4200},
      ...
    ],
    "totals": {"2025": 68700, "2024": 62400, "2023": 55200, "2022": 42000}
  }
  ```

**Dependencies:** None

**Testing Notes:**
- Test with all 4 years selected
- Test with only 2 years selected
- Test export to CSV/Excel
- Test current month highlighting
- Test future months display (should be €0 or blank)
- Verify totals calculation
- Verify VAT excluded amounts
- Test responsive table (horizontal scroll on mobile if needed)
