# Story 4.2 — Stock Movement History

## User Story 4.2.1: Display Stock Movement Summary

**As a** business owner
**I want to** see stock movement summary by category (last 30 days)
**So that** I understand stock consumption trends

**Priority:** LOW
**Estimate:** 3 story points

**Acceptance Criteria:**
- [ ] Display table or cards showing (last 30 days):
  - Category
  - Stock IN (purchases, roasting IN, adjustments IN)
  - Stock OUT (sales, roasting OUT, adjustments OUT)
  - Net Change (IN - OUT)
- [ ] Categories: Green Coffee, Roasted Coffee, Tea, Accessories, Other
- [ ] Stock IN = sum of positive quantity stock movements
- [ ] Stock OUT = sum of absolute value of negative quantity movements
- [ ] Net Change = Stock IN - Stock OUT
- [ ] Color indicator for Net Change:
  - Green if net positive (stock increased)
  - Red if net negative (stock decreased)
- [ ] Time period: Last 30 days (configurable in future: 7 days, 90 days, etc.)
- [ ] Quantities shown in kg or units (with unit label)

**Technical Implementation:**
- **API Endpoint:** `GET /api/inventory/movement-summary?days=30`
- **Database Query:**
  ```sql
  SELECT
    p.category,
    SUM(CASE WHEN sm.quantity > 0 THEN sm.quantity ELSE 0 END) as stock_in,
    SUM(CASE WHEN sm.quantity < 0 THEN ABS(sm.quantity) ELSE 0 END) as stock_out,
    SUM(sm.quantity) as net_change
  FROM stockMovements sm
  JOIN products p ON p.id = sm.product_id
  WHERE sm.date >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
  GROUP BY p.category
  ORDER BY p.category
  ```
- **Response Format:**
  ```json
  {
    "summary": [
      {
        "category": "Green Coffee",
        "stock_in": 50,
        "stock_out": 42,
        "net_change": 8
      },
      ...
    ]
  }
  ```

**Dependencies:** None

**Testing Notes:**
- Test with stock movements in last 30 days
- Test with no stock movements (empty state)
- Test calculation (IN, OUT, Net)
- Test color indicator (positive/negative)
- Verify categories included

---

## User Story 4.2.2: Display Recent Stock Movements

**As a** user
**I want to** see a list of recent stock movements
**So that** I can verify recent activity

**Priority:** LOW
**Estimate:** 2 story points

**Acceptance Criteria:**
- [ ] Display table of last 20 stock movements
- [ ] Columns:
  - Date
  - Product Name
  - Type (Purchase, Sale, Roasting, Adjustment, Opening Stock, Closing Stock)
  - Quantity (+/- with sign, e.g., "+25kg" or "-5kg")
  - Notes (if available)
- [ ] Sorted by date descending (newest first)
- [ ] Positive quantities (IN) shown in green with "+" prefix
- [ ] Negative quantities (OUT) shown in red with "-" prefix
- [ ] Link to view full movement history (future enhancement, optional for MVP)

**Technical Implementation:**
- **API Endpoint:** `GET /api/inventory/recent-movements?limit=20`
- **Database Query:**
  ```sql
  SELECT
    sm.date,
    p.name as product_name,
    sm.type,
    sm.quantity,
    sm.notes
  FROM stockMovements sm
  JOIN products p ON p.id = sm.product_id
  ORDER BY sm.date DESC, sm.created_at DESC
  LIMIT 20
  ```
- **Response Format:**
  ```json
  {
    "movements": [
      {
        "date": "2025-12-24",
        "product_name": "Peru El Mango (Green)",
        "type": "Sale",
        "quantity": -2.5,
        "notes": "Sale #764"
      },
      ...
    ]
  }
  ```

**Dependencies:** None

**Testing Notes:**
- Test with various movement types
- Test quantity sign display (+/-)
- Test color coding (green for +, red for -)
- Test sorting (newest first)
- Test with no movements (empty state)
