# Story 3.4 — Channel Performance Over Time

## User Story 3.4.1: Display Channel Revenue Trends

**As a** business owner
**I want to** see how each channel's revenue evolved over time
**So that** I can identify growing or declining channels

**Priority:** LOW
**Estimate:** 3 story points

**Acceptance Criteria:**
- [ ] Display table showing annual revenue by channel (VAT excluded):
  ```
  Channel        | 2025 (YTD) | 2024   | 2023   | Growth '24->'25
  ---------------|------------|--------|--------|---------------
  B2B            | €52,000    | €48,000| €40,000| +8.3%
  B2C            | €14,000    | €12,000| €10,000| +16.7%
  Webshop        | €2,000     | €1,500 | €500   | +33.3%
  Boeren en Buren| €700       | €900   | €4,700 | -22.2%
  ```
- [ ] Optional: Line chart showing channel trends over months:
  - X-axis: Months
  - Y-axis: Revenue
  - Multiple lines (one per channel)
  - Legend to identify channels
- [ ] Highlight fastest growing channel (green highlight or icon)
- [ ] Highlight fastest declining channel (red highlight or icon)
- [ ] Growth calculated as: `(2025 YTD / 2024 YTD for same period) - 1`
  - Fair comparison even if 2025 incomplete
- [ ] All values exclude VAT

**Technical Implementation:**
- **API Endpoint:** `GET /api/analytics/sales/channel-trends?years=2023,2024,2025`
- **Database Query:**
  ```sql
  SELECT
    channel,
    YEAR(date) as year,
    SUM(amount_vat_excl) as revenue
  FROM sales
  WHERE status IN ('INVOICED', 'PAID')
    AND YEAR(date) IN (2023, 2024, 2025)
  GROUP BY channel, YEAR(date)
  ORDER BY channel, year
  ```
- **Frontend:**
  - Pivot data for table display
  - Calculate growth percentages
  - Optional: Recharts LineChart for trends
- **Response Format:**
  ```json
  {
    "channels": [
      {
        "channel": "B2B",
        "2025": 52000,
        "2024": 48000,
        "2023": 40000,
        "growth_2024_to_2025": 8.3
      },
      ...
    ]
  }
  ```

**Dependencies:**
- User Story 1.2.1 (channel field exists)

**Testing Notes:**
- Test with all channels having data
- Test with channel having no data for a year (show €0)
- Test growth calculation (verify accuracy)
- Test fastest growing/declining identification
- Test optional line chart
- Verify VAT excluded amounts
