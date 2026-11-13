# UC-007: Set Customer-Specific Prices

Allows an admin to assign negotiated prices for specific product variants to an individual customer, overriding the default B2B or B2C pricing. Customer-specific prices include both with-VAT and without-VAT amounts, linked to a sales price variant, and are effective only within a specified date range.

## Metadata
- **Domain:** Product / Customer / Finance
- **Primary Actor:** Admin
- **Secondary Actors:** None
- **Priority:** Should
- **Status:** Draft
- **Interface:** Admin Dashboard

## Preconditions
- Admin is authenticated and has admin privileges.
- The admin is consulting a customer's details (UC-039).
- At least one sales price variant exists for the relevant product (UC-006).

## Main Flow
1. The admin indicates they want to manage custom pricing for the customer.
2. The system shows all existing customer-specific prices for this customer. For each price it shows: the product name, the variant (weight and unit), the custom price excluding VAT, the custom price including VAT, the valid-from date, and the valid-until date.
3. The admin indicates they want to add a new custom price.
4. The system asks for: the sales price variant (product, weight, and unit as configured in UC-006), the custom price excluding VAT, the custom price including VAT, the valid-from date, and the valid-until date.
5. When the admin enters a price including VAT, the system automatically calculates the corresponding price excluding VAT using the product's VAT class percentage, and vice versa.
6. The admin provides all required information and confirms.
7. The system verifies the data is complete: a sales price variant is selected, both prices are positive, and the valid-until date is on or after the valid-from date.
8. The system records the custom price linking the customer, the sales price variant, both price amounts, and the validity period.
9. The system shows the refreshed list of customer-specific prices with the same fields as step 2.

## Alternative Flows
- **AF-1: Change Custom Price** -- The admin selects an existing customer-specific price and changes any field (prices, dates). The system recalculates VAT counterparts if a price field changes. The system verifies the changed data and applies the changes.
- **AF-2: Remove Custom Price** -- The admin indicates they want to remove a customer-specific price. The system asks the admin to confirm the removal. Once confirmed, the system removes the custom price.

## Exception Flows
- **EF-1: Duplicate Variant** -- A custom price for the same customer and sales price variant already exists. The system rejects the entry and informs the admin that a custom price for this variant is already recorded.
- **EF-2: Invalid Price** -- The admin provides a negative or zero price. The system rejects the entry and asks for a valid positive amount.
- **EF-3: Invalid Date Range** -- The valid-until date is before the valid-from date. The system rejects the entry and informs the admin to correct the dates.

## Postconditions
- A customer-specific price is recorded linking the customer, a sales price variant, prices excluding and including VAT, and a validity period.

## Business Rules
- **BR-1:** Only one custom price per customer and sales price variant combination is allowed. A second entry for the same combination is rejected.
- **BR-2:** VAT auto-calculation uses the product's assigned VAT class percentage. Entering a price including VAT computes the excluding-VAT price as: amount / (1 + vatRate). Entering a price excluding VAT computes the including-VAT price as: amount * (1 + vatRate). This follows the same behaviour as UC-006 BR-11.
- **BR-3:** Removing a sales price variant (UC-006 AF-2) cascades to remove all customer-specific prices linked to it.

## Presentation Guidelines
- **PG-1:** Custom prices whose validity period has expired are visually distinguished from active prices.
- **PG-2:** The custom prices list is ordered by product name, then by variant weight.

## Implementation Notes
- The `customerPrices` table references `salesPrices.id` via `salesUnitDefaultId`, linking to a specific product variant rather than directly to a product.
- Prices are stored with 5-decimal precision (`precision: 10, scale: 5`) to match sales price precision.
- VAT auto-calculation happens client-side, consistent with the `SalesPriceDialog` component pattern in UC-006.
- The `insertCustomerPriceSchema` omits `id`, `customerPriceCreationDate`, and `customerPriceModificationDate` (auto-managed).
- BR-1 uniqueness is not currently enforced by a database constraint. The application should enforce this at the service layer or a unique index should be added on `(customer_id, sales_unit_default_id)`.
- The frontend custom pricing management UI is not yet built -- `CustomerDetail.tsx` currently shows a placeholder. The API endpoints exist and function correctly.

## Implemented By
- Routes: `GET /api/customers/:id/prices`, `POST /api/customers/:id/prices`, `PATCH /api/customers/:id/prices/:priceId`, `DELETE /api/customers/:id/prices/:priceId`
- Logic: `server/routes.ts` (all CRUD operations are inline in route handlers; no dedicated service layer exists)
- Components: `client/src/pages/admin/CustomerDetail.tsx` (placeholder only -- custom pricing UI not yet implemented)
- Schema: `shared/schema.ts` -- `customerPrices` table, `insertCustomerPriceSchema`
