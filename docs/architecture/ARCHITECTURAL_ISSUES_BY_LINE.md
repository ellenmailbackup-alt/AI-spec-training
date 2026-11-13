# Architectural Issues - Detailed Line-by-Line Reference

## HIGH SEVERITY ISSUES (Fix First)

### Issue 1.1: Complex Invoice Creation
**File:** `server/routes.ts`
**Lines:** 1102-1200
**Route:** `POST /api/sales`
**Severity:** HIGH

**Problematic Code Sections:**
- Lines 1104-1109: Parameter extraction from request
- Lines 1115-1195: Complex conditional logic (B2B vs B2C)
- Lines 1118-1122: Database query for current year parameter
- Lines 1130-1172: Full transaction handling with invoice locking
- Lines 1152-1166: Data preparation (8 fields initialized as strings/booleans)

**Why It's Wrong:**
- Route is 99 lines (entire handler)
- Contains 3 separate database queries
- Has transaction management
- Has business logic (invoice number generation)
- Has conditional branching logic
- Parameter extraction couples route to database schema

**Should Be In:** `salesService.ts::createSale()`

**Performance Impact:** 3+ database round-trips for single operation

---

### Issue 1.2: Sale Update with Transaction and Joins
**File:** `server/routes.ts`
**Lines:** 519-599
**Route:** `PATCH /api/sales/:id`
**Severity:** HIGH

**Problematic Code Sections:**
- Lines 525-527: Business validation mixed with HTTP validation
- Lines 532-589: Entire transaction block
  - Lines 534-543: Sale update
  - Lines 549-550: Delete old line items
  - Lines 553-556: Insert new line items
  - Lines 559-583: Fetch updated sale with 3-way joins
- Lines 585-588: Result assembly (mixing data with presentation)

**Why It's Wrong:**
- Route handler is 81 lines
- Contains transaction management
- Performs delete-then-insert pattern (business logic)
- Executes 3-way join in route (query logic belongs in storage)
- Assembles complex result with line items

**Should Be In:** `salesService.ts::updateSale()`

**Performance Impact:** Complex transaction with joins, difficult to debug

---

### Issue 2.1: Stock Movements Query with In-Memory Filtering
**File:** `server/routes.ts`
**Lines:** 1220-1275
**Route:** `GET /api/stock-movements`
**Severity:** HIGH

**Problematic Code Sections:**
- Lines 1222-1223: Dynamic schema imports (anti-pattern)
- Lines 1224-1227: Query parameters extraction
- Lines 1229-1237: Filter condition building
- Lines 1239-1257: Complex query construction with 2 joins
- Lines 1259-1268: In-memory filtering (loads all results, then filters)

**Why It's Wrong:**
- Query construction in route (belongs in storage layer)
- Dynamic imports indicate over-complexity
- In-memory filtering loads entire dataset then filters
- Filtering could be done in SQL (1000x faster for large datasets)
- Not reusable if search needed elsewhere

**Should Be In:** `storage.ts::getStockMovements()` or `stockMovementService.ts`

**Performance Impact:** In-memory filtering is 10-100x slower than SQL filtering

---

### Issue 2.2: Stock Calculation with 4 Sequential Queries
**File:** `server/routes.ts`
**Lines:** 1277-1348
**Route:** `GET /api/products/:id/stock-movements`
**Severity:** HIGH

**Problematic Code Sections:**
- Lines 1284-1289: Parameter extraction (repeated pattern)
- Lines 1292-1302: Query 1 - Start stock calculation
- Lines 1307-1318: Query 2 - Total bought calculation
- Lines 1323-1334: Query 3 - Total sold calculation
- Lines 1338-1343: Result assembly

**Why It's Wrong:**
- 4 separate database queries for one operation (n+1 problem)
- Business logic (calculating start stock, bought, sold) in route
- Parameter extraction repeated (not DRY)
- Each query makes separate round-trip to database
- Could be 1 optimized query

**Should Be In:** `storage.ts::getProductStockSummary()`

**Performance Impact:** 4x slower than needed. Could calculate all metrics in 1 query.

---

### Issue 1.3: Sale Deletion with Transaction
**File:** `server/routes.ts`
**Lines:** 601-628
**Route:** `DELETE /api/sales/:id`
**Severity:** HIGH

**Problematic Code Sections:**
- Lines 605-606: Dynamic schema import
- Lines 607-618: Transaction handling
  - Line 610: Delete line items (foreign key constraint)
  - Line 613: Delete sale
  - Lines 615-617: Error checking

