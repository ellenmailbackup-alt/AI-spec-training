# UC-041: Consult Supplier Orders

The admin reviews the list of supplier orders and opens a specific order to inspect its details: order information, supplier contact details, and line items with quantities and buying prices. This is a read-only consultation page.

## Metadata
- **Domain:** Inventory / Procurement
- **Primary Actor:** Admin
- **Secondary Actors:** None
- **Priority:** Must
- **Status:** Approved
- **Interface:** Admin Dashboard

## Preconditions
- Admin is authenticated and has admin privileges.

## Main Flow
1. The admin requests an overview of supplier orders.
2. The system presents the list of supplier orders showing:
   - Order number.
   - Supplier name.
   - Order date.
   - Number of distinct line items.
   - Status (Pending or Confirmed).
3. The admin selects a supplier order.
4. The system presents the order detail:
   - Order information: order date, status, and remark.
   - Supplier details: supplier name, contact person (first and last name), phone, and email.
   - A list of order lines, each showing: product name, quantity, unit (from the buying price), unit price (from the active buying price), and line total (quantity multiplied by unit price).
   - The order total (sum of all line totals).
5. The admin reviews the information.

## Alternative Flows
- **AF-1: Search Orders** -- At step 1, the admin provides a search term. The system filters the list by supplier name, order date, or order number. The flow continues at step 2 with the filtered results.
- **AF-2: Sort Orders** -- At step 2, the admin changes the sort order. The system re-sorts the list by the selected column: supplier name, order date, or status. The flow continues at step 2.
- **AF-3: Line Without Active Buying Price** -- At step 4, if a line item's product has no active buying price, the system shows "No active price" instead of a unit price and a dash instead of a line total. The order total includes only lines with a resolved price. The flow continues at step 5.

## Exception Flows
None. The order is selected from the system's own list and always exists. An order with no line items is normal behaviour -- the system shows an empty list.

## Postconditions
- The admin has reviewed the supplier order's details and line items.
- No data is modified (read-only consultation).

## Business Rules
- **BR-1:** Unit prices are resolved dynamically from the active buying price for each product (UC-011). They are not stored on the order line.
- **BR-2:** Line totals are calculated as quantity multiplied by the resolved unit price.
- **BR-3:** The order total is the sum of all line totals where a buying price is available.

## Presentation Guidelines
- **PG-1:** Confirmed orders show the confirmation date alongside the status.
- General display rules (nl-BE formatting, currency) are defined in `docs/design/design_guidelines.md`.

## Related Use Cases
- **UC-009:** Manage Supplier Orders -- placing, editing, and removing supplier orders.
- **UC-011:** Manage Buying Prices -- provides the unit prices displayed on order lines.
- **UC-042:** Verify Supplier Delivery -- confirms delivery and records stock movements.

## Implementation Notes
- The list endpoint returns orders with their lines and supplier data in a single query using Drizzle relation loading.
- The detail endpoint fetches the active buying price per line item via individual queries (N+1 pattern).
- Line totals and the order total are calculated client-side from the resolved buying prices and quantities.

## Implemented By
- Routes: `GET /api/supplier-orders`, `GET /api/supplier-orders/:id`
- Services: None (logic is inline in `server/routes.ts`)
- Components: `client/src/pages/admin/SupplierOrders.tsx`, `client/src/pages/admin/SupplierOrderDetail.tsx`
- Storage: `storage.getSupplierOrders()`, `storage.getSupplierOrder()`
