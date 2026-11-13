# Story 4.1 — Stock Level Table

## User Story 4.1.1: Display All Products with Current Stock Levels

**As a** business owner
**I want to** see a table of all products with current stock, sales velocity, and days remaining
**So that** I can plan reorders based on data rather than gut feeling

**Priority:** MEDIUM
**Estimate:** 5 story points

**Acceptance Criteria:**
- [ ] Display table with columns:
  - Product Name
  - Category
  - Current Stock (kg or units)
  - Avg/Month (average sold per month, based on last 12 months)
  - Days Remaining (calculated)
  - Status (color indicator)
- [ ] Current Stock = `SUM(stockMovements.quantity)` for each product
- [ ] Avg/Month = `(Total quantity sold in last 12 months) / 12`
- [ ] Days Remaining = `(Current Stock / Avg per Month) * 30`
- [ ] Status color coded:
  - Red: <15 days remaining (critical)
  - Yellow: 15-30 days remaining (low)
  - Green: >30 days remaining (good)
- [ ] Sortable by any column:
  - Default sort: Days Remaining (ascending, lowest first)
  - Can sort by Product Name, Category, Current Stock, etc.
- [ ] Filterable by category (dropdown: All, Coffee, Tea, Green Coffee, Accessories)
- [ ] Products with zero or negative stock appear at top (0 days remaining)
- [ ] Products never sold (no sales data) show "N/A" for Avg/Month and Days Remaining
- [ ] Pagination if >100 products (50 per page)

**Technical Implementation:**
- **API Endpoint:** `GET /api/inventory?category=all&sort=days_remaining&order=asc`
- **Database Query:**
  ```sql
  SELECT
    p.id,
    p.name as product_name,
    p.category,
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
  ORDER BY days_remaining ASC NULLS LAST
  ```
- **Frontend:**
  - Sortable table component
  - Category filter dropdown
  - Sort indicator (arrows)
  - Pagination controls
- **Response Format:**
  ```json
  {
    "products": [
      {
        "id": "uuid",
        "product_name": "Peru El Mango (Green)",
        "category": "Green Coffee",
        "current_stock": 2.5,
        "avg_monthly_usage": 8.0,
        "days_remaining": 9,
        "status": "critical"
      },
      ...
    ],
    "total_count": 150,
    "page": 1,
    "per_page": 50
  }
  ```

**Dependencies:** None

**Testing Notes:**
- Test with products at various stock levels
- Test with product never sold (verify "N/A")
- Test with zero stock (verify 0 days, appears first)
- Test sorting (all columns)
- Test category filter
- Test pagination
- Test calculation: `(current_stock / avg_monthly_usage) * 30`
- Verify color coding (critical/low/good)

---

## User Story 4.1.2: Filter and Search Products

**As a** user
**I want to** filter products by category and search by name
**So that** I can quickly find specific products

**Priority:** LOW
**Estimate:** 2 story points

**Acceptance Criteria:**
- [ ] Category filter dropdown:
  - Options: All, Coffee, Tea, Green Coffee, Accessories, Other
  - Filters table to show only selected category
- [ ] Search bar:
  - Placeholder: "Search products..."
  - Filters products by name (case-insensitive, partial match)
  - Searches as user types (debounced, 300ms delay)
- [ ] Filters work in combination (category + search)
- [ ] Show result count: "Showing 12 of 150 products"
- [ ] Clear search button (X icon) appears when search has text
- [ ] Filters persist in URL parameters (e.g., `?category=coffee&search=colombia`)

**Technical Implementation:**
- **API Endpoint:** `GET /api/inventory?category=coffee&search=colombia`
- **Backend:**
  - Add WHERE clause for category and search
  - Search: `WHERE p.name LIKE '%:search%'`
- **Frontend:**
  - Debounce search input (300ms)
  - Update URL parameters on filter change
  - Display result count

**Dependencies:**
- User Story 4.1.1 (Stock level table)

**Testing Notes:**
- Test category filter (each category)
- Test search (partial match, case-insensitive)
- Test combined filters
- Test search debouncing
- Test clear search button
- Test URL parameters persist on refresh
