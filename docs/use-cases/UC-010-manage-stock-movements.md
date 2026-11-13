# UC-010: Manage Stock Movements

Allows an admin to review the inventory movement history for a specific product and manually record, correct, or remove stock movement entries.

## Metadata
- **Domain:** Inventory
- **Primary Actor:** Admin
- **Secondary Actors:** None
- **Priority:** Must
- **Status:** Approved
- **Interface:** Admin Dashboard

## Preconditions
- The admin is authenticated and has admin privileges.
- At least one product exists in the system.
- The admin has selected a product whose stock movements they wish to review.

## Main Flow
1. The admin requests an overview of stock movements for a specific product.
2. The system shows a list of all stock movements for that product with the following per entry: movement number, date, reason, quantity in grams, remark, references (linked sale, supplier order, or roast when applicable), and actions to correct or remove the entry.
3. The admin optionally narrows the list by selecting a year or entering search text.
4. The admin indicates they want to add a new stock movement.
5. The system asks for: product (pre-filled with the current product), date, reason (from the list of configured movement reasons), quantity in grams (positive to increase stock, negative to decrease), and an optional remark. When applicable, the admin may also associate the movement with a sale, supplier order, or roast.
6. The admin provides the required details and confirms.
7. The system verifies that a product is selected, a date is provided, a reason is chosen, and a quantity is entered.
8. The system records the stock movement.
9. The system refreshes the movement list to include the new entry.

## Alternative Flows
- **AF-1: Correct a Movement** -- At step 4, instead of adding a new movement, the admin selects an existing movement to correct. The system presents the movement details in an editable form pre-filled with the current values. The admin changes the necessary fields and confirms. The system verifies the input (same checks as step 7) and applies the changes. The flow continues at step 9.
- **AF-2: Remove a Movement** -- At step 4, instead of adding a new movement, the admin selects an existing movement to remove. The system asks the admin to confirm the removal, showing the movement's number, date, and quantity. The admin confirms the removal. The system removes the movement. The flow continues at step 9.

## Exception Flows
- **EF-1: Incomplete Information** -- At step 7, if the product, date, reason, or quantity is missing, the system informs the admin which fields are required and does not record the movement. The admin may correct the information or cancel.

## Postconditions
- The stock movement is recorded, corrected, or removed as intended.
- The product's effective stock level reflects all current movements.
- The movement history for the product is up to date.

## Business Rules
- **BR-1:** A stock movement must have a product, a date, a reason, and a quantity. The remark is optional.
- **BR-2:** The reason must be one of the configured movement reasons (e.g., Start Stock, Buy, Sale, Correction, Own Use, Sponsorship, Due Date Expired, Free Sample, Redivision Blend, Course Material, Roast, Final Stock).

## Presentation Guidelines
- **PG-1:** Positive quantities are displayed in green with a plus sign; negative quantities are displayed in red.
- **PG-2:** When a movement is linked to a sale, supplier order, or roast, the reference column identifies the source record. When there is no link, the column shows a dash.

## Implementation Notes
- A product's effective stock level is the sum of all its movement quantities; there is no separately stored stock level field. Stock level is computed on demand by summing all stock_movement.quantity values for a product.
- The `POST /api/stock-movements` route uses a transaction: if the movement has a `saleId`, it also sets `stockUpdated = true` on the linked sale within the same transaction. This is an internal side-effect not visible to the admin.
- The reference fields (`saleId`, `orderId`, `roastId`) are stored on the movement record. They are typically set programmatically by other use cases (sales, supplier orders, roasts) but can also be provided manually when adding a movement.
- The `GET /api/stock-movements` route supports server-side filtering by year and product; text search is applied in-memory after the query.
- The `GET /api/stock-movements/years` route returns the distinct years that have movements for a given product, used for the year filter.
- The CRUD operations in routes.ts bypass the storage layer methods and interact with the database directly via Drizzle -- this is an architectural inconsistency with the intended 3-layer pattern.

## Implemented By
- Routes: `GET /api/stock-movements`, `GET /api/stock-movements/:id`, `GET /api/stock-movements/years`, `POST /api/stock-movements`, `PUT /api/stock-movements/:id`, `DELETE /api/stock-movements/:id`, `GET /api/stock-movement-reasons`
- Services: `server/stockMovementService.ts` (used only for `GET /api/products/:id/stock-movements` aggregated stats, not for CRUD)
- Components: `client/src/pages/admin/ProductStockMovements.tsx`, `client/src/components/admin/StockMovementDialog.tsx`
- Storage: Direct database operations (storage layer not used for CRUD)
