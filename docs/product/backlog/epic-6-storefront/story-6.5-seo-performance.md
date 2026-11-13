# Story 6.5 — SEO & Performance

## User Story 6.5.1: SEO Optimization

**As a** business owner
**I want to** optimize for search engines
**So that** customers discover us via Google

**Priority:** MEDIUM
**Estimate:** 5 story points

**Acceptance Criteria:**
- [ ] Dynamic meta tags: title, description, Open Graph, Twitter Card
- [ ] Canonical URLs
- [ ] XML sitemap (`/sitemap.xml`)
- [ ] Robots.txt (`/robots.txt`)
- [ ] Structured data (JSON-LD): Product, Organization, Breadcrumb
- [ ] Alt text on images
- [ ] Semantic HTML (heading hierarchy)
- [ ] Internal linking (breadcrumbs, related products)
- [ ] Performance: lazy loading, code splitting, minification
- [ ] Mobile-friendly
- [ ] HTTPS enforced

**Technical Implementation:**
- Meta tags: react-helmet
- Sitemap: generate from products/pages
- Structured data: JSON-LD in page `<head>`

**Dependencies:** User Story 6.1.1, 6.2.1-6.2.3

**Testing Notes:**
- Test meta tags
- Test structured data (Google Rich Results)
- Test sitemap validity
- Test page speed (PageSpeed Insights)
- Test mobile-friendliness

---

## User Story 6.5.2: Analytics Integration

**As a** business owner
**I want to** track visitors and conversions
**So that** I can optimize for sales

**Priority:** MEDIUM
**Estimate:** 3 story points

**Acceptance Criteria:**
- [ ] Google Analytics 4 integration
- [ ] Track: page views, product views, add to cart, checkout, purchase, searches
- [ ] Google Tag Manager (optional)
- [ ] Cookie consent banner (GDPR)
- [ ] Privacy policy updated

**Technical Implementation:**
- Library: react-ga4
- Events:
```tsx
ReactGA.event({ category: 'Ecommerce', action: 'Product View', label: product.name });
ReactGA.event({ category: 'Ecommerce', action: 'Add to Cart', label: product.name });
```

**Dependencies:** None

**Testing Notes:**
- Test GA4 events
- Test cookie consent
- Test events in dashboard
- Test GDPR compliance
