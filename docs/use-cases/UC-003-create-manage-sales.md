# UC-003: Record and Manage Sales

Allows the admin to record new sales and manage existing ones. Sales capture the full relationship between a customer, the products they purchase, and the financial totals.

## Metadata
- **Domain:** Sales / Finance
- **Primary Actor:** Admin
- **Secondary Actors:** None
- **Priority:** Must
- **Status:** Approved
- **Interface:** Admin Dashboard

## Preconditions
- Admin is authenticated and has admin privileges
- At least one customer and one product exist in the system
- Sales prices are configured for products

## Main Flow
1. The admin indicates they want to record a new sale.
2. The system asks for the sale details: customer, sale date, payment method, whether it is a webshop sale, and line items.
3. The admin selects a customer.
4. The system determines the sales channel (B2B, B2C, or Boeren en Buren) based on the customer type.
5. The admin adds a line item by selecting a product.
6. The system asks the admin to indicate the unit and weight for the selected product.
7. The system retrieves the applicable price for the selected product, unit, and customer. The admin may override the price.
8. The admin repeats steps 5–7 for each additional product.
9. The admin optionally adds shipping costs and a discount.
10. The system calculates line totals, subtotal, VAT per VAT class, and grand total in real-time.
11. The admin confirms the sale.
12. For B2B customers, the system assigns the next available invoice number. For B2C customers, no invoice number is assigned.
13. The system records the new sale with status "new" and all line items, ensuring all information is saved together.

## Alternative Flows
- **AF-1: Edit Sale** — The admin modifies an existing sale's details, line items, or customer. The admin may also toggle the stock updated and uploaded to accounting flags. The system applies the changes.
- **AF-2: Remove Sale** — The admin removes a sale that is no longer needed. The system asks for confirmation before proceeding. This is not available for paid sales.
- **AF-3: Record Sale from Customer Context** — Precondition: the admin indicated they want to record a sale for an identified customer (e.g., from UC-039). The system presents the sale form with the customer already selected and the sales channel already determined. The flow continues from step 2, skipping the customer selection (steps 3–4).

## Exception Flows
- **EF-1: No Line Items** — The system requires at least one line item before a sale can be recorded.
- **EF-2: Invalid Quantities** — The system rejects zero or negative quantities.
- **EF-3: Partial Save Prevented** — If any part of the sale recording fails, nothing is saved and the admin is informed.

## Postconditions
- The sale is recorded with status "new", the customer reference, and all calculated totals.
- All sale line items are registered with product, quantity, unit price, and line total.
- Stock movements may be created depending on the sale status workflow.

## Business Rules
- **BR-1:** VAT is calculated per line item based on the product's VAT class (6% or 21%).
- **BR-2:** The sales channel is derived from the customer type (B2B, B2C, or Boeren en Buren). Marking a sale as a webshop sale is an additional flag — it does not override the customer type. The customer type still determines the applicable pricing.
- **BR-3:** When a product and unit/weight are selected, the system retrieves the applicable price: customer-specific price first (UC-007), falling back to the standard sales price (UC-006). The admin may override this price.
- **BR-4:** Shipping costs are held separately from line items.
- **BR-5:** Discounts can be applied at the sale level as a percentage or fixed amount.
- **BR-6:** Sale numbers are assigned sequentially per year by the system.
- **BR-7:** Invoice numbers are automatically assigned to B2B sales, sequentially per year. B2C sales do not receive an invoice number.
- **BR-8:** A sale that has been marked as paid cannot be edited or removed.
- **BR-9:** Sale status cannot be changed backwards in the lifecycle.

## Related Use Cases
- **UC-039:** Consult Customer Details — the admin can initiate a sale from this page (AF-3).
- **UC-004:** Consult Sale Details — detailed view of a single sale, including status changes and invoice actions.

## Implementation Notes
- Sale creation and all its line items are written in a single atomic operation to prevent partial records.

## Implemented By
- Routes: `GET /api/sales`, `GET /api/sales/:id`, `POST /api/sales`, `PATCH /api/sales/:id`, `DELETE /api/sales/:id`
- Services: `server/salesService.ts`
- Components: `client/src/pages/admin/Orders.tsx`, `client/src/pages/admin/SaleDetail.tsx`
- Storage: `storage.getSales()`, `storage.getSale()`, `storage.createSale()`, `storage.updateSale()`, `storage.deleteSale()`, `storage.createSaleLine()`
