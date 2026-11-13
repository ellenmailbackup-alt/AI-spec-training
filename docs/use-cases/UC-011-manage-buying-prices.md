# UC-011: Manage Buying Prices

Allows an admin to maintain the cost prices paid for a product over time, including validity periods, so the business can track procurement costs and calculate margins.

## Metadata
- **Domain:** Product / Procurement
- **Primary Actor:** Admin
- **Secondary Actors:** None
- **Priority:** Should
- **Status:** Approved
- **Interface:** Admin Dashboard

## Preconditions
- The admin is authenticated and has admin privileges.
- At least one product exists in the system.

## Main Flow
1. The admin requests an overview of buying prices for a specific product.
2. The system shows the list of active and future buying prices for the product, ordered by most recent validity start date first. For each entry the system shows: valid-from date, valid-until date, price, currency, and product unit.
3. The admin indicates they want to add a new buying price.
4. The system asks for: valid-from date, valid-until date, price, currency (pre-filled with EUR), product unit (pre-filled with kg), and optionally an external work reference.
5. The admin provides the buying price details.
6. The system verifies the information is complete and valid.
7. The system records the buying price linked to the product with its validity period.
8. The system shows the refreshed list of buying prices.

## Alternative Flows
- **AF-1: Change Buying Price** -- At step 3, instead of adding a new entry, the admin selects an existing buying price to change. The system presents the current values for valid-from date, valid-until date, price, currency, product unit, and external work reference. The admin adjusts one or more values. The system verifies the changes and saves them. The flow continues at step 8.
- **AF-2: Remove Buying Price** -- At step 3, instead of adding a new entry, the admin selects an existing buying price to remove. The system asks the admin to confirm the removal, showing the validity period of the entry to be removed. The admin confirms. The system removes the buying price. The flow continues at step 8.
- **AF-3: Show Expired Buying Prices** -- At step 2, the admin indicates they also want to see expired buying prices. The system shows all buying prices including those whose valid-until date has passed. The flow continues at step 3.

## Exception Flows
- **EF-1: Invalid Date Range** -- At step 6, the valid-until date is before the valid-from date. The system rejects the entry and informs the admin that the valid-until date must be on or after the valid-from date.
- **EF-2: Incomplete Information** -- At step 6, one or more required fields are missing. The system indicates which fields must be provided and does not save the entry.

## Postconditions
- The buying price is saved linked to the product with the specified validity period, currency, and product unit.
- The buying price is available for use in supplier order calculations.

## Business Rules
- **BR-1:** The valid-until date must be on or after the valid-from date.
- **BR-2:** Price, valid-from date, valid-until date, currency, and product unit are all required.

## Presentation Guidelines
- **PG-1:** By default, only active and future buying prices are shown (valid-until date is today or later). Expired entries are hidden unless the admin explicitly requests to see them.

## Implementation Notes
- Buying prices are stored per product only -- there is no direct supplier association on the buying price record. The supplier relationship is established through the product's assigned supplier.
- The `orderLines` table references `buyingPrices` via `buyinPriceId` to link supplier order lines to the active buying price at the time of ordering.
- The `workId` field on the buying price is an optional external system reference.
- Routes handle CRUD directly without a dedicated service layer.

## Implemented By
- Routes: `GET /api/products/:productId/buying-prices`, `POST /api/buying-prices`, `PATCH /api/buying-prices/:id`, `DELETE /api/buying-prices/:id`
- Services: None (routes handle directly)
- Components: `client/src/pages/admin/ProductDetail.tsx` (BuyingPricesTab), `client/src/components/admin/BuyingPriceDialog.tsx`
- Storage: None (routes query database directly via Drizzle)
