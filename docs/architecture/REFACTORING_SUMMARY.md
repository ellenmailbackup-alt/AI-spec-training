# Roast Service Refactoring Summary

## Overview
Refactored roast management from routes layer to follow clean architecture principles by introducing a dedicated service layer.

## Changes Made

### 1. **New File: `server/roastService.ts`**
Created a dedicated service layer that encapsulates all roast-related business logic:

**Key Features:**
- ✅ **Transaction Management**: All operations wrapped in database transactions for atomicity
- ✅ **Automatic Stock Movements**: Automatically creates/updates/deletes stock movements
- ✅ **Bug Fixes**:
  - DELETE now properly cleans up stock movements (was previously broken)
  - UPDATE preserves history by updating in place instead of delete/recreate
- ✅ **Better Error Handling**: Throws descriptive errors instead of silent warnings
- ✅ **Separation of Concerns**: Business logic separate from HTTP handling

**Service Methods:**
- `createRoast(data)` - Creates roast + 2 stock movements (green out, roasted in)
- `updateRoast(id, data)` - Updates roast + stock movements (preserves timestamps)
- `deleteRoast(id)` - Deletes roast + all associated stock movements
- `getRoast(id)` - Simple delegation to storage layer
- `getRoasts()` - Simple delegation to storage layer

### 2. **Updated: `server/routes.ts`**
Simplified route handlers to focus only on HTTP concerns:

**Before (lines 971-1102):**
- 131 lines of mixed HTTP handling + business logic
- No transaction safety
- Bugs in DELETE (orphaned stock movements)
- UPDATE lost history

**After (lines 972-1009):**
- 37 lines of clean HTTP handling
- Simple delegation to service layer
- Proper error messages from service

**Example - POST route went from 56 lines to 10:**
```typescript
// Before: 56 lines with DB operations, mapping lookups, stock movement creation
app.post("/api/roasts", isAdmin, async (req, res) => {
  try {
    const validatedData = insertRoastSchema.parse(req.body);
    // ... 40+ lines of business logic ...
  } catch (error) { ... }
});

// After: Clean and simple
app.post("/api/roasts", isAdmin, async (req, res) => {
  try {
    const validatedData = insertRoastSchema.parse(req.body);
    const roast = await roastService.createRoast(validatedData);
    res.status(201).json(roast);
  } catch (error) {
    console.error("Error creating roast:", error);
    const message = error instanceof Error ? error.message : "Failed to create roast";
    res.status(500).json({ error: message });
  }
});
```

## Architecture Improvements

### Clean Architecture Layers

```
┌─────────────────────────────────────────┐
│  Routes Layer (routes.ts)               │
│  - HTTP request/response handling       │
│  - Validation (Zod schemas)             │
│  - Authentication/Authorization         │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Service Layer (roastService.ts) ★NEW   │
│  - Business logic                       │
│  - Transactions                         │
│  - Orchestration                        │
│  - Stock movement automation            │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Storage Layer (storage.ts)             │
│  - Simple CRUD operations               │
│  - Database access                      │
│  - No business logic                    │
└─────────────────────────────────────────┘
```

### Benefits

1. **Testability**: Business logic can now be unit tested independently
2. **Reusability**: Service methods can be called from other parts of the app
3. **Maintainability**: Changes to business logic don't affect HTTP handling
4. **Reliability**: Transactions ensure data consistency
5. **Readability**: Each layer has a single, clear responsibility

## Bug Fixes

### Critical: DELETE Operation
**Before:**
```typescript
app.delete("/api/roasts/:id", isAdmin, async (req, res) => {
  const success = await storage.deleteRoast(id); // ❌ Orphans stock movements
  ...
});
```

**After:**
```typescript
async deleteRoast(id: number): Promise<boolean> {
  return await db.transaction(async (tx) => {
    await tx.delete(stockMovements).where(eq(stockMovements.roastId, id)); // ✅ Cleanup
    const result = await tx.delete(roasts).where(eq(roasts.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  });
}
```

### Medium: UPDATE Operation
**Before:**
```typescript
// Delete all and recreate - loses original timestamps
await db.delete(stockMovements).where(eq(stockMovements.roastId, id));
await db.insert(stockMovements).values({ ... }); // New timestamps
```

**After:**
```typescript
// Smart update strategy:
// - If green coffee changed: recreate movements (product IDs changed)
// - Otherwise: update in place (preserves creation timestamps)
const greenCoffeeChanged = data.greenCoffeeId !== roast.greenCoffeeId;
if (greenCoffeeChanged) {
  await tx.delete(stockMovements).where(eq(stockMovements.roastId, id));
  await this.createStockMovementsForRoast(tx, roast);
} else {
  // Update existing movements - preserves history
  await tx.update(stockMovements).set({ ... });
}
```

## Database Operations

### Stock Movements Created Per Roast

Each roast creates **2 stock movements**:

1. **Green Coffee (Consumed)**
   - `productId`: Green coffee product ID
   - `quantity`: Negative value (stock goes out)
   - `reason`: "roast" reason ID
   - `roastId`: Links to roast record

2. **Roasted Coffee (Produced)**
   - `productId`: Roasted coffee product ID (from mapping)
   - `quantity`: Positive value (stock comes in)
   - `reason`: "roast" reason ID
   - `roastId`: Links to roast record

Both movements are created atomically in a transaction.

## Prerequisites

For roast creation to succeed, the following must exist:

1. **Green-Roasted Coffee Mapping**: Entry in `green_roasted_coffees` table
2. **Stock Movement Reason**: Entry with `reason = "roast"` in `stock_movement_reason` table

If either is missing, the service throws a descriptive error instead of silently succeeding.

## Migration Notes

- ✅ **No database schema changes** - works with existing schema
- ✅ **Backwards compatible** - API endpoints unchanged
- ✅ **No data migration needed** - existing roasts and stock movements unaffected
- ✅ **Drop-in replacement** - routes continue to work exactly as before, but better

## Testing Recommendations

1. **Create Roast**: Verify 1 roast + 2 stock movements created
2. **Update Roast** (same green coffee): Verify stock movements updated in place
3. **Update Roast** (different green coffee): Verify old movements deleted, new ones created
4. **Delete Roast**: Verify roast + all stock movements deleted
5. **Error Cases**: Verify proper errors when mapping/reason missing

## Files Modified

- ✅ `server/roastService.ts` - **NEW** (339 lines)
- ✅ `server/routes.ts` - **MODIFIED** (3 routes simplified, -94 lines)

## Code Reduction

- **Before**: 131 lines of route logic
- **After**: 37 lines of route logic + 339 lines of service logic
- **Net**: Better separation, more maintainable code, critical bugs fixed
