# Story 1.5 — Invoice Health Summary

## User Story 1.5.1: Display Invoice Health Metrics on Dashboard

**As a** business owner
**I want to** see a summary of invoice status (outstanding, overdue)
**So that** I can quickly identify cash flow issues

**Priority:** HIGH
**Estimate:** 3 story points

**Acceptance Criteria:**
- [ ] Display total outstanding amount (sum of all INVOICED sales not yet PAID, VAT excluded)
- [ ] Display overdue amount (sales INVOICED >15 days ago, not yet PAID, VAT excluded)
- [ ] Display count of overdue invoices
- [ ] Display average days to payment (for sales marked PAID in last 12 months)
- [ ] Overdue amount highlighted visually if > €0:
  - Red background or red text
  - Warning icon
- [ ] "Invoice Manager" link navigates to Invoice Manager page
- [ ] Show target comparison for avg days to payment: "18.5 days (Target: 15 days)"
- [ ] Color indicator for avg days:
  - Green if <=15 days
  - Yellow if 16-20 days
  - Red if >20 days
- [ ] All values exclude VAT

**Acceptance Criteria - Overdue Calculation:**
- [ ] Overdue = sales with status INVOICED where `DATEDIFF(current_date, invoice_date) > 15`
- [ ] Invoice date = `invoice_date` field (date when status changed to INVOICED)
- [ ] If `invoice_date` is null (old sales), use `date` field as fallback

**Technical Implementation:**
- **Database Requirements:**
  - Add `invoice_date` field to sales table (see Story 5.1)
  - Add `paid_date` field to sales table (see Story 5.1)
- **Database Queries:**
  ```sql
  -- Outstanding amount
  SELECT SUM(amount_vat_excl) as outstanding
  FROM sales
  WHERE status = 'INVOICED'

  -- Overdue amount and count
  SELECT
    SUM(amount_vat_excl) as overdue_amount,
    COUNT(*) as overdue_count
  FROM sales
  WHERE status = 'INVOICED'
    AND DATEDIFF(CURRENT_DATE, COALESCE(invoice_date, date)) > 15

  -- Average days to payment
  SELECT AVG(DATEDIFF(paid_date, COALESCE(invoice_date, date))) as avg_days
  FROM sales
  WHERE status = 'PAID'
    AND paid_date >= DATE_SUB(CURRENT_DATE, INTERVAL 12 MONTH)
    AND paid_date IS NOT NULL
  ```
- **API Endpoint:** `GET /api/dashboards/main`
- **Response Format:**
  ```json
  "invoice_health": {
    "outstanding_amount": 15600,
    "overdue_amount": 4268,
    "overdue_count": 2,
    "avg_days_to_payment": 18.5,
    "target_days": 15
  }
  ```

**Dependencies:**
- User Story 5.1.2 (Add invoice_date and paid_date fields)

**Testing Notes:**
- Test with no overdue invoices (overdue = €0, count = 0)
- Test with overdue invoices (verify 15-day threshold)
- Test avg days to payment calculation
- Test fallback to `date` field if `invoice_date` is null
- Verify visual highlighting for overdue amount
- Verify VAT excluded amounts

**Migration Required:** Yes (see Story 5.1)
