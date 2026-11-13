# UC-036: Discover Storefront via Search Engines

The KRUZE webshop is made discoverable by search engines through proper page metadata, structured product information, a sitemap, and crawler directives, so that potential customers can find the shop and its products through organic search results.

## Metadata
- **Domain:** E-Commerce / Marketing
- **Primary Actor:** Search Engine Crawler, Website Visitor
- **Secondary Actors:** None
- **Priority:** Should
- **Status:** Draft
- **Interface:** Storefront (Webshop)

## Preconditions
- The storefront is publicly accessible without authentication.
- Products exist with webshop visibility enabled, including names, descriptions, images, and prices.
- Product categories are configured with names and images.

## Main Flow
1. A search engine crawler requests the robots directives for the storefront.
2. The system provides a robots file that permits crawling of all public storefront pages (homepage, product categories, product detail pages, informational pages) and blocks access to the admin area, POS area, shopping cart, checkout, and customer account pages.
3. The crawler requests the XML sitemap.
4. The system generates and returns a sitemap listing all public storefront URLs: the homepage, each product category page, each webshop-visible product detail page, and all static informational pages (About Us, Contact, Workshops, Meeting Room, Professional). Each URL includes the date it was last modified.
5. The crawler visits a storefront page.
6. The system serves the page with complete metadata: a descriptive page title, a meta description summarizing the page content, a canonical URL, Open Graph tags (title, description, image, URL, type), and Twitter Card tags (card type, title, description, image).
7. On a product detail page, the system additionally embeds structured product data describing the product name, description, image, price, currency, and availability.
8. On the homepage, the system embeds structured organization data describing the KRUZE business name, logo, and website URL.
9. On category and product pages, the system embeds structured breadcrumb data showing the navigation path (e.g., Home, Coffee, Product Name).
10. A website visitor finds a KRUZE product or page in their search engine results.
11. The visitor selects the search result and arrives at the corresponding storefront page with all information matching what was previewed in the search results.

## Alternative Flows
- **AF-1: Social Media Sharing** — A visitor shares a storefront link on social media. The platform reads the Open Graph and Twitter Card tags to generate a rich preview card with the page title, description, and image.
- **AF-2: Direct Product Link** — A visitor arrives at a product detail page directly from a search result. The system shows the full product page with all metadata and structured data intact, without requiring navigation from the homepage.

## Exception Flows
- **EF-1: Product Removed** — A crawler or visitor follows a previously indexed link to a product that has been removed or hidden from the webshop. The system returns a not-found response so the search engine can de-index the page.
- **EF-2: Missing Product Image** — A product has no image uploaded. The system uses a default placeholder image in the metadata and structured data rather than omitting the image field.

## Postconditions
- All public storefront pages are discoverable and indexable by search engines.
- Search result listings display meaningful titles, descriptions, and images.
- Product pages appear with rich product information in search results (price, availability).
- Private areas of the application (admin, POS, cart, checkout, account) are excluded from search engine indexes.

## Business Rules
- **BR-1:** Only webshop-visible products are included in the sitemap and receive product structured data.
- **BR-2:** The canonical URL for each page is its full, absolute URL without query parameters or fragments.
- **BR-3:** Page titles follow the pattern "[Page Name] | KRUZE Coffee & Tea" for consistency in search results.
- **BR-4:** Meta descriptions are kept under 160 characters to avoid truncation in search results.
- **BR-5:** Product structured data includes the B2C webshop price in EUR.
- **BR-6:** The sitemap is regenerated or served dynamically so that newly added or removed products are reflected without manual intervention.
- **BR-7:** The robots file explicitly disallows: /admin, /pos, /cart, /checkout, /account, and any other non-public paths.
- **BR-8:** Each storefront page uses a proper heading hierarchy (one primary heading per page, logically nested subheadings) to support both accessibility and search engine understanding.

## Implementation Notes
- Meta tags and structured data (JSON-LD) are rendered client-side using a React head management library (e.g., react-helmet-async or a custom hook that updates document.head).
- The XML sitemap endpoint (`/sitemap.xml`) should query webshop-visible products and static page paths, returning valid XML in the Sitemap Protocol format.
- The `robots.txt` is served as a static file or a simple route returning plain text.
- Structured data schemas follow schema.org vocabulary: `Product`, `Organization`, and `BreadcrumbList`.
- Open Graph type should be `og:type = "product"` on product pages and `og:type = "website"` on other pages.

## Implemented By
- Routes: Not yet implemented
- Services: Not yet implemented
- Components: Not yet implemented
- Storage: Not yet implemented