**Why It's Wrong:**
- Transaction management in route
- Foreign key constraint handling (business rule) in route
- Should be in service layer for reusability

**Should Be In:** `salesService.ts::deleteSale()`

---

### Issue 4.1: Product Statistics with 4 Queries
**File:** `server/storage.ts`
**Lines:** 387-438
**Method:** `getProductStatistics()`
**Severity:** HIGH

**Problematic Code Sections:**
- Lines 394-401: Query 1 - YTD Sales (raw SQL)
- Lines 404-409: Query 2 - Current Stock (raw SQL)
- Lines 412-422: Query 3 - Highest Monthly Sale (raw SQL)
- Lines 425-430: Query 4 - Total Revenue (raw SQL)

**Why It's Wrong:**
- Makes 4 separate database queries
- Could be 1 optimized query with multiple aggregates
- Each query makes separate round-trip
- Raw SQL instead of ORM
- Error handling missing

**Should Be:** Single query with all aggregates

**Performance Impact:** 4x slower. 4 round-trips instead of 1.

**Example Optimization:**
```sql
-- Instead of 4 queries, use 1:
SELECT 
  SUM(sl.amount * sl.weight) FILTER (WHERE EXTRACT(YEAR FROM s.sales_date) = $1) as ytd_sales,
  COALESCE(SUM(sm.quantity), 0) as current_stock,
  MAX(...) as highest_monthly,
  SUM(sl.total_without_vat) as total_revenue
FROM salesline sl
LEFT JOIN sale s ON sl.sale_id = s.id
LEFT JOIN stock_movement sm ON sm.product_id = $2
WHERE sl.product_id = $2
```

---

### Issue 4.2: Customer Statistics with 6 Queries
**File:** `server/storage.ts`
**Lines:** 538-609
**Method:** `getCustomerStatistics()`
**Severity:** HIGH

**Problematic Code Sections:**
- Lines 548-554: Query 1 - Lifetime Value
- Lines 557-564: Query 2 - Current Year Revenue
- Lines 567-574: Query 3 - Previous Year Revenue
- Lines 577-587: Query 4 - Order Stats and Average
- Lines 590-598: Query 5 - First/Last Purchase Dates
- Lines 600-608: Result assembly with date formatting

**Why It's Wrong:**
- Makes 6 separate database queries
- Could be optimized to 1-2 queries
- Each query makes separate round-trip
- Business logic (date formatting) in storage layer
- Very inefficient for frequently accessed data

**Should Be:** Consolidate to 2 optimized queries

**Performance Impact:** 6x slower. 6 round-trips instead of 2 max.

---

## MEDIUM SEVERITY ISSUES (Fix Second)

### Issue 3.1: Parameter Extraction Repeated in Routes
**File:** `server/routes.ts`
**Locations:**
- Lines 267-268: GET /api/products/:id/statistics
- Lines 422-423: GET /api/customers/:id/statistics
- Lines 1284-1289: GET /api/products/:id/stock-movements

**Problem:** Same code duplicated 3+ times
```typescript
const [paramRow] = await db.select().from(parameterTable).where(eq(parameterTable.parameterName, "current_year"));
const currentYear = paramRow ? parseInt(paramRow.parameterValue) : new Date().getFullYear();
```

