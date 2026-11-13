# UC-016: Manage Product Blends

The admin defines and maintains the recipe for a blend product by specifying which component coffees it contains and their respective percentages. Blend recipes inform roasting operations and product labelling.

## Metadata
- **Domain:** Product
- **Primary Actor:** Admin
- **Secondary Actors:** None
- **Priority:** Should
- **Status:** Reviewed
- **Interface:** Admin Dashboard

## Preconditions
- Admin is authenticated and has admin privileges
- The product is marked as an own blend
- At least one other product exists in the system to serve as a component

## Main Flow
1. The admin navigates to a product that is marked as an own blend.
2. The system shows the blend components section with the current recipe. For each component the system shows: component product name (Dutch and English), percentage, and available actions (change, remove). The system also shows a total percentage across all components.
3. The admin indicates they want to add a component.
4. The system asks for the component details: the component product (from a list of all products except the current blend) and its percentage (0 to 99.99, with two-decimal precision).
5. The admin selects a component product and provides its percentage.
6. The system verifies the information is valid and records the blend component.
7. The system shows the refreshed blend recipe with the new component included and the recalculated total percentage.
8. The admin repeats steps 3 through 7 for any additional components.

## Alternative Flows
- **AF-1: Change Component Percentage** -- At step 3, instead of adding a new component, the admin indicates they want to change an existing component. The system presents the current component product and percentage. The admin adjusts the percentage. The system records the change and the flow continues at step 7.
- **AF-2: Remove Component** -- At step 3, instead of adding a new component, the admin indicates they want to remove an existing component. The system asks the admin to confirm the removal. Upon confirmation, the system removes the component and the flow continues at step 7.

## Exception Flows
None. The admin selects components from the system's own product list, and existing entries are displayed by the system before any action is taken.

## Postconditions
- The blend recipe is stored with the correct component products and percentages
- The blend recipe is visible on the product detail page

## Business Rules
- **BR-1:** Each component percentage must be between 0 and 99.99.
- **BR-2:** A product cannot be added as a component of itself.

## Presentation Guidelines
- **PG-1:** The blend components section is only visible when the product is marked as an own blend.
- **PG-2:** When the total percentage of all components does not equal 100, the system displays an advisory warning. This is not a hard block.

## Implementation Notes
- Component percentage is stored as `decimal(4,2)` -- maximum value 99.99
- The self-reference prevention is only enforced in the frontend (product list filters out the current product). There is no server-side validation preventing a product from being added as its own component.
- Delete confirmation uses browser-native `confirm()` instead of a shadcn AlertDialog, which is inconsistent with the design guidelines.
- No dedicated service layer exists for blend components -- routes operate directly on the database, which is inconsistent with the 3-layer architecture.

## Implemented By
- Routes: `GET /api/products/:productId/components`, `POST /api/product-components`, `PATCH /api/product-components/:id`, `DELETE /api/product-components/:id`
- Services: None (routes access database directly)
- Components: `client/src/pages/admin/ProductDetail.tsx`, `client/src/components/admin/BlendComponentDialog.tsx`
- Storage: None (no storage methods -- routes use inline Drizzle queries)
