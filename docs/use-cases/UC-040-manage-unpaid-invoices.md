# UC-040: Manage Unpaid Invoices

Allows the admin to view, filter, and track invoices, with the primary goal of monitoring outstanding (unpaid) invoices and marking them as paid when payment is received.

## Metadata
- **Domain:** Finance
- **Primary Actor:** Admin
- **Secondary Actors:** None
- **Priority:** Must
- **Status:** Approved
- **Interface:** Admin Dashboard

## Preconditions
- Admin is authenticated and has admin privileges
- At least one sale exists with status INVOICED or PAID and a valid invoice number

## Main Flow
1. The admin requests an overview of unpaid invoices.
2. The system fetches all sales and filters them to only those with status INVOICED and a valid invoice number (not "0" or blank).
3. The system displays summary statistics cards: Total Invoiced (sum of INVOICED sales), Total Paid (sum of PAID sales), Outstanding (equal to Total Invoiced), and Number of Invoices (count of displayed invoices).
4. The system displays the invoice list in a table with columns: Invoice Number, Date, Customer, Status, Total Amount, and Actions.
5. The admin reviews the list of open invoices.
6. The admin clicks "Mark as Paid" on an unpaid invoice.
7. The system updates the sale status to PAID. The invoice moves from the "outstanding" category to "paid" in the statistics. The "Mark as Paid" button disappears for that row.

## Alternative Flows
- **AF-1: Filter by Date Range** -- The admin enters a "Date From" and/or "Date To" value. The system narrows the invoice list to sales within the specified date range. Summary statistics update to reflect the filtered set.
- **AF-2: Filter by Customer** -- The admin selects a customer from the customer dropdown. The system narrows the invoice list to that customer's invoices only. Summary statistics update accordingly.
- **AF-3: Filter by Status** -- The admin changes the status filter to "PAID" or "All Statuses". The system updates the invoice list and summary statistics to match the selected filter.

## Exception Flows
- **EF-1: Mark as Paid Fails** -- The status update request fails (e.g., network error or business rule violation). The system displays an error toast with the failure reason. The invoice status remains unchanged.
- **EF-2: No Invoices Found** -- No sales match the invoice criteria. The system displays an empty state message: "There are no invoices in the system yet."
- **EF-3: No Invoices Match Filters** -- Sales with invoices exist but none match the active filters. The system displays: "Try adjusting your filters to see more results."

## Postconditions
- The admin has reviewed the current state of invoices.
- If AF-4 was performed: the sale status has been changed from INVOICED to PAID.

## Business Rules
- **BR-1:** Only sales with status INVOICED (ID 3) or PAID (ID 4) and a valid invoice number (not "0" or blank) appear on this page. Sales with other statuses or without invoice numbers are excluded.
- **BR-2:** The default status filter is "INVOICED", so the admin sees open invoices immediately upon entering the page.
- **BR-3:** The "Mark as Paid" button is only available on invoices with status INVOICED. It is not shown for already-paid invoices.
- **BR-4:** When marking as paid, no stock movements are created (the request explicitly sets `createStockMovements: false`). Stock movements are handled during other status transitions (see UC-003).
- **BR-5:** Summary statistics are computed from the filtered set of invoices, not the full set. Changing filters changes the displayed totals.
- **BR-6:** The "Outstanding" statistic equals the Total Invoiced amount (i.e., the sum of all INVOICED sales in the current filtered view).
- **BR-7:** The total amount for each invoice is calculated as: sales lines total + shipping cost (incl. VAT) - discount (incl. VAT).
- **BR-8:** All currency amounts are displayed in EUR using nl-BE formatting (e.g., "EUR 1.250,00").

## Implementation Notes
- The page fetches all sales via `GET /api/sales` and applies client-side filtering. There is no server-side filtering for invoice status or date range.
- Customer names are resolved from the `customerName` field returned by the API, falling back to the customer object's company name or contact name.

## Implemented By
- Routes: `GET /api/sales`, `GET /api/customers`, `PATCH /api/sales/:id/status`
- Services: `server/salesService.ts` (updateSaleStatus)
- Components: `client/src/pages/admin/Invoices.tsx`

## Related Use Cases
- **UC-003: Record and Manage Sales** -- Sales and their statuses originate here; sale status lifecycle rules are defined in UC-003.
- **UC-008: Invoice Customer** -- PDF download and email sending are delegated to this use case. The Invoices page is one of UC-008's entry points.
- **UC-004: Consult Sale Details** -- The other entry point for invoice actions.
