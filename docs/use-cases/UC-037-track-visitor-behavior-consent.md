# UC-037: Track Visitor Behavior with Consent

Visitors to the KRUZE webshop are asked for consent before any tracking takes place. Those who consent have their browsing and purchasing behavior recorded through an analytics service, giving the business owner insight into how customers discover and interact with the shop.

## Metadata
- **Domain:** E-Commerce / Marketing / Compliance
- **Primary Actor:** Website Visitor
- **Secondary Actors:** Analytics Service (Google Analytics 4)
- **Priority:** Should
- **Status:** Draft
- **Interface:** Storefront (Webshop)

## Preconditions
- The storefront is publicly accessible.
- The analytics measurement identifier is configured as an environment variable on the server.
- A privacy/cookie policy page or section exists on the storefront.

## Main Flow
1. A visitor arrives at the KRUZE webshop for the first time.
2. The system checks whether the visitor has previously recorded a consent preference.
3. The system finds no prior preference and displays a cookie consent notice. The notice is styled to match the KRUZE brand and uses a friendly, coffee-themed tone (e.g., "We use cookies -- not the chocolate chip kind"). It presents three choices: accept all cookies, accept essential cookies only, or view detailed information about which cookies are used.
4. The visitor chooses to accept all cookies.
5. The system records the visitor's preference locally so they are not asked again on subsequent visits.
6. The system loads the analytics tracking script using the configured measurement identifier.
7. The visitor browses the storefront. As they navigate, the system sends page view events to the analytics service for each page visited.
8. The visitor views a product detail page. The system sends a product view event including the product name, category, and price.
9. The visitor adds a product to the cart. The system sends an add-to-cart event with the product details and quantity.
10. The visitor proceeds to checkout. The system sends a begin-checkout event with the cart contents and total value.
11. The visitor completes a purchase. The system sends a purchase event with the order number, total amount, and items purchased.
12. The business owner opens the analytics service dashboard at a later time and reviews visitor behavior data: page views, popular products, cart abandonment rates, and completed purchases.

## Alternative Flows
- **AF-1: Essential Cookies Only** — The visitor chooses to accept essential cookies only. The system records this preference and does not load the analytics tracking script. The visitor browses the storefront without any behavior tracking. Essential functionality (cart, authentication) continues to work normally.
- **AF-2: View Cookie Details** — The visitor chooses to view detailed information. The system shows a breakdown of cookie categories: essential cookies (required for the shop to function) and analytics cookies (used to understand visitor behavior). The visitor then makes their choice from this detailed view.
- **AF-3: Returning Visitor with Prior Consent** — A returning visitor arrives who previously accepted all cookies. The system finds the stored preference, skips the consent notice, and immediately loads the analytics tracking script.
- **AF-4: Returning Visitor without Consent** — A returning visitor arrives who previously chose essential only. The system finds the stored preference, skips the consent notice, and does not load the analytics script.
- **AF-5: Change Consent Preference** — A visitor who previously made a choice wants to change their preference. They open the cookie settings through a link in the storefront footer. The system presents the same consent choices. The visitor selects a different option. The system updates the stored preference and either loads or removes the analytics script accordingly.
- **AF-6: Privacy Policy Review** — A visitor opens the privacy/cookie policy page from the footer or from the consent notice. The system displays a clear explanation of what data is collected, how it is used, who it is shared with, and how long it is retained.

## Exception Flows
- **EF-1: Analytics Service Unavailable** — The analytics script fails to load (network error, ad blocker). The storefront continues to function normally. No visitor behavior data is collected for that session.
- **EF-2: Measurement Identifier Not Configured** — The analytics measurement identifier is not set in the environment. The system does not attempt to load the analytics script regardless of consent, and the consent notice is still shown (consent preferences may apply to future analytics or other services).

## Postconditions
- Every visitor has been presented with a clear consent choice before any tracking occurs.
- Visitors who consented have their browsing and purchasing behavior recorded in the analytics service.
- Visitors who declined are not tracked in any way beyond essential functionality.
- The consent preference is remembered for returning visitors.
- The business owner can access visitor behavior reports through the analytics service dashboard.

## Business Rules
- **BR-1:** No analytics tracking script is loaded until the visitor explicitly consents. This is a legal requirement under GDPR.
- **BR-2:** The consent preference is stored locally on the visitor's device, not on the server.
- **BR-3:** Essential cookies (cart contents, authentication tokens) do not require consent and always function.
- **BR-4:** The analytics measurement identifier is read from an environment variable and is never embedded directly in the source code.
- **BR-5:** The consent notice must be clearly visible on first visit but must not completely block the visitor from browsing the storefront.
- **BR-6:** The visitor can change their consent preference at any time through the footer link.
- **BR-7:** E-commerce events sent to the analytics service include: page views, product views, add-to-cart actions, checkout initiation, and completed purchases.
- **BR-8:** The privacy/cookie policy page must explain in plain language what data is collected, the purpose of the analytics cookies, and how the visitor can change their preference.
- **BR-9:** The consent notice uses a warm, on-brand tone consistent with the KRUZE coffee and tea theme.

## Implementation Notes
- Google Analytics 4 is loaded via the `gtag.js` script. The script tag is injected into the document head only after the visitor consents.
- The GA4 measurement ID (format: `G-XXXXXXXXXX`) is provided via the `VITE_GA4_MEASUREMENT_ID` environment variable so Vite includes it in the client bundle.
- Consent preference is stored in `localStorage` under a key like `kruze-cookie-consent` with values such as `all`, `essential`, or `null` (not yet decided).
- E-commerce events follow the GA4 recommended event schema: `page_view`, `view_item`, `add_to_cart`, `begin_checkout`, `purchase`.
- The consent banner component should be rendered at the application root level of the storefront so it appears on every page until a choice is made.
- The footer link to change preferences re-opens the consent banner or navigates to a dedicated settings section.

## Implemented By
- Routes: Not yet implemented
- Services: Not yet implemented
- Components: Not yet implemented
- Storage: Not yet implemented
