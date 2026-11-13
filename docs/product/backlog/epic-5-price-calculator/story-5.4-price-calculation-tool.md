# Story 5.4 — Price Calculation & Management Tool

**Goal:** Comprehensive price calculation tool to analyze cost breakdowns, set competitive prices, and manage pricing across product variants

**Priority:** MEDIUM - Supports pricing strategy and profitability optimization

This story group contains 15 sub-stories organized into two epics from the original backlog:
- **Epic 5.1 (original):** Price Calculation Tool (12 stories, ~47 points)
- **Epic 5.2 (original):** Technical Infrastructure (3 stories, ~16 points)

**Total Estimated Points:** ~63 points

---

## User Story 5.4.1: Price Calculator Access

**As a** business manager
**I want to** access a price calculator from the product detail page
**So that** I can analyze and set prices based on comprehensive cost breakdowns

**Priority:** HIGH
**Estimate:** 2 story points

**Acceptance Criteria:**
- [ ] "Calculate Price" button visible on Product Detail page
- [ ] Opens dedicated price calculation screen/modal
- [ ] Shows current product information (name, image, current prices)
- [ ] Access restricted to admin users only

**Technical Implementation:**
- **Route:** `/products/:id/price-calculator` (modal or separate page)
- **Component:** PriceCalculator
- **Button Location:** ProductDetail page, next to pricing tabs

**Dependencies:**
- Product Detail page must exist

**Testing Notes:**
- Test button visibility and navigation
- Test admin-only access restriction
- Test product information display

---

## User Story 5.4.2: Multi-Component Cost Input

**As a** business manager
**I want to** input all cost components that contribute to product pricing
**So that** I can calculate accurate selling prices based on total costs

**Cost Components to Support:**
- Product buying cost (from buying_prices table)
- Labor cost (per unit)
- Packaging cost (per unit)
- Electricity/utilities cost (per unit)
- Shipping/logistics cost (per unit)
- Other overhead costs (configurable fields)

**Priority:** HIGH
**Estimate:** 4 story points

**Acceptance Criteria:**
- [ ] Form fields for each cost component
- [ ] Pre-populate product buying cost from database (latest buying_prices record)
- [ ] Pre-populate default cost values from parameter_table:
  - `cost_labor_per_unit`
  - `cost_packaging_per_unit`
  - `cost_electricity_per_unit`
  - `cost_shipping_per_unit`
  - `cost_overhead_per_unit`
- [ ] All cost fields editable (can override defaults)
- [ ] Support for decimal precision (5 decimal places)
- [ ] Currency display (€)
- [ ] Costs can vary by product unit size (250g vs 1kg may have different packaging)
- [ ] Cost breakdown shows total cost per unit
- [ ] Real-time cost total calculation

**Technical Implementation:**
- **API Endpoint:** `GET /api/parameters` - fetch cost parameters
- **Database:**
  - Read from `parameter_table` for default costs
  - Read from `buying_prices` for product cost
- **Form Fields:**
  - Product cost (from buying_prices, read-only with override option)
  - Labor cost (from parameter_table, editable)
  - Packaging cost (from parameter_table, editable)
  - Electricity cost (from parameter_table, editable)
  - Shipping cost (from parameter_table, editable)
  - Overhead cost (from parameter_table, editable)
- **Calculation:**
  - Total Cost = Sum of all cost components

**Dependencies:**
- User Story 5.4.1 (Price Calculator Access)
- Parameter table must contain cost parameters

**Testing Notes:**
- Test pre-population from parameter_table
- Test pre-population from buying_prices
- Test manual override of costs
- Test cost total calculation
- Test decimal precision
- Test with missing parameter values (graceful defaults)

---

## User Story 5.4.3: Markup/Margin Calculation Parameters

**As a** business manager
**I want to** define markup or margin percentages
**So that** the system can calculate suggested selling prices

**Priority:** HIGH
**Estimate:** 3 story points

