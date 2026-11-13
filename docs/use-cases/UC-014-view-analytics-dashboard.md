# UC-014: View Analytics Dashboard

The admin reviews a consolidated overview of business performance covering revenue trends, channel comparisons, invoice health, stock alerts, customer statistics, and top performers. The dashboard supports month-by-month navigation, multi-year sales analysis, and inventory health monitoring, enabling quick identification of issues and opportunities.

## Metadata
- **Domain:** Finance / Analytics
- **Primary Actor:** Admin
- **Secondary Actors:** None
- **Priority:** Must
- **Status:** Approved
- **Interface:** Admin Dashboard

## Preconditions
- The admin is authenticated and has admin privileges
- At least one sale exists in the system (otherwise all values show as zero)

## Main Flow
1. The admin requests an overview of business performance.
2. The system presents current-month summary indicators: the selected month's revenue with year-over-year change (amount and percentage), the year-to-date revenue with year-over-year change, the top customer by revenue (name and amount), and the top product by revenue (name and amount).
3. The system shows an urgent alerts banner if any overdue invoices or critical stock items (fewer than 30 days remaining) exist. The banner reports the count of overdue invoices and critical stock alerts.
4. The system shows revenue by channel for the selected month compared to the same month last year. For each channel (B2B, B2C, Webshop, Boeren en Buren) it shows: current month revenue, same month previous year revenue, absolute change, and percentage change.
5. The system shows a monthly sales trend chart comparing revenue per month for the current year against the previous year.
6. The system shows year-to-date revenue by product category as a proportional breakdown, listing each category with its revenue amount.
7. The system shows invoice health: outstanding invoices (amount and count), overdue invoices beyond the payment target threshold (amount and count), and average days to payment over the last 12 months.
8. The system shows stock alerts for products with the lowest remaining stock days, listing for each: product name, current stock level with unit, estimated days remaining, and average monthly sales rate.
9. The system shows customer statistics: total customers, new customers this month, total sales year-to-date, one-time buyers, and inactive customers (no purchases in the last 12 months).
10. The system shows the top 5 customers year-to-date, listing for each: rank, customer name, and revenue.
11. The system shows the top 5 products year-to-date, listing for each: rank, product name, revenue, and quantity sold.
12. The admin reviews the presented information.

## Alternative Flows
- **AF-1: Navigate to a Different Month** -- At step 2, instead of viewing the current month, the admin selects a previous month. The system presents all overview indicators and channel comparisons for the chosen month. The admin cannot navigate beyond the current month. The flow continues at step 2 with the new month's data.
- **AF-2: Review Sales Analysis** -- At step 12, the admin requests the sales analysis. The system shows: lifetime revenue and best-ever revenue month as summary indicators; the admin chooses which years to compare; a multi-year revenue trend chart plotting monthly revenue for each selected year; a year-over-year growth table listing each of the last four years with revenue and growth percentage (the current year marked as year-to-date); and a channel performance over time table showing revenue per channel per selected year. The flow ends.
- **AF-3: Review Inventory Health** -- At step 12, the admin requests the inventory health overview. The system shows summary indicators: total products tracked, count of low-stock items (fewer than 60 days remaining), and count of critical items (fewer than 30 days remaining). Below the summaries, the system shows a stock levels list with: product name, current stock with unit, average monthly consumption, and estimated days remaining. The flow ends.

## Exception Flows
- **EF-1: Analytics Retrieval Fails** -- At step 2, if the system cannot retrieve analytics data due to a service error, it informs the admin that dashboard data is temporarily unavailable. The admin cannot review performance.

## Postconditions
- The admin has reviewed a comprehensive overview of current business performance

## Business Rules
- **BR-1:** Revenue figures include only sales with a status of Shipped, Invoiced, or Paid.
- **BR-2:** The overdue invoice threshold is 15 days past the invoice date.

## Presentation Guidelines
- **PG-1:** The dashboard is organized into three analytical views: Overview (revenue, channels, invoices, stock, customers, top performers), Sales Analysis (multi-year trends, growth, channel performance over time), and Inventory (stock levels and alerts).
- **PG-2:** Revenue change indicators show directional arrows: up for positive growth, down for negative, flat for no change.
- **PG-3:** Stock alert urgency uses color coding: critical (fewer than 30 days) in red, warning (fewer than 60 days) in amber, normal otherwise.
- **PG-4:** Weight-based product quantities display in grams or kilograms as appropriate; piece-based products display as integers without unit suffix.
- **PG-5:** The current year in the year-over-year growth table is labeled as year-to-date when the year is not yet complete.
- **PG-6:** Year-over-year comparisons use the same calendar period in the previous year (same month or same year-to-date window, capped at today's equivalent date in the previous year).
- **PG-7:** Inactive customers are classified as those with no purchases in the last 12 months.
- **PG-8:** Stock alerts are based on estimated days remaining, calculated from current stock divided by the average monthly sales rate over the last 12 months.

## Implementation Notes
- The Overview and Sales Analysis views both call `dashboardService` methods.
- All dashboard aggregations run in parallel using `Promise.all` for performance.
- The dashboard endpoint accepts optional `year` and `month` query parameters; it caps the reference date to today to prevent future-month queries from skewing year-to-date calculations.

## Implemented By
- Routes: `GET /api/analytics/dashboard`, `GET /api/analytics/sales-analysis`, `GET /api/analytics/inventory`
- Services: `server/dashboardService.ts`
- Components: `client/src/pages/admin/Dashboard.tsx`
- Storage: Aggregation queries via `storage.getRevenueForDateRange()`, `storage.getRevenueForChannel()`, `storage.getRevenueByCategory()`, `storage.getOutstandingInvoices()`, `storage.getOverdueInvoices()`, `storage.getAverageDaysToPayment()`, `storage.getLowStockProducts()`, `storage.getTotalCustomers()`, `storage.getNewCustomersThisMonth()`, `storage.getOneTimeCustomers()`, `storage.getInactiveCustomers()`, `storage.getSalesCount()`, `storage.getTopCustomersByRevenue()`, `storage.getTopProductsByRevenue()`, `storage.getAllInventoryLevels()`
