# Product Backlog

**Project:** Kruze Coffee & Tea Management System
**Last Updated:** March 23, 2026
**Product Owner:** Kruze Business Owner

> Navigation index -- story and epic details live in the subfolders alongside this file.

## Important Notes

### Reporting Standards
- **All revenue and financial amounts are reported EXCLUDING VAT** unless explicitly stated otherwise
- All calculations, comparisons, and displays use `amount_vat_excl` field

### Business Context
- **Payment Terms:** B2B customers have 15-day payment terms
- **Sales Channels:** B2B, B2C, Webshop, Boeren en Buren (4 channels)
- **Stock Calculation:** Based on 12-month average sales velocity
- **Fiscal Year:** Calendar year (January 1 - December 31)

---

## Epics

| Epic | Title | Stories | Points | Status |
|------|-------|---------|--------|--------|
| [Epic 1](./epic-1-dashboard/epic.md) | Main Dashboard | 9 | ~35 | ~70% Done — 5 stories done, 4 partial (missing schema fields) |
| [Epic 2](./epic-2-invoice-manager/epic.md) | Invoice Manager | 3 | ~18 | Partial |
| [Epic 3](./epic-3-sales-analysis/epic.md) | Sales Analysis (Deep Dive) | 5 | ~20 | Partial — frontend built, API endpoints not wired |
| [Epic 4](./epic-4-inventory/epic.md) | Inventory Dashboard | 3 | ~20 | Partial — service + frontend done, API routes missing |
| [Epic 5](./epic-5-price-calculator/epic.md) | Price Calculator & Cross-Cutting | 4 | ~73 | Partial — 5.1 not started (blocker), 5.2-5.3 partial, 5.4 not started |
| [Epic 6](./epic-6-storefront/epic.md) | Storefront Website | 5 | ~100 | Partial — cart/checkout/Mollie work; missing i18n, SEO, search, templates |
| [Epic 7](./epic-7-storefront-account/epic.md) | Storefront Account | 1 | ~5 | Partial — top products works, order history buggy (ISS-016), reorder missing |
| [Epic 8](./epic-8-customer-pricing/epic.md) | Customer-Specific Pricing | 1 | ~5 | Not Started — backend done, admin UI is placeholder only |

**Total: 31 story groups / ~276 estimated points**

---

## Implementation Order (Recommended)

### Sprint 1: Foundation & Database (Week 1-2)
- [Story 5.1](./epic-5-price-calculator/story-5.1-schema-updates.md): Add Channel Field + Invoice/Payment Dates (blocking)
- [Story 1.2](./epic-1-dashboard/story-1.2-revenue-by-channel.md): Assign Channel to Sales (blocking)

### Sprint 2: Main Dashboard Core (Week 3-4)
- [Story 1.1](./epic-1-dashboard/story-1.1-revenue-overview.md): Revenue Overview YoY
- [Story 1.9](./epic-1-dashboard/story-1.9-dashboard-infrastructure.md): Dashboard API + Frontend

### Sprint 3: Main Dashboard Completion (Week 5-6)
- [Story 1.3](./epic-1-dashboard/story-1.3-monthly-sales-trend.md): Monthly Sales Chart
- [Story 1.4](./epic-1-dashboard/story-1.4-sales-by-category.md): Sales by Category
- [Story 1.5](./epic-1-dashboard/story-1.5-invoice-health.md): Invoice Health
- [Story 1.6](./epic-1-dashboard/story-1.6-stock-alerts.md): Stock Alerts
- [Story 1.7](./epic-1-dashboard/story-1.7-customer-statistics.md): Customer Stats
- [Story 1.8](./epic-1-dashboard/story-1.8-top-performers.md): Top Performers

### Sprint 4: Invoice Manager (Week 7-8)
- [Story 2.1](./epic-2-invoice-manager/story-2.1-invoice-list-view.md): Invoice List View
- [Story 2.2](./epic-2-invoice-manager/story-2.2-invoice-aging.md): Invoice Aging
- [Story 2.3](./epic-2-invoice-manager/story-2.3-invoice-manager-page.md): Invoice Manager Page
- [Story 5.3](./epic-5-price-calculator/story-5.3-navigation-ux.md): Update Navigation

### Sprint 5: Sales Analysis (Week 9-10)
- [Story 3.1](./epic-3-sales-analysis/story-3.1-month-comparison-table.md): Month-by-Month Table
- [Story 3.2](./epic-3-sales-analysis/story-3.2-multi-year-chart.md): Multi-Year Chart
- [Story 3.3](./epic-3-sales-analysis/story-3.3-lifetime-statistics.md): Lifetime Statistics
- [Story 3.4](./epic-3-sales-analysis/story-3.4-channel-performance.md): Channel Trends
- [Story 3.5](./epic-3-sales-analysis/story-3.5-sales-analysis-page.md): Sales Analysis Page

### Sprint 6: Inventory (Week 11-12)
- [Story 4.1](./epic-4-inventory/story-4.1-stock-level-table.md): Stock Level Table
- [Story 4.2](./epic-4-inventory/story-4.2-stock-movement-history.md): Movement History
- [Story 4.3](./epic-4-inventory/story-4.3-inventory-page.md): Inventory Page

### Sprint 7: Optimization (Week 13)
- [Story 5.2](./epic-5-price-calculator/story-5.2-performance-optimization.md): Performance Optimization
- Bug fixes and polish

### Future Sprints
- [Story 5.4](./epic-5-price-calculator/story-5.4-price-calculation-tool.md): Price Calculation Tool (~10 weeks)
- [Epic 6](./epic-6-storefront/epic.md): Storefront Website (~12 weeks)
- [Epic 7](./epic-7-storefront-account/epic.md): Storefront Account

---

## Glossary

- **VAT Excluded:** All financial amounts reported without Value Added Tax
- **YoY:** Year-over-Year (comparing same period in different years)
- **YTD:** Year-to-Date (from January 1 to current date)
- **Aging Bucket:** Categorization of invoices by days outstanding
- **Sales Velocity:** Average rate of product sales (quantity per time period)
- **Days Remaining:** Estimated days until stock runs out at current sales velocity

## Database Tables Reference

- **sales:** Sales records (status: NEW, SHIPPED, INVOICED, PAID)
- **customers:** Customer records
- **products:** Product catalog
- **saleItems:** Line items for each sale
- **stockMovements:** Stock movements (IN/OUT)

## Status Definitions

- **NEW:** Sale created, not yet shipped
- **SHIPPED:** Sale shipped/delivered, awaiting invoice
- **INVOICED:** Invoice sent to customer, awaiting payment
- **PAID:** Payment received
