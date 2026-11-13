# Story 2.1 — Invoice List View

## User Story 2.1.1: Display All Open Invoices

**As a** business owner
**I want to** see a list of all open invoices (status = INVOICED)
**So that** I can track which customers owe money

**Priority:** HIGH
**Estimate:** 3 story points

**Acceptance Criteria:**
- [ ] Display table of all sales with status = INVOICED
- [ ] Columns:
  - Customer Name
  - Invoice Date (date when status changed to INVOICED)
  - Amount (€, VAT excluded)
  - Days Outstanding (current_date - invoice_date)
  - Actions (Mark as Paid button)
- [ ] Sorted by Days Outstanding (descending, oldest/most overdue first)
- [ ] Color coding by aging bucket:
  - Green row: 0-15 days (within payment terms)
  - Yellow row: 16-30 days (overdue)
  - Red row: 31+ days (seriously overdue)
- [ ] Show total outstanding amount at top of table (sum of all open invoices, VAT excluded)
- [ ] Empty state if no open invoices: "All invoices paid!"
- [ ] Pagination if >50 invoices (show 50 per page)
- [ ] All amounts exclude VAT

**Technical Implementation:**
- **API Endpoint:** `GET /api/invoices?status=open`
- **Database Query:**
  ```sql
  SELECT
    s.id,
    c.name as customer_name,
    COALESCE(s.invoice_date, s.date) as invoice_date,
    s.amount_vat_excl,
    DATEDIFF(CURRENT_DATE, COALESCE(s.invoice_date, s.date)) as days_outstanding
  FROM sales s
  JOIN customers c ON c.id = s.customer_id
  WHERE s.status = 'INVOICED'
  ORDER BY days_outstanding DESC
  ```
- **Response Format:**
  ```json
  {
    "total_outstanding": 15600,
    "invoices": [
      {
        "id": "uuid",
        "customer_name": "AE NV",
        "invoice_date": "2025-11-10",
        "amount": 4268.87,
        "days_outstanding": 44,
        "aging_bucket": "seriously_overdue"
      },
      ...
    ]
  }
  ```

**Dependencies:**
- User Story 5.1.2 (invoice_date field added to sales table)

**Testing Notes:**
- Test with invoices in all aging buckets
- Test with no open invoices (empty state)
- Test sorting (verify oldest first)
- Test pagination (if >50 invoices)
- Verify color coding matches aging buckets
- Verify total outstanding calculation
- Verify VAT excluded amounts

---

## User Story 2.1.2: Filter Invoices by Aging Bucket

**As a** business owner
**I want to** filter invoices by aging bucket (all, within terms, overdue, seriously overdue)
**So that** I can focus on urgent payment collection

**Priority:** MEDIUM
**Estimate:** 2 story points

**Acceptance Criteria:**
- [ ] Filter tabs/buttons displayed above invoice table:
  - All
  - Within Terms (0-15 days)
  - Overdue (16-30 days)
  - Seriously Overdue (31+ days)
- [ ] Clicking a filter shows only invoices in that aging bucket
- [ ] Badge shows count of invoices in each bucket (e.g., "Overdue (3)")
- [ ] Badge also shows total amount for each bucket (e.g., "Overdue (3) - €5,200")
- [ ] Default view: All invoices
- [ ] Active filter tab visually highlighted
- [ ] URL parameter reflects current filter (e.g., `?aging_bucket=overdue`)
- [ ] Filter persists on page refresh
- [ ] Changing filter updates table immediately (no page reload)

**Technical Implementation:**
- **API Endpoint:** `GET /api/invoices?aging_bucket=overdue`
- **Query Parameter:** `aging_bucket` (values: all, within_terms, overdue, seriously_overdue)
- **Frontend:**
  - Tabs/buttons component
  - Update URL parameter on filter change
  - Re-fetch data from API with new filter
- **Backend Filter Logic:**
  ```sql
  WHERE s.status = 'INVOICED'
    AND CASE
      WHEN aging_bucket = 'within_terms' THEN days_outstanding <= 15
      WHEN aging_bucket = 'overdue' THEN days_outstanding BETWEEN 16 AND 30
      WHEN aging_bucket = 'seriously_overdue' THEN days_outstanding > 30
      ELSE TRUE -- 'all'
    END
  ```

**Dependencies:**
- User Story 2.1.1 (Invoice list view)

**Testing Notes:**
- Test each filter (verify correct invoices shown)
- Test badge counts and amounts
- Test URL parameter (verify persists on refresh)
- Test switching between filters
- Verify "All" shows all invoices

---

## User Story 2.1.3: Mark Invoice as Paid

**As a** user
**I want to** mark an invoice as paid directly from the invoice list
**So that** I can quickly update payment status

**Priority:** HIGH
**Estimate:** 3 story points

**Acceptance Criteria:**
- [ ] "Mark as Paid" button next to each invoice in the list
- [ ] Clicking button shows confirmation modal:
  - Title: "Mark Invoice as Paid?"
  - Message: "Mark invoice for [Customer Name] (€[Amount]) as paid?"
  - Buttons: "Cancel" and "Confirm"
- [ ] Confirming updates sale:
  - Status: INVOICED -> PAID
  - paid_date: Set to current timestamp
- [ ] Invoice removed from open invoices list immediately after update
- [ ] Success toast/message shown: "Invoice marked as paid"
- [ ] If API error occurs:
  - Show error message: "Failed to update invoice. Please try again."
  - Invoice remains in list (no optimistic update on failure)
- [ ] Action logged in audit trail (optional):
  - Track who marked it paid (user_id)
  - Track when (timestamp)
- [ ] Confirmation modal dismisses on Cancel or Confirm
- [ ] Button disabled while API request in progress (prevent double-click)

**Technical Implementation:**
- **API Endpoint:** `PATCH /api/sales/:id/mark-paid`
- **Request Body:**
  ```json
  {
    "paid_date": "2025-12-24T14:30:00Z"
  }
  ```
- **Backend Logic:**
  ```sql
  UPDATE sales
  SET status = 'PAID',
      paid_date = :paid_date
  WHERE id = :sale_id
    AND status = 'INVOICED' -- Only allow if currently INVOICED
  ```
- **Frontend:**
  - Confirmation modal component (e.g., Modal, Dialog)
  - Optimistic update: Remove invoice from list immediately
  - Rollback if API fails: Re-add invoice to list
  - Toast notification for success/error
- **Audit Trail (optional):**
  - Log to `audit_log` table or similar
  - Record: sale_id, action: 'mark_paid', user_id, timestamp

**Dependencies:**
- User Story 2.1.1 (Invoice list view)
- User Story 5.1.2 (paid_date field added to sales table)

**Testing Notes:**
- Test marking single invoice as paid
- Test confirmation modal (cancel and confirm)
- Test API error handling (simulate failure)
- Test optimistic update and rollback
- Test button disabled state (prevent double-click)
- Verify status and paid_date updated in database
- Verify audit log created (if implemented)
