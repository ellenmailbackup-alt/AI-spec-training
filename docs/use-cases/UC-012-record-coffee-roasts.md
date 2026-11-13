# UC-012: Record Coffee Roasts

Allows an admin to record, review, correct, and remove coffee roasting sessions. Each roast transforms a quantity of green coffee into roasted coffee and automatically adjusts the inventory of both products.

## Metadata
- **Domain:** Operations / Inventory
- **Primary Actor:** Admin
- **Secondary Actors:** None
- **Priority:** Must
- **Status:** Approved
- **Interface:** Admin Dashboard

## Preconditions
- The admin is authenticated and has admin privileges.
- Green coffee products exist in the system.
- Roast configurations exist mapping green coffee products to roasted coffee products (managed in UC-015).

## Main Flow
1. The admin requests an overview of recorded roasts.
2. The system shows a list of all roasts with the following per entry: identifier, green coffee name, roast date, green coffee amount in grams, roasted coffee amount in grams, remarks, and actions to correct or remove the entry. The list is sorted by roast date (most recent first) by default.
3. The admin optionally narrows the list by selecting a specific green coffee product, entering search text, or changing the sort order.
4. The admin indicates they want to record a new roast.
5. The system asks for: green coffee product (only active green coffee products are available), roast date (defaults to today), green coffee amount in grams, roasted coffee amount in grams, and an optional remark.
6. The admin provides the roast details and confirms.
7. The system verifies that a green coffee product is selected, a roast date is provided, and both amounts are positive.
8. The system records the roast and automatically adjusts inventory: it reduces the green coffee product's stock by the amount consumed and increases the corresponding roasted coffee product's stock by the amount produced. Both adjustments happen together -- either both succeed or neither is applied.
9. The system refreshes the roast list to include the new entry.

## Alternative Flows
- **AF-1: Correct a Roast** -- At step 3, instead of recording a new roast, the admin selects an existing roast to correct. The system presents the roast details pre-filled with the current values. The admin changes the necessary fields and confirms. The system verifies the input (same checks as step 7) and applies the changes, adjusting the associated inventory movements accordingly. The flow continues at step 9.
- **AF-2: Remove a Roast** -- At step 3, instead of recording a new roast, the admin selects an existing roast to remove. The system asks the admin to confirm the removal, identifying the roast by its number and green coffee name. The admin confirms. The system removes the roast and reverses the associated inventory movements. The flow continues at step 9.

## Exception Flows
- **EF-1: Incomplete or Invalid Information** -- At step 7, if the green coffee product is missing, the roast date is absent, or either amount is zero or negative, the system informs the admin which fields need correction and does not record the roast. The admin may correct the information or cancel.
- **EF-2: Missing Roast Configuration** -- At step 8, if no roast configuration exists mapping the selected green coffee product to a roasted coffee product, the system informs the admin that a configuration must be set up first and does not record the roast.
- **EF-3: Recording Failure** -- At step 8, if any part of the recording fails, nothing is saved and the admin is notified. The inventory remains unchanged.

## Postconditions
- The roast is recorded in the system with the green and roasted amounts.
- An inventory movement is recorded reducing the green coffee product's stock.
- An inventory movement is recorded increasing the corresponding roasted coffee product's stock.
- Both inventory movements reference the roast for traceability.

## Business Rules
- **BR-1:** Only active green coffee products (determined by product type) are available for selection when recording a roast.
- **BR-2:** The admin cannot manually select the roasted coffee product -- it must be determined by an existing roast configuration.
- **BR-3:** Correcting a roast adjusts its associated inventory movements to match the new amounts. If the green coffee product is changed, the old inventory movements are replaced entirely.

## Implementation Notes
- The roast and both inventory movements are written atomically in a single transaction so a partial failure leaves the system unchanged.
- This use case is implemented by `server/roastService.ts`, which serves as the reference implementation for the 3-layer clean architecture pattern used throughout the codebase.
- Stock movement reason codes are defined as constants; the ROAST reason is looked up case-insensitively and used for both the green deduction and the roasted addition.
- When a roast is corrected without changing the green coffee product, the existing stock movements are updated in place (preserving their identifiers). When the green coffee product changes, the movements are replaced.

## Implemented By
- Routes: `GET /api/roasts`, `GET /api/roasts/:id`, `POST /api/roasts`, `PATCH /api/roasts/:id`, `DELETE /api/roasts/:id`
- Services: `server/roastService.ts`
- Components: `client/src/pages/admin/Roasts.tsx`
- Storage: `storage.getRoasts()`, `storage.getRoast()`, `storage.createRoast()`, `storage.updateRoast()`, `storage.deleteRoast()`
