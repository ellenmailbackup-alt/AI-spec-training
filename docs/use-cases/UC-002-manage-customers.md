# UC-002: Manage Customers

Allows the admin to maintain the customer base by adding, changing, and removing customer records. Customers are the foundation for sales, pricing, and revenue reporting throughout the system.

## Metadata
- **Domain:** Customer
- **Primary Actor:** Admin
- **Secondary Actors:** None
- **Priority:** Must
- **Status:** Approved
- **Interface:** Admin Dashboard

## Preconditions
- Admin is authenticated and has admin privileges

## Main Flow
1. The admin requests an overview of the Customers from the Admin pannel.
2. The system displays overall customer statistics: total customers, B2B customers, B2C customers, and one-time customers.
3. The system shows a searchable list of all customers with ID, first name, last name, email, phone, B2B client indicator, B2B pricing indicator, and company name.
4. The admin indicates they want to add a new customer.
5. The system asks for the customer details: first name, last name, email, phone, birthday, company name, VAT number, customer type (B2B/B2C), B2B pricing indicator, billing address, and an optional shipping address.
6. The admin provides the customer details and confirms.
7. The system verifies the information is complete and valid (required fields, valid email format).
8. The system records the new customer.
9. The system shows the new customer in the list.

## Alternative Flows
- **AF-1: Edit Customer** — The admin selects an existing customer, changes the desired fields, and saves. The system applies the changes.
- **AF-2: Delete Customer** — The admin chooses to remove a customer. The system asks the admin to confirm the deletion. After confirmation, the system checks for associated sales. If none exist, the customer is removed. Otherwise, removal is blocked with an explanatory message.
- **AF-3: Duplicate Email Warning** — When adding or editing a customer, the system checks whether the email address is already used by another customer. If a duplicate is found, the system warns the admin and gives them the choice to continue or cancel.
- **AF-4: Quick Register Customer from POS** — Extended by UC-021 step 7. The cashier opens the customer selection dialog and chooses to register a new customer. The system presents a minimal form: first name, last name, email, and birthday. The cashier provides the details and confirms. The system validates the email format, registers the customer as B2C (b2bClient = false, b2bPrices = false), and associates the new customer with the current POS transaction. The customer is immediately available for future transactions in both POS and Admin.

## Exception Flows
- **EF-1: Delete with Sales** — The system prevents removal and shows "Cannot delete customer with existing sales" message.
- **EF-2: Invalid Email** — The system rejects the entry when the email address is not in a valid format.
- **EF-3: Duplicate Email** — The provided email already belongs to another customer. The system warns the admin with the existing customer's details. The admin can choose to proceed or cancel.
- **EF-4: Invalid Email (POS)** — During POS quick registration (AF-4), the system rejects an invalid email format and prevents submission.
- **EF-5: Missing Required Fields (POS)** — During POS quick registration (AF-4), the cashier omits a required field (first name, last name, email, or birthday). The system prevents submission until all fields are provided.

## Postconditions
- The customer is registered in the system with contact information, B2B/B2C classification, and — for B2B clients — the applicable pricing indicator.
- The customer is available for selection in sales, POS, and custom pricing.

## Business Rules
- **BR-1:** Customers cannot be removed if they have associated sales records.
- **BR-2:** Customers are classified as either B2B (wholesale) or B2C (retail).
- **BR-3:** B2B clients can optionally have B2B pricing enabled. The B2B pricing flag is only available for customers classified as B2B clients.
- **BR-4:** The customer yearly sales breakdown shows revenue per year for that customer.

## Implementation Notes
- The duplicate email check (AF-3/EF-3) is a warning, not a block — duplicate emails are permitted but require conscious acknowledgement from the admin.

## Implemented By
- Routes: `GET /api/customers`, `GET /api/customers/:id`, `POST /api/customers`, `PATCH /api/customers/:id`, `DELETE /api/customers/:id`, `GET /api/pos/customers/search`, `GET /api/pos/customers/guest`, `POST /api/pos/customers/register`
- Services: `server/customerService.ts`, `server/posService.ts` (POS quick registration)
- Components: `client/src/pages/admin/Customers.tsx`, `client/src/components/pos/CustomerSelectionDialog.tsx` (AF-4)
- Storage: `storage.getCustomers()`, `storage.getCustomer()`, `storage.createCustomer()`, `storage.updateCustomer()`, `storage.deleteCustomer()`
