# Story 1.7 — Customer Statistics

## User Story 1.7.1: Display Customer Metrics on Dashboard

**As a** business owner
**I want to** see customer statistics (total, new this month, one-time, inactive)
**So that** I can understand customer base health

**Priority:** LOW
**Estimate:** 2 story points

**Acceptance Criteria:**
- [ ] Display total number of customers (all-time)
- [ ] Display number of new customers this month (customers with first sale in current month)
- [ ] Display number of one-time customers (customers with exactly 1 sale ever)
- [ ] Display percentage of one-time customers (e.g., "610 (59%)")
- [ ] Display number of inactive customers (customers with no sales in last 12 months, but had sales before)
- [ ] Display total number of sales (all-time or current year - specify)
- [ ] All metrics clearly labeled
- [ ] Metrics update based on current date

**Technical Implementation:**
- **Database Queries:**
  ```sql
  -- Total customers
  SELECT COUNT(DISTINCT customer_id) as total_customers
  FROM sales

  -- New customers this month
  SELECT COUNT(DISTINCT customer_id) as new_customers
  FROM sales
  WHERE customer_id IN (
    SELECT customer_id
    FROM sales
    GROUP BY customer_id
    HAVING MIN(date) >= DATE_FORMAT(CURRENT_DATE, '%Y-%m-01')
  )

  -- One-time customers
  SELECT COUNT(*) as one_time_customers
  FROM (
    SELECT customer_id
    FROM sales
    GROUP BY customer_id
    HAVING COUNT(*) = 1
  ) subquery

  -- Inactive customers (had sales before, but not in last 12 months)
  SELECT COUNT(DISTINCT customer_id) as inactive_customers
  FROM sales
  WHERE customer_id NOT IN (
    SELECT DISTINCT customer_id
    FROM sales
    WHERE date >= DATE_SUB(CURRENT_DATE, INTERVAL 12 MONTH)
  )

  -- Total sales (current year)
  SELECT COUNT(*) as total_sales
  FROM sales
  WHERE YEAR(date) = YEAR(CURRENT_DATE)
  ```
- **API Endpoint:** `GET /api/dashboards/main`
- **Response Format:**
  ```json
  "customer_stats": {
    "total_customers": 1028,
    "new_this_month": 45,
    "one_time_customers": 610,
    "one_time_percentage": 59,
    "inactive_customers": 47,
    "total_sales": 764
  }
  ```

**Dependencies:** None

**Testing Notes:**
- Test with various customer scenarios
- Test percentage calculation (verify rounding)
- Test edge case: Customer with 1 sale this month (should count as both new and one-time)
- Test inactive calculation (customer with last sale exactly 12 months ago - boundary)