**Acceptance Criteria:**
- [ ] Input fields for markup/margin percentage
- [ ] Support user's custom calculation formulas (formulas provided by user separately)
- [ ] Separate markup parameters for B2C and B2B
- [ ] Clear labels explaining difference between markup and margin
- [ ] Visual indicator showing the calculation method being used
- [ ] Real-time calculation as parameters change
- [ ] Validation: Percentages must be positive numbers
- [ ] Suggested price updates immediately when markup/margin changes

**Calculation Methods (to be refined with user's formulas):**
- **Markup:** Selling Price = Cost x (1 + Markup%)
- **Margin:** Selling Price = Cost / (1 - Margin%)

**Technical Implementation:**
- **Form Fields:**
  - B2C Markup/Margin % (editable)
  - B2B Markup/Margin % (editable)
  - Calculation method selector (Markup vs Margin)
- **Calculation Logic:**
  - User will provide specific formulas later
  - Support both markup and margin calculations
  - Calculate for both B2C and B2B simultaneously
- **Real-time Updates:**
  - Use React state to recalculate on parameter change
  - Debounce calculations (100ms delay)

**Dependencies:**
- User Story 5.4.2 (Cost Input)

**Testing Notes:**
- Test markup calculation
- Test margin calculation
- Test B2C vs B2B separate calculations
- Test real-time updates
- Test validation (negative numbers, invalid input)
- Test edge cases (0%, 100% margin, etc.)

---

## User Story 5.4.4: Multi-Variant Price Calculation

**As a** business manager
**I want to** calculate prices for all product variants simultaneously
**So that** I can maintain consistent pricing across different unit sizes

**Priority:** HIGH
**Estimate:** 5 story points

**Acceptance Criteria:**
- [ ] Display all existing sales price variants (250g, 1kg, 5kg, etc.)
- [ ] Calculate suggested price for each variant
- [ ] Show cost breakdown per variant (costs may differ by size)
- [ ] Support adding new variants in the calculator
- [ ] Compare current vs. suggested prices side-by-side
- [ ] Table format with columns:
  - Unit Size (e.g., 250g, 1kg)
  - Total Cost (per variant)
  - Current B2C Price
  - Suggested B2C Price
  - Current B2B Price
  - Suggested B2B Price
  - Change (%)
- [ ] Highlight variants with significant price changes (>10% difference)
- [ ] Option to select which variants to update

**Technical Implementation:**
- **API Endpoint:** `GET /api/products/:id/sales-prices` - fetch all variants
- **Data Structure:**
  ```json
  {
    "variants": [
      {
        "unit": "g",
        "amount": 250,
        "current_b2c_price_without_vat": 5.50,
        "current_b2b_price_without_vat": 4.50,
        "cost_per_unit": 3.00,
        "suggested_b2c_price": 6.00,
        "suggested_b2b_price": 4.80
      }
    ]
  }
  ```
- **Variant-Specific Costs:**
  - Packaging cost may differ by size
  - Allow per-variant cost adjustments
- **Comparison Logic:**
  - Calculate % difference between current and suggested
  - Highlight if difference > 10%

**Dependencies:**
- User Story 5.4.3 (Markup/Margin Calculation)

**Testing Notes:**
- Test with multiple variants (different sizes)
- Test with single variant
- Test cost calculations per variant
- Test price comparison highlighting
- Test adding new variant
- Test variant selection

---

## User Story 5.4.5: B2C and B2B Price Calculations

**As a** business manager
**I want to** calculate separate B2C and B2B prices
**So that** I can maintain different pricing strategies for retail and wholesale

**Priority:** HIGH
**Estimate:** 3 story points

**Acceptance Criteria:**
- [ ] Separate markup/margin inputs for B2C and B2B
- [ ] Calculate both price types simultaneously
- [ ] Show prices with and without VAT for each
- [ ] VAT automatically calculated based on product's VAT class
- [ ] Visual comparison between B2C and B2B pricing
- [ ] Display format:
  ```
  B2C: €6.00 (excl. VAT) -> €7.26 (incl. VAT)
  B2B: €4.80 (excl. VAT) -> €5.81 (incl. VAT)
  ```
- [ ] Validate: B2C price should typically be higher than B2B
- [ ] Warning if B2B price > B2C price

**Technical Implementation:**
- **VAT Calculation:**
  - Fetch product.vatClassId
  - Fetch vat_class.percentage
  - Calculate: Price with VAT = Price without VAT x (1 + VAT%)
- **Calculation:**
  - B2C Price (excl. VAT) = Cost x B2C Markup
  - B2C Price (incl. VAT) = B2C Price x (1 + VAT%)
  - B2B Price (excl. VAT) = Cost x B2B Markup
  - B2B Price (incl. VAT) = B2B Price x (1 + VAT%)
- **Validation:**
  - Show warning icon if B2B > B2C

**Dependencies:**
- User Story 5.4.3 (Markup/Margin Parameters)
- VAT class table must exist

**Testing Notes:**
- Test VAT calculation (different VAT rates: 6%, 21%)
- Test B2C vs B2B price display
- Test validation warning (B2B > B2C)
- Test with product having different VAT classes
- Verify rounding (currency precision)

---

## User Story 5.4.6: Price Calculation Results Display

**As a** business manager
**I want to** see a clear breakdown of how prices are calculated
**So that** I understand the composition of the final selling price

**Priority:** MEDIUM
**Estimate:** 3 story points

**Display Elements:**
- Total cost breakdown (sum of all components)
- Markup/margin percentage applied
- Calculated price before VAT
- VAT amount
- Final price including VAT
- Profit amount and profit margin percentage
- All calculations shown for each variant and price type

**Acceptance Criteria:**
- [ ] Display detailed calculation breakdown for each variant
- [ ] Show step-by-step calculation:
  1. Total Cost = Sum of all cost components
  2. Markup Applied = Cost x Markup%
  3. Price before VAT = Cost + Markup
  4. VAT Amount = Price x VAT%
  5. Final Price = Price before VAT + VAT
  6. Profit = Price before VAT - Cost
  7. Profit Margin % = (Profit / Price before VAT) x 100
- [ ] Format all currency values with € symbol and 2 decimal places
- [ ] Format percentages with % symbol and 1 decimal place
- [ ] Expandable/collapsible breakdown (show summary, expand for details)
- [ ] Visual hierarchy: Final price most prominent, breakdown secondary
- [ ] Color coding: Costs (red), Markup (blue), Profit (green)

**Technical Implementation:**
- **Component:** PriceBreakdown
- **Display Format:**
  ```
  === B2C Price Calculation (250g) ===

  Costs:
  - Product Cost:      €2.50
  - Labor:             €0.30
  - Packaging:         €0.15
  - Electricity:       €0.05
  --------------------------
  Total Cost:          €3.00

  Markup (100%):       €3.00
  --------------------------
  Price (excl. VAT):   €6.00
  VAT (21%):           €1.26
  --------------------------
  Final Price:         €7.26

  Profit:              €3.00
  Profit Margin:       50.0%
  ```

**Dependencies:**
- User Story 5.4.5 (B2C/B2B Calculations)

**Testing Notes:**
- Test breakdown display for all variants
- Test expandable/collapsible functionality
- Test calculation accuracy
- Test formatting (currency, percentages)
- Test color coding
- Test with different cost combinations

---

## User Story 5.4.7: Pricing Scenario Comparison

**As a** business manager
**I want to** compare different pricing scenarios side-by-side
**So that** I can choose the optimal pricing strategy

**Priority:** LOW
**Estimate:** 4 story points

**Acceptance Criteria:**
- [ ] Ability to create multiple calculation scenarios (up to 3)
- [ ] Each scenario can have different markup/margin parameters
- [ ] Side-by-side comparison view in table format
- [ ] Show impact on profit margins
- [ ] Compare against current prices
- [ ] Columns: Scenario Name, B2C Price, B2B Price, Profit Margin, Total Revenue Impact
- [ ] Option to save scenarios with names
- [ ] Option to switch between scenarios
- [ ] Highlight recommended scenario (highest profit margin or custom criteria)

**Technical Implementation:**
- **Data Structure:**
  ```json
  {
    "scenarios": [
      {
        "name": "Conservative (30% markup)",
        "b2c_markup": 30,
        "b2b_markup": 20,
        "b2c_price": 3.90,
        "b2b_price": 3.60,
        "profit_margin": 23.1
      },
      {
        "name": "Standard (50% markup)",
        "b2c_markup": 50,
        "b2b_markup": 35,
        "b2c_price": 4.50,
        "b2b_price": 4.05,
        "profit_margin": 33.3
      }
    ]
  }
  ```
- **Component:** ScenarioComparison
- **Features:**
  - Add/remove scenarios
  - Edit scenario parameters
  - Comparison table
  - Visual indicators (charts, badges)

**Dependencies:**
- User Story 5.4.6 (Price Breakdown)

**Testing Notes:**
- Test creating multiple scenarios
- Test editing scenarios
- Test comparison table display
- Test saving/loading scenarios
- Test scenario deletion
- Test with different parameter combinations

---

## User Story 5.4.8: Price Update Approval & Application

**As a** business manager
**I want to** review and approve calculated prices before applying them
**So that** I maintain control over pricing changes

**Priority:** HIGH
**Estimate:** 5 story points

**Acceptance Criteria:**
- [ ] Clear summary of price changes (old -> new)
- [ ] Highlight which prices are changing
- [ ] Show impact summary:
  - Number of variants affected
  - Average price increase/decrease (%)
  - Estimated profit margin change
- [ ] Approval confirmation dialog
- [ ] Option to apply to specific variants or all variants
- [ ] Option to set validity date range (validFrom/validUntil)
- [ ] Option to keep current prices for POS vs. update later
- [ ] Checkbox: "Make prices active in POS" (sets posItem flag)
- [ ] Cancel option (discard changes)
- [ ] Success confirmation message

**Technical Implementation:**
- **Component:** PriceApprovalDialog
- **Dialog Contents:**
  - Summary of changes table
  - Validity date pickers (validFrom, validUntil)
  - POS activation checkbox
  - Variant selection checkboxes
  - Confirm/Cancel buttons
- **API Endpoint:** `POST /api/products/:id/apply-prices`
- **Request Body:**
  ```json
  {
    "variants": [
      {
        "amount": 250,
        "unit": "g",
        "b2c_price_without_vat": 6.00,
        "b2c_price_with_vat": 7.26,
        "b2b_price_without_vat": 4.80,
        "b2b_price_with_vat": 5.81,
        "valid_from": "2025-12-25",
        "valid_until": null,
        "pos_item": true
      }
    ]
  }
  ```

**Dependencies:**
- User Story 5.4.4 (Multi-Variant Calculation)

**Testing Notes:**
- Test approval dialog display
- Test summary accuracy
- Test variant selection
- Test date validation (validFrom must be <= validUntil)
- Test POS activation checkbox
- Test cancel (no changes applied)
- Test confirmation (prices applied)
- Verify database updates

---

## User Story 5.4.9: Bulk Price Updates

**As a** business manager
**I want to** apply calculated prices to the sales_prices table
**So that** new prices become effective immediately or on a scheduled date

**Priority:** HIGH
**Estimate:** 5 story points

**Acceptance Criteria:**
- [ ] Update sales_prices for selected variants
- [ ] Preserve price history:
  - Don't delete old prices
  - Set validUntil = validFrom of new price - 1 day
- [ ] Create new price records with calculated values
- [ ] Update both B2C and B2B prices
- [ ] Update POS visibility (posItem flag) if selected
- [ ] Transaction safety: All updates succeed or all rollback
- [ ] Success confirmation with count of updated records
- [ ] Show which variants were updated
- [ ] Log price changes in audit trail (optional)
- [ ] Ability to rollback if needed (future enhancement)

**Technical Implementation:**
- **API Endpoint:** `POST /api/products/:id/apply-prices`
- **Database Transaction:**
  ```sql
  BEGIN TRANSACTION;

  -- Update existing prices (set validUntil)
  UPDATE sales_prices
  SET valid_until = :new_valid_from - INTERVAL 1 DAY
  WHERE product_id = :product_id
    AND amount = :amount
    AND unit = :unit
    AND valid_until IS NULL;

  -- Insert new prices
  INSERT INTO sales_prices (
    product_id, amount, unit, pos_item,
    b2c_price_without_vat, b2c_price_with_vat,
    b2b_price_without_vat, b2b_price_with_vat,
    valid_from, valid_until
  ) VALUES (...);

  COMMIT;
  ```
- **Error Handling:**
  - Catch all errors, rollback transaction
  - Return error message to user
  - Log errors server-side
- **Success Response:**
  ```json
  {
    "success": true,
    "updated_count": 5,
    "variants_updated": ["250g", "500g", "1kg", "2kg", "5kg"]
  }
  ```

**Dependencies:**
- User Story 5.4.8 (Price Approval)

**Testing Notes:**
- Test price creation for new variants
- Test price update for existing variants
- Test price history preservation
- Test transaction rollback on error
- Test with multiple variants
- Test with single variant
- Test POS flag update
- Test date validation
- Verify database consistency

---

## User Story 5.4.10: Cost Parameter Management

**As a** business manager
**I want to** view and update cost parameters in the parameter_table
**So that** default cost values are accurate across all price calculations

**Priority:** MEDIUM
**Estimate:** 3 story points

**Acceptance Criteria:**
- [ ] Settings page to manage cost parameters
- [ ] Display current values from parameter_table:
  - `cost_labor_per_unit`
  - `cost_packaging_per_unit`
  - `cost_electricity_per_unit`
  - `cost_shipping_per_unit`
  - `cost_overhead_per_unit`
- [ ] Edit functionality for each parameter
- [ ] Validation: Must be positive numbers
- [ ] Currency formatting (€)
- [ ] Save button to update parameter_table
- [ ] Success/error feedback
- [ ] Help text explaining what each parameter represents
- [ ] History of parameter changes (optional)

**Technical Implementation:**
- **Route:** `/settings/cost-parameters`
- **API Endpoints:**
  - `GET /api/parameters?filter=cost_*` - fetch cost parameters
  - `PUT /api/parameters/:parameterName` - update parameter
- **Component:** CostParameterSettings
- **Form Fields:**
  - Each cost parameter as editable input
  - Help icons with tooltips
  - Save/Cancel buttons
- **Database:**
  - Update parameter_table using parameterService.setParameter()

**Dependencies:**
- Parameter table must exist
- parameterService must exist

**Testing Notes:**
- Test parameter display
- Test parameter update
- Test validation (negative numbers, invalid input)
- Test success/error messages
- Test with missing parameters (create new)
- Test with existing parameters (update)
- Verify database updates

---

## User Story 5.4.11: Price Calculation History

**As a** business manager
**I want to** track when and why prices were changed
**So that** I can audit pricing decisions

**Priority:** LOW
**Estimate:** 4 story points

**Acceptance Criteria:**
- [ ] Log each price calculation session
- [ ] Store parameters used:
  - Costs (all components)
  - Markup/margin percentages
  - Calculated prices
  - Date/time
  - User who performed calculation
- [ ] Link to resulting price changes (sales_prices records)
- [ ] Display price calculation history on product page
- [ ] Searchable history by product/date/user
- [ ] Filter by date range
- [ ] Export history to CSV

**Technical Implementation:**
- **New Table:** `price_calculation_history`
  ```sql
  CREATE TABLE price_calculation_history (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    user_id VARCHAR REFERENCES users(id),
    cost_breakdown JSONB, -- all cost components
    markup_parameters JSONB, -- B2C/B2B markup/margin
    calculated_prices JSONB, -- all variant prices
    applied BOOLEAN, -- were prices applied to sales_prices?
    created_at TIMESTAMP DEFAULT NOW()
  );
  ```
- **API Endpoints:**
  - `POST /api/price-calculations` - log calculation
  - `GET /api/price-calculations?product_id=123` - fetch history
- **Component:** PriceCalculationHistory

**Dependencies:**
- User Story 5.4.9 (Bulk Updates)

**Testing Notes:**
- Test history logging on price calculation
- Test history display
- Test filtering by product/date/user
- Test export to CSV
- Verify JSONB storage/retrieval

---

## User Story 5.4.12: Responsive Price Calculator UI

**As a** business manager
**I want to** use the price calculator on any device
**So that** I can work flexibly from desktop or tablet

**Priority:** MEDIUM
**Estimate:** 3 story points

**Acceptance Criteria:**
- [ ] Responsive design for desktop and tablet
- [ ] Desktop (>1024px): Multi-column layout, side-by-side comparison
- [ ] Tablet (768-1024px): Stacked sections, scrollable tables
- [ ] Mobile (<768px): Single column, simplified view (optional - may restrict to desktop only)
- [ ] Clear form layout with logical grouping
- [ ] Real-time calculation updates
- [ ] Easy navigation between cost inputs and results
- [ ] Print-friendly price summary view
- [ ] Loading states for API calls
- [ ] Error states with clear messages

**Technical Implementation:**
- **Framework:** React with Tailwind CSS (or existing design system)
- **Responsive Breakpoints:**
  - Mobile: <768px
  - Tablet: 768-1024px
  - Desktop: >1024px
- **Layout:**
  - Desktop: Sidebar (costs) + Main (results + variants)
  - Tablet: Stacked sections
- **Print Styles:**
  - Hide navigation, buttons
  - Show only calculation results
  - Format for A4 page

**Dependencies:**
- All previous calculator user stories

**Testing Notes:**
- Test on desktop browser
- Test on tablet (iPad, Android tablet)
- Test on mobile (optional)
- Test print view
- Test responsive breakpoints
- Test with different screen orientations
- Test loading states
- Test error states

---

## Technical Story 5.4.13: Price Calculation Service

**Description:** Create backend service for price calculations

**Priority:** HIGH
**Estimate:** 5 story points

**Acceptance Criteria:**
- [ ] Create PriceCalculationService class
- [ ] API endpoints for price calculation:
  - `POST /api/products/:id/calculate-prices` - calculate prices
  - `GET /api/products/:id/cost-breakdown` - get cost components
  - `POST /api/products/:id/apply-prices` - apply calculated prices
- [ ] Support user's custom formulas (to be provided later)
- [ ] Validate cost inputs (positive numbers, decimal precision)
- [ ] Calculate all price variants in single request
- [ ] Return comprehensive breakdown
- [ ] Transaction support for bulk updates
- [ ] Error handling and validation

**Technical Implementation:**
- **Service:** `/server/priceCalculationService.ts`
- **Methods:**
  - `calculatePrices(productId, costs, markup)` - calculate all variants
  - `getCostBreakdown(productId)` - fetch costs from parameter_table and buying_prices
  - `applyPrices(productId, variants)` - update sales_prices
- **Formulas:** Placeholder for user-provided formulas
- **Database Queries:**
  - Fetch buying_prices (latest)
  - Fetch parameter_table (cost parameters)
  - Fetch sales_prices (current prices)
  - Update sales_prices (new prices)

**Dependencies:**
- parameter_table must exist
- buying_prices table must exist
- sales_prices table must exist

**Testing Notes:**
- Unit tests for calculation formulas
- Integration tests for API endpoints
- Test transaction rollback on error
- Test with various cost combinations
- Test validation (negative costs, invalid input)

---

## Technical Story 5.4.14: Cost Components Schema

**Description:** Extend database to support cost tracking and calculation history

**Priority:** MEDIUM
**Estimate:** 3 story points

**Acceptance Criteria:**
- [ ] Add cost parameters to parameter_table:
  - `cost_labor_per_unit`
  - `cost_packaging_per_unit`
  - `cost_electricity_per_unit`
  - `cost_shipping_per_unit`
  - `cost_overhead_per_unit`
- [ ] Create price_calculation_history table (for audit trail)
- [ ] Migration scripts
- [ ] Seed default cost parameters

**Migration Script:**
```sql
-- Add cost parameters
INSERT INTO parameter_table (parameter_name, parameter_value) VALUES
  ('cost_labor_per_unit', '0.30'),
  ('cost_packaging_per_unit', '0.15'),
  ('cost_electricity_per_unit', '0.05'),
  ('cost_shipping_per_unit', '0.10'),
  ('cost_overhead_per_unit', '0.20');

-- Create price calculation history table
CREATE TABLE price_calculation_history (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id),
  user_id VARCHAR REFERENCES users(id),
  cost_breakdown JSONB NOT NULL,
  markup_parameters JSONB NOT NULL,
  calculated_prices JSONB NOT NULL,
  applied BOOLEAN DEFAULT FALSE,
  creation_date TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_price_calc_history_product ON price_calculation_history(product_id);
CREATE INDEX idx_price_calc_history_date ON price_calculation_history(creation_date);
```

**Dependencies:**
- parameter_table must exist
- parameterService must exist

**Testing Notes:**
- Test migration on local database
- Test migration on staging database
- Verify parameters inserted
- Verify table created
- Verify indexes created
- Test rollback migration

---

## Technical Story 5.4.15: Price Calculator UI Component

**Description:** Build React component for price calculation interface

**Priority:** HIGH
**Estimate:** 8 story points

**Acceptance Criteria:**
- [ ] Create PriceCalculator component
- [ ] Form for cost inputs
- [ ] Real-time calculation display
- [ ] Results table for all variants
- [ ] Comparison views (current vs suggested)
- [ ] Integration with existing ProductDetail page
- [ ] Responsive design
- [ ] Loading states
- [ ] Error handling

**Component Structure:**
```
PriceCalculator (page/modal)
+-- CostInputForm
|   +-- ProductCostInput
|   +-- LaborCostInput
|   +-- PackagingCostInput
|   +-- ElectricityCostInput
|   +-- ShippingCostInput
|   +-- OverheadCostInput
+-- MarkupParameterForm
|   +-- B2CMarkupInput
|   +-- B2BMarkupInput
+-- PriceResultsTable
|   +-- VariantRow (for each variant)
|   +-- TotalRow
+-- PriceBreakdown (expandable)
+-- ApprovalDialog
    +-- ChangesSummary
    +-- ValidityDatePickers
    +-- ConfirmButtons
```

**Technical Implementation:**
- **State Management:** React hooks (useState, useEffect)
- **API Calls:** Fetch cost parameters, calculate prices, apply prices
- **Real-time Calculation:** Debounced calculation (100ms)
- **Validation:** Form validation with error messages
- **Styling:** Tailwind CSS

**Dependencies:**
- Technical Story 5.4.13 (Price Calculation Service)
- Technical Story 5.4.14 (Schema updates)

**Testing Notes:**
- Test component rendering
- Test form inputs
- Test real-time calculations
- Test API integration
- Test error handling
- Test responsive design
- Test approval flow

---

## Implementation Order (Recommended)

**Sprint 1: Foundation (Week 1-2)**
- Technical Story 5.4.14: Cost Components Schema (blocking)
- Technical Story 5.4.13: Price Calculation Service (blocking)
- User Story 5.4.10: Cost Parameter Management

**Sprint 2: Core Calculator (Week 3-4)**
- User Story 5.4.1: Price Calculator Access
- User Story 5.4.2: Multi-Component Cost Input
- User Story 5.4.3: Markup/Margin Calculation
- Technical Story 5.4.15: Price Calculator UI Component (start)

**Sprint 3: Multi-Variant Support (Week 5-6)**
- User Story 5.4.4: Multi-Variant Price Calculation
- User Story 5.4.5: B2C and B2B Price Calculations
- User Story 5.4.6: Price Calculation Results Display
- Technical Story 5.4.15: Price Calculator UI Component (complete)

**Sprint 4: Price Application (Week 7-8)**
- User Story 5.4.8: Price Update Approval & Application
- User Story 5.4.9: Bulk Price Updates
- User Story 5.4.12: Responsive Price Calculator UI

**Sprint 5: Enhancements (Week 9-10)**
- User Story 5.4.7: Pricing Scenario Comparison (optional)
- User Story 5.4.11: Price Calculation History (optional)
- Testing, bug fixes, polish
