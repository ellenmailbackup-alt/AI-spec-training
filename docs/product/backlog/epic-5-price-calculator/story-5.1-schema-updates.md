# Story 5.1 — Database Schema Updates

## User Story 5.1.1: Add Channel Field to Sales Table

**As a** developer
**I want to** add a channel field to the sales table
**So that** sales can be categorized by channel for reporting

**Priority:** HIGH (blocking for Epic 1)
**Estimate:** 2 story points

**Acceptance Criteria:**
- [ ] Add `channel` column to `sales` table
- [ ] Column type: ENUM('B2B', 'B2C', 'WEBSHOP', 'BOEREN_EN_BUREN')
- [ ] Column nullable: Yes (for backwards compatibility with existing sales)
- [ ] Add index on `channel` column for query performance
- [ ] Migration script runs without errors on development, staging, and production databases
- [ ] Existing sales remain intact after migration (no data loss)
- [ ] Migration is reversible (down migration available)

**Migration Script:**
```sql
-- Up migration
ALTER TABLE sales
ADD COLUMN channel VARCHAR(20) NULL
COMMENT 'Sales channel: B2B, B2C, WEBSHOP, BOEREN_EN_BUREN';

CREATE INDEX idx_sales_channel ON sales(channel);

-- Optional: Backfill existing sales with default channel
-- UPDATE sales SET channel = 'B2B' WHERE channel IS NULL;

-- Down migration (rollback)
ALTER TABLE sales DROP COLUMN channel;
```

**Backfill Strategy (discuss with product owner):**
- Option 1: Leave as NULL, require manual update via UI
- Option 2: Set default based on customer type (if customer.type = 'B2B', set channel = 'B2B')
- Option 3: Set all to 'B2B' as default assumption
- **Recommended:** Option 2 (smart default based on customer type)

**Dependencies:** None

**Testing Notes:**
- Test migration on local database
- Test migration on staging database (with production-like data)
- Verify existing sales unchanged after migration
- Verify index created successfully (`SHOW INDEX FROM sales`)
- Test rollback (down migration)
- Verify NULL values allowed
- Verify enum values enforced (reject invalid values)

---

## User Story 5.1.2: Add Invoice and Payment Date Tracking

**As a** developer
**I want to** track invoice_date and paid_date separately from general sale date
**So that** invoice aging and payment metrics can be calculated accurately

**Priority:** HIGH (blocking for Epic 1 and Epic 2)
**Estimate:** 3 story points

**Acceptance Criteria:**
- [ ] Add `invoice_date` column to `sales` table (TIMESTAMP, nullable)
- [ ] Add `paid_date` column to `sales` table (TIMESTAMP, nullable)
- [ ] When sale status changes to INVOICED, auto-set `invoice_date = current timestamp`
- [ ] When sale status changes to PAID, auto-set `paid_date = current timestamp`
- [ ] Migration script backfills invoice_date and paid_date for existing sales:
  - If status = INVOICED: Set `invoice_date = date`
  - If status = PAID: Set `invoice_date = date` AND `paid_date = date`
- [ ] Add indexes on `invoice_date` and `paid_date` for query performance
- [ ] Migration is reversible (down migration available)
- [ ] Application logic updated to auto-set dates on status change

**Migration Script:**
```sql
-- Up migration
ALTER TABLE sales
ADD COLUMN invoice_date TIMESTAMP NULL COMMENT 'Date when sale was invoiced',
ADD COLUMN paid_date TIMESTAMP NULL COMMENT 'Date when invoice was paid';

-- Backfill existing sales
UPDATE sales
SET invoice_date = date
WHERE status IN ('INVOICED', 'PAID');

UPDATE sales
SET paid_date = date
WHERE status = 'PAID';

-- Add indexes
CREATE INDEX idx_sales_invoice_date ON sales(invoice_date);
CREATE INDEX idx_sales_paid_date ON sales(paid_date);

-- Down migration (rollback)
ALTER TABLE sales
DROP COLUMN invoice_date,
DROP COLUMN paid_date;
```

**Application Logic Update:**
- **Sale Update API:** When `status` changes:
  - If new status = 'INVOICED' AND invoice_date is NULL: Set `invoice_date = NOW()`
  - If new status = 'PAID' AND paid_date is NULL: Set `paid_date = NOW()`
- **Note:** Do NOT overwrite if dates already set (preserve original dates)

**Dependencies:** None

**Testing Notes:**
- Test migration on local database
- Test migration on staging database
- Verify backfill logic (check sample sales before/after)
- Verify indexes created successfully
- Test application logic: Create new sale, change status to INVOICED, verify invoice_date set
- Test application logic: Change status to PAID, verify paid_date set
- Test that dates not overwritten if already set
- Test rollback (down migration)
