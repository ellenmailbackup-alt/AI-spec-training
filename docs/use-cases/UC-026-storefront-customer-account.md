# UC-026: Manage Storefront Account

A registered user opens their account page to view and update their personal information, billing and shipping addresses, and company details. They can also review the orders they have placed and see the products they order most frequently.

## Metadata
- **Domain:** Customer / E-Commerce
- **Primary Actor:** Registered User
- **Secondary Actors:** Authentication Service (Supabase Auth)
- **Priority:** Should
- **Status:** Approved
- **Interface:** Storefront (Webshop)

## Preconditions
- The actor has a registered account and is authenticated (see UC-027 for login and registration flows).

## Main Flow
1. The registered user navigates to their account page.
2. The system displays the account page with three sections: profile information, order history, and most-ordered products.
3. The registered user opens the profile section.
4. The system shows the current profile information: first name, last name, email address, phone number, date of birth, billing address, shipping address, and optional company details (company name, VAT number).
5. The registered user updates one or more fields and saves.
6. The system validates the input and saves the changes. Updated name and address details are used to pre-fill future checkout forms.

## Alternative Flows

### AF-1: Order History
The registered user opens the order history section. The system shows all orders placed by this user across all sales channels (webshop, POS, admin-created), each showing the order number, date, status, and total amount. The user selects an order to expand its details: line items, quantities, shipping cost, and payment status.

### AF-2: Most-Ordered Products
The registered user opens the most-ordered products section. The system shows the six products this user has ordered most frequently, ranked by total quantity ordered. Each product links directly to its product detail page.

### AF-3: Quick Reorder *(not yet implemented — see Backlog Story 7.1.2)*
From the most-ordered products section, the registered user adds a previously purchased product directly to their cart without visiting the product detail page.

### AF-4: Logout
The registered user chooses to sign out. The system ends the session and returns the user to the public storefront. See UC-027 for the full logout flow.

## Exception Flows
- **EF-1: Validation Error** — A submitted profile field contains invalid data (e.g., empty required field). The system highlights the field and shows a descriptive error message. The profile is not saved.
- **EF-2: Expired Session** — The session has expired while the user is on the account page. API requests return 401. The system redirects the user to the login page with a return URL so they can continue after re-authenticating.

## Postconditions
- Profile information is saved and used to pre-fill checkout forms.
- Order history is accessible for reference.

## Business Rules
- **BR-1:** Profile updates (name, address) are reflected in both the user record and the linked customer record to keep them in sync.
- **BR-2:** Profile updates affect future checkout auto-fill but do not modify any past orders.
- **BR-3:** Order history shows all orders placed by this user across all sales channels (webshop, POS, admin-created).
- **BR-4:** The six most-ordered products are calculated from the user's full order history across all sales channels.
- **BR-5:** The email address is managed by the authentication service and cannot be changed from the profile form.
- **BR-6:** Password management is handled entirely by the authentication service (see UC-027).

## Implementation Notes
- Authentication is handled by Supabase Auth using JWT tokens stored in secure HTTP-only cookies.
- The user record (`users` table) and the customer record (`customer` table) are linked by email address. A profile update keeps both in sync atomically via a database transaction.
- A customer record is created automatically on first profile save if one does not yet exist.
- Order history queries the `sales` table (all channels), not the `webshopOrders` table — see Backlog Ticket 7.1.1 for the fix.

## Implemented By
- Routes: `GET /api/account/profile`, `PUT /api/account/profile`, `GET /api/account/orders`, `GET /api/account/top-products`
- Auth routes (registration, login, logout, reset): see UC-027 — implemented in `server/supabaseAuth.ts`
- Services: `customerService.updateAccountProfile()` in `server/customerService.ts`
- Components: `client/src/pages/storefront/Account.tsx`
- Storage: `storage.getUser()`, `storage.getCustomerByEmail()`, inline query on `sales` / `webshopOrders`
