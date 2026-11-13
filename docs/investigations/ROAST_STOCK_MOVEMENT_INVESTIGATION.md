# Investigation: Stock Movement Relationship with Roasts

## Executive Summary

Stock movement creation IS automatic when roasts are created/updated, but the implementation has issues:
- Logic is in the CONTROLLER/ROUTES layer (not proper separation of concerns)
- Delete operations don't clean up related stock movements (BUG)
- Update operations delete and recreate movements (loses history)
- No proper service layer for business logic coordination

---

## 1. DATABASE SCHEMA ANALYSIS

### Roasts Table (shared/schema.ts, lines 234-241)
```typescript
export const roasts = pgTable("roast", {
  id: serial("id").primaryKey(),
  greenCoffeeId: integer("green_coffee_id").notNull().references(() => products.id),
  greenCoffeeAmount: smallint("green_coffee_amount").notNull(),
  roastedCoffeeAmount: smallint("roasted_coffee_amount").notNull(),
  roastDate: date("roast_date").notNull(),
  remark: text("remark").notNull(),
});
```

**Key Fields:**
- greenCoffeeId: Reference to the green coffee product
- greenCoffeeAmount: Weight in grams of green coffee used
- roastedCoffeeAmount: Weight in grams of roasted coffee produced
- roastDate: When the roasting occurred
- remark: Optional notes

### Stock Movements Table (shared/schema.ts, lines 157-170)
```typescript
export const stockMovements = pgTable("stock_movement", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id").references(() => sales.id),
  saleslineId: integer("salesline_id").references(() => salesLines.id),
  productId: integer("product_id").notNull().references(() => products.id),
  roastId: integer("roast_id"),  // <-- LINKS TO ROASTS
  orderId: integer("order_id"),
  date: date("date").notNull(),
  quantity: decimal("quantity", { precision: 15, scale: 5 }).notNull(),
  reason: integer("reason").notNull().references(() => stockMovementReasons.id),
  remark: text("remark"),
  creationDate: timestamp("creation_date").notNull().default(sql`now()`),
  modificationDate: timestamp("modification_date").notNull().default(sql`now()`),
});
```

---

## KEY FINDINGS SUMMARY

### Finding #1: Automatic Stock Movement Creation EXISTS

YES - Stock movements ARE created automatically when roasts are created/updated.

