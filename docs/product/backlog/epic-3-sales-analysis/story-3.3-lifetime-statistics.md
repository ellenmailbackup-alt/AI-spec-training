# Story 3.3 — Lifetime Statistics

## User Story 3.3.1: Display Lifetime Revenue and Milestones

**As a** business owner
**I want to** see all-time revenue and key milestones
**So that** I can track long-term business growth

**Priority:** LOW
**Estimate:** 3 story points

**Acceptance Criteria:**
- [ ] Display total all-time revenue (sum of all INVOICED/PAID sales ever, VAT excluded)
- [ ] Display best month ever:
  - Month and year (e.g., "July 2024")
  - Revenue amount (€, VAT excluded)
- [ ] Display year-over-year growth rates table:
  ```
  Year | Revenue    | Growth
  -----|------------|--------
  2022 | €42,000    | -
  2023 | €55,200    | +31.4%
  2024 | €62,400    | +13.0%
  2025 | €68,700    | +10.1% (YTD projected)
  ```
- [ ] If current year incomplete, mark as "YTD" or "Projected"
- [ ] Display cumulative revenue chart:
  - Line chart showing running total from business start to now
  - X-axis: Timeline (by month or year)
  - Y-axis: Cumulative revenue
- [ ] Optional: Display milestones (configurable):
  - First €10k month
  - First €50k year
  - Other custom milestones
- [ ] All values exclude VAT

**Technical Implementation:**
- **API Endpoint:** `GET /api/analytics/sales/lifetime-stats`
- **Database Queries:**
  ```sql
  -- All-time revenue
  SELECT SUM(amount_vat_excl) as total_revenue
  FROM sales
  WHERE status IN ('INVOICED', 'PAID')

  -- Best month ever
  SELECT
    YEAR(date) as year,
    MONTH(date) as month,
    SUM(amount_vat_excl) as revenue
  FROM sales
  WHERE status IN ('INVOICED', 'PAID')
  GROUP BY YEAR(date), MONTH(date)
  ORDER BY revenue DESC
  LIMIT 1

  -- Annual revenue for growth calculation
  SELECT
    YEAR(date) as year,
    SUM(amount_vat_excl) as revenue
  FROM sales
  WHERE status IN ('INVOICED', 'PAID')
  GROUP BY YEAR(date)
  ORDER BY year

  -- Cumulative revenue (by month)
  SELECT
    DATE_FORMAT(date, '%Y-%m') as month,
    SUM(amount_vat_excl) as revenue
  FROM sales
  WHERE status IN ('INVOICED', 'PAID')
  GROUP BY DATE_FORMAT(date, '%Y-%m')
  ORDER BY month
  ```
- **Frontend:**
  - Calculate YoY growth percentages
  - Calculate cumulative sum for chart
  - Recharts LineChart for cumulative revenue
- **Response Format:**
  ```json
  {
    "total_all_time": 228300,
    "best_month": {"month": "July", "year": 2024, "revenue": 8500},
    "annual_growth": [
      {"year": 2022, "revenue": 42000, "growth_percentage": null},
      {"year": 2023, "revenue": 55200, "growth_percentage": 31.4},
      {"year": 2024, "revenue": 62400, "growth_percentage": 13.0},
      {"year": 2025, "revenue": 68700, "growth_percentage": 10.1, "ytd": true}
    ],
    "cumulative_revenue": [
      {"month": "2022-01", "revenue": 3500, "cumulative": 3500},
      {"month": "2022-02", "revenue": 4000, "cumulative": 7500},
      ...
    ]
  }
  ```

**Dependencies:** None

**Testing Notes:**
- Test with multiple years of data
- Test with single year of data
- Test cumulative chart (verify running sum calculation)
- Test YoY growth calculation (verify percentages)
- Test "best month" identification
- Verify YTD flag for current incomplete year
- Verify VAT excluded amounts
