# Story 1.4 — Sales by Category

## User Story 1.4.1: Display Sales Distribution by Product Category

**As a** business owner
**I want to** see a pie chart showing revenue breakdown by product category
**So that** I can understand product mix and which categories drive revenue

**Priority:** MEDIUM
**Estimate:** 2 story points

**Acceptance Criteria:**
- [ ] Display pie chart with product categories (Coffee, Tea, Green Coffee, Accessories, Takeaway, Other)
- [ ] Each slice shows category name and percentage of total revenue
- [ ] Calculated from current year sales only (January 1 - current date)
- [ ] Revenue calculated from sale items grouped by product category (VAT excluded)
- [ ] Categories with <1% revenue optionally grouped into "Other" category
- [ ] Hover/tooltip shows:
  - Category name
  - Absolute revenue amount (e.g., "Coffee: €26,106")
  - Percentage (e.g., "38%")
- [ ] Chart uses distinct colors for each category (consistent color scheme)
- [ ] Legend shows all categories with colors
- [ ] Chart responsive (readable on all screen sizes)
- [ ] All values exclude VAT

**Technical Implementation:**
- **Database Query:**
  ```sql
  SELECT
    p.category,
    SUM(si.amount_vat_excl) as revenue
  FROM saleItems si
  JOIN sales s ON s.id = si.sale_id
  JOIN products p ON p.id = si.product_id
  WHERE s.status IN ('INVOICED', 'PAID')
    AND YEAR(s.date) = YEAR(CURRENT_DATE)
  GROUP BY p.category
  ORDER BY revenue DESC
  ```
- **Frontend:**
  - Charting library: Recharts PieChart
  - Calculate percentages: `(category_revenue / total_revenue) * 100`
  - Color palette: Consistent, accessible colors
- **API Endpoint:** `GET /api/dashboards/main`
- **Response Format:**
  ```json
  "sales_by_category": [
    {"category": "Coffee", "revenue": 26106, "percentage": 38},
    {"category": "Tea", "revenue": 22671, "percentage": 33},
    {"category": "Takeaway", "revenue": 10305, "percentage": 15},
    {"category": "Green Coffee", "revenue": 9618, "percentage": 14},
    {"category": "Accessories", "revenue": 687, "percentage": 1}
  ]
  ```

**Dependencies:**
- Assumes `products` table has `category` field (verify this exists)

**Testing Notes:**
- Test with all categories having revenue
- Test with one category having >90% revenue (pie chart still readable)
- Test with many small categories (verify "Other" grouping if implemented)
- Verify percentages sum to 100% (handle rounding)
- Verify chart displays on mobile
- Verify VAT excluded amounts
