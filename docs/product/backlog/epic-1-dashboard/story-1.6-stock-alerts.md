# Story 1.6 — Stock Alerts Summary

## User Story 1.6.1: Display Low Stock Alerts on Dashboard

**As a** business owner
**I want to** see products with lowest stock levels and days remaining
**So that** I can identify what needs reordering soon

**Priority:** MEDIUM
**Estimate:** 4 story points

**Acceptance Criteria:**
- [ ] Display top 3 products with lowest "days remaining" stock
- [ ] For each product show:
  - Product name
  - Days remaining (calculated)
  - Current stock level
- [ ] Color coding:
  - Red if <15 days remaining
  - Yellow if 15-30 days remaining
  - Green if >30 days remaining
- [ ] "Days remaining" calculated as: `(current_stock / avg_monthly_usage) * 30`
- [ ] Average monthly usage = total quantity sold in last 12 months / 12
- [ ] If product has zero or negative stock, show "0 days" and display first (highest priority)
- [ ] If product has never been sold (no sales data), show "N/A" and exclude from top 3
- [ ] "View Inventory" link navigates to full Inventory page
- [ ] Only show products with inventory tracking (exclude services if applicable)

**Technical Implementation:**
- **Database Queries:**
  ```sql
  -- Current stock per product
  SELECT
    product_id,
    SUM(quantity) as current_stock
  FROM stockMovements
  GROUP BY product_id

  -- Average monthly usage per product (last 12 months)
  SELECT
    si.product_id,
    SUM(si.quantity) / 12 as avg_monthly_usage
  FROM saleItems si
  JOIN sales s ON s.id = si.sale_id
  WHERE s.date >= DATE_SUB(CURRENT_DATE, INTERVAL 12 MONTH)
  GROUP BY si.product_id

  -- Combined query with days remaining calculation
  SELECT
    p.name as product_name,
    COALESCE(stock.current_stock, 0) as current_stock,
    COALESCE(usage.avg_monthly_usage, 0) as avg_monthly_usage,
    CASE
      WHEN usage.avg_monthly_usage > 0
      THEN (stock.current_stock / usage.avg_monthly_usage) * 30
      ELSE NULL
    END as days_remaining
  FROM products p
  LEFT JOIN (
    SELECT product_id, SUM(quantity) as current_stock
    FROM stockMovements
    GROUP BY product_id
  ) stock ON stock.product_id = p.id
  LEFT JOIN (
    SELECT si.product_id, SUM(si.quantity) / 12 as avg_monthly_usage
    FROM saleItems si
    JOIN sales s ON s.id = si.sale_id
    WHERE s.date >= DATE_SUB(CURRENT_DATE, INTERVAL 12 MONTH)
    GROUP BY si.product_id
  ) usage ON usage.product_id = p.id
  WHERE days_remaining IS NOT NULL
  ORDER BY days_remaining ASC
  LIMIT 3
  ```
- **API Endpoint:** `GET /api/dashboards/main`
- **Response Format:**
  ```json
  "stock_alerts": [
    {
      "product_id": "uuid",
      "product_name": "Peru El Mango (Green)",
      "current_stock": 2.5,
      "avg_monthly_usage": 8.0,
      "days_remaining": 9,
      "status": "critical"
    },
    ...
  ]
  ```

**Dependencies:** None

**Testing Notes:**
- Test with products having low stock (<15 days)
- Test with product having zero stock (should show 0 days)
- Test with product never sold (should exclude from list)
- Test with product with negative stock (e.g., stock discrepancy)
- Verify calculation: `(current_stock / avg_monthly_usage) * 30`
- Verify color coding thresholds
- Verify sorting (lowest days first)
