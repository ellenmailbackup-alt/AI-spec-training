# UC-024: Manage Shopping Cart

Visitors and registered customers build and adjust their shopping cart by adding products with their chosen options, changing quantities, and reviewing totals including dynamically calculated shipping costs before proceeding to checkout.

## Metadata
- **Domain:** Sales / E-Commerce
- **Primary Actor:** Webshop Visitor, Registered Customer
- **Secondary Actors:** None
- **Priority:** Must
- **Status:** Approved
- **Interface:** Storefront (Webshop)

## Preconditions
- Visitor is on the storefront
- At least one product is available for purchase

## Main Flow
1. The visitor views a product and selects options (grind size, quantity).
2. The visitor adds the product to their shopping cart.
3. The system adds the item to the shopping cart with the selected options and current price.
4. The system updates the cart indicator with the new item count.
5. The visitor opens the cart page.
6. The system displays all cart items with their product name, options, quantity, unit price, and line total.
7. The system calculates and displays the subtotal, shipping cost (calculated dynamically), and grand total.
8. The visitor adjusts the cart as needed before proceeding to checkout.

## Alternative Flows
- **AF-1: Update Quantity** — The visitor changes the quantity of an item in the cart. The system recalculates all totals.
- **AF-2: Remove Item** — The visitor removes an item from the cart. The system recalculates all totals.
- **AF-3: Apply Promo Code** — The visitor provides a promotional code. The system validates and applies the discount.
- **AF-4: Free Shipping Eligible** — The cart total exceeds the free shipping threshold or the delivery postal code qualifies. The system sets the shipping cost to €0.
- **AF-5: Continue Shopping** — The visitor returns to the catalogue to add more items.

## Exception Flows
- **EF-1: Invalid Promo Code** — The system shows an "Invalid promo code" message. The cart total remains unchanged.
- **EF-2: Product No Longer Available** — A product in the cart has been removed from the webshop. The system notifies the visitor.

## Postconditions
- The cart contains the selected products with correct pricing and options.
- Shipping cost is calculated based on cart contents and delivery destination.
- The cart is ready for checkout (UC-025).

## Business Rules
- **BR-1:** The cart is managed in the visitor's browser — no server-side cart storage is used.
- **BR-2:** Shipping cost is calculated dynamically based on postal code, country, total weight, and order value.
- **BR-3:** Orders above the free shipping threshold receive free shipping.
- **BR-4:** Specific postal codes qualify for free shipping regardless of order value (configured in UC-015).
- **BR-5:** Grind size selection is stored per item for coffee products.
- **BR-6:** Prices are locked at the time of adding to cart and are not recalculated on subsequent page loads.

## Implementation Notes
- Shipping cost is the only cart-related value fetched from the server; all other cart state is managed client-side in React context and persisted to localStorage.

## Implemented By
- Routes: `GET /api/webshop/shipping-cost` (dynamic calculation)
- Services: `server/shippingService.ts`
- Components: `client/src/pages/storefront/Cart.tsx`, cart state management in React context
- Storage: Client-side only (localStorage/React state)
