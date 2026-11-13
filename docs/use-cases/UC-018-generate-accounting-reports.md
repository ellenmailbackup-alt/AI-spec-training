# UC-018: Generate Accounting Reports

The admin produces quarterly accounting reports for a selected year and downloads them as Excel workbooks ready for the accounting department. Three report types are available: Boeren en Buren channel reconciliation, B2C retail sales, and the Kasboek (cash ledger).

## Metadata
- **Domain:** Finance / Reporting
- **Primary Actor:** Admin
- **Secondary Actors:** Accounting Department (report consumer)
- **Priority:** Must
- **Status:** Reviewed
- **Interface:** Admin Dashboard

## Preconditions
- The admin is authenticated and has admin privileges.
- Sales data exists in the system.

## Main Flow
1. The admin requests an overview of accounting reports.
2. The system presents the available report types: Boeren en Buren, B2C Sales, and Kasboek. The system also shows the current year selection and the beginning cash balance configured for that year.
3. The admin selects a reporting year.
4. The system shows the beginning cash balance stored for the selected year.
5. The admin chooses the Boeren en Buren report.
6. The system prepares the report: all non-webshop sales for the selected year where the customer belongs to the Buurderij channel, with daily totals per customer showing amounts excluding VAT, amounts including VAT, and the VAT difference, grouped into quarterly worksheets (Q1 through Q4) with daily subtotals and a quarter total.
7. The system delivers the workbook as a download.

## Alternative Flows
- **AF-1: B2C Sales Report** -- At step 5, instead of Boeren en Buren, the admin chooses the B2C Sales report. The system prepares the report: all non-webshop, non-B2B, non-Buurderij sales for the selected year, grouped by date, payment method, and VAT rate, with discount and shipping distributed proportionally across VAT groups. Per row the report shows: invoice number, sales date, payment method, company name, first name, last name, line totals excluding and including VAT, VAT percentage, proportional discount excluding and including VAT, proportional shipping including and excluding VAT, net total excluding VAT, net total including VAT, and net VAT. The flow continues at step 7 (delivery).
- **AF-2: Kasboek Report** -- At step 5, instead of Boeren en Buren, the admin chooses the Kasboek report. The system prepares the report: all cash payments for the selected year, using the configured beginning cash balance as the opening balance for Q1 and deriving opening balances for Q2 through Q4 from the cumulative cash received in prior quarters. Each row shows: general ledger account, cash register name, counter account, customer name, transaction date, description, payment amount, and running balance. The flow continues at step 7 (delivery).
- **AF-3: Adjust Beginning Cash Balance** -- At step 4, the admin changes the beginning cash balance for the selected year. The system records the new value. The flow continues at step 5.

## Exception Flows
None. The year is selected from a constrained range and cannot be invalid.

## Postconditions
- An Excel workbook containing the requested accounting report for the selected year has been downloaded to the admin's machine.

## Business Rules
- **BR-1:** The Boeren en Buren report includes only non-webshop sales where the customer's last name contains "buurderij" (case-insensitive).
- **BR-2:** The B2C Sales report excludes B2B clients, webshop sales, and Buurderij customers.
- **BR-3:** When a sale has multiple VAT rate groups, discount and shipping amounts are distributed proportionally based on each group's share of the sale's total excluding VAT.
- **BR-4:** The Kasboek opening balance for Q1 equals the configured beginning cash balance for that year; each subsequent quarter's opening balance equals the previous quarter's closing balance.
- **BR-5:** The beginning cash balance must be a valid number before it can be stored.

## Presentation Guidelines
- **PG-1:** All three reports are structured as Excel workbooks with four worksheets named Q1, Q2, Q3, and Q4.
- **PG-2:** Monetary columns in the Boeren en Buren and Kasboek reports use two-decimal currency formatting. The B2C report uses five-decimal precision for raw line totals and discount/shipping columns, and two-decimal precision for computed net totals.
- **PG-3:** The B2C report displays VAT percentage as a percentage format.
- **PG-4:** Subtotal and total rows in the B2C report are styled bold.
- **PG-5:** Dates in all reports are formatted as DD/MM/YYYY.

## Implementation Notes
- Report generation uses the `xlsx` library to build workbooks in memory before streaming as a binary download.
- Each report type has a dedicated endpoint that applies channel-specific SQL filtering and column layouts.
- The Kasboek uses fixed accounting constants for general ledger account (570000), cash register name, counter account (400000), and transaction description.
- The beginning cash balance is persisted as a system parameter keyed by year (`kas_beginsaldo_{year}`).

## Implemented By
- Routes: `GET /api/accounting/reports/boeren-buren`, `GET /api/accounting/reports/b2c-sales`, `GET /api/accounting/reports/cash-payments`, `GET /api/accounting/kas-beginsaldo`, `PUT /api/accounting/kas-beginsaldo`
- Services: `server/accountingReportService.ts`, `server/parameterService.ts`
- Components: `client/src/pages/admin/AccountingReports.tsx`
