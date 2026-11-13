# Issues & Technical Debt

**Project:** Kruze Coffee & Tea Management System
**Last Updated:** 2026-03-14

Items here are bugs, UI inconsistencies, and technical debt — not new features. For planned feature work, see [backlog/INDEX.md](backlog/INDEX.md).

---

## Open

### ISS-001: Extract Sales Price Logic into salesPriceService.ts

**Type:** Technical Debt
**Severity:** MEDIUM
**Related UC:** UC-006 — Configure Sales Pricing

**Problem:**
All sales price business logic (duplicate detection, overlap resolution, forward truncation, webshop default enforcement) resides directly in `server/routes.ts` rather than in a dedicated service layer. This is inconsistent with the clean architecture pattern established by `roastService.ts`, `salesService.ts`, and other services.

**Solution:**
Create `server/salesPriceService.ts` following the `roastService.ts` reference pattern. Move all business logic from the POST, PATCH, and DELETE sales price routes into the service. Routes should only handle HTTP concerns (validation, status codes, responses).

**Acceptance Criteria:**
- [ ] New `server/salesPriceService.ts` created following the roastService pattern
- [ ] POST route delegates to `salesPriceService.createSalesPrice()`
- [ ] PATCH route delegates to `salesPriceService.updateSalesPrice()`
- [ ] DELETE route delegates to `salesPriceService.deleteSalesPrice()`
- [ ] All transactions managed in the service layer
- [ ] Routes contain only HTTP concerns (validation, auth, response formatting)
- [ ] No behavioral changes — all existing functionality preserved
- [ ] Dynamic imports in routes replaced with static top-level imports

---

### ISS-002: Missing Unique Constraint on customerPrices Table

**Type:** Bug
**Severity:** HIGH
**Related UC:** UC-007 — Set Customer-Specific Prices

**Problem:**
BR-2 states only one custom price per customer-variant combination is allowed, but there is no database unique index on `(customer_id, sales_unit_default_id)`. Duplicate entries can be recorded.

**Solution:**
Add a unique index on `(customerId, salesUnitDefaultId)` in the `customerPrices` table in `shared/schema.ts`. Generate and apply the migration.

**Acceptance Criteria:**
- [ ] Unique index added to schema
- [ ] Migration generated and applied
- [ ] POST route returns appropriate error when duplicate is attempted

---

### ISS-003: Extract Customer Price Logic into customerPriceService.ts

**Type:** Technical Debt
**Severity:** MEDIUM
**Related UC:** UC-007 — Set Customer-Specific Prices

**Problem:**
All four CRUD operations for customer prices are implemented inline in `server/routes.ts` with no dedicated service layer. Dynamic imports are used instead of static top-level imports.

**Solution:**
Create `server/customerPriceService.ts` following the `roastService.ts` reference pattern.

**Acceptance Criteria:**
- [ ] New `server/customerPriceService.ts` created
- [ ] All CRUD routes delegate to the service
- [ ] Dynamic imports replaced with static top-level imports
- [ ] Routes contain only HTTP concerns

---

### ISS-004: Confirmed Supplier Orders Can Be Deleted via API

**Type:** Bug
**Severity:** HIGH
**Related UC:** UC-009 — Manage Supplier Orders

**Problem:**
The `DELETE /api/supplier-orders/:id` route does not check whether the order is confirmed before deleting it. The UI hides the delete button on confirmed orders, but a direct API call bypasses this. Deleting a confirmed order orphans the stock movements that were created during confirmation.

**Solution:**
Add a server-side guard in the delete route: fetch the order, check `if (order.confirmed)`, and return 400 "Cannot delete a confirmed supplier order."

**Test:**
Call `DELETE /api/supplier-orders/<confirmed-order-id>` with a valid auth cookie. Currently returns 200 (bug). After fix, should return 400.

**Acceptance Criteria:**
- [ ] Backend rejects deletion of confirmed supplier orders with 400 status
- [ ] Descriptive error message returned
- [ ] Existing UI behavior unchanged (delete button already hidden)

---

### ISS-005: Supplier Order Confirmation Not Wrapped in Transaction

**Type:** Technical Debt
**Severity:** HIGH
**Related UC:** UC-009 — Manage Supplier Orders

**Problem:**
The confirm route (`POST /api/supplier-orders/:id/confirm`) first marks the order as confirmed via `storage.confirmSupplierOrder(id)`, then creates stock movements for each line item in separate calls via `Promise.all`. If a stock movement insert fails midway, the order remains "confirmed" but inventory is only partially updated. Per architecture rules, all `db.transaction()` calls must be in a service layer.

**Solution:**
Create a `supplierOrderService.ts` (or add to an existing service) with a `confirmOrder(id)` method that wraps the entire confirmation — status update and all stock movement inserts — in a single `db.transaction()`.

