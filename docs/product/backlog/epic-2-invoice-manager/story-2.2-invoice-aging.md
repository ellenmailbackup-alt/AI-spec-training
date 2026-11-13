# Story 2.2 — Invoice Aging Analysis

## User Story 2.2.1: Display Aging Bucket Summary

**As a** business owner
**I want to** see a summary of invoices grouped by aging bucket
**So that** I can understand overall payment collection health

**Priority:** MEDIUM
**Estimate:** 3 story points

**Acceptance Criteria:**
- [ ] Display summary cards or table showing:
  - **Within Terms (0-15 days):** Count + Total Amount (€, VAT excluded)
  - **Overdue (16-30 days):** Count + Total Amount
  - **Seriously Overdue (31+ days):** Count + Total Amount
- [ ] Color coded:
  - Green for Within Terms
  - Yellow for Overdue
  - Red for Seriously Overdue
- [ ] Visual representation (bar chart or stacked bar showing distribution)
- [ ] Clicking a bucket filters the invoice list to that bucket (links to filtered view)
- [ ] Summary displayed prominently at top of Invoice Manager page
- [ ] All amounts exclude VAT

**Technical Implementation:**
- **API Endpoint:** `GET /api/invoices/aging-summary`
- **Database Query:**
  ```sql
  SELECT
    CASE
      WHEN DATEDIFF(CURRENT_DATE, COALESCE(invoice_date, date)) <= 15
        THEN 'within_terms'
      WHEN DATEDIFF(CURRENT_DATE, COALESCE(invoice_date, date)) <= 30
        THEN 'overdue'
      ELSE 'seriously_overdue'
    END as bucket,
    COUNT(*) as count,
    SUM(amount_vat_excl) as total_amount
  FROM sales
  WHERE status = 'INVOICED'
  GROUP BY bucket
  ```
- **Response Format:**
  ```json
  {
    "within_terms": {"count": 12, "total_amount": 18450},
    "overdue": {"count": 3, "total_amount": 5200},
    "seriously_overdue": {"count": 2, "total_amount": 4268}
  }
  ```
- **Frontend:**
  - Summary cards component
  - Optional: Bar chart (Recharts BarChart)
  - Clickable cards -> filter invoice list

**Dependencies:**
- User Story 2.1.1 (Invoice list)
- User Story 2.1.2 (Filtering)

**Testing Notes:**
- Test with invoices in all buckets
- Test with no invoices in a bucket (show 0)
- Test clicking bucket filters list
- Verify calculations (count and total)
- Verify color coding
- Verify VAT excluded amounts

---

## User Story 2.2.2: Display Average Days to Payment Metric

**As a** business owner
**I want to** see the average days customers take to pay invoices
**So that** I can track if payment times are improving or worsening

**Priority:** MEDIUM
**Estimate:** 2 story points

**Acceptance Criteria:**
- [ ] Display metric: "Average Days to Payment: 18.5 days"
- [ ] Calculated from all sales marked PAID in last 12 months
- [ ] Formula: `AVG(paid_date - invoice_date)` for sales with status PAID
- [ ] Show target comparison: "Target: 15 days" (B2B payment terms)
- [ ] Color indicator:
  - Green if <=15 days (meeting target)
  - Yellow if 16-20 days (slightly over target)
  - Red if >20 days (significantly over target)
- [ ] Tooltip/help text explains calculation: "Average time from invoice to payment for invoices paid in last 12 months"
- [ ] Display "N/A" if no invoices paid in last 12 months

**Technical Implementation:**
- **API Endpoint:** `GET /api/invoices/payment-metrics`
- **Database Query:**
  ```sql
  SELECT
    AVG(DATEDIFF(paid_date, COALESCE(invoice_date, date))) as avg_days_to_payment
  FROM sales
  WHERE status = 'PAID'
    AND paid_date >= DATE_SUB(CURRENT_DATE, INTERVAL 12 MONTH)
    AND paid_date IS NOT NULL
  ```
- **Response Format:**
  ```json
  {
    "avg_days_to_payment": 18.5,
    "target_days": 15,
    "status": "warning"
  }
  ```
- **Frontend:**
  - Metric card component
  - Color indicator based on status
  - Tooltip with explanation

**Dependencies:**
- User Story 5.1.2 (invoice_date and paid_date fields)

**Testing Notes:**
- Test with invoices paid in last 12 months
- Test with no invoices paid (verify "N/A")
- Test calculation accuracy
- Test color indicator (green/yellow/red thresholds)
- Test tooltip display
