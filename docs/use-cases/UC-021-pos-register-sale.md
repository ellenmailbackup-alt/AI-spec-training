# UC-021: Register POS Sale

The cashier browses products, builds a transaction, collects payment, and confirms the sale — all in one continuous flow. The system records the sale, adjusts stock levels, prints or displays a receipt, and resets for the next transaction.

## Metadata
- **Domain:** Sales / POS
- **Primary Actor:** POS User / Cashier
- **Secondary Actors:** None
- **Priority:** Must
- **Status:** Approved
- **Interface:** POS Terminal

## Preconditions
- Cashier is authenticated
- Products exist with at least one sales price unit marked as a POS item. A POS short name (Dutch) is optional; the system falls back to the standard Dutch product name when no POS short name is set.
- Company details are configured for receipt display (company name, address, VAT number)
- Receipt quotes are available in the system for the rotating quote feature

## Main Flow
1. The cashier opens the POS interface.
2. The system sets the Kruze company customer as the default and displays the POS product grid. Only products that are active, have the POS flag enabled on at least one sales price, and have valid pricing within the current date range are included. Products that do not meet all three criteria are filtered out and never appear in the grid.
3. The cashier selects a product.
4. The system shows available variants (weight and packaging options) with prices.
5. The cashier selects a variant. The system adds the item to the cart with a quantity of one.
6. The cashier repeats steps 3-5 for additional items. To change the quantity of any item, the cashier uses the cart panel (AF-2).
7. The cashier optionally selects an existing customer or quick-registers a new one (extends UC-002 AF-6); otherwise the Kruze company customer remains assigned.
8. If a different customer is selected, the system recalculates prices based on customer-specific pricing (UC-007) or the customer's B2B/B2C type.
9. The system displays the transaction summary: items, quantities, unit prices, line totals, and grand total.
10. The cashier optionally applies a discount (percentage or fixed amount).
11. The system recalculates the total with the discount applied.
12. The cashier proceeds to payment. The system displays the payment dialog with a VAT breakdown per VAT class, the total excluding VAT, and the grand total.
13. The cashier selects banktransfer as the payment method and confirms the sale.
14. The system records the sale with all items and payment atomically.
15. The system adjusts inventory levels for each sold product.
16. If a Star printer is connected and the payment included cash (AF-6), the system opens the cash drawer automatically.
17. The system fetches the completed receipt data from the server. If a Star printer is connected, the system prints the receipt automatically. If the printer is unavailable or not connected, the system notifies the cashier and continues without blocking.
18. The system displays the receipt on screen with company details, line items, VAT breakdown, payment information, and a rotating quote. The cashier can optionally print via browser print.
19. The cashier closes the receipt. The system resets the cart, removes any discount, and reverts to the Kruze company customer for the next transaction.

## Alternative Flows
- **AF-1: Search Product** — At step 3, the cashier searches for a product by name instead of browsing the grid. The system filters the product list to match. The cashier selects a result and the flow continues at step 4.
- **AF-2: Change Quantity** — At step 6, in the cart panel, the cashier adjusts the quantity of an already-added item using the increment/decrement controls. The system recalculates the line total and grand total. This is the only place where quantity is changed, regardless of how the item was added (variant selection or single-variant auto-add). The flow continues at step 6.
- **AF-3: Remove Item** — At step 6, the cashier removes an item from the cart panel. The system recalculates the grand total. The flow continues at step 6.
- **AF-4: Apply Percentage Discount** — At step 10, the cashier enters a percentage discount (e.g., 10%). The system calculates the discount amount from the subtotal and the flow continues at step 11.
- **AF-5: Apply Fixed Discount** — At step 10, the cashier enters a fixed EUR amount as discount. The system applies it and the flow continues at step 11.
- **AF-6: Cash Payment** — At step 13, the cashier selects cash as the payment method. The system displays a tendered-amount input. The cashier enters the amount received from the customer. The system calculates and displays the change due. The cashier confirms and the flow continues at step 14.
- **AF-7: Split Payment** — At step 13, the cashier selects split payment. The system presents two payment-method selectors, each with an amount field. The cashier chooses a method and enters an amount for each portion (e.g., EUR 20,00 cash + EUR 15,00 banktransfer). The system enforces that the two amounts together equal the sale total. The cashier confirms and the flow continues at step 14.
- **AF-8: Cancel Transaction** — At any point before step 13, the cashier cancels the current transaction. All items are cleared, any discount is removed, and the system reverts to the Kruze company customer. The use case ends.
- **AF-9: Filter by Category** — At step 3, the cashier selects a product type tab (e.g., Coffee, Tea) to narrow the product grid to that category. If the selected type has subtypes, a second row of tabs appears for further filtering. The cashier selects "All" to reset. The flow continues at step 3.
- **AF-10: Single Variant Auto-Add** — At step 3, if the selected product has only one active POS variant configured, the system skips the variant selection dialog (step 4) and adds the item directly to the cart with that variant and a quantity of one. The behaviour after adding is identical to the multi-variant path: the cashier adjusts quantity in the cart panel if needed (AF-2). The flow continues at step 6.

