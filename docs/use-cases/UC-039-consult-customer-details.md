# UC-039: Consult Customer Details

The admin opens a customer's detail page to review their complete profile: contact information, address details, account metrics, purchase history, and custom pricing. This page acts as the central hub for everything related to a single customer.

## Metadata
- **Domain:** Customer
- **Primary Actor:** Admin
- **Secondary Actors:** None
- **Priority:** Must
- **Status:** Approved
- **Interface:** Admin Dashboard

## Preconditions
- Admin is authenticated and has admin privileges.
- The customer exists in the system.

## Main Flow
1. The admin selects a customer from the customer list (UC-002).
2. The system presents the customer's details:
   - The customer name, type (B2B/B2C), pricing model, email, and phone.
   - Lifetime value (total revenue excl. VAT), current year revenue (with year-over-year growth indicator), total number of orders, and average order value.
   - A sales evolution overview comparing yearly revenue and order count across all years.
   - A list of all products the customer has purchased, with total quantity (grams) and revenue (excl. VAT).
   - Yearly sales data showing revenue and order count per year.
3. The admin reviews the information.

## Alternative Flows
- **AF-1: Consult Overview** — The admin consults the customer's overview information. The system presents read-only customer attributes: ID, first name, last name, company name, VAT number, customer type, pricing model, first purchase date, last purchase date, birthday, and WooCommerce ID.
- **AF-2: Consult Contact & Address** — The admin consults the customer's contact and address information. The system presents the customer's email, phone number, billing address (street, bus number, postal code, city), and shipping address (same fields).
- **AF-3: Consult Account Details** — The admin consults the customer's account details. The system presents account creation date, last modification date, lifetime orders, lifetime revenue, average order value, and account status.
- **AF-4: Consult Custom Pricing** — The admin consults the customer's custom pricing. The system presents customer-specific prices. Behaviour is defined in UC-007: Set Customer-Specific Prices.
## Exception Flows
None. The customer is selected from the system's own list and always exists. Absence of sales data is normal behaviour — the system presents zero values.

## Postconditions
- The admin has reviewed the customer's profile, purchase history, and performance data.
- No data is modified by the main flow (read-only consultation).

## Business Rules
- **BR-1:** Year-over-year growth compares the current year's revenue with the previous year's.
- **BR-2:** The products purchased list aggregates across all years and all sales for that customer.
- **BR-3:** Customer statistics aggregate across all sales channels.
- **BR-4:** Revenue calculations include only completed, paid, or invoiced sales.

## Presentation Guidelines
- **PG-1:** Positive year-over-year growth is shown in green with an up indicator; negative growth in red with a down indicator.
- **PG-2:** The sales evolution overview uses a dual-axis layout: bars for revenue and a line for order count.
- General display rules (nl-BE formatting, currency, weight units) are defined in `docs/design/design_guidelines.md`.

## Related Use Cases
- **UC-002:** Manage Customers — the customer list from which this page is opened.
- **UC-007:** Set Customer-Specific Prices — governs the custom pricing section.

## Implementation Notes
- The page fetches data from multiple endpoints in parallel for fast loading.
- Customer statistics are resolved in two parallel queries rather than one query per metric, using conditional SQL aggregation to minimise database round-trips.

## Implemented By
- Routes: `GET /api/customers/:id`, `GET /api/customers/:id/statistics`, `GET /api/customers/:id/yearly-sales`, `GET /api/customers/:id/products-purchased`
- Services: `server/customerService.ts`
- Components: `client/src/pages/admin/CustomerDetail.tsx`
