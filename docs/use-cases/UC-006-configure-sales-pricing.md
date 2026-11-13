# UC-006: Configure Sales Pricing

Allows the admin to add and maintain date-ranged sales price variants for each product. A single price record defines a product variant (unit and weight) with both B2B and B2C prices, date validity, and channel flags for POS and Webshop visibility. The system automatically resolves overlapping date ranges when a new price is added.

## Metadata
- **Domain:** Product / Finance
- **Primary Actor:** Admin
- **Secondary Actors:** None
- **Priority:** Must
- **Status:** Approved
- **Interface:** Admin Dashboard

## Preconditions
- Admin is authenticated and has admin privileges
- The admin is consulting a product's details (UC-038)
- At least one product unit (weight + unit combination) is configured in the system settings

## Main Flow
1. The admin indicates they want to manage the sales pricing for the product.
2. The system shows all active price variants for the product.
3. The admin indicates they want to add a new sales price.
4. The system asks for the following information: unit (from the product unit settings, e.g., gram, piece), amount, B2C price excluding VAT, B2C price including VAT, B2B price excluding VAT, B2B price including VAT, valid-from date, valid-until date, and three channel flags: POS item, Webshop price, and Webshop default variant.
5. When the admin enters a price including VAT, the system automatically calculates the corresponding price excluding VAT using the product's VAT class percentage, and vice versa.
6. The admin provides all required information and confirms.
7. The system verifies the data: all required fields are present, dates are valid, the valid-until date is on or after the valid-from date, and no price with the same product, unit, amount, and valid-from date already exists.
8. The system resolves any date range overlaps with existing prices for the same variant, adjusting end dates as needed to prevent conflicts (see BR-3).
9. The system records the new sales price.
10. The system shows the updated price list.

## Alternative Flows
- **AF-1: Change Price** -- The admin selects an existing sales price and changes any field (prices, dates, channel flags). The system verifies the data and applies the changes directly. Note: the change operation does not re-apply the overlap resolution described in step 9. The admin is responsible for ensuring date ranges remain consistent when changing existing prices.
- **AF-2: Remove Price** -- The admin indicates they want to remove a sales price that is no longer needed. The system asks the admin to confirm the removal. Because customer-specific prices (UC-007) are linked to sales price records, removing a sales price also removes all customer-specific price overrides linked to it. The system confirms the removal is complete.
- **AF-3: View Price History** -- The admin indicates they want to see expired prices. The system includes prices whose valid-until date has passed, allowing the admin to review the full pricing history for the product.

## Exception Flows
- **EF-1: Invalid Date Range** -- The valid-until date is before the valid-from date. The system rejects the entry and informs the admin to correct the dates.
- **EF-2: Missing Required Fields** -- Any required field (unit, amount, B2C prices, B2B prices, dates) is empty. The system rejects the entry and indicates which fields need to be provided.
- **EF-3: Duplicate Price** -- A price with the same product, unit, weight amount, and valid-from date already exists. The system rejects the entry and informs the admin that a price for this variant and start date already exists.

## Postconditions
- The new sales price is recorded with the specified variant (unit + weight), B2B prices, B2C prices, date validity, and channel flags.
- Any previously overlapping prices for the same variant have had their valid-until dates adjusted to end the day before the new price starts.
- If the new price would overlap with a future price for the same variant, its valid-until date has been truncated accordingly.
- Only one price per product can have the Webshop default flag enabled.
- The price is available for use in POS (if POS item flag is set), Webshop (if Webshop price flag is set), and admin sales entry based on the date range and customer type.

## Business Rules
- **BR-1:** A sales price record defines a product variant by combining a unit (from the product unit settings, e.g., gram, piece) with an amount (e.g., 250, 500, 1000). Each record holds both B2B and B2C pricing simultaneously -- there is no separate "price type" concept.
- **BR-2:** Sales prices have date-range validity (valid-from to valid-until). Only prices whose date range includes the current date are considered active.
- **BR-3:** Overlap resolution on addition: when a new price is added, the system adjusts existing overlapping prices for the same variant (product + unit + amount) by ending them the day before the new price starts. The system also truncates the new price's end date if a future price for the same variant already exists.
- **BR-4:** Overlap resolution is not applied when changing an existing price. The admin is responsible for maintaining date consistency when changing existing prices.
- **BR-5:** B2B prices are used for customers with the B2B pricing flag. B2C prices are used for all other customers, including guest and walk-in customers.
- **BR-6:** Customer-specific prices (UC-007) override these default B2B/B2C prices. Removing a sales price also removes all customer-specific price overrides linked to it.
- **BR-7:** Prices are stored with 5-decimal precision internally. Display formatting follows the general data formatting guidelines.
- **BR-8:** The POS item flag determines whether this variant appears in POS for selection during a sale.
- **BR-9:** The Webshop price flag determines whether this variant is available on the storefront. The Webshop default flag designates which variant's price is shown on the product listing in the storefront catalog.
- **BR-10:** Only one price per product can have the Webshop default flag enabled. Setting it on a new or changed price automatically clears it from all other prices for the same product.
- **BR-11:** VAT auto-calculation uses the product's assigned VAT class percentage. Entering a price including VAT computes the excluding-VAT price as: amount / (1 + vatRate). Entering a price excluding VAT computes the including-VAT price as: amount * (1 + vatRate).

## Presentation Guidelines
- **PG-1:** Price variants are ordered by amount and valid-from date.
- **PG-2:** By default, only prices with a current or future validity period are shown. Expired prices are hidden unless the admin explicitly requests to see them (AF-3).

## Implementation Notes
- Overlap resolution is applied only at the point of adding a new price (POST). Editing (PATCH) applies the update directly without re-checking overlaps.
- The valid-until date defaults to 9999-12-31 in the UI form when creating a new price, effectively making it open-ended.
- VAT auto-calculation happens client-side in the SalesPriceDialog component. The server does not validate VAT consistency between the with-VAT and without-VAT fields.
- The overlap matching key is the combination of productId + unit + amount (weight). Two prices with different units or different weight amounts for the same product are treated as independent variants and do not trigger overlap resolution against each other.

## Implemented By
- Routes: `GET /api/products/:id/sales-prices`, `GET /api/sales-prices` (all active prices across products), `POST /api/sales-prices`, `PATCH /api/sales-prices/:id`, `DELETE /api/sales-prices/:id`
- Logic: `server/routes.ts` (all business logic including overlap resolution, duplicate detection, and webshop default enforcement is inline in the route handlers; no dedicated service layer exists)
- Components: `client/src/pages/admin/ProductDetail.tsx`, `client/src/components/admin/SalesPriceDialog.tsx`
- Schema: `shared/schema.ts` -- `salesPrices` table, `insertSalesPriceSchema` (with date range validation refinement)