**Acceptance Criteria:**
- [ ] Confirmation and stock movements wrapped in a single transaction
- [ ] Logic extracted from routes into a service layer
- [ ] Partial failure rolls back both the status change and any stock movements
- [ ] No behavioral change on the happy path

---

### ISS-006: Supplier Deletion Returns Generic 500 on FK Constraint

**Type:** Bug
**Severity:** MEDIUM
**Related UC:** UC-009 — Manage Supplier Orders

**Problem:**
The `DELETE /api/settings/suppliers/:id` route does not check for associated supplier orders before deleting. When a supplier has orders, the database foreign key constraint throws an error, which surfaces as a generic 500 "Failed to delete supplier" instead of a descriptive message.

**Solution:**
Before deleting, query `supplierOrders` for any rows with the given `supplierId`. If found, return 409 "Cannot delete supplier with existing orders."

**Acceptance Criteria:**
- [ ] Backend checks for associated orders before attempting deletion
- [ ] Returns 409 with descriptive error message when orders exist
- [ ] Returns 200 on successful deletion when no orders exist

---

### ISS-007: Inventory Overview Page Calls Non-Existent API Endpoints

**Type:** Bug
**Severity:** HIGH
**Related UC:** UC-010 — Manage Stock Movements

**Problem:**
`Inventory.tsx` calls `/api/inventory`, `/api/inventory/movement-summary`, and `/api/inventory/recent-movements`, but none of these routes exist in `routes.ts`. The `inventoryService` is imported but never used in any route handler. The Inventory Overview page is likely broken.

**Solution:**
Either wire up the missing routes using the existing `inventoryService`, or remove the dead code if this page is no longer needed.

**Acceptance Criteria:**
- [ ] Inventory Overview page either works correctly or is removed
- [ ] No dead imports or unused service code remains

---

### ISS-008: Stock Movement CRUD Bypasses Storage Layer

**Type:** Technical Debt
**Severity:** MEDIUM
**Related UC:** UC-010 — Manage Stock Movements

**Problem:**
Stock movement CRUD operations in `routes.ts` interact with the database directly via Drizzle instead of going through the storage layer methods (`storage.createStockMovement()`, etc.), which exist but are unused. This violates the 3-layer architecture pattern.

**Solution:**
Refactor stock movement CRUD routes to use the storage layer, or extract into a `stockMovementService.ts` for operations that involve business logic (e.g., the sale-linked transaction).

**Acceptance Criteria:**
- [ ] CRUD routes delegate to storage or service layer
- [ ] No direct `db.insert`/`db.update`/`db.delete` calls in routes for stock movements

---

### ISS-009: Stock Movement Text Search Applied In-Memory

**Type:** Technical Debt
**Severity:** MEDIUM
**Related UC:** UC-010 — Manage Stock Movements

**Problem:**
The `GET /api/stock-movements` route fetches all movements matching year/product filters from the database, then applies text search filtering in-memory. This violates the architectural rule against in-memory filtering.

**Solution:**
Move the text search to a SQL WHERE clause using `ILIKE` or full-text search.

**Acceptance Criteria:**
- [ ] Text search filtering happens in SQL, not in-memory
- [ ] No performance degradation for large movement datasets

---

### ISS-010: Counting Session Finalize Route Missing Slash

**Type:** Bug
**Severity:** CRITICAL
**Related UC:** UC-013 — Conduct Inventory Counting Session

**Problem:**
In `routes.ts` line 2486, the finalize route is written as `"/api/counting-sessions:id/finalize"` — missing the `/` before `:id`. The route pattern never matches incoming requests, so the finalize button in the UI gets a 404.

**Solution:**
Change the route to `"/api/counting-sessions/:id/finalize"`.

**Acceptance Criteria:**
- [ ] Route path corrected with slash before `:id`
- [ ] Finalize action works from the UI

---

### ISS-011: Redundant Counting Session /complete Endpoint

**Type:** Technical Debt
**Severity:** LOW
**Related UC:** UC-013 — Conduct Inventory Counting Session

**Problem:**
Both `POST /api/counting-sessions/:id/complete` and `POST /api/counting-sessions/:id/finalize` exist. The `/complete` endpoint just sets status to "completed" without generating correction stock movements. The UI only calls `/finalize`. The `/complete` endpoint appears to be dead code.

**Solution:**
Verify `/complete` is unused, then remove the endpoint and any associated service method.

**Acceptance Criteria:**
- [ ] Confirm no frontend code calls `/complete`
- [ ] Remove the dead endpoint
- [ ] Remove any orphaned service code

---

### ISS-012: Inconsistent Revenue Status IDs in Dashboard Service

