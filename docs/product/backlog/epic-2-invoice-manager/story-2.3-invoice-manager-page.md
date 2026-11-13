# Story 2.3 — Invoice Manager Page

## User Story 2.3.1: Create Invoice Manager Page

**As a** user
**I want to** navigate to a dedicated Invoice Manager page
**So that** I can manage invoices in one place

**Priority:** HIGH
**Estimate:** 5 story points

**Acceptance Criteria:**
- [ ] Page accessible at `/invoices` route
- [ ] Navigation link in main menu: "Invoice Manager" or "Invoices"
- [ ] Page includes all components:
  1. Aging bucket summary (top section)
  2. Payment metrics (avg days to payment)
  3. Filter tabs (All, Within Terms, Overdue, Seriously Overdue)
  4. Invoice list table
- [ ] Page title: "Invoice & Payment Tracking" (browser tab and page header)
- [ ] Breadcrumb: Dashboard > Invoice Manager
- [ ] Responsive layout (desktop, tablet, mobile)
- [ ] Loading state while fetching data
- [ ] Error state if API fails
- [ ] Empty state if no invoices exist

**Technical Implementation:**
- **Route:** `/invoices`
- **API Endpoints:**
  - `GET /api/invoices/aging-summary`
  - `GET /api/invoices/payment-metrics`
  - `GET /api/invoices?aging_bucket=all`
- **Components:**
  - InvoiceManager (page)
    - AgingBucketSummary
    - PaymentMetrics
    - InvoiceFilterTabs
    - InvoiceTable
- **Navigation:** Add link to main navigation menu

**Dependencies:**
- User Story 2.1.1, 2.1.2, 2.1.3 (Invoice list and actions)
- User Story 2.2.1, 2.2.2 (Aging summary and metrics)

**Testing Notes:**
- Test navigation from dashboard
- Test all sections load correctly
- Test responsive layout
- Test loading and error states
- Test breadcrumb navigation