## Exception Flows
- **EF-1: Payment Mismatch** — In a split payment (AF-7), the two amounts do not equal the sale total. The system prevents confirmation until they match.
- **EF-2: Empty Cart** — At step 12, no items are in the cart. The system prevents proceeding to payment.
- **EF-3: Recording Failure** — At step 14, the system fails to record the sale. The transaction is rolled back, nothing is saved, and the cashier is notified with an error message. The cart remains intact so the cashier can retry.
- **EF-4: Insufficient Cash** — In a cash payment (AF-6), the cashier enters a tendered amount less than the sale total. The system prevents confirmation until the tendered amount is sufficient.
- **EF-5: Printer Unavailable** — At step 17, the Star printer is offline or encounters an error during auto-print. The system notifies the cashier with a warning and continues to step 18. The receipt is still displayed on screen and browser printing remains available. The sale itself is not affected.

## Postconditions
- Sale record exists with status "paid".
- All line items are stored with product, quantity, price, and discount information.
- Payment records are stored with method and amount.
- Inventory levels are adjusted for each sold product.
- For B2B customers, an invoice number is generated and assigned to the sale.
- Receipt data is available for retrieval and printing.
- The transaction is visible in the Admin sales list.

## Business Rules
- **BR-1:** POS sales use the POS-specific sale creation flow (not the admin flow).
- **BR-2:** POS pricing uses the hierarchy: customer-specific price (if valid) -> B2B price (if B2B customer) -> B2C price (default).
- **BR-3:** When no customer is selected, the sale is recorded against the Kruze company customer with B2C pricing.
- **BR-4:** Product variants in POS represent weight and packaging options from active sales prices marked as POS items.
- **BR-5:** Discounts can be percentage-based or fixed-amount.
- **BR-6:** The total of all payments must exactly equal the discounted sale total.
- **BR-7:** Inventory adjustments are created automatically for each line item (reason type: SALE). The adjustment quantity is calculated as the number of units multiplied by the product weight — for coffee and tea this is weight-based (e.g., 3 bags of 250g = 0.75 kg deducted), for accessories where weight equals 1 the adjustment is effectively unit-based.
- **BR-8:** B2C POS sales are directly marked as paid without an invoice number. B2B POS sales automatically receive an invoice number generated via the invoice numbering system.
- **BR-9:** When a product+variant combination that already exists in the cart is added again, the system increments the existing line's quantity by one instead of creating a duplicate line.
- **BR-10:** VAT is calculated per line item based on the product VAT class.
- **BR-11:** Every item enters the cart with a quantity of one. The variant selection dialog is for choosing a variant only and never includes a quantity input. Quantity management is performed exclusively in the cart panel, providing a single consistent interaction pattern regardless of how the item was added.

## Presentation Guidelines
- **PG-1:** Products with multiple active POS variants must display a visual indicator (e.g., a small badge or icon) on their tile in the product grid, so the cashier can see at a glance which products will open the variant selection dialog and which will add directly to the cart.

## Implementation Notes
- Pricing resolution is performed server-side via `posService.ts`.
- Product variants are derived from `salesPrices` records where `posItem = true` and the date range is valid.
- Sale creation, line items, payment entries, and inventory adjustments are all persisted atomically in a single database transaction — if any step fails, none are saved.
- Inventory adjustments are recorded as negative-quantity stock movements of reason type SALE; the quantity formula is `-(amount * weight)`.
- The default Kruze company customer is loaded on POS startup and after each completed transaction.
- Receipt data includes company details, VAT breakdown, and a rotating quote selected by category (coffee, tea, or general) based on the customer's purchase history.
- Receipt printing supports Star mPOP thermal printers via the Web Bluetooth API. Browser `window.print()` is available as a fallback when no Star printer is connected.

## Implemented By
- Routes: `GET /api/pos/products`, `GET /api/pos/products/:id/variants`, `GET /api/pos/customers/guest`, `GET /api/pos/customers/search`, `POST /api/pos/customers/register`, `POST /api/pos/sales`, `GET /api/pos/sales/:id/receipt`, `GET /api/pos/reports/daily`
- Services: `server/posService.ts` (handles both business logic and data access for POS operations)
- Printer services: `client/src/services/starPrinter.ts` (Web Bluetooth connection to Star mPOP), `client/src/services/receiptPrinter.ts` (receipt formatting and printing)
- Components: `client/src/pages/pos/POSPage.tsx`, `client/src/components/pos/ProductGrid.tsx`, `client/src/components/pos/ShoppingCartPanel.tsx`, `client/src/components/pos/VariantSelectionDialog.tsx`, `client/src/components/pos/DiscountDialog.tsx`, `client/src/components/pos/PaymentDialog.tsx`, `client/src/components/pos/ReceiptDialog.tsx`, `client/src/components/pos/CustomerSelectionDialog.tsx`, `client/src/components/pos/PrinterSettingsDialog.tsx`
