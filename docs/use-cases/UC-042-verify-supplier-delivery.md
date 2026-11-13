# UC-042: Verify Supplier Delivery

The admin opens a pending supplier order, reviews the ordered products and quantities, and confirms that the goods have been received. Upon confirmation the system records a stock movement for each line item, which increases inventory, and marks the order as confirmed. Confirmation is a separate moment in time from placing the order (UC-009).

## Metadata
- **Domain:** Inventory / Procurement
- **Primary Actor:** Admin
- **Secondary Actors:** None
- **Priority:** Must
- **Status:** Approved
- **Interface:** Admin Dashboard

## Preconditions
- The admin is authenticated.
- The admin has admin privileges.
- A supplier order exists in Pending status with at least one line item.

## Main Flow
1. The admin requests an overview of supplier orders.
2. The system presents the list of supplier orders showing: order number, supplier name, order date, number of distinct line items, and status (Pending or Confirmed).
3. The admin selects a pending supplier order.
4. The system presents the order detail as defined in UC-041.
5. The admin reviews the order lines against the received goods.
6. The admin requests confirmation of the delivery.
7. The system presents a confirmation prompt stating that the order becomes immutable after confirmation.
8. The admin confirms the delivery.
9. The system records one stock movement of type PURCHASE for each line item (BR-1a, BR-1b, BR-1c).
10. The system increases the stock of each product by the ordered quantity of its line item.
11. The system sets the order status to Confirmed.
12. The system records the confirmation date.
13. The system presents the updated order detail showing the confirmed status.

## Alternative Flows
None.

## Exception Flows
- **EF-1: Confirm Empty Order** -- At step 6, the system prevents the admin from requesting confirmation when the order has no line items (BR-2). The admin adds line items first via UC-009.
- **EF-2: Confirm Already-Confirmed Order** -- At step 6, the system rejects the request (BR-4). The system shows the admin the message "[TBD: message text]" stating the order is already confirmed.

## Postconditions
- The supplier order has status Confirmed.
- The supplier order has a recorded confirmation date.
- One stock movement of type PURCHASE exists for each line item of the supplier order.
- The stock of each product is increased by the ordered quantity of its line item.
- The confirmed supplier order is immutable, including its line items (BR-3).

## Business Rules
- **BR-1a:** The system records one stock movement per line item with reason PURCHASE (reason code 2).
- **BR-1b:** The system sets each stock movement date to the confirmation date, not the order date.
- **BR-1c:** The system references the supplier order on each stock movement.
- **BR-2:** The system rejects a confirmation request for a supplier order without line items.
- **BR-3a:** The system rejects any change to a confirmed supplier order.
- **BR-3b:** The system rejects any change to the line items of a confirmed supplier order.
- **BR-3c:** The system rejects the removal of a confirmed supplier order.
- **BR-3d:** The system rejects the removal of a line item of a confirmed supplier order.
- **BR-3e:** The system shows the admin the message "[TBD: feedback message to the admin when a change is rejected]" for each rejection under BR-3a to BR-3d.
- **BR-4:** The system rejects a confirmation request for an already-confirmed supplier order.
- **BR-5:** The system records the status change and all stock movements of a confirmation in one atomic operation.

## Related Use Cases
- **UC-009:** Manage Supplier Orders -- placing, editing, and removing supplier orders before delivery.
- **UC-010:** Manage Stock Movements -- the PURCHASE stock movements recorded by confirmation appear here.
- **UC-041:** Consult Supplier Orders -- read-only consultation of order details.

## Implementation Notes
- Known gap against BR-5: the confirmation and the stock movement recording do not run in a single transaction. If stock movement recording fails partway through, the order stays confirmed while some stock movements are missing. Moving this logic into a service with a database transaction closes the gap.
- Known gap against BR-2: the backend does not validate that the order has line items before confirming. Only the UI enforces the rule, by disabling the confirm action when the order has no lines.
- Known gap against BR-3a–BR-3d: the backend does not check the confirmed status on `PATCH`/`DELETE /api/supplier-orders/:id` or on the supplier order line routes (`POST /api/supplier-orders/:orderId/lines`, `PATCH`/`DELETE /api/supplier-order-lines/:id`). Only the UI prevents changes to a confirmed order.
- The current rejection text for EF-2 is "Order is already confirmed" (HTTP 400).
- The stock movement date is today's date at confirmation time, not the order date (BR-1b).

## Implemented By
- Routes: `POST /api/supplier-orders/:id/confirm`
- Services: None (logic is inline in `server/routes.ts`)
- Components: `client/src/pages/admin/SupplierOrderDetail.tsx`
- Storage: `storage.getSupplierOrder()`, `storage.confirmSupplierOrder()`, `storage.createStockMovement()`
