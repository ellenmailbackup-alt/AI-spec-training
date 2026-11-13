# UC-038: Consult Product Details

The admin reviews a product's complete profile: base information, statistics, stock position, pricing history, buying prices, blend composition (if applicable), and webshop settings. This is the central hub for everything related to a single product.

## Metadata
- **Domain:** Product
- **Primary Actor:** Admin
- **Secondary Actors:** None
- **Priority:** Must
- **Status:** Approved
- **Interface:** Admin Dashboard

## Preconditions
- Admin is authenticated and has admin privileges.
- The product exists in the system.

## Main Flow
1. The admin selects a product from the product list (UC-001).
2. The system presents the product's details:
   - The product name (EN and NL) and image (if available).
   - YTD sales (grams), current stock (grams), peak monthly sales volume (grams), and all-time revenue (excl. VAT).
   - A year-over-year sales trend overview comparing the current year with the previous year, with the ability to view other years.
   - Yearly sales data showing total sales (grams) and revenue (excl. VAT) per year.
3. The admin reviews the information.

## Alternative Flows
- **AF-1: Consult Overview** — The admin consults the product's overview information. The system presents read-only product attributes: ID, names (EN/NL), status, category, sub-category, supplier, supplier product ID, VAT rate, own blend, WooCommerce ID, and POS short name.
- **AF-2: Consult Stock Movements** — The admin consults the product's stock movements. The system presents the year-to-date stock summary: start stock (carried from previous years), total bought, and total sold for the current year. The admin can navigate to the full stock movement history.
- **AF-3: Consult Pricing** — The admin consults the product's sales prices. Behaviour is defined in UC-006: Configure Sales Pricing.
- **AF-4: Consult Buying Prices** — The admin consults the product's buying prices. Behaviour is defined in UC-011: Manage Buying Prices.
- **AF-5: Consult Blend Components** — The admin consults the product's blend composition. Behaviour is defined in UC-016: Manage Product Blends.
- **AF-6: Consult Webshop Settings** — The admin consults and modifies the product's webshop visibility, descriptions, and product-type-specific attributes (coffee origin/strength, tea brewing parameters, or equipment specifications). The admin saves the changes.
- **AF-7: Navigate Year** — The admin indicates they want to view a different year in the sales trend overview. The system presents monthly sales data for the selected comparison period.

## Exception Flows
None. The product is selected from the system's own list and always exists. Absence of sales data is normal behaviour — the system displays zero values.

## Postconditions
- The admin has reviewed the product's current state and performance data.
- No data is modified by the main flow (read-only consultation).

## Business Rules
- **BR-1:** Product statistics are derived from sales line items and stock movements.
- **BR-2:** Revenue calculations include only completed, paid, or invoiced sales.
- **BR-3:** Monthly statistics use calendar months.
- **BR-4:** Blend component validation (must total 100%) is defined in UC-016.

## Presentation Guidelines
- **PG-1:** Blend composition is only visible for products marked as own blend.
- **PG-2:** Expired prices are hidden by default; the admin can toggle their visibility.
- **PG-3:** Price status is determined by comparing validity dates to today: Active (within range), Future (before start date), Expired (after end date).
- **PG-4:** The sales trend overview shows two lines: current year (solid) vs previous year (dashed). Navigation cannot go beyond the current year.
- **PG-5:** Coffee, tea, and equipment products show different type-specific fields in the webshop settings section.
- General display rules (nl-BE formatting, currency, weight units) are defined in `docs/design/design_guidelines.md`.

## Related Use Cases
- **UC-001:** Manage Products — the product list from which this page is opened.
- **UC-006:** Configure Sales Pricing — governs the pricing section.
- **UC-011:** Manage Buying Prices — governs the buying prices section.
- **UC-016:** Manage Product Blends — governs the blend composition section.

## Implementation Notes
- The page fetches data from multiple endpoints in parallel for fast loading.
- Statistics use conditional SQL aggregation to minimise database round-trips.
- The webshop settings section renders different fields depending on the product type (coffee, tea, or equipment).

## Implemented By
- Routes: `GET /api/products/:id`, `GET /api/products/:id/statistics`, `GET /api/products/:id/monthly-sales`, `GET /api/products/:id/yearly-sales`, `GET /api/products/:id/stock-movements`, `GET /api/products/:id/sales-prices`, `GET /api/products/:id/buying-prices`, `GET /api/products/:id/components`, `GET /api/products/:id/webshop-details`, `PATCH /api/products/:id/webshop-details`
- Services: `server/productService.ts`, `server/stockMovementService.ts`, `server/customerService.ts`
- Components: `client/src/pages/admin/ProductDetail.tsx`, `client/src/components/admin/SalesPriceDialog.tsx`, `client/src/components/admin/BuyingPriceDialog.tsx`, `client/src/components/admin/BlendComponentDialog.tsx`, `client/src/components/admin/RichTextEditor.tsx`
