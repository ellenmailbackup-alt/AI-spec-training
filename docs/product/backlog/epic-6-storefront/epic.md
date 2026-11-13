# Epic 6 — Storefront Website (E-commerce Frontend)

**Goal:** Build a complete multilanguage storefront with product pages, shopping experience, and different templates for Coffee, Tea, and other products

**Priority:** HIGH - Customer-facing website for online sales

**Context:** Homepage already exists (Shop.tsx), now need product catalog, individual product pages, and backend content management

**Total Estimated Points:** ~100 points

## Stories

| Story | Title | Points | Status |
|-------|-------|--------|--------|
| [Story 6.1](story-6.1-product-content-management.md) | Product Content Management (Backend) | 26 | Partial — basic webshop fields exist, missing slug/SEO/media/translations/admin UI |
| [Story 6.2](story-6.2-product-page-templates.md) | Product Page Templates | 21 | Partial — single product page works, missing slug routing + dedicated templates |
| [Story 6.3](story-6.3-shopping-experience.md) | Shopping Experience | 37 | Partial — cart + checkout + Mollie work; missing search, discounts, DB cart |
| [Story 6.4](story-6.4-multilanguage.md) | Multilanguage Infrastructure | 8 | Not Started — no i18n, no translations table, no language switcher |
| [Story 6.5](story-6.5-seo-performance.md) | SEO & Performance | 8 | Not Started — no meta tags, sitemap, structured data, or analytics |

## Dependencies
- Product content fields must be added to the schema before templates can be built
- Multilanguage support (6.1.2) is foundational for all storefront pages
- Shopping cart (6.3.2) is required before checkout (6.3.3)
- Mollie payment integration needed for checkout

## Implementation Order (Recommended)

**Sprint 1: Backend Foundation (Week 1-2)**
- Story 6.1.1: Product Schema Extension (blocking)
- Story 6.1.2: Multilanguage Support (blocking)
- Story 6.1.3: Product Media Gallery (blocking)

**Sprint 2: Content Management (Week 3-4)**
- Story 6.1.4: Product Admin UI
- Story 6.4.1: Language Switcher
- Seed products with content

**Sprint 3: Product Pages (Week 5-6)**
- Story 6.2.1: Coffee Template
- Story 6.2.2: Tea Template
- Story 6.2.3: Generic Template
- Story 6.2.4: Template Routing

**Sprint 4: Shopping - Part 1 (Week 7-8)**
- Story 6.3.1: Product Catalog
- Story 6.3.2: Shopping Cart

**Sprint 5: Shopping - Part 2 (Week 9-10)**
- Story 6.3.3: Checkout Flow (large story)
- Story 6.3.5: Discount Vouchers & Coupon Codes
- Story 6.3.4: Product Search

**Sprint 6: Polish (Week 11-12)**
- Story 6.4.2: Static Content Translation
- Story 6.5.1: SEO Optimization
- Story 6.5.2: Analytics
