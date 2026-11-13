# UC-004: Consult Sale Details

The admin reviews a sale's complete information: invoice number, customer, dates, status, payment method, all purchased products with quantities and prices, and the financial summary including VAT breakdown. This is the central reference point for a single sale.

## Metadata
- **Domain:** Sales / Finance
- **Primary Actor:** Admin
- **Secondary Actors:** None
- **Priority:** Must
- **Status:** Draft
- **Interface:** Admin Dashboard

## Preconditions
- Admin is authenticated and has admin privileges.
- The sale exists in the system.

## Main Flow
1. The admin selects a sale from the sales list (UC-003).
2. The system presents the sale's details:
   - Invoice number, sale date, customer name (with company if applicable), payment method, status, whether it is a webshop sale, whether stock has been updated, and whether it has been uploaded to accounting.
   - A list of all purchased products, each showing product name, quantity, unit and weight, unit price (excl. and incl. VAT), and line total (excl. and incl. VAT).
   - A financial summary: products subtotal (excl. VAT), shipping cost (if applicable), discount (if applicable), subtotal (excl. VAT), VAT per rate, and grand total (incl. VAT).
3. The admin reviews the information.

## Alternative Flows
- **AF-1: Advance to Shipped** — The admin indicates they want to advance the sale to shipped. The system changes the status and automatically records stock movements for all line items.
- **AF-2: Advance to Invoiced** — The admin indicates they want to advance the sale to invoiced. If stock movements have not yet been recorded, the system asks the admin to confirm whether they should be recorded now. The system changes the status accordingly.
- **AF-3: Advance to Paid** — The admin indicates they want to mark the sale as paid. The system changes the status. Once paid, the sale can no longer be edited or removed (UC-003 BR-8).

> The admin may also generate or send an invoice for this sale; that flow is owned by UC-008 (Invoice Customer).

## Exception Flows
- **EF-1: Invalid Status Transition** — The admin attempts a status change that moves backwards in the lifecycle. The system rejects the transition and informs the admin.

## Postconditions
- The admin has reviewed the sale's complete information.
- No data is modified by the main flow (read-only consultation).

## Business Rules
- **BR-1:** VAT is grouped and displayed per rate (e.g., 6%, 21%), aggregated across all line items.
- **BR-2:** When a discount is applied, it is proportionally distributed across VAT rates for correct VAT calculation.
- **BR-3:** Shipping VAT is determined separately and rounded to the nearest standard Belgian VAT rate (0%, 6%, 12%, or 21%).
- **BR-4:** Status can only advance forward in the lifecycle, never backwards.
- **BR-5:** Advancing to shipped automatically records stock movements (inventory deductions) for all line items.
- **BR-6:** Advancing to invoiced prompts for stock movement confirmation only if no stock movements have been recorded yet.

## Presentation Guidelines
- **PG-1:** Shipping cost and discount lines are only shown in the financial summary when their values are greater than zero.
- **PG-2:** VAT lines are sorted descending by percentage (highest rate first).
- General display rules (nl-BE formatting, currency, weight units) are defined in `docs/design/design_guidelines.md`.

## Related Use Cases
- **UC-003:** Record and Manage Sales — the sales list from which this page is opened, and where sales are recorded and modified.
- **UC-008:** Invoice Customer — the admin can generate, download, or send an invoice for this sale from the detail page.

## Implementation Notes
- The page fetches sale data including all line items and customer information in a single request.
- VAT calculations are performed client-side from line item data for display purposes.

## Implemented By
- Routes: `GET /api/sales/:id`, `PATCH /api/sales/:id/status`
- Services: `server/salesService.ts`
- Components: `client/src/pages/admin/SaleDetail.tsx`
