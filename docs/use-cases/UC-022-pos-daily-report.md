# UC-022: View POS Daily Sales Report

The cashier or admin reviews a summary of all POS transactions for a given day to support end-of-day cash reconciliation and sales performance monitoring.

## Metadata
- **Domain:** Sales / Finance / POS
- **Primary Actor:** POS User / Cashier
- **Secondary Actors:** Admin
- **Priority:** Should
- **Status:** Approved
- **Interface:** POS Terminal

## Preconditions
- User is authenticated (cashier or admin)
- Sales exist for the requested date

## Main Flow
1. The cashier accesses the daily report feature.
2. The system retrieves all POS sales for the current day (or the selected date).
3. The system displays the daily report showing the total number of transactions, total revenue for the day, a revenue breakdown by payment method (cash total, card total, and any other methods), and a product-level breakdown listing each product sold with its quantity and total.
4. The cashier reviews the report for end-of-day reconciliation.

## Alternative Flows
- **AF-1: View Receipt** — The cashier retrieves the receipt data for a specific past transaction for reprinting.
- **AF-2: Select Different Date** — The cashier or admin views the report for a specific past date.

## Exception Flows
- **EF-1: No Sales** — No transactions exist for the selected date. The system shows zero totals.

## Postconditions
- The user has a complete view of the day's POS sales performance.
- Payment method totals support cash drawer reconciliation.

## Business Rules
- **BR-1:** The daily report aggregates all POS sales for a single calendar day.
- **BR-2:** Payment breakdown helps reconcile the cash register at end of day.
- **BR-3:** Product breakdown shows what was sold and in what quantities.
- **BR-4:** Reports are read-only — they do not change any data.

## Implementation Notes
- The report is built from aggregation queries across the sales, sale_lines, and payments tables filtered by the specified date.

## Implemented By
- Routes: `GET /api/pos/reports/daily`, `GET /api/pos/sales/:id/receipt`
- Services: `server/posService.ts`
- Components: `client/src/pages/pos/POSPage.tsx`
- Storage: Aggregation queries on sales, sale_lines, and payments for the specified date
