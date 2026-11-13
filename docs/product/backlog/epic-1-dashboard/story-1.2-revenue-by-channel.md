# Story 1.2 — Revenue by Channel

## User Story 1.2.1: Track Revenue by Sales Channel

**As a** business owner
**I want to** see revenue broken down by channel (B2B, B2C, Webshop, Boeren en Buren)
**So that** I can understand which channels are performing best

**Priority:** HIGH
**Estimate:** 3 story points

**Acceptance Criteria:**
- [ ] Display revenue for each channel for current month (VAT excluded)
- [ ] Display revenue for each channel for same month last year (VAT excluded)
- [ ] Calculate change (absolute € and percentage) for each channel
- [ ] Show channels in table format with columns:
  - Channel Name
  - This Month (€)
  - Same Month Last Year (€)
  - Change (€ and %)
- [ ] Include visual indicators for growth/decline per channel
- [ ] Handle channels with zero revenue (show €0, avoid division by zero in % change)
- [ ] If previous year has no data for a channel, show "N/A" or "New Channel" in change column
- [ ] All values exclude VAT
- [ ] Channels displayed in order: B2B, B2C, Webshop, Boeren en Buren

**Technical Implementation:**
- **Database Requirements:**
  - Add `channel` column to `sales` table
  - Type: ENUM('B2B', 'B2C', 'WEBSHOP', 'BOEREN_EN_BUREN')
  - Nullable: Yes (for backward compatibility)
  - Index: Add index on `channel` column
- **Database Query:**
  ```sql
  -- Current month by channel
  SELECT channel, SUM(amount_vat_excl) as revenue
  FROM sales
  WHERE status IN ('INVOICED', 'PAID')
    AND MONTH(date) = MONTH(CURRENT_DATE)
    AND YEAR(date) = YEAR(CURRENT_DATE)
  GROUP BY channel

  -- Previous year same month by channel
  SELECT channel, SUM(amount_vat_excl) as revenue
  FROM sales
  WHERE status IN ('INVOICED', 'PAID')
    AND MONTH(date) = MONTH(CURRENT_DATE)
    AND YEAR(date) = YEAR(CURRENT_DATE) - 1
  GROUP BY channel
  ```
- **API Endpoint:** `GET /api/dashboards/main`
- **Response Format:**
  ```json
  "channels": [
    {
      "channel": "B2B",
      "current_month": 4500,
      "previous_month": 4200,
      "change_absolute": 300,
      "change_percentage": 7.1
    },
    ...
  ]
  ```

**Dependencies:**
- User Story 1.2.2 (Add channel field to sales)

**Testing Notes:**
- Test all 4 channels with revenue
- Test channel with €0 current month
- Test channel that didn't exist previous year
- Verify VAT excluded amounts
- Verify percentage calculation handles €0 gracefully

**Migration Required:** Yes (see Story 5.1)

---

## User Story 1.2.2: Assign Channel to Existing and New Sales

**As a** user creating or editing a sale
**I want to** assign a channel to each sale
**So that** revenue can be tracked by channel

**Priority:** HIGH
**Estimate:** 3 story points

**Acceptance Criteria:**
- [ ] Sales form includes "Channel" dropdown field
- [ ] Dropdown options: B2B, B2C, Webshop, Boeren en Buren
- [ ] Channel is required field (cannot create sale without selecting channel)
- [ ] Default value set intelligently:
  - If customer has `customer_type = 'B2B'`, default to B2B channel
  - If customer has `customer_type = 'B2C'`, default to B2C channel
  - Otherwise, no default (user must select)
- [ ] Channel can be edited after sale creation
- [ ] Existing sales without channel value:
  - Display "Unknown" in dashboard until updated
  - Show warning in sales list: "Channel not set"
  - Admin can bulk update channels for existing sales
- [ ] Boeren en Buren import automatically assigns `BOEREN_EN_BUREN` channel to all imported sales
- [ ] API validation: Reject sale creation/update if channel is null or invalid

**Technical Implementation:**
- **Frontend Changes:**
  - Add channel dropdown to sales form component
  - Use existing customer data to set default value
  - Add validation: channel is required
- **Backend Changes:**
  - Add `channel` field to sale creation/update API
  - Validation: `channel IN ('B2B', 'B2C', 'WEBSHOP', 'BOEREN_EN_BUREN')` and NOT NULL
  - Boeren import script: Add `channel = 'BOEREN_EN_BUREN'` to all imported sales
- **Migration Strategy:**
  - Add column as nullable
  - Backfill existing sales:
    - Option 1: Set channel based on customer type
    - Option 2: Leave as null, require manual update
    - Option 3: Set all to 'B2B' as default (discuss with business owner)
  - Make column NOT NULL after backfill (future constraint)

**Dependencies:**
- User Story 5.1.1 (Database migration to add channel column)

**Testing Notes:**
- Test creating new sale with channel selected
- Test form validation (reject without channel)
- Test editing existing sale's channel
- Test Boeren import assigns correct channel
- Test default channel selection based on customer type
- Verify API rejects invalid channel values
