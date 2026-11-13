# Epic 1 — Main Dashboard

**Goal:** Create a single-page dashboard for weekly business health monitoring with prominent year-over-year comparisons

**Priority:** HIGH - Addresses primary pain point (YoY comparison requires dropdown switching)

**Total Estimated Points:** ~35 points

## Stories

| Story | Title | Points | Status |
|-------|-------|--------|--------|
| [Story 1.1](story-1.1-revenue-overview.md) | Revenue Overview with YoY Comparison | 4 | Done |
| [Story 1.2](story-1.2-revenue-by-channel.md) | Revenue by Channel | 6 | Partial — works via derived logic, missing dedicated channel field |
| [Story 1.3](story-1.3-monthly-sales-trend.md) | Monthly Sales Trend Visualization | 3 | Done |
| [Story 1.4](story-1.4-sales-by-category.md) | Sales by Category | 2 | Done |
| [Story 1.5](story-1.5-invoice-health.md) | Invoice Health Summary | 3 | Partial — uses date workarounds, missing invoice_date/paid_date fields |
| [Story 1.6](story-1.6-stock-alerts.md) | Stock Alerts Summary | 4 | Done |
| [Story 1.7](story-1.7-customer-statistics.md) | Customer Statistics | 2 | Done |
| [Story 1.8](story-1.8-top-performers.md) | Top Performers | 4 | Partial — returns top 5 instead of top 10 |
| [Story 1.9](story-1.9-dashboard-infrastructure.md) | Dashboard Infrastructure | 13 | Partial — functional, API path differs from spec |

## Dependencies
- Story 5.1 (Database Schema Updates) — channel field and invoice/payment date tracking are blocking
- All revenue and financial amounts are reported EXCLUDING VAT
- Payment Terms: B2B customers have 15-day payment terms
- Sales Channels: B2B, B2C, Webshop, Boeren en Buren (4 channels)
- Fiscal Year: Calendar year (January 1 - December 31)
