# UC-025: Checkout and Online Payment

A webshop visitor completes a purchase by providing their order details and paying through the payment provider. The system records the order and notifies the customer of the outcome by email.

## Metadata
- **Domain:** Sales / Finance / E-Commerce
- **Primary Actor:** Webshop Visitor
- **Secondary Actors:** Payment Provider (Mollie), Email Service (Resend)
- **Priority:** Must
- **Status:** Approved
- **Interface:** Storefront (Webshop)

## Preconditions
- Cart contains at least one item
- Shipping cost has been calculated
- Payment provider integration is configured

## Main Flow
1. The visitor proceeds from the cart to checkout.
2. The system asks for the order details: customer information (name, email, phone), billing address (street, city, postal code, country), shipping address (same as billing or separate), and optional company details (company name, VAT number).
3. The system pre-fills known details if the visitor is a registered and logged-in customer.
4. The visitor provides all required information and reviews the order summary.
5. The visitor confirms the order to proceed to payment.
6. The system validates all provided information.
7. The system records the order with a pending payment status.
8. The system initiates the payment process with the payment provider using the order total.
9. The system redirects the visitor to the payment provider's page.
10. The visitor completes payment on the payment provider's page, selecting their preferred payment method (iDEAL, Bancontact, credit card, etc.).
11. The payment provider notifies the system of the payment result.
12. The system receives the notification and adjusts the order status to reflect the outcome (paid or failed).
13. The payment provider redirects the visitor back to the order confirmation page.
14. The system shows the order confirmation with the order number and details.
15. The system sends an order confirmation email to the customer.

## Alternative Flows
- **AF-1: Payment Failed** — The payment provider reports a payment failure. The system shows an error page with the option to retry.
- **AF-2: Payment Pending** — Some payment methods (e.g. bank transfer) have delayed confirmation. The order remains in a pending state until confirmation arrives.
- **AF-3: Authenticated Customer** — A logged-in customer's address and contact details are pre-filled from their profile.
- **AF-4: B2B Customer** — Company name and VAT number are captured for B2B invoicing.

## Exception Flows
- **EF-1: Validation Error** — Required fields are missing or invalid. The system highlights the errors and prevents the visitor from proceeding.
- **EF-2: Payment Provider Error** — The payment session cannot be initiated. The system shows an error and allows the visitor to retry.
- **EF-3: Notification Failure** — The payment provider's notification cannot reach the system. The order remains in a pending state until manually resolved.
- **EF-4: Session Expired** — The payment session at the provider expires. The system initiates a new session if the visitor retries.

## Postconditions
- An order record exists with all customer and item details.
- Payment is processed through the payment provider.
- Order status reflects the payment result (paid, pending, or failed).
- The customer receives an order confirmation email.
- The order is visible in the admin sales and orders list.

## Business Rules
- **BR-1:** All online payments go through Mollie — no direct payment processing.
- **BR-2:** Supported payment methods include: iDEAL, Bancontact, credit card, PayPal, and bank transfer.
- **BR-3:** An order is only fulfilled after successful payment confirmation.
- **BR-4:** Shipping cost is included in the payment total.
- **BR-5:** Order confirmation emails are sent via the Resend email service.
- **BR-6:** Webshop orders are a separate entity from admin-created sales but are visible in the admin interface.
- **BR-7:** VAT is calculated per item based on the product's VAT class.
- **BR-8:** All amounts are in EUR.

## Implementation Notes
- Payment sessions are created via the Mollie API; the order total is passed at session creation time.
- Payment outcome is communicated via a webhook callback from Mollie to the system.
- The order record is created before the visitor is redirected to the payment provider so an order number is available regardless of payment outcome.

## Implemented By
- Routes: `POST /api/checkout/create`, `POST /api/checkout/webhook`, `GET /api/checkout/order/:orderNumber`, `GET /api/checkout/customer-data`
- Services: `server/checkoutService.ts`
- Components: `client/src/pages/storefront/Checkout.tsx`, `client/src/pages/storefront/OrderConfirmation.tsx`
- Storage: `storage.createWebshopOrder()`, `storage.updateWebshopOrder()`, `storage.getWebshopOrder()`
