# Story 1.1 — Revenue Overview with YoY Comparison

## User Story 1.1.1: Display Current Month Revenue with YoY Comparison

**As a** business owner
**I want to** see current month revenue compared to the same month last year
**So that** I can quickly assess if we're growing month-over-month

**Priority:** HIGH
**Estimate:** 2 story points

**Acceptance Criteria:**
- [ ] Display current month total revenue excluding VAT (e.g., "December 2025: €7,200")
- [ ] Display same month previous year revenue excluding VAT (e.g., "December 2024: €6,800")
- [ ] Calculate and display absolute difference (e.g., "+€400")
- [ ] Calculate and display percentage change (e.g., "+5.9%")
- [ ] Show visual indicator: green arrow for positive growth (>0%), red arrow for decline (<0%), neutral for no change (0%)
- [ ] Revenue calculated from all sales with status INVOICED or PAID (excluding NEW/SHIPPED)
- [ ] All values exclude VAT (use `amount_vat_excl` field)
- [ ] Current month determined by server's current date (month/year)
- [ ] If previous year has no data for the month, display "No data for [Month] 2024"
- [ ] Handle edge cases: division by zero (if previous year = €0, show "N/A" for percentage)

**Technical Implementation:**
- **Database Query:**
  ```sql
  -- Current month
  SELECT SUM(amount_vat_excl) as current_revenue
  FROM sales
  WHERE status IN ('INVOICED', 'PAID')
    AND MONTH(date) = MONTH(CURRENT_DATE)
    AND YEAR(date) = YEAR(CURRENT_DATE)

  -- Previous year same month
  SELECT SUM(amount_vat_excl) as previous_revenue
  FROM sales
  WHERE status IN ('INVOICED', 'PAID')
    AND MONTH(date) = MONTH(CURRENT_DATE)
    AND YEAR(date) = YEAR(CURRENT_DATE) - 1
  ```
- **Calculation:**
  - Absolute: `current_revenue - previous_revenue`
  - Percentage: `((current_revenue - previous_revenue) / previous_revenue) * 100`
- **API Endpoint:** `GET /api/dashboards/main` (part of dashboard response)

**Dependencies:** None

**Testing Notes:**
- Test with current month having sales, previous year having sales
- Test with previous year having no sales (€0)
- Test edge case: Currently January (compare to previous December)
- Verify VAT excluded amounts used

---

## User Story 1.1.2: Display Year-to-Date Revenue with YoY Comparison

**As a** business owner
**I want to** see year-to-date revenue compared to the same period last year
**So that** I can track overall annual performance

**Priority:** HIGH
**Estimate:** 2 story points

**Acceptance Criteria:**
- [ ] Display current year YTD revenue excluding VAT (e.g., "2025 YTD: €68,700")
- [ ] Display previous year YTD revenue excluding VAT for same date range (e.g., "2024 YTD: €62,400")
- [ ] Calculate and display absolute difference (e.g., "+€6,300")
- [ ] Calculate and display percentage change (e.g., "+10.1%")
- [ ] Show visual indicator for growth/decline
- [ ] YTD calculated from January 1st of current year to current date
- [ ] Previous year YTD calculated from January 1st to **same day/month** in previous year
  - Example: If today is Dec 24, 2025, compare:
    - 2025: Jan 1 - Dec 24
    - 2024: Jan 1 - Dec 24
- [ ] All values exclude VAT
- [ ] Handle edge case: If business didn't exist previous year, show "No previous year data"

**Technical Implementation:**
- **Database Query:**
  ```sql
  -- Current year YTD
  SELECT SUM(amount_vat_excl) as ytd_current
  FROM sales
  WHERE status IN ('INVOICED', 'PAID')
    AND date BETWEEN CONCAT(YEAR(CURRENT_DATE), '-01-01') AND CURRENT_DATE

  -- Previous year YTD (same date range)
  SELECT SUM(amount_vat_excl) as ytd_previous
  FROM sales
  WHERE status IN ('INVOICED', 'PAID')
    AND date BETWEEN CONCAT(YEAR(CURRENT_DATE) - 1, '-01-01')
                 AND DATE_SUB(CURRENT_DATE, INTERVAL 1 YEAR)
  ```
- **API Endpoint:** `GET /api/dashboards/main`

**Dependencies:** None

**Testing Notes:**
- Test partial year comparison (e.g., run on Dec 24, verify both years use Jan 1 - Dec 24)
- Test full year comparison (run on Dec 31)
- Test early in year (run on Jan 5, verify small date ranges)
- Verify VAT excluded amounts
