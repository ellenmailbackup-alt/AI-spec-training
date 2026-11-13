# UC-030: Calculate Dynamic Shipping Cost

The system determines the applicable shipping cost for a visitor's cart based on their destination and order value. The calculated cost is shown in the cart and carried into the checkout total.

## Metadata
- **Domain:** Sales / E-Commerce / Finance
- **Primary Actor:** Webshop Visitor
- **Secondary Actors:** None
- **Priority:** Must
- **Status:** Approved
- **Interface:** Storefront (Webshop)

## Preconditions
- Cart contains at least one item.
- Shipping configuration is set up (thresholds, free postal codes).

## Main Flow
1. The visitor views their shopping cart.
2. The visitor provides their postal code and country.
3. The system determines the shipping cost: if the postal code appears on the free shipping list, shipping is free; otherwise, if the cart total exceeds the free shipping threshold, shipping is free; otherwise, the system applies the rate for the destination country based on the order weight and value.
4. The system shows the calculated shipping cost in the cart and adjusts the grand total accordingly.

## Alternative Flows
- **AF-1: Domestic Shipping (Belgium)** — The destination is in Belgium and no free shipping condition applies. The standard Belgian shipping rate is used.
- **AF-2: EU Shipping** — The destination is outside Belgium but within the EU and no free shipping condition applies. A higher rate for EU destinations is used.
- **AF-3: Free Shipping** — The order qualifies for free shipping via either the postal code list or the order value threshold. A shipping cost of €0 is shown.

## Exception Flows
- **EF-1: Unknown Postal Code** — The postal code is not in the free shipping list. The standard rate for the destination country is applied.
- **EF-2: Missing Address** — No postal code has been provided. The system shows a default shipping estimate until the visitor provides their address.

## Postconditions
- The shipping cost is calculated and visible to the visitor.
- The shipping cost is included in the checkout total passed to the payment provider.
- The shipping cost is recorded with the order upon checkout.

## Business Rules
- **BR-1:** Free shipping applies if the postal code is on the configured free list (see UC-015).
- **BR-2:** Free shipping applies if the cart total exceeds the configured threshold.
- **BR-3:** Shipping cost is calculated per order, not per item.
- **BR-4:** Shipping calculation is available without authentication.
- **BR-5:** The shipping cost is stored with the webshop order upon checkout.

## Implementation Notes
- Shipping calculation is a public endpoint requiring no session.
- Free postal codes and the free shipping threshold are maintained as system parameters (see UC-015).

## Implemented By
- Routes: `GET /api/webshop/shipping-cost`
- Services: `server/shippingService.ts`
- Components: `client/src/pages/storefront/Cart.tsx`, `client/src/pages/storefront/Checkout.tsx`
- Storage: `storage.getFreeShippingPostalCodes()`, `storage.getParameter('free_shipping_threshold')`
