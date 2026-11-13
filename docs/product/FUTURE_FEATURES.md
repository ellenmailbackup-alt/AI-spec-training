# Kruze Coffee & Tea - Future Features

This document outlines planned features for the Kruze Coffee & Tea management system. Each feature includes business requirements, technical approach, and implementation considerations.

---

## 1. n8n API Integration

### Overview
External REST API that allows n8n automation workflows to interact with the Kruze system, starting with roast data creation.

### Business Requirements
- **Phase 1**: Create roast records via API
  - n8n sends roast data (date, green coffee product, roasted coffee product, quantities)
  - System creates roast record
  - Auto-generates stock movements (green coffee OUT, roasted coffee IN)
  - Returns success confirmation to n8n

- **Future Phases**: Extend to other operations (products, customers, sales, etc.)

### Technical Implementation

#### Authentication
- **API Key System**: Generate unique API keys for external access
- Store hashed keys in database with metadata (name, created date, last used)
- Middleware validates API key in `Authorization: Bearer <key>` header
- Separate from session-based authentication (external tools can't use cookies)

#### Endpoints
```
POST /api/external/roasts
Headers: Authorization: Bearer <api-key>
Body: {
  roastDate: "2025-01-15",
  greenCoffeeProductId: "uuid",
  roastedCoffeeProductId: "uuid", 
  greenCoffeeQuantity: 25.5,
  roastedCoffeeQuantity: 21.2,
  notes: "Optional notes"
}
Response: { success: true, roastId: "uuid", stockMovementsCreated: 2 }
```

#### Security Considerations
- Rate limiting (prevent API abuse)
- Input validation (all fields required, quantities must be positive)
- Audit logging (track all API calls with timestamp, IP, action)
- Ability to revoke/regenerate API keys

#### Database Schema
```typescript
// New table: apiKeys
{
  id: uuid primary key
  name: varchar (e.g., "n8n Production Workflow")
  keyHash: varchar (hashed API key)
  createdAt: timestamp
  lastUsedAt: timestamp
  isActive: boolean
}
```

### Implementation Priority
**MEDIUM** - Useful for automation but not immediate priority

---

## 2. Boeren en Buren Import ✅ **COMPLETED**

### Overview
Upload monthly Excel file containing farmers market sales, preview/verify data, then create NEW sales in the system.

### Business Requirements
- **Input**: Excel file uploaded monthly (standardized format)
- **Preview Stage**: Show parsed data before committing
  - Display all rows with product names, quantities, prices
  - Flag potential errors (unknown products, invalid dates, negative quantities)
  - Allow manual edits/corrections
- **Verification**: User reviews and approves or rejects
- **Creation**: Approved rows become NEW sales in the system
- **Customer**: All sales assigned to "Boeren en Buren" customer account

### Technical Implementation

#### Excel Format (Expected Columns)
```
| Date       | Product Name          | Quantity | Unit Price | Total   |
|------------|-----------------------|----------|------------|---------|
| 01/01/2025 | Colombia Supremo 250g | 5        | 8.50       | 42.50   |
| 01/01/2025 | Earl Grey Tea 100g    | 3        | 6.00       | 18.00   |
```

#### Upload Flow
1. **Upload**: User selects Excel file via file input
2. **Parse**: Backend parses using library (e.g., `xlsx`, `exceljs`)
3. **Validate**: Check product names against database, validate dates/quantities
4. **Preview**: Return parsed data with validation flags
5. **Review**: User sees table with color-coded rows (green=valid, yellow=warning, red=error)
6. **Approve**: User confirms → create all sales with status=NEW

#### Product Matching
- Fuzzy matching on product name (handle minor spelling differences)
- Admin interface to create product name aliases/mappings
- Unmapped products flagged for manual assignment

#### UI Components
- File upload dropzone
- Preview table with editable cells
- Bulk actions: "Approve All", "Fix Errors", "Cancel Import"
- Progress indicator during processing

### Database Schema
```typescript
// New table: importLogs
{
  id: uuid
  fileName: varchar
  uploadedAt: timestamp
  uploadedBy: varchar (user ID)
  rowsProcessed: integer
  rowsSucceeded: integer
  rowsFailed: integer
  status: enum('pending', 'completed', 'cancelled')
  errors: jsonb (array of error messages)
}

// New table: productNameAliases
{
  id: uuid
  alias: varchar
  productId: uuid (foreign key)
}
```

### Implementation Priority
**MEDIUM** - Monthly process, manual workaround acceptable short-term

---

## 3. Stock Counting & Reconciliation ✅ **COMPLETED**

### Overview
Physical inventory counting workflow with location tracking, variance analysis, and manual correction movements.

### Business Requirements

#### Workflow Steps
1. **Physical Count**: Manual counting in warehouse (paper/tablet)
2. **Record Locations**: Enter counted quantities per location
   - Example: "Shelf A: 5kg, Cold Storage: 3kg, Display: 2kg"
3. **Calculate Total**: System sums all locations for each product
4. **Variance Analysis**: Compare counted vs system stock
   - Show difference: `Counted (10kg) - System (12kg) = -2kg variance`
5. **Investigation**: User investigates discrepancies
   - Check for unrecorded spoilage, theft, measurement errors
   - Find missing invoices or stock movements
6. **Corrections**: Create manual stock adjustment movements for unexplained differences

#### User Interface
- **Counting Screen**: 
  - Select product
  - Add multiple location entries
  - Real-time total calculation
- **Variance Report**:
  - Table showing: Product | System Stock | Counted Stock | Variance | % Difference
  - Color-coded: green (matches), yellow (small variance <5%), red (large variance >5%)
  - Click to drill down into location details
- **Correction Entry**:
  - Form to create adjustment stock movement
  - Reason code (spoilage, theft, measurement error, administrative correction)
  - Approval workflow for large adjustments?

### Technical Implementation

#### Stock Counting Sessions
- Create "counting session" to group all location records
- Can pause and resume counting over multiple days
- Lock counted products to prevent concurrent stock movements?

#### Variance Calculation
```typescript
const systemStock = calculateCurrentStock(productId); // Sum of all stock movements
const countedStock = sumLocationRecords(countingSessionId, productId);
const variance = countedStock - systemStock;
const variancePercent = (variance / systemStock) * 100;
```

#### Correction Movements
- Type: "ADJUSTMENT_IN" or "ADJUSTMENT_OUT"
- Must include reason and reference to counting session
- Audit trail for all adjustments

### Database Schema
```typescript
// New table: stockCountingSessions
{
  id: uuid
  startedAt: timestamp
  completedAt: timestamp (nullable)
  startedBy: varchar (user ID)
  status: enum('in_progress', 'completed', 'cancelled')
  notes: text
}

// New table: productLocationRecords
{
  id: uuid
  sessionId: uuid (foreign key)
  productId: uuid (foreign key)
  location: varchar (e.g., "Shelf A", "Cold Storage")
  quantity: decimal
  countedAt: timestamp
  countedBy: varchar (user ID)
}

// Extend stockMovements table
adjustmentReason: varchar (nullable)
countingSessionId: uuid (nullable, foreign key)
```

### Implementation Priority
**COMPLETED** - Implemented for periodic inventory accuracy workflows

---

## 4. Price Calculation Tool

### Overview
Interactive price planning tool that calculates B2C and B2B prices for all product variants based on configurable parameters and formulas (different for coffee vs tea).

### Business Requirements

#### Input Parameters (Coffee)
- Green coffee cost per kg
- Roasting loss percentage (e.g., 18%)
- Packaging cost per unit
- Labor cost per batch
- Target profit margin (B2C)
- B2B discount percentage (from B2C)

#### Input Parameters (Tea)
- Wholesale tea cost per kg
- Packaging cost per unit
- Labor/handling cost
- Target profit margin (B2C)
- B2B discount percentage

#### Calculation Formulas

**Coffee Example:**
```
Roasted Coffee Cost = (Green Coffee Cost / (1 - Loss%)) + Packaging + Labor
B2C Price = Roasted Coffee Cost × (1 + Margin%)
B2B Price = B2C Price × (1 - B2B Discount%)
```

**Tea Example:**
```
Tea Unit Cost = (Wholesale Cost / Units per Batch) + Packaging + Labor
B2C Price = Tea Unit Cost × (1 + Margin%)
B2B Price = B2C Price × (1 - B2B Discount%)
```

#### User Workflow
1. **Configure Parameters**: Enter costs and margins in form
2. **Calculate**: System calculates prices for all product variants
3. **Preview Results**: Table showing:
   - Product name
   - Current B2C price → New B2C price (highlight if changed)
   - Current B2B price → New B2B price (highlight if changed)
   - % change
4. **Apply or Cancel**: 
   - "Apply to All" button updates all product prices
   - "Apply Selected" button updates only checked products
   - "Cancel" discards calculations

#### Advanced Features
- Save parameter sets as "scenarios" for comparison
- Export price lists to CSV/PDF
- Batch apply to specific product categories only

### Technical Implementation

#### Calculation Engine
- Separate calculation functions for coffee vs tea
- Support for custom formulas per product category
- Round to 2 decimal places, configurable rounding rules

#### Price Update Logic
- Create price history record before updating
- Batch update products in transaction (all or nothing)
- Audit log of price changes with timestamp and user

#### UI Components
- Tabbed interface: Coffee Parameters | Tea Parameters | Results
- Slider controls for percentages (margin, discount, loss)
- Real-time calculation preview as parameters change
- Comparison view (old vs new prices side-by-side)

### Database Schema
```typescript
// New table: priceCalculationScenarios
{
  id: uuid
  name: varchar
  productType: enum('coffee', 'tea')
  parameters: jsonb (all input values)
  createdAt: timestamp
  createdBy: varchar (user ID)
}

// New table: priceHistory
{
  id: uuid
  productId: uuid (foreign key)
  priceB2C: decimal
  priceB2B: decimal (nullable)
  effectiveDate: timestamp
  changedBy: varchar (user ID)
  changeReason: varchar (e.g., "Price calculation applied")
  scenarioId: uuid (nullable, foreign key)
}
```

### Implementation Priority
**MEDIUM** - Strategic pricing tool, not urgent but high value

---

## 5. Year-End Closure

### Overview
Close fiscal year by creating closing stock movements that bring all product balances to zero (standard accounting practice).

### Business Requirements

#### Manual Trigger
- Admin clicks "Close Year" button
- System prompts for confirmation (irreversible action)
- User confirms fiscal year to close (e.g., "2024")

#### Closing Process
1. **Calculate Final Stock**: For each product, sum all stock movements for the year
2. **Create Closing Movements**: 
   - Type: "CLOSING_STOCK"
   - Date: Last day of fiscal year (e.g., 2024-12-31)
   - Quantity: Negative of total stock (brings balance to zero)
3. **Generate Report**: PDF showing all products with closing quantities
4. **Lock Year**: Prevent further stock movements with dates in closed year

#### Validation
- Cannot close year if:
  - Sales exist with status NEW or SHIPPED (must be INVOICED or PAID)
  - Stock movements have future dates
  - Previous year not yet closed
- Warning if large stock discrepancies detected

### Technical Implementation

#### Closing Movement Creation
```typescript
for each product:
  totalStock = sum(stockMovements where year = closingYear)
  if totalStock != 0:
    create stockMovement {
      type: 'CLOSING_STOCK'
      productId: product.id
      quantity: -totalStock
      date: `${closingYear}-12-31`
      notes: `Year-end closing for ${closingYear}`
    }
```

#### Year Locking
- Add `closedAt` timestamp to year records
- Validation middleware prevents modifications to closed years
- Override permission for administrators (emergency corrections)

#### Closing Report
- PDF generation using PDFKit
- Contains: Company header, closing date, product list with quantities
- Stored in database for historical reference

### Database Schema
```typescript
// New table: fiscalYears
{
  id: uuid
  year: integer (e.g., 2024)
  startDate: date
  endDate: date
  closedAt: timestamp (nullable)
  closedBy: varchar (user ID, nullable)
  closingReportUrl: varchar (nullable)
}

// Extend stockMovements validation
// Add check: movement.date must be in open fiscal year
```

### Implementation Priority
**MEDIUM** - Annual process, can be done manually first year

---

## 6. New Fiscal Year Opening

### Overview
Open new fiscal year by creating opening stock movements based on previous year's closing stock.

### Business Requirements

#### Manual Trigger
- Admin clicks "Open New Year" button
- System prompts for year to open (e.g., "2025")
- Validates that previous year is closed

#### Opening Process
1. **Retrieve Closing Stock**: Get all closing movements from previous year
2. **Create Opening Movements**:
   - Type: "OPENING_STOCK"
   - Date: First day of new year (e.g., 2025-01-01)
   - Quantity: Same as previous year's closing stock (but positive)
3. **Activate Year**: Mark new fiscal year as active
4. **Generate Report**: PDF showing all products with opening quantities

#### Validation
- Cannot open year if:
  - Previous year not closed
  - Year already opened
  - Opening movements already exist for this year

### Technical Implementation

#### Opening Movement Creation
```typescript
closingMovements = getStockMovements({
  type: 'CLOSING_STOCK',
  year: previousYear
})

for each closingMovement:
  create stockMovement {
    type: 'OPENING_STOCK'
    productId: closingMovement.productId
    quantity: -closingMovement.quantity (inverse of closing)
    date: `${newYear}-01-01`
    notes: `Opening stock for ${newYear}`
    linkedMovementId: closingMovement.id (reference)
  }
```

#### Year Activation
- Set new fiscal year as `isActive: true`
- Only one active year at a time
- All new transactions default to active year

### Database Schema
```typescript
// Extend fiscalYears table
isActive: boolean (default false)

// Extend stockMovements table
linkedMovementId: uuid (nullable, foreign key to stockMovements)
```

### Implementation Priority
**MEDIUM** - Annual process, coupled with year-end closure

---

## 7. Dashboards

### Overview
Three specialized dashboard views providing operational insights, year-over-year analysis, and production tracking.

---

### 7.1 Main Admin Dashboard (Current Year Operations)

#### Business Requirements
Real-time business health metrics for the current fiscal year.

#### Key Metrics
- **Revenue Summary**
  - Total sales revenue (current year)
  - Monthly revenue trend (line chart)
  - Revenue by status: INVOICED vs PAID
  - Outstanding invoices (amount and count)

- **Customer Insights**
  - Top 10 customers by revenue
  - New vs returning customers this month
  - B2B vs B2C revenue split

- **Product Performance**
  - Top 10 products by quantity sold
  - Top 10 products by revenue
  - Low stock alerts (products below threshold)

- **Recent Activity**
  - Latest 10 sales (with status)
  - Latest stock movements
  - Pending invoices requiring action

#### UI Layout
- Grid of cards (4 columns on desktop, stacked on mobile)
- Charts using library (e.g., Recharts, Chart.js)
- Refresh button + auto-refresh every 5 minutes
- Date range selector (default: current year)

---

### 7.2 Year-over-Year Sales Dashboard

#### Business Requirements
Compare sales performance across multiple years to identify trends.

#### Key Metrics
- **Revenue Comparison**
  - Bar chart: Total revenue by year (2023, 2024, 2025)
  - Line chart: Monthly revenue comparison (overlay 3 years)
  - Growth percentage year-over-year

- **Customer Growth**
  - Total customers by year
  - New customers acquired per year
  - Customer retention rate

- **Sales Volume**
  - Number of invoices by year
  - Average order value by year
  - Sales by channel (B2B vs B2C) over time

- **Product Mix Evolution**
  - Coffee sales vs tea sales by year
  - Category breakdown over time

#### UI Layout
- Year selector (checkboxes for multiple years)
- Stacked charts for comparison
- Data table with year-by-year breakdown
- Export to CSV/PDF

---

### 7.3 Coffee & Tea Production Dashboard

#### Business Requirements
Long-term production insights focused on roasting volumes and product mix.

#### Key Metrics
- **Coffee Roasting**
  - Total kg roasted per year (bar chart)
  - Monthly roasting volume (line chart)
  - Most roasted varieties (pie chart)
  - Average roasting loss percentage over time

- **Green Coffee Consumption**
  - Total kg green coffee used per year
  - Green to roasted ratio (efficiency metric)
  - Top green coffee origins

- **Tea Production**
  - Total kg tea sold per year
  - Top tea varieties

- **Product Mix**
  - Coffee % vs Tea % revenue over years (stacked area chart)
  - Diversification trend

- **Cost Trends** (optional)
  - Average cost per kg green coffee over time
  - Average cost per kg roasted coffee
  - Margin trends

#### UI Layout
- Time range selector (all years, last 3 years, last 5 years)
- Multiple charts in tabs or scrollable sections
- Exportable data tables
- Drill-down capability (click year → see monthly details)

---

### Technical Implementation (All Dashboards)

#### Data Aggregation
- Server-side calculations for performance
- Cache frequently accessed metrics (Redis or in-memory)
- Background jobs for heavy calculations?

#### API Endpoints
```
GET /api/dashboards/operational
GET /api/dashboards/yoy-sales
GET /api/dashboards/production
Query params: ?startYear=2023&endYear=2025
```

#### Performance Considerations
- Aggregate queries with indexes on date/status fields
- Materialized views for complex calculations?
- Lazy loading for charts (load visible charts first)

#### Charting Library
- **Recharts** (recommended): React-friendly, responsive, customizable
- Alternative: Chart.js, Victory

### Implementation Priority
**MEDIUM-HIGH** - High business value for decision-making, but MVP operational without them

---

### 7.4 Dashboard Backlog (Detailed Stories, VAT Excl)

The items below are written as INVEST-friendly user stories. They are small, testable, and focused on weekly/bi-weekly reviews. All amounts are **VAT excl**.

#### Phase 1: Main Dashboard (Weekly Quick Scan)

**Epic 7.4.1: Revenue Overview (YoY)**

**User Story 7.4.1.1: Current Month Revenue vs Same Month Last Year**  
As a business owner, I want to see current month revenue compared to the same month last year, so I can quickly assess growth.

Acceptance Criteria:
- Show current month revenue total (VAT excl) for statuses INVOICED or PAID.
- Show same month last year revenue total (VAT excl).
- Show absolute change (€, VAT excl) and percentage change.
- Show growth indicator: 📈 for positive, 📉 for negative, ➡️ for zero.
- Use current server date to determine month/year.

**User Story 7.4.1.2: Year-to-Date Revenue vs Last Year**  
As a business owner, I want to see year-to-date revenue compared to the same period last year, so I can track overall performance.

Acceptance Criteria:
- Show YTD revenue (VAT excl) from Jan 1 to today for current year.
- Show YTD revenue (VAT excl) for the same date range in the previous year.
- Show absolute change (€, VAT excl) and percentage change.
- Show growth indicator (📈/📉/➡️).

**Epic 7.4.2: Revenue by Channel (YoY)**

**User Story 7.4.2.1: Channel Revenue Table**  
As a business owner, I want to see revenue by channel (B2B, B2C, Webshop, Boeren en Buren) with YoY comparison, so I can spot channel shifts.

Acceptance Criteria:
- Table columns: Channel | This Month | Same Month Last Year | Change.
- Show VAT excl totals for INVOICED or PAID sales.
- Show absolute and percentage change per channel.
- Handle zero or missing previous-year data (show € 0 or “N/A” without division errors).
- Use channel values: B2B, B2C, Webshop, Boeren en Buren.
- No webshop automation required for Phase 1 (data optional if present).

**Epic 7.4.3: Sales Trend (YoY Overlay)**

**User Story 7.4.3.1: Monthly Trend Chart**  
As a business owner, I want a chart that overlays current year and last year monthly revenue, so I can see seasonality.

Acceptance Criteria:
- Line or bar chart with Jan–Dec on the X-axis.
- Two series: current year and previous year (VAT excl).
- Future months in current year show € 0.
- Tooltip shows month + year + value (VAT excl).

**Epic 7.4.4: Sales by Category**

**User Story 7.4.4.1: Category Pie Chart**  
As a business owner, I want a pie chart showing revenue by product category, so I can see product mix.

Acceptance Criteria:
- Categories: Coffee, Tea, Green Coffee, Accessories, Takeaway.
- Based on current year sales (Jan 1 to today), VAT excl.
- Each slice shows category and percentage.
- Tooltip shows category + VAT excl amount.

**Epic 7.4.5: Invoice Health Summary**

**User Story 7.4.5.1: Invoice Health Metrics**  
As a business owner, I want a small invoice health summary, so I can spot overdue invoices during weekly/bi-weekly reviews.

Acceptance Criteria:
- Show total outstanding (INVOICED, not PAID), VAT excl.
- Show overdue amount for invoices > 15 days, VAT excl.
- Show overdue invoice count.
- Show average days to payment for invoices paid in last 12 months.
- Highlight overdue amount if > € 0.
- Link to “Invoice Manager”.

**Epic 7.4.6: Stock Alerts Summary**

**User Story 7.4.6.1: Low Stock Alerts**  
As a business owner, I want to see the top 3 lowest stock items with days remaining, so I can plan orders.

Acceptance Criteria:
- Show top 3 products with lowest days remaining.
- Days remaining uses last 12 months average usage:
  - Average monthly usage = total quantity sold last 12 months / 12.
  - Days remaining = current stock / (avg monthly usage / 30).
- Color code thresholds are configurable via parameter_table (defaults: 🔴 <15 days, 🟡 15–30, 🟢 >30).
- Exclude non-inventory products.

**Epic 7.4.7: Customer Stats**

**User Story 7.4.7.1: Customer Metrics**  
As a business owner, I want customer statistics (total, new, one-time, inactive), so I can track customer health.

Acceptance Criteria:
- Total customers (distinct).
- New this month (first sale in current month).
- One-time customers (exactly one sale).
- Inactive customers (no sales in last 12 months, but had sales before).
- Show total sales count for current year.

**Epic 7.4.8: Top Performers**

**User Story 7.4.8.1: Top Customers by Revenue**  
As a business owner, I want a list of top customers by revenue, so I can identify key accounts.

Acceptance Criteria:
- Top 10 customers by VAT excl revenue (current year).
- Only INVOICED or PAID sales.
- Show rank, customer name, and VAT excl revenue.

**User Story 7.4.8.2: Top Products by Revenue**  
As a business owner, I want a list of top products by revenue, so I can see best sellers.

Acceptance Criteria:
- Top 10 products by VAT excl revenue (current year).
- Only INVOICED or PAID sales.
- Show rank, product name, and VAT excl revenue.

**Epic 7.4.9: Dashboard API + UI**

**User Story 7.4.9.1: Main Dashboard API**  
As a developer, I want a single API endpoint for dashboard data, so the UI loads efficiently.

Acceptance Criteria:
- Endpoint returns all main dashboard sections in one response.
- Response includes generated_at timestamp and current date.
- Handles missing data gracefully (defaults or nulls).
- Response time target: <2 seconds for typical dataset.

**User Story 7.4.9.2: Main Dashboard Page**  
As a user, I want a clean main dashboard layout, so I can scan metrics in under 5 minutes.

Acceptance Criteria:
- Route: /dashboard.
- Sections in order: revenue overview, revenue by channel, trend + category, invoice + stock, customers + top performers.
- Responsive layout (desktop/tablet/mobile).
- Loading and error states (retry button).

#### Phase 2: Invoice Manager (Weekly/Bi-Weekly Review)

**Epic 7.4.10: Invoice List + Filters**

**User Story 7.4.10.1: Open Invoice List**  
As a business owner, I want a list of open invoices, so I can track outstanding payments.

Acceptance Criteria:
- Show all INVOICED sales with VAT excl amounts.
- Columns: Customer | Invoice Date | Amount | Days Outstanding | Actions.
- Sort by days outstanding (highest first).
- Highlight by aging buckets: 0–15, 16–30, 31+.

**User Story 7.4.10.2: Aging Filters**  
As a business owner, I want filters for aging buckets, so I can focus on overdue invoices.

Acceptance Criteria:
- Filters: All, Within Terms, Overdue, Seriously Overdue.
- Each filter shows count.
- Filter persists on refresh (query param or storage).

**User Story 7.4.10.3: Mark Invoice as Paid**  
As a user, I want to mark invoices as paid, so payment status stays accurate.

Acceptance Criteria:
- “Mark as Paid” action with confirmation.
- Updates status to PAID and sets paid_date.
- Removes invoice from open list on success.

**Epic 7.4.11: Invoice Health Metrics**

**User Story 7.4.11.1: Aging Summary**  
As a business owner, I want a summary of invoices by aging bucket, so I can see total exposure.

Acceptance Criteria:
- Show bucket totals (count + VAT excl amount) for 0–15, 16–30, 31+.
- Color-coded summary.

**User Story 7.4.11.2: Average Days to Payment**  
As a business owner, I want average days to payment, so I can see if payment speed is improving.

Acceptance Criteria:
- Average days to payment based on invoices paid in last 12 months.
- Show target (15 days) and color indicator.

#### Phase 3: Sales Analysis (Monthly Deep Dive)

**Epic 7.4.12: Multi-Year Comparison**

**User Story 7.4.12.1: Month-by-Month Table**  
As a business owner, I want a month-by-month table across multiple years, so I can compare quickly without switching views.

Acceptance Criteria:
- Rows = months, columns = selected years.
- Show VAT excl revenue per month and year.
- Show YoY change between current and previous year.
- Export to CSV/Excel.

**User Story 7.4.12.2: Multi-Year Trend Chart**  
As a business owner, I want a multi-year trend chart, so I can spot seasonality.

Acceptance Criteria:
- Multiple lines, one per year (VAT excl).
- Toggle year visibility.
- Tooltips show month + year + value.

**Epic 7.4.13: Lifetime Stats**

**User Story 7.4.13.1: Lifetime Revenue & Best Month**  
As a business owner, I want lifetime stats, so I can track long-term progress.

Acceptance Criteria:
- Show all-time revenue (VAT excl).
- Show best month ever (month/year + VAT excl amount).
- Show YoY growth rates for available years.

#### Phase 4: Inventory (Reorder Planning)

**Epic 7.4.14: Inventory Overview**

**User Story 7.4.14.1: Stock Table**  
As a business owner, I want a full stock table, so I can plan reorders.

Acceptance Criteria:
- Columns: Product | Category | Current Stock | Avg/Month | Days Remaining | Status.
- Avg/Month uses last 12 months average.
- Sortable and filterable by category.
- Products with zero stock appear first.

**User Story 7.4.14.2: Stock Movement Summary**  
As a business owner, I want a 30-day stock movement summary, so I can see recent changes.

Acceptance Criteria:
- Show stock in/out and net change by category for last 30 days.
- Highlight net negative categories.

#### Cross-Cutting: Data & Navigation

**Epic 7.4.15: Data Model Updates**

**User Story 7.4.15.1: Sales Channel Field**  
As a developer, I want a channel field on sales, so reporting by channel is consistent.

Acceptance Criteria:
- Sales channel enum supports B2B, B2C, Webshop, Boeren en Buren.
- Channel required for new sales.
- Existing sales can remain unknown until updated.

**User Story 7.4.15.2: Invoice & Payment Dates**  
As a developer, I want invoice_date and paid_date fields, so aging metrics are accurate.

Acceptance Criteria:
- invoice_date set when status moves to INVOICED.
- paid_date set when status moves to PAID.
- Backfill existing data using sale date as fallback.

**Epic 7.4.16: Navigation**

**User Story 7.4.16.1: Dashboard Links**  
As a user, I want clear navigation links, so I can reach each dashboard page quickly.

Acceptance Criteria:
- Navigation includes Dashboard, Invoice Manager, Sales Analysis, Inventory.
- Current page is highlighted.
- Mobile navigation works.

## Implementation Roadmap

### ✅ Completed
1. **Boeren en Buren Import** - Monthly farmers market sales import with smart product mapping

### Phase 1: Foundation (Medium Priority)
2. **n8n API** - Roast creation endpoint (enables automation)
3. **Main Admin Dashboard** - Operational visibility

### Phase 2: Inventory Management
4. **Stock Counting** ✅ - Accuracy and reconciliation
5. **Year-End Closure** - Proper accounting
6. **New Year Opening** - Coupled with closure

### Phase 3: Strategic Tools
7. **Price Calculation Tool** - Strategic pricing
8. **YoY Sales Dashboard** - Historical analysis
9. **Production Dashboard** - Long-term insights

---

## Technical Considerations

### Security
- All external APIs require authentication (API keys)
- Input validation on all endpoints
- Rate limiting to prevent abuse
- Audit logging for sensitive operations (price changes, year closures)

### Performance
- Batch operations for large datasets (Excel imports, price updates)
- Background jobs for long-running tasks (year closure, WooCommerce sync)
- Database indexes on frequently queried fields
- Caching for dashboard metrics

### Error Handling
- Graceful degradation (show partial data if some queries fail)
- User-friendly error messages
- Detailed error logging for debugging
- Retry logic for external API calls (WooCommerce)

### Testing
- Unit tests for calculation logic (prices, stock reconciliation)
- Integration tests for external APIs (n8n, WooCommerce)
- E2E tests for critical workflows (year closure, import processes)

### Documentation
- API documentation for n8n integration (request/response examples)
- User guides for complex features (stock counting, price calculations)
- Administrator documentation for year-end processes

---

## Questions for Future Refinement

### Stock Counting
- Should counting sessions lock products from concurrent movements?
- Approval workflow for large adjustments?
- Mobile app for warehouse counting (future consideration)?

### Dashboards
- Specific KPIs to highlight (profit margins, customer acquisition cost)?
- Email alerts for threshold breaches (low stock, overdue invoices)?
- Drill-down capabilities (click chart → detailed table)?

### Year-End Processes
- Generate tax reports during closure?
- Archive old data after closure (for performance)?
- Support for mid-year fiscal calendars (not Jan-Dec)?

---

*Last Updated: January 2025*
*Maintained by: Kruze Development Team*
