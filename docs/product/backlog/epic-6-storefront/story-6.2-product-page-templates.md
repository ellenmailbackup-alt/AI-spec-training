# Story 6.2 — Product Page Templates

## User Story 6.2.1: Coffee Product Page Template

**As a** customer
**I want to** view detailed coffee information
**So that** I can understand origin, flavor, and brewing recommendations

**Priority:** HIGH
**Estimate:** 8 story points

**Acceptance Criteria:**
- [ ] Route: `/shop/products/:slug`
- [ ] Coffee template layout:
  1. **Hero Section:**
     - Image gallery (main + thumbnails)
     - Product name and origin
     - Price (B2C with VAT)
     - Short description
     - Quantity/unit selector (250g, 500g, 1kg)
     - "Add to Cart" button
     - Stock availability
  2. **Tabs:**
     - About: Full description, story
     - Tasting Notes: Flavor profile chart
     - Specifications: Origin, variety, process, altitude, roast
     - Brewing Guide: Brew methods with parameters
     - Reviews: Customer reviews (future)
  3. **Sidebar:**
     - Badges (organic, fair trade)
     - Shipping info
     - Returns policy
  4. **Related Products:** "You might also like"
- [ ] Responsive (mobile, tablet, desktop)
- [ ] Breadcrumbs: Home > Coffee > [Product Name]
- [ ] SEO meta tags
- [ ] Structured data (JSON-LD)
- [ ] Language switching

**Technical Implementation:**
- Component: CoffeeProductPage
- API: GET `/api/products/slug/:slug?lang=nl`
- Image Gallery: react-image-gallery
- Flavor Chart: recharts radar chart

**Dependencies:** User Story 6.1.1, 6.1.2, 6.1.3

**Testing Notes:**
- Test with different slugs
- Test image gallery
- Test quantity/unit selection
- Test language switching
- Test SEO/structured data
- Test responsive layout
- Test "Add to Cart"

---

## User Story 6.2.2: Tea Product Page Template

**As a** customer
**I want to** view detailed tea information
**So that** I can learn about tea type, brewing, and benefits

**Priority:** HIGH
**Estimate:** 6 story points

**Acceptance Criteria:**
- [ ] Tea template layout:
  1. **Hero Section:** Similar to coffee
     - Quantity selector (50g, 100g, 250g, 500g)
  2. **Tabs:**
     - About: Description, tea garden info
     - Flavor Profile: Tasting notes, aroma, color
     - Specifications: Origin, grade, harvest, oxidation, caffeine
     - Brewing Guide: Temperature, steep time, quantity
     - Health Benefits: Caffeine, antioxidants
     - Reviews
  3. **Sidebar:**
     - Certifications
     - Serving suggestions
     - Pairing recommendations
- [ ] Unique design (greens, light colors)
- [ ] Brewing guide with visual icons
- [ ] Different structured data for tea

**Technical Implementation:**
- Component: TeaProductPage
- Template selection based on `productTypeId`
- Brewing guide with temperature gauge, timer illustrations

**Dependencies:** User Story 6.2.1

**Testing Notes:**
- Test tea-specific content
- Test brewing guide visuals
- Test health benefits section
- Test responsive layout

---

## User Story 6.2.3: Generic Product Page Template

**As a** customer
**I want to** view equipment, accessories, experiences
**So that** I can browse the full range

**Priority:** MEDIUM
**Estimate:** 4 story points

**Acceptance Criteria:**
- [ ] Generic template for equipment, accessories, experiences, academy
- [ ] Simpler layout:
  1. **Hero:** Image, name, price, description, quantity, CTA
  2. **Content:** Description, features, specifications
  3. **Sidebar:** Highlights, shipping
- [ ] Support for experiences/academy:
  - Date/time selection (future)
  - Location, duration, max participants
- [ ] Support non-physical products

**Technical Implementation:**
- Component: GenericProductPage
- Default fallback for non-coffee, non-tea
- Conditional rendering

**Dependencies:** User Story 6.2.1

**Testing Notes:**
- Test equipment products
- Test accessories
- Test experiences/academy
- Test non-physical products

---

## User Story 6.2.4: Product Template Routing

**As a** developer
**I want to** auto-select correct template by product type
**So that** each category has optimized display

**Priority:** HIGH
**Estimate:** 3 story points

**Acceptance Criteria:**
- [ ] Route `/shop/products/:slug` loads correct template:
  - Coffee (productTypeId = 1) -> CoffeeProductPage
  - Tea (productTypeId = 2) -> TeaProductPage
  - Else -> GenericProductPage
- [ ] Shared components:
  - ImageGallery, AddToCartSection, RelatedProducts, Breadcrumbs, SEOHead
- [ ] 404 if product not found/unpublished

**Technical Implementation:**
```tsx
export default function ProductPage({ slug }) {
  const { data: product } = useQuery({ queryKey: [`/api/products/slug/${slug}`] });
  if (!product) return <ProductNotFound />;

  switch (product.productType.name) {
    case 'coffee': return <CoffeeProductPage product={product} />;
    case 'tea': return <TeaProductPage product={product} />;
    default: return <GenericProductPage product={product} />;
  }
}
```

**Dependencies:** User Story 6.2.1, 6.2.2, 6.2.3

**Testing Notes:**
- Test routing
- Test 404 for invalid slugs
- Test unpublished products
- Test shared components
