# UC-015: Configure System Settings

The admin maintains the reference data and configuration values that govern how products, sales, shipping, and other features behave across all interfaces. All reference data is managed from one central area, and changes take effect immediately.

## Metadata
- **Domain:** Operations / Configuration
- **Primary Actor:** Admin
- **Secondary Actors:** None
- **Priority:** Must
- **Status:** Reviewed
- **Interface:** Admin Dashboard

## Preconditions
- Admin is authenticated and has admin privileges.

## Main Flow
1. The admin requests an overview of system settings.
2. The system presents the available configuration sections: suppliers, VAT classes, product types, product subtypes, product units, product locations, inventory statuses, Boeren en Buren product mappings, roast configurations, announcements, grind sizes, and shipping.
3. The admin selects a configuration section.
4. The system presents the current entries for that section, showing the columns described in the Reference Data Sections table below.
5. The admin indicates they want to add a new entry.
6. The system asks for the fields described in the Reference Data Sections table below for the selected section.
7. The admin provides the details and confirms.
8. The system verifies the information is complete and valid, records the entry, and presents the refreshed list.
9. The admin repeats steps 3 through 8 for any additional sections or entries.

## Alternative Flows
- **AF-1: Change an Existing Entry** -- At step 5, instead of adding, the admin selects an existing entry and indicates they want to change it. The system presents the current values. The admin adjusts the desired fields and confirms. The system verifies the changes, records them, and the flow continues at step 8.
- **AF-2: Remove an Entry** -- At step 5, instead of adding, the admin selects an existing entry and indicates they want to remove it. The system asks for confirmation. The admin confirms the removal. The system removes the entry and the flow continues at step 8.
- **AF-3: Assign an Image to a Product Type** -- At step 7, while providing details for a product type, the admin also provides an image. The system stores the image and associates it with the product type. The flow continues at step 8.
- **AF-4: Set the Free Shipping Threshold** -- At step 4, while viewing the shipping section, the admin changes the minimum order amount that qualifies for free shipping. The system records the new threshold. The flow continues at step 8.
- **AF-5: Reorder Entries** -- At step 4, for sections that support ordering (product types, announcements, grind sizes), the admin changes the sort order of entries. The system records the new order. The flow continues at step 8.

## Exception Flows
- **EF-1: Referenced Entry Cannot Be Removed** -- During AF-2, when the system attempts to remove the entry, it detects that the entry is referenced by existing records (e.g., a product type assigned to products, a supplier linked to orders). The system informs the admin that the entry cannot be removed while it is in use. The entry remains unchanged.
- **EF-2: Image Storage Failure** -- At step 8 of AF-3, the image cannot be stored. The system informs the admin that the upload failed. The product type remains without the new image.
- **EF-3: Duplicate Entry** -- At step 8, the system detects that an entry with the same identifying value already exists (e.g., a grind size name or postal code that is already registered). The system informs the admin of the conflict. The entry is not recorded.

## Postconditions
- The reference data is recorded and immediately available across all system interfaces (admin, POS, storefront).

## Business Rules
- **BR-1:** Reference data entries that are referenced by existing records (products, sales, orders, inventory items) cannot be removed.
- **BR-2:** Grind size names must be unique.
- **BR-3:** Free shipping postal codes must be unique.
- **BR-4:** Each product subtype must be linked to an existing product type.
- **BR-5:** Each roast configuration must link a green coffee product to a roasted coffee product; both must exist.
- **BR-6:** VAT class percentage is required and must be a valid decimal value.

## Presentation Guidelines
- **PG-1:** Product types with homepage display enabled and their sort order control the storefront homepage category presentation.
- **PG-2:** Announcement entries marked as active appear on the storefront homepage in their configured sort order.

## Reference Data Sections

| Section | List Columns | Form Fields |
|---------|-------------|-------------|
| Suppliers | ID, name, contact (first + last name), phone, email | Name, contact first name, contact last name, contact phone, contact email |
| VAT Classes | ID, name, percentage | Name, percentage |
| Product Types | ID, name, name (Dutch), image, homepage display toggle, homepage sort order | Name (English), name (Dutch), image |
| Product Subtypes | ID, name, parent product type | Name, product type (selection from existing product types) |
| Product Units | ID, weight, unit label | Weight, unit label (e.g., gram, kg, stuk) |
| Product Locations | ID, name | Name |
| Inventory Statuses | ID, name, description | Name, description |
| Boeren en Buren Mappings | External reference, product name, sales price info | External product reference, sales price (selection from existing sales prices) |
| Roast Configurations | ID, green coffee product name, roasted coffee product name | Green coffee product (selection), roasted coffee product (selection) |
| Announcements | ID, text, link, sort order, active toggle | Text, link (optional), sort order |
| Grind Sizes | ID, name, sort order | Name, sort order |
| Shipping -- Free Shipping Threshold | (single value) | Minimum order amount (incl. VAT) |
| Shipping -- Free Shipping Postal Codes | Postal code, city | Postal code, city (optional) |

## Implementation Notes
- Product type images are stored in cloud object storage; the system manages references to those assets.
- Boeren en Buren product mappings link external supplier references to internal products for the import process (UC-017).
- Roast configurations (green-roasted coffee mappings) define which green coffee maps to which roasted coffee, used during roast recording (UC-012).
- Payment methods and sales statuses are stored as reference tables but are currently not editable through this settings area -- they are read-only lookups consumed by sales and POS features.
- The free shipping threshold is stored as a system parameter (`free_shipping_threshold_incl_vat`).
- Suppliers managed here are the same supplier records used in supplier orders (UC-009).

## Implemented By
- Routes: `/api/settings/suppliers` (GET, POST, PATCH, DELETE), `/api/settings/vat-classes` (GET, POST, PATCH, DELETE), `/api/settings/product-types` (GET, POST, PATCH, DELETE), `/api/settings/product-types/:id/image` (POST), `/api/settings/product-subtypes` (GET, POST, PATCH, DELETE), `/api/settings/product-units` (GET, POST, PATCH, DELETE), `/api/settings/product-locations` (GET, POST, PATCH, DELETE), `/api/settings/product-statuses` (GET, POST, PATCH, DELETE), `/api/settings/roast-configurations` (GET, POST, PATCH, DELETE), `/api/settings/announcements` (GET, POST, PATCH, DELETE), `/api/settings/grind-sizes` (GET, POST, PATCH, DELETE), `/api/settings/free-shipping-postal-codes` (GET, POST, DELETE), `/api/settings/shipping-params` (GET, POST), `/api/settings/payment-methods` (GET), `/api/settings/sales-statuses` (GET), `/api/boeren-import/mappings` (GET), `/api/boeren-import/save-mapping` (POST), `/api/boeren-import/mappings/:reference` (DELETE)
- Services: `server/parameterService.ts` (for free shipping threshold)
- Components: `client/src/pages/admin/Settings.tsx`
- Storage: CRUD methods in `server/storage.ts` for each entity (suppliers, vatClasses, productTypes, productSubtypes, productUnits, productLocations, productItemStatuses, greenRoastedCoffees, announcements, grindSizes, freeShippingPostalCodes)