**Type:** Bug
**Severity:** HIGH
**Related UC:** UC-014 — View Analytics Dashboard

**Problem:**
`dashboardService.ts` calculates overall revenue using Shipped(2) + Invoiced(3) + Paid(4) as `REVENUE_STATUS_IDS`. However, `getTopCustomers()` and `getTopProducts()` within the same service only use Invoiced(3) + Paid(4), excluding Shipped. This means the revenue total includes shipped sales but the top customer/product rankings don't — the numbers disagree.

**Solution:**
Add Shipped(2) to the status filter in `getTopCustomers()` and `getTopProducts()` so all revenue calculations are consistent.

**Acceptance Criteria:**
- [ ] `getTopCustomers()` uses the same `REVENUE_STATUS_IDS` as the rest of the dashboard
- [ ] `getTopProducts()` uses the same `REVENUE_STATUS_IDS` as the rest of the dashboard
- [ ] Top customer/product rankings include shipped sales

---

### ISS-013: Blend Component Delete Uses Browser confirm() Instead of AlertDialog

**Type:** Bug
**Severity:** LOW
**Related UC:** UC-016 — Manage Product Blends

**Problem:**
In `ProductDetail.tsx` line 1865, blend component deletion uses the native browser `confirm('Are you sure...')` instead of the shadcn AlertDialog with AlertTriangle icon required by the design guidelines. Every other delete action in the admin uses AlertDialog.

**Solution:**
Replace `confirm()` with a shadcn AlertDialog following the pattern used elsewhere in the admin.

**Acceptance Criteria:**
- [ ] Delete uses AlertDialog with AlertTriangle icon
- [ ] Consistent with other delete confirmations in the admin

---

### ISS-014: No Server-Side Self-Reference Check on Blend Components

**Type:** Bug
**Severity:** MEDIUM
**Related UC:** UC-016 — Manage Product Blends

**Problem:**
The frontend filters out the current product from the component product selector, preventing the admin from adding a product as its own blend ingredient. But the `POST /api/product-components` endpoint has no validation preventing `finalProductId === componentProductId`. A direct API call could create a circular reference.

**Test:**
Call `POST /api/product-components` with `finalProductId` and `componentProductId` set to the same product ID, with a valid auth cookie. Currently returns 201 (bug). After fix, should return 400 with a descriptive error.

**Solution:**
Add a server-side check: if `finalProductId === componentProductId`, return 400 "A product cannot be a component of itself."

**Acceptance Criteria:**
- [ ] Backend rejects self-referencing blend components with 400
- [ ] Descriptive error message returned
- [ ] Existing UI behavior unchanged

---

### ISS-015: Missing Manual Mapping Flow in Boeren en Buren Import

**Type:** Bug
**Severity:** MEDIUM
**Related UC:** UC-017 — Import Boeren en Buren Sales Data

**Problem:**
When the system cannot suggest any product match (confidence = "none"), the UI displays "Please map manually in the mappings admin" but there is no way to manually pick a product within the import flow. The admin is stuck — they must go to Settings, manually create a mapping, then restart the import. This makes zero-confidence matches unresolvable from within the import flow.

**Solution:**
Add a manual product selector in the import UI for unmapped products with no suggestion, allowing the admin to pick a product directly.

**Acceptance Criteria:**
- [ ] Admin can manually select a product for unmapped references with no suggestion
- [ ] Selected mapping is saved for future imports
- [ ] Import can proceed once all products are mapped

---

### ISS-016: Account Order History Only Queries webshopOrders Table

**Type:** Bug
**Severity:** MEDIUM
**Related UC:** UC-026 — Manage Storefront Account (BR-3)

**Problem:**
`GET /api/account/orders` currently queries only the `webshopOrders` table. Webshop orders are persisted there initially (to survive Mollie payment failures), but upon confirmed payment they are recorded as regular sales in the `sales` table. Orders placed through the admin back-office or POS on behalf of a customer are also stored only in `sales`. As a result, a customer's account page never shows orders created via POS or admin, and may not consistently reflect webshop orders either.

**Solution:**
Change `GET /api/account/orders` to query the `sales` table (joined with `salesLines` and `products`) filtered by `customerId`, replacing the current `webshopOrders` query. This covers all channels: webshop (post-payment), admin-created, and POS.

**Acceptance Criteria:**
- [ ] Orders created via the admin back-office for a customer appear in that customer's account order history
- [ ] Orders placed via POS for a customer appear in that customer's account order history
- [ ] Webshop orders (post-payment, recorded as sales) appear in the account order history
- [ ] Order list shows: order number, date, status, items, total incl. VAT, shipping cost
- [ ] `webshopOrders` table is no longer queried by this endpoint

---

## Resolved

_(None yet)_
