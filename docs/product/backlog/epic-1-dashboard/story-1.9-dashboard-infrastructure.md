# Story 1.9 — Dashboard Infrastructure

## User Story 1.9.1: Create Dashboard API Endpoint

**As a** frontend developer
**I want to** fetch all dashboard data from a single API endpoint
**So that** the dashboard loads efficiently without multiple API calls

**Priority:** HIGH
**Estimate:** 5 story points

**Acceptance Criteria:**
- [ ] API endpoint: `GET /api/dashboards/main`
- [ ] Requires authentication (valid session token)
- [ ] Returns JSON with all dashboard sections:
  - `revenue_overview` (current month, YTD, YoY comparisons)
  - `channels` (revenue by channel with YoY)
  - `monthly_trend` (12 months data for current and previous year)
  - `sales_by_category` (pie chart data)
  - `invoice_health` (outstanding, overdue, avg days)
  - `stock_alerts` (top 3 low stock products)
  - `customer_stats` (total, new, one-time, inactive)
  - `top_customers` (top 10 by revenue)
  - `top_products` (top 10 by revenue)
- [ ] Response time <2 seconds under normal load (typical dataset: 10,000 sales, 500 products)
- [ ] Includes metadata:
  - `generated_at` (timestamp of data generation)
  - `current_date` (server date)
  - `current_year` (server year)
- [ ] Handles missing data gracefully:
  - Returns `null` for unavailable metrics
  - Returns empty arrays `[]` for lists with no data
  - Never returns 500 errors for missing data
- [ ] All revenue amounts exclude VAT
- [ ] API versioned (e.g., `/api/v1/dashboards/main`) for future compatibility

**Technical Implementation:**
- **Endpoint:** `GET /api/v1/dashboards/main`
- **Authentication:** Middleware checks session/JWT token
- **Query Optimization:**
  - Use database connection pooling
  - Consider parallel query execution (if database supports)
  - Add database indexes (see Story 5.2)
- **Response Format:**
  ```json
  {
    "generated_at": "2025-12-24T10:30:00Z",
    "current_date": "2025-12-24",
    "current_year": 2025,
    "revenue_overview": {
      "current_month": {
        "amount": 7200,
        "month": "December",
        "year": 2025
      },
      "previous_month": {
        "amount": 6800,
        "month": "December",
        "year": 2024
      },
      "change": {
        "absolute": 400,
        "percentage": 5.9
      },
      "ytd_current": {
        "amount": 68700,
        "year": 2025
      },
      "ytd_previous": {
        "amount": 62400,
        "year": 2024
      },
      "ytd_change": {
        "absolute": 6300,
        "percentage": 10.1
      }
    },
    "channels": [...],
    "monthly_trend": [...],
    "sales_by_category": [...],
    "invoice_health": {...},
    "stock_alerts": [...],
    "customer_stats": {...},
    "top_customers": [...],
    "top_products": [...]
  }
  ```
- **Error Handling:**
  - 401 if unauthenticated
  - 500 if database error (with generic error message, log details server-side)
  - 200 with partial data if some queries fail (log failures)
- **Caching Strategy (optional Phase 2 optimization):**
  - Consider Redis cache with 5-minute TTL
  - Cache key: `dashboard:main:{current_date}`
  - Invalidate on data changes (sales created/updated)

**Dependencies:**
- All Epic 1.1-1.8 user stories (data requirements)
- Database schema updates (channel, invoice_date, paid_date fields)

**Testing Notes:**
- Load testing: Simulate 100 concurrent requests, verify <2s response time
- Test with empty database (verify graceful handling)
- Test with large dataset (10,000+ sales)
- Test authentication (verify 401 for invalid token)
- Test partial data scenarios (e.g., no stock movements)
- Verify all amounts are VAT excluded

---

## User Story 1.9.2: Create Dashboard Frontend Component

**As a** user
**I want to** view the main dashboard with all metrics in a clean, scannable layout
**So that** I can quickly assess business performance in my weekly check-in

**Priority:** HIGH
**Estimate:** 8 story points

**Acceptance Criteria:**
- [ ] Dashboard page accessible at `/dashboard` route
- [ ] Page loads and displays all sections:
  1. Revenue Overview (top section, prominent placement)
  2. Revenue by Channel (table below revenue)
  3. Monthly Sales Chart (left) and Sales by Category Chart (right) - side by side
  4. Invoice Health (left) and Stock Alerts (right) - side by side
  5. Customer Stats (left) and Top Performers (right) - bottom section
- [ ] Layout responsive:
  - Desktop (>1024px): Multi-column grid layout
  - Tablet (768-1024px): 2-column layout
  - Mobile (<768px): Single column, stacked sections
- [ ] Loading state:
  - Show skeleton loaders or spinner while fetching data
  - Message: "Loading dashboard..."
- [ ] Error state:
  - If API fails, show error message: "Failed to load dashboard data"
  - Retry button: "Retry"
  - Does not crash/show blank screen
- [ ] Auto-refresh (optional):
  - Manual refresh button in top-right corner
  - Optional: Auto-refresh every 5 minutes (configurable)
- [ ] Visual hierarchy clear:
  - Revenue metrics largest/most prominent
  - Section headers clear (bold, larger font)
  - Adequate spacing between sections
- [ ] Color coding consistent:
  - Green = positive/good (growth, within targets)
  - Yellow = warning (approaching thresholds)
  - Red = alert/critical (overdue, low stock, decline)
- [ ] All currency values formatted with € symbol and thousands separator
- [ ] Charts use Recharts library (or specified charting library)
- [ ] Page title: "Dashboard" (browser tab and page header)
- [ ] Accessible: Keyboard navigation, screen reader friendly

**Technical Implementation:**
- **Framework:** React (or current frontend framework)
- **Routing:** React Router, route: `/dashboard`
- **State Management:**
  - React hooks (useState, useEffect)
  - OR Redux/Context for complex state
- **API Call:**
  - Fetch from `GET /api/v1/dashboards/main` on component mount
  - Handle loading, success, error states
- **Charting Library:** Recharts
  - LineChart for monthly trend
  - PieChart for sales by category
- **Styling:** Tailwind CSS (or existing design system)
- **Components Structure:**
  ```
  Dashboard (page)
  ├── RevenueOverview
  ├── RevenueByChannel (table)
  ├── MonthlySalesTrend (chart)
  ├── SalesByCategory (chart)
  ├── InvoiceHealth
  ├── StockAlerts
  ├── CustomerStats
  ├── TopPerformers
  │   ├── TopCustomers (table)
  │   └── TopProducts (table)
  ```
- **Responsive Breakpoints:**
  - Mobile: <768px
  - Tablet: 768-1024px
  - Desktop: >1024px

**Dependencies:**
- User Story 1.9.1 (API endpoint must be complete)
- Design mockups/wireframes (if available)

**Testing Notes:**
- Test on desktop, tablet, mobile (responsive)
- Test loading state (simulate slow API)
- Test error state (simulate API failure)
- Test with real data (full dataset)
- Test with empty data (no sales, no products)
- Verify all amounts show € symbol and VAT excluded
- Verify charts render correctly
- Verify color coding (green/yellow/red) is consistent
- Accessibility testing (keyboard nav, screen reader)
