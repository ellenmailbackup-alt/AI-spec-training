# Epic 2 — Invoice Manager

**Goal:** Dedicated invoice tracking and payment management interface to improve cash flow visibility

**Priority:** HIGH - Addresses identified pain point (invoices only checked once a year)

**Total Estimated Points:** ~18 points

## Stories

| Story | Title | Points | Status |
|-------|-------|--------|--------|
| [Story 2.1](story-2.1-invoice-list-view.md) | Invoice List View | 8 | Partial — basic page/table exist, missing aging logic & dedicated endpoints |
| [Story 2.2](story-2.2-invoice-aging.md) | Invoice Aging Analysis | 5 | Not Started — blocked by Story 5.1 (schema) |
| [Story 2.3](story-2.3-invoice-manager-page.md) | Invoice Manager Page | 5 | Partial — route & shell exist, missing aging summary/metrics/tabs |

## Dependencies
- Story 5.1 (Database Schema Updates) — invoice_date and paid_date fields are blocking
- All amounts exclude VAT
- 15-day payment terms for B2B
