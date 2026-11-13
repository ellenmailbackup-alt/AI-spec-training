# Story 1.8 — Top Performers

## User Story 1.8.1: Display Top 10 Customers by Revenue

**As a** business owner
**I want to** see the top 10 customers by revenue
**So that** I can identify key accounts

**Priority:** MEDIUM
**Estimate:** 2 story points

**Acceptance Criteria:**
- [ ] Display top 10 customers ranked by total revenue (current year, VAT excluded)
- [ ] Show customer name and total revenue amount
- [ ] Revenue calculated from sales with status INVOICED or PAID
- [ ] If fewer than 10 customers exist, show all customers
- [ ] Table format with columns:
  - Rank (1-10)
  - Customer Name
  - Revenue (€, VAT excluded)
- [ ] Ranked from highest to lowest revenue
- [ ] Revenue formatted with € symbol and thousands separator (e.g., "€12,794")
- [ ] All values exclude VAT

**Technical Implementation:**
- **Database Query:**
  ```sql
  SELECT
    c.name as customer_name,
    SUM(s.amount_vat_excl) as total_revenue
  FROM sales s
  JOIN customers c ON c.id = s.customer_id
  WHERE s.status IN ('INVOICED', 'PAID')
    AND YEAR(s.date) = YEAR(CURRENT_DATE)
  GROUP BY s.customer_id, c.name
  ORDER BY total_revenue DESC
  LIMIT 10
  ```
- **API Endpoint:** `GET /api/dashboards/main`
- **Response Format:**
  ```json
  "top_customers": [
    {"rank": 1, "customer_name": "Kruze Kruze", "revenue": 12794},
    {"rank": 2, "customer_name": "Felipes BVBA", "revenue": 11896},
    ...
  ]
  ```

**Dependencies:** None

**Testing Notes:**
- Test with >10 customers (verify only top 10 shown)
- Test with <10 customers (verify all shown)
- Test with customers having same revenue (verify consistent ordering)
- Verify VAT excluded amounts
- Verify formatting

---

## User Story 1.8.2: Display Top 10 Products by Revenue

**As a** business owner
**I want to** see the top 10 products by revenue
**So that** I can identify best-selling products

**Priority:** MEDIUM
**Estimate:** 2 story points

**Acceptance Criteria:**
- [ ] Display top 10 products ranked by total revenue (current year, VAT excluded)
- [ ] Show product name and total revenue amount
- [ ] Revenue calculated from sale items where parent sale has status INVOICED or PAID
- [ ] If fewer than 10 products exist, show all products
- [ ] Table format with columns:
  - Rank (1-10)
  - Product Name
  - Revenue (€, VAT excluded)
- [ ] Ranked from highest to lowest revenue
- [ ] Revenue formatted with € symbol and thousands separator (e.g., "€8,092")
- [ ] All values exclude VAT

**Technical Implementation:**
- **Database Query:**
  ```sql
  SELECT
    p.name as product_name,
    SUM(si.amount_vat_excl) as total_revenue
  FROM saleItems si
  JOIN sales s ON s.id = si.sale_id
  JOIN products p ON p.id = si.product_id
  WHERE s.status IN ('INVOICED', 'PAID')
    AND YEAR(s.date) = YEAR(CURRENT_DATE)
  GROUP BY si.product_id, p.name
  ORDER BY total_revenue DESC
  LIMIT 10
  ```
- **API Endpoint:** `GET /api/dashboards/main`
- **Response Format:**
  ```json
  "top_products": [
    {"rank": 1, "product_name": "Green Bean - Mexico - Chiapas Deca", "revenue": 8092},
    {"rank": 2, "product_name": "Peru - El Mango - Jaen", "revenue": 5511},
    ...
  ]
  ```

**Dependencies:** None

**Testing Notes:**
- Test with >10 products (verify only top 10 shown)
- Test with <10 products (verify all shown)
- Test with products having same revenue (verify consistent ordering)
- Verify VAT excluded amounts (use saleItems.amount_vat_excl, not products.price)
- Verify formatting