**Why It's Wrong:**
- Not DRY (Don't Repeat Yourself)
- Couples multiple routes to parameter table structure
- No caching (repeated queries)
- Should be single utility/service method

**Should Be:** `parameterService.ts::getCurrentYear()` with caching

**Performance Impact:** Same query executed multiple times. Caching would be 100x faster.

---

### Issue 3.2-3.4: Statistics Endpoints
**File:** `server/routes.ts`
**Locations:**
- Lines 262-276: GET /api/products/:id/statistics
- Lines 278-300: GET /api/products/:id/monthly-sales
- Lines 417-453: GET /api/customers/:id/statistics (multiple endpoints)
- Lines 1438-1466: GET /api/analytics/dashboard

**Problem:** Mix of route complexity and storage layer complexity

**Details by Endpoint:**

**GET /api/products/:id/statistics**
- Lines 267-268: Parameter extraction
- Line 270: Calls storage method with complex SQL (Issue 4.1)

**GET /api/analytics/dashboard**
- Lines 1440-1444: Loads ALL customers, ALL sales, ALL products
- Lines 1447-1452: In-memory revenue calculation (should be SQL)
- Line 1458: In-memory supplier count calculation (should be SQL)

**Why It's Wrong:**
- Analytics dashboard loads entire datasets into memory
- Performs calculations in JavaScript
- Not scalable (imagine 100k sales)
- Should use SQL aggregation

---

### Issue 4.3: Sales Stats with Hardcoded Business Rules
**File:** `server/storage.ts`
**Lines:** 736-756
**Method:** `getSalesStats()`

**Problematic Code Sections:**
- Lines 739: Count distinct invoices
- Lines 740: Revenue from webshop (CASE logic)
- Lines 741: Revenue from 'KRUZE' customer (hardcoded name)
- Lines 742: Revenue from 'BUURDERIJ' customer (hardcoded name)

**Why It's Wrong:**
- Hardcoded customer names in SQL
- Business rules not documented or configurable
- Difficult to test or change

---

### Issue 4.4: Customer Stats with Business Logic
**File:** `server/storage.ts`
**Lines:** 663-692
**Method:** `getCustomerStats()`

**Problematic Code Sections:**
- Lines 672-673: Filtering for B2B/B2C
- Line 670: Loads all customers into memory
- Line 684: Filtering for one-time customers

**Why It's Wrong:**
- Business logic (categorization) in storage layer
- Loads all data into memory to filter
- Should use SQL WHERE/HAVING clauses
- Inefficient for large datasets

---

### Issue 2.3: CRUD Operations with Dynamic Imports
**File:** `server/routes.ts`
**Lines:** 1372-1435 (Stock Movement CRUD)

**Affected Routes:**
- Lines 1372-1388: POST /api/stock-movements
- Lines 1390-1413: PUT /api/stock-movements/:id
- Lines 1415-1435: DELETE /api/stock-movements/:id

**Problem:**
- Lines 1374: `const { stockMovements, insertStockMovementSchema } = await import("@shared/schema");`
- Lines 1393: `const { stockMovements, insertStockMovementSchema } = await import("@shared/schema");`
- Lines 1418: `const { stockMovements } = await import("@shared/schema");`

**Why It's Wrong:**
- Dynamic imports should be at top of file
- Each route re-imports same modules
- Indicates over-complexity

---

## LOW SEVERITY ISSUES (Fix Third)

### Issue 5.1: Dynamic Schema Imports (13 Locations)
**File:** `server/routes.ts`

**Locations:**
1. Line 305-306: GET /api/products/:id/sales-prices
2. Line 529: PATCH /api/sales/:id
3. Line 605: DELETE /api/sales/:id
4. Line 1036-1037: GET /api/sales-prices
5. Line 1063-1064: GET /api/invoice-number/next
6. Line 1111-1112: POST /api/sales
7. Line 1205: GET /api/stock-movement-reasons
8. Line 1222-1223: GET /api/stock-movements
9. Line 1280-1281: GET /api/products/:id/stock-movements
10. Line 1353-1354: GET /api/stock-movements/:id
11. Line 1374: POST /api/stock-movements
12. Line 1393: PUT /api/stock-movements/:id
13. Line 1418: DELETE /api/stock-movements/:id

**Why It's Wrong:**
- Should import once at top: `import { schema } from "@shared/schema"`
- Dynamic imports have performance overhead
- Makes static dependencies unclear
- Indicates routes are too complex

---

### Issue 5.2: Multiple Table Joins in Routes
**File:** `server/routes.ts`

**Locations:**
1. Lines 308-312: GET /api/products/:id/sales-prices (simple join)
2. Lines 559-583: PATCH /api/sales/:id (3-way join)
3. Lines 1239-1257: GET /api/stock-movements (2 joins)

**Why It's Wrong:**
- Complex query construction belongs in storage layer
- Makes routes harder to read and maintain
- Duplicates query logic if needed elsewhere

---

## Summary by File

### server/routes.ts (1470 lines total)
- 7 high severity issues
- 5 medium severity issues
- 4 low severity issues
- Total problematic code: ~400+ lines

### server/storage.ts (1066 lines total)
- 2 high severity issues (n+1 queries)
- 2 medium severity issues (business logic)
- Total problematic code: ~200+ lines

---

## Quick Fix Guide

1. **Search for "await import"** - Find all dynamic imports (Issue 5.1)
2. **Search for "db.transaction"** - Find all transaction handling in routes (Issues 1.1-1.3)
3. **Search for "db.execute"** - Find all raw SQL queries (Issues 4.1, 4.2)
4. **Search for "for (const"** - Find all in-memory looping/filtering (Issues 2.1, 4.4)
5. **Search for parameter extraction pattern** - Find DRY violations (Issue 3.1)

