# UC-009: Manage Supplier Orders

The admin places supplier orders, builds them up with line items, and maintains them until they are ready for delivery verification. This use case covers the full draft lifecycle: placing the order, adding and adjusting line items, editing remarks, and removing draft orders. Delivery confirmation is a separate activity covered by UC-042.

## Metadata
- **Domain:** Inventory / Procurement
- **Primary Actor:** Admin
- **Secondary Actors:** None
- **Priority:** Must
- **Status:** Approved
- **Interface:** Admin Dashboard

## Preconditions
- Admin is authenticated and has admin privileges.
- At least one supplier exists in the system.
- Products exist and are assigned to the relevant supplier.

## Main Flow
1. The admin requests an overview of supplier orders.
2. The system presents the list of supplier orders showing: order number, supplier name, order date, number of distinct line items, and status (Pending or Confirmed).
3. The admin indicates they want to place a new supplier order.
4. The system presents the available suppliers and asks for the supplier, order date, and an optional remark.
5. The admin selects a supplier, provides the order date and optional remark, and confirms.
6. The system records the order with status Pending and presents the order detail page.
7. The admin indicates they want to add a line item.
8. The system presents the products assigned to the order's supplier and asks for a product and quantity.
9. The admin selects a product, enters a quantity, and confirms.
10. The system records the line item and presents the updated order lines.
11. The admin repeats steps 7--10 for each additional product.

## Alternative Flows
- **AF-1: Add Supplier** -- At step 3, instead of placing a new order the admin navigates to the supplier settings. The admin indicates they want to add a new supplier. The system asks for: name, contact first name, contact last name, phone, and email. The admin provides the details and confirms. The system records the new supplier. The flow ends (the admin returns to the supplier order list when ready).
- **AF-2: Change Supplier Details** -- At step 3, instead of placing a new order the admin navigates to the supplier settings and selects an existing supplier. The system presents the current details. The admin changes the desired fields and confirms. The system applies the changes. The flow ends.
- **AF-3: Remove Supplier** -- At step 3, instead of placing a new order the admin navigates to the supplier settings and indicates they want to remove a supplier. The system asks for confirmation. The admin confirms. The system removes the supplier. The flow ends.
- **AF-4: Change Order Remark** -- At step 7, instead of adding a line item the admin changes the remark on the pending order. The system saves the change. The flow continues at step 7.
- **AF-5: Change Line Item Quantity** -- At step 7, instead of adding a new line item the admin selects an existing line item to change. The system presents the current quantity (the product cannot be changed). The admin adjusts the quantity and confirms. The system applies the change. The flow continues at step 7.
- **AF-6: Remove Line Item** -- At step 7, instead of adding a new line item the admin indicates they want to remove an existing line item. The system asks for confirmation. The admin confirms. The system removes the line item and presents the updated order lines. The flow continues at step 7.
- **AF-7: Remove Draft Order** -- At step 3, instead of placing a new order the admin indicates they want to remove a pending order from the list. The system asks for confirmation. The admin confirms. The system removes the order and all its line items. The flow continues at step 1.

## Exception Flows
- **EF-1: Remove Supplier With Orders** -- At AF-3, if the supplier has associated supplier orders, the system rejects the removal and informs the admin that the supplier cannot be removed while orders reference it.

## Postconditions
- A new supplier order exists in Pending status with its line items recorded.
- Alternatively, a supplier or order has been modified or removed as per the alternative flows.

## Business Rules
- **BR-1:** A new supplier order starts with status Pending.
- **BR-2:** Only products assigned to the order's supplier can be added as line items.
- **BR-3:** Confirmed orders are immutable -- no changes or removals are permitted on a confirmed order or its line items. Only pending orders can be modified or removed.
- **BR-4:** Suppliers cannot be removed if they have associated supplier orders.
- **BR-5:** Line item quantity must be greater than zero.

## Presentation Guidelines
- **PG-1:** Confirmed orders do not show management actions (change or remove) in the list or on the detail page.
- **PG-2:** The order detail page shows the active buying price and computed line total for each line item. Pricing resolution and display rules are defined in UC-041.

## Related Use Cases
- **UC-011:** Manage Buying Prices -- provides the unit prices shown on order lines.
- **UC-041:** Consult Supplier Orders -- read-only consultation of the order list and detail.
- **UC-042:** Verify Supplier Delivery -- confirms delivery and records stock movements.

## Implementation Notes
- The backend delete endpoint for supplier orders does not enforce the "pending only" constraint; immutability of confirmed orders is enforced only in the UI by hiding management actions. This is a known gap.
- The backend delete endpoint for suppliers does not check for associated orders explicitly; the database foreign key constraint causes the deletion to fail with an unhandled error.
- No duplicate product check exists on supplier order lines -- the same product can be added multiple times to an order.

## Implemented By
- Routes: `GET /api/settings/suppliers`, `POST /api/settings/suppliers`, `PATCH /api/settings/suppliers/:id`, `DELETE /api/settings/suppliers/:id`, `POST /api/supplier-orders`, `PATCH /api/supplier-orders/:id`, `DELETE /api/supplier-orders/:id`, `POST /api/supplier-orders/:orderId/lines`, `PATCH /api/supplier-order-lines/:id`, `DELETE /api/supplier-order-lines/:id`
- Services: None (logic is inline in `server/routes.ts`)
- Components: `client/src/pages/admin/SupplierOrders.tsx`, `client/src/pages/admin/SupplierOrderDetail.tsx`, `client/src/components/admin/NewSupplierOrderDialog.tsx`, `client/src/pages/admin/Settings.tsx` (Suppliers tab)
- Storage: `storage.getSuppliers()`, `storage.createSupplier()`, `storage.updateSupplier()`, `storage.deleteSupplier()`, `storage.createSupplierOrder()`, `storage.updateSupplierOrder()`, `storage.deleteSupplierOrder()`, `storage.createSupplierOrderLine()`, `storage.updateSupplierOrderLine()`, `storage.deleteSupplierOrderLine()`