When you POST to `/api/roasts`:
1. Two stock movements are created automatically
2. One for green coffee (negative quantity - it's consumed)
3. One for roasted coffee (positive quantity - it's produced)
4. Both linked via roastId field

### Finding #2: Wrong Layer for Business Logic

**Current Location:** Controller/Routes Layer (routes.ts lines 971-1090)

**Problem:** Business logic mixed with HTTP handling
- If same roast creation logic is needed elsewhere (e.g., import scripts), it's duplicated
- Can't unit test business logic separately
- Hard to reuse in batch operations
- Tightly coupled to Express framework

**Better Approach:**
- Create a service layer (e.g., RoastService)
- Storage layer: CRUD only
- Service layer: Business logic coordination
- Routes layer: HTTP handling only

### Finding #3: CRITICAL BUG - Delete Missing Cleanup

**Issue:** When DELETE /api/roasts/:id is called:
1. Roast record is deleted
2. Stock movements with roastId=deleted_id are NOT deleted
3. These orphaned movements remain in the database
4. Stock calculations may include them incorrectly

**Impact:** Stock counts could be inaccurate, audit trail is incomplete, data integrity issue

**Location:** `/home/user/KruzeApp/server/routes.ts` lines 1092-1102

### Finding #4: Update Logic Loses History

**Current Update Logic (lines 1040-1041):**
1. Delete all stock movements for the roast
2. Recreate new ones with new amounts

**Problems:**
- Loses original creation dates
- Loses original stock movement IDs
- Breaks audit trail
- No way to see what was changed

### Finding #5: Missing Error Handling

**Examples:**
1. No green-roasted coffee mapping found: logs warning but returns success (incomplete!)
2. "roast" reason not found: logs warning but returns success (incomplete!)

**Issues:**
- Roast is created but stock movements are not
- User doesn't know something failed
- System doesn't validate required data exists

**Locations:** lines 986-989 and 997-1000

### Finding #6: Missing Transaction Wrapping

**Current Code:**
```typescript
const roast = await storage.createRoast(validatedData);
// Create stock movements (could fail after roast created)
await db.insert(stockMovements).values({...});
```

**Problem:** If stock movement creation fails after roast is created, database becomes inconsistent.

---

## 2. CODE LOCATIONS

| Component | File | Lines | Purpose |
|-----------|------|-------|---------|
| Schema Definition | `/home/user/KruzeApp/shared/schema.ts` | 234-241 | roasts table definition |
| Schema Definition | `/home/user/KruzeApp/shared/schema.ts` | 157-170 | stock_movements table with roastId |
| Schema Definition | `/home/user/KruzeApp/shared/schema.ts` | 244-248 | green_roasted_coffee mapping |
| Storage CRUD | `/home/user/KruzeApp/server/storage.ts` | 1050-1063 | createRoast, updateRoast, deleteRoast |
| API Route POST | `/home/user/KruzeApp/server/routes.ts` | 971-1027 | Creates roast + stock movements |
| API Route PATCH | `/home/user/KruzeApp/server/routes.ts` | 1029-1090 | Updates roast + stock movements |
| API Route DELETE | `/home/user/KruzeApp/server/routes.ts` | 1092-1102 | ONLY deletes roast (BUG) |
| UI Component | `/home/user/KruzeApp/client/src/pages/admin/Roasts.tsx` | All | Roast management interface |

---

## 3. ARCHITECTURE RECOMMENDATION

### Current (Problematic)
```
Routes/Controller
  ├── Roast CRUD
  ├── Stock Movement Creation (mixed in)
  └── Stock Movement Update/Delete (mixed in)
```

### Recommended (Clean)
```
Routes/Controller (HTTP handling only)
  ↓ uses
Service Layer (Business Logic Coordination)
  ├── RoastService.createRoast()
  ├── RoastService.updateRoast()
  └── RoastService.deleteRoast()
    ↓ uses
Storage Layer (CRUD only)
  ├── createRoast()
  ├── updateRoast()
  ├── deleteRoast()
  ├── createStockMovement()
  └── deleteStockMovement()
```

---

## 4. ISSUES REQUIRING FIXES

| Issue | Severity | Location | Fix Type |
|-------|----------|----------|----------|
| Delete doesn't remove stock movements | CRITICAL | routes.ts:1092-1102 | Add transaction to delete both |
| Update loses history (delete + recreate) | MEDIUM | routes.ts:1040-1041 | Update in-place instead |
| Missing transaction wrapping | MEDIUM | routes.ts:971-1027 | Wrap in transaction |
| Silent failures on missing prerequisites | MEDIUM | routes.ts:986-1000 | Throw errors instead of logging |
| Business logic in routes layer | HIGH | routes.ts:971-1090 | Extract service layer |
| No validation of active status | LOW | routes.ts:972-978 | Add validation |

---

## 5. REQUIRED PREREQUISITES

When creating a roast via POST /api/roasts, ensure:

1. **Roast Data (from request):**
   - greenCoffeeId (must be valid product ID)
   - greenCoffeeAmount > 0
   - roastedCoffeeAmount > 0
   - roastDate (valid date)
   - remark (optional)

2. **Database Prerequisites:**
   - Product record for greenCoffeeId
   - Product must have productTypeName containing "green coffee"
   - Product must have status = "1" (active)
   - GreenRoastedCoffees record mapping greenCoffeeId to roastedCoffeeId
   - StockMovementReasons record with reason="roast"

3. **System Behavior on Success:**
   - Creates roast record in roasts table
   - Creates stock movement for green coffee (negative quantity)
   - Creates stock movement for roasted coffee (positive quantity)
   - Both stock movements linked via roastId
   - Both use stockMovementReason with id for "roast"

---

## 6. FLOW DIAGRAM

```
POST /api/roasts
│
├─ Validate input data
│
├─ Create roast record in database
│  └─ Get roast.id (auto-generated)
│
├─ Find green-roasted coffee mapping
│  └─ Query greenRoastedCoffees where greenCoffeeId = input.greenCoffeeId
│  └─ Get roastedCoffeeId from mapping
│
├─ Find "roast" stock movement reason
│  └─ Query stockMovementReasons where reason = "roast"
│  └─ Get reasonId
│
├─ Create stock movement for green coffee (CONSUMES)
│  └─ productId = input.greenCoffeeId
│  └─ quantity = -input.greenCoffeeAmount
│  └─ reason = reasonId
│  └─ roastId = roast.id
│
├─ Create stock movement for roasted coffee (PRODUCES)
│  └─ productId = roastedCoffeeId (from mapping)
│  └─ quantity = input.roastedCoffeeAmount
│  └─ reason = reasonId
│  └─ roastId = roast.id
│
└─ Return roast record (HTTP 201)
```

---

## 7. IMPACT ANALYSIS

**If Delete Bug Not Fixed:**
- Deleted roasts leave orphaned stock movements
- Stock calculations include movements from non-existent roasts
- Audit trail becomes inaccurate
- Over time, stock counts diverge from reality
- Difficult to reconcile inventory

**If Update Logic Not Fixed:**
- Cannot track what changed in a roast
- Original timestamps are lost
- Stock movement IDs change unexpectedly
- Report queries may break if they reference old IDs
- Audit trail is incomplete

---

