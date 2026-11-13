# Epic 5 — Price Calculation & Cross-Cutting Infrastructure

This epic consolidates two groups of stories:
1. **Cross-Cutting Stories (5.1-5.3):** Database schema updates, performance optimization, and navigation/UX changes that support Epics 1-4.
2. **Price Calculation Tool (5.4):** Comprehensive price calculation tool to analyze cost breakdowns, set competitive prices, and manage pricing across product variants.

**Priority:** Stories 5.1-5.3 are HIGH (blocking for Epics 1-4). Story 5.4 is MEDIUM.

**Total Estimated Points:** ~73 points (10 cross-cutting + 63 price calculator)

## Stories

| Story | Title | Points | Status |
|-------|-------|--------|--------|
| [Story 5.1](story-5.1-schema-updates.md) | Database Schema Updates | 5 | Not Started — no channel, invoice_date, or paid_date fields in schema |
| [Story 5.2](story-5.2-performance-optimization.md) | Performance Optimization | 3 | Partial — dashboard exists, blocked by 5.1 for channel index |
| [Story 5.3](story-5.3-navigation-ux.md) | Navigation and UX | 2 | Partial — nav exists, missing Sales Analysis + Inventory links and breadcrumbs |
| [Story 5.4](story-5.4-price-calculation-tool.md) | Price Calculation & Management Tool | 63 | Not Started — sales price infrastructure exists but no calculator logic/UI |

## Dependencies
- Stories 5.1 and 5.2 are blocking for Epic 1 (Dashboard) and Epic 2 (Invoice Manager)
- Story 5.3 depends on all page routes from Epics 1-4 existing
- Story 5.4 depends on parameter_table, buying_prices, and sales_prices tables existing

## Notes
- The original backlog had duplicate "Epic 5.1" and "Epic 5.2" numbering across Cross-Cutting Stories and Phase 5 (Price Calculator). This has been consolidated: cross-cutting infrastructure is 5.1-5.3, and the price calculator tool is 5.4.
