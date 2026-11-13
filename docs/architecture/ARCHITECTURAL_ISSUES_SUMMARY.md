# Architectural Flaws Summary - Quick Reference

## Overview
19 architectural flaws identified where business logic is improperly mixed into HTTP routes and storage layer.

## By Severity

### HIGH SEVERITY (7 Issues) - FIX FIRST
| Issue | Location | Problem | Impact |
|-------|----------|---------|--------|
| 1.1 | routes.ts:1102-1200 | Invoice creation with transaction in route | Complex business logic in HTTP handler |
| 1.2 | routes.ts:519-599 | Sale update with transaction in route | Hard to test, difficult to maintain |
| 2.1 | routes.ts:1220-1275 | Stock movements with in-memory filtering | Inefficient, not reusable |
| 2.2 | routes.ts:1277-1348 | Stock calculations with 4 sequential queries | n+1 problem, 4x slower than needed |
| 1.3 | routes.ts:601-628 | Sale deletion with transaction in route | Business logic in HTTP layer |
| 4.1 | storage.ts:387-438 | Product stats with 4 separate queries | Performance issue, n+1 pattern |
| 4.2 | storage.ts:538-609 | Customer stats with 6 separate queries | Serious performance issue, 6x slower |

### MEDIUM SEVERITY (8 Issues) - FIX SECOND
- Issue 3.1: Parameter extraction repeated in routes (5+ places)
- Issue 3.2-3.4: Statistics endpoints with business logic in storage layer
- Issue 4.3: Sales stats with hardcoded business rules
- Issue 4.4: Customer stats with filtering logic in storage
- Issue 2.3: CRUD operations with dynamic schema imports

### LOW SEVERITY (4 Issues) - FIX THIRD
- Issue 5.1: Dynamic schema imports (13 locations)
- Issue 5.2: Multiple table joins in routes

---

## Files to Create (New Service Layer)

1. **server/salesService.ts** - Sales orchestration
   - `createSale()` - with invoice number generation
   - `updateSale()` - with line item handling
   - `deleteSale()` - with cascading delete

2. **server/stockMovementService.ts** - Inventory logic
   - `getStockMovementsWithFilters()` - optimized query
   - `getProductStockSummary()` - consolidate 4 queries into 1

3. **server/parameterService.ts** - Parameter management
   - `getCurrentYear()` - cached access
   - Used by all statistics endpoints

4. **server/analyticsService.ts** - Dashboard calculations
   - Pre-calculated metrics from SQL

---

## Files to Refactor

1. **server/routes.ts** (1470 lines)
   - Remove all business logic
   - Import schemas at top (not dynamically)
   - Delegate to service layer

2. **server/storage.ts** (1066 lines)
   - Consolidate 4-query methods to 1 query
   - Consolidate 6-query methods to 2 queries
   - Remove filtering logic
   - Focus on pure data access

---

## Performance Improvements Expected

| Current | After | Improvement |
|---------|-------|-------------|
| 4 queries for product stats | 1 query | 4x faster |
| 6 queries for customer stats | 2 queries | 3x faster |
| 4 queries for stock calculations | 1 query | 4x faster |
| In-memory filtering (all results) | SQL filtering | 10-100x faster (depending on data) |
| No caching | Cached parameters | 100x faster for repeated calls |

---

## Refactoring Priority

### Phase 1: Service Layer (40% effort, 60% impact)
1. Create `SalesService` - enables testing of invoice generation
2. Create `StockMovementService` - fixes performance issues
3. Create `ParameterService` - DRY principle, caching

### Phase 2: Storage Layer Optimization (30% effort, 30% impact)
1. Consolidate statistics queries
2. Remove business logic from storage methods

### Phase 3: Route Cleanup (30% effort, 10% impact)
1. Fix dynamic imports
2. Move joins to storage layer
3. Make routes focused on HTTP concerns

---

## Pattern: Good Service Layer

The `roastService.ts` is the reference implementation:

```typescript
// Storage layer: simple CRUD
async createRoast(data: InsertRoast): Promise<Roast>

// Service layer: business logic + transactions
async createRoast(data: InsertRoast): Promise<Roast> {
  return await db.transaction(async (tx) => {
    // 1. Create roast
    const roast = await tx.insert(roasts).values(data);
    
    // 2. Find mapping
    const mapping = await tx.select().from(greenRoastedCoffees)...
    
    // 3. Create stock movements (2 entries)
    await tx.insert(stockMovements)...
    
    return roast;
  });
}

// Route: HTTP handling only
app.post("/api/roasts", isAdmin, async (req, res) => {
  const validatedData = insertRoastSchema.parse(req.body);
  const roast = await roastService.createRoast(validatedData);
  res.status(201).json(roast);
});
```

Follow this pattern for Sales, StockMovement, and other complex operations.

---

## Next Steps

1. Read full report: `/home/user/KruzeApp/ARCHITECTURAL_ANALYSIS_REPORT.md`
2. Review roastService.ts as reference implementation
3. Create service layer files in order of priority
4. Refactor routes to use service layer
5. Optimize storage layer queries
6. Add unit tests for service layer

---

## Key Takeaways

1. **19 architectural flaws** - not just a few
2. **7 high severity** - directly impact testability and maintainability
3. **Similar pattern to roast routes** - which were already refactored correctly
4. **Performance issues** - n+1 queries can be 4-10x slower than needed
5. **Testability impact** - cannot unit test business logic currently
6. **Codebase quality** - following roastService pattern will significantly improve code

---

Created: $(date)
