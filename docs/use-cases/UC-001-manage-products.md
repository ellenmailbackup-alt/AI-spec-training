# UC-001: Manage Products

Allows the admin to maintain the product catalogue by adding, changing, and removing products. Products form the basis for all sales, pricing, and inventory tracking in the system.

## Metadata
- **Domain:** Product
- **Primary Actor:** Admin
- **Secondary Actors:** None
- **Priority:** Must
- **Status:** Approved
- **Interface:** Admin Dashboard

## Preconditions
- Admin is authenticated and has admin privileges
- Product types, subtypes and VAT classes are configured in the system
- At least one supplier is configured in the system

## Main Flow
1. The admin requests an overview of the Products from Admin pannel.
2. The system shows a searchable, sortable list of all products with columns: ID, picture, name (EN), name (NL), category, sub-category, supplier, VAT %, status, and own blend.
3. The admin can search the list by product name (English or Dutch) or product ID.
4. The admin indicates they want to add a new product.
5. The system asks for the product details: name (EN), name (NL), POS short name (optional), product type, product subtype (optional, filtered by selected type), supplier, VAT class, status (default: Active), WooCommerce product ID (optional), supplier product ID (optional), own blend (default: No), and an optional product image.
6. The admin provides the product details.
7. **Extension point: Attach Image** — The admin may optionally attach a product image (extends UC-029).
8. The system verifies the information is complete and valid (name, product type, supplier, VAT class, and status are required).
9. The system records the new product.
10. The system shows the new product in the list.

## Alternative Flows
- **AF-1: Edit Product** — The admin selects an existing product, changes the desired fields, and saves. The system applies the changes. The admin may also attach or replace an image (extends UC-029).
- **AF-2: Delete Product** — The admin chooses to remove a product. The system checks whether the product has associated sales records. If none exist, the product is removed. If sales exist, removal is blocked with an explanatory message.
- **AF-3: Sort List** — The admin clicks a column header to sort the product list by that column (ID, name, category, sub-category, supplier, VAT %, status, or own blend).

## Exception Flows
- **EF-1: Duplicate Product Name** — The system allows duplicate names but warns the admin.
- **EF-2: Delete with Sales** — The system prevents removal and shows "Cannot delete product with existing sales" message.

## Extension Points
- **Attach Image** (step 7, AF-1) — Extended by UC-029: Manage Media Library. The admin can upload a new image or select one from the media library.

## Postconditions
- The product is registered in the system with all configured attributes.

## Business Rules
- **BR-1:** Products cannot be removed if they have associated sales records.
- **BR-2:** Each product belongs to exactly one product type and optionally one subtype.
- **BR-3:** Products have a VAT class that determines the applicable tax rate (6% or 21%).
- **BR-4:** Product subtype options are filtered based on the selected product type.

## Implementation Notes
- The product list supports pagination with configurable page sizes (10, 25, 50, 100 items; default 25).

## Implemented By
- Routes: `GET /api/products`, `GET /api/products/:id`, `POST /api/products`, `PATCH /api/products/:id`, `DELETE /api/products/:id`
- Services: `server/productService.ts`
- Components: `client/src/pages/admin/Products.tsx`
- Storage: `storage.getProducts()`, `storage.getProduct()`, `storage.createProduct()`, `storage.updateProduct()`, `storage.deleteProduct()`
