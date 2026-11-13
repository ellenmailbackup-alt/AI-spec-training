# UC-023: Browse Storefront Product Catalog

Visitors and registered customers explore the KRUZE online catalogue by navigating product categories and viewing individual product detail pages, allowing them to discover products and their pricing before adding items to the cart.

## Metadata
- **Domain:** Sales / E-Commerce
- **Primary Actor:** Webshop Visitor, Registered Customer
- **Secondary Actors:** None
- **Priority:** Must
- **Status:** Approved
- **Interface:** Storefront (Webshop)

## Preconditions
- Storefront is accessible (public, no authentication required)
- Products exist with webshop visibility enabled
- Product types are configured with images and sort order

## Main Flow
1. The visitor opens the KRUZE webshop homepage.
2. The system displays homepage announcements, featured product categories with images, and navigation links to product categories and information pages.
3. The visitor selects a product category (e.g., "Coffee", "Tea", "Accessories").
4. The system displays all webshop-visible products in that category with their name, image, short description, and price.
5. The visitor selects a product.
6. The system displays the product detail page showing the product name, image, full description, tasting notes, origin, brewing instructions (for coffee and tea), the B2C webshop price, grind size options (for coffee products), and a quantity selector.

## Alternative Flows
- **AF-1: Search Products** — The visitor uses the search function to find products by name or keyword.
- **AF-2: Browse Special Categories** — The visitor opens a special page such as Jura Series (compatible products), Professional (wholesale), or Workshops.
- **AF-3: View Company Pages** — The visitor opens an informational page such as Over Ons (About Us), Contact, or Vergaderzaal (Meeting Room).
- **AF-4: Authenticated Customer** — A logged-in customer views the same catalogue but may see different pricing if they are a B2B account.

## Exception Flows
- **EF-1: Empty Category** — The selected category has no webshop-visible products. The system shows a "No products available" message.
- **EF-2: Product Not Found** — A direct link to a removed product is followed. The system shows a not-found page or redirects to the catalogue.

## Postconditions
- The visitor can view all webshop-enabled products and their details.
- Product information is displayed accurately with current pricing.

## Business Rules
- **BR-1:** Only products marked as webshop-visible appear in the storefront.
- **BR-2:** The webshop default price is shown to anonymous visitors and B2C customers.
- **BR-3:** Product categories are displayed in the configured sort order.
- **BR-4:** Homepage announcements are managed by admins (UC-015).
- **BR-5:** Coffee products show grind size options; non-coffee products do not.
- **BR-6:** Product types with homepage display enabled appear as featured categories.

## Implementation Notes
- The storefront catalogue endpoint filters products by the webshop-visible flag server-side.
- Announcements are fetched from a separate active-announcements endpoint.

## Implemented By
- Routes: `GET /api/webshop/products`, `GET /api/products/:id`, `GET /api/product-types`, `GET /api/homepage-categories`, `GET /api/announcements/active`
- Services: Inline handlers in `server/routes.ts`
- Components: `client/src/pages/storefront/Shop.tsx`, `client/src/pages/storefront/ShopProduct.tsx`, `client/src/pages/storefront/Jura.tsx`
- Storage: `storage.getWebshopProducts()`, `storage.getProductTypes()`, `storage.getAnnouncements()`
