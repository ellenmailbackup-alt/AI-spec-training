# UC-042: Verify Supplier Delivery

The admin opens a pending supplier order, reviews the ordered products and quantities, and confirms that the goods have been received. Upon confirmation the system records stock movements for each line item, increasing inventory, and marks the order as confirmed. This is a separate moment in time from placing the order (UC-009).

## Metadata
- **Domain:** Inventory / Procurement
- **Primary Actor:** Admin
- **Secondary Actors:** None
- **Priority:** Must
- **Status:** Approved
- **Interface:** Admin Dashboard

## Preconditions
- Admin is authenticated and has admin privileges.
- A supplier order exists in Pending status with at least one line item.

## Main Flow
1. The admin requests an overview of supplier orders.
2. The system presents the list of supplier orders showing: order number, supplier name, order date, number of distinct line items, and status (Pending or Confirmed).
3. The admin selects a pending supplier order.
4. The system presents the order detail: order information, supplier details, and order lines with product name, quantity, unit, unit price, and line total (as described in UC-041).
5. The admin reviews the order lines against the received goods and indicates they want to confirm the delivery.
6. The system asks for confirmation, warning that the order will become immutable.
7. The admin confirms.
8. The system records one stock movement of type PURCHASE for each line item, increasing the product's stock by the ordered quantity.
9. The system sets the order status to Confirmed and records the confirmation date.
10. The system presents the updated order detail showing the confirmed status.

## Alternative Flows
None.

## Exception Flows
- **EF-1: Confirm Empty Order** -- At step 5, if the order has no line items, the system prevents the admin from initiating confirmation. The admin must add line items first (UC-009).
- **EF-2: Confirm Already-Confirmed Order** -- At step 5, if the order has already been confirmed, the system rejects the request and informs the admin that the order is already confirmed.

## Postconditions
- The supplier order status is Confirmed with a recorded confirmation date.
- One stock movement of type PURCHASE exists for each line item, increasing the product's stock.
- The order and its line items are immutable.

## Business Rules
- **BR-1:** Confirmation records one stock movement per line item with reason PURCHASE (reason code 2), using today's date as the movement date and referencing the supplier order for traceability.
- **BR-2:** A supplier order must have at least one line item before it can be confirmed.
- **BR-3:** Confirmed orders are immutable -- no further changes or removals are permitted on the order or its line items.
- **BR-4:** An already-confirmed order cannot be confirmed again.

## Related Use Cases
- **UC-009:** Manage Supplier Orders -- placing, editing, and removing supplier orders before delivery.
- **UC-010:** Manage Stock Movements -- the PURCHASE stock movements recorded by confirmation appear here.
- **UC-041:** Consult Supplier Orders -- read-only consultation of order details.

## Implementation Notes
- The confirmation and stock movement recording are not wrapped in a single transaction. If stock movement recording fails partway through, the order may be marked as confirmed while some stock movements are missing. This is architectural debt that should be resolved by moving this logic into a service with a database transaction.
- The backend does not validate that the order has line items before confirming -- this check is enforced only in the UI by disabling the confirm action when the order has no lines.
- Stock movement date uses today's date at confirmation time, not the order date.

## Implemented By
- Routes: `POST /api/supplier-orders/:id/confirm`
- Services: None (logic is inline in `server/routes.ts`)
- Components: `client/src/pages/admin/SupplierOrderDetail.tsx`
- Storage: `storage.getSupplierOrder()`, `storage.confirmSupplierOrder()`, `storage.createStockMovement()`
