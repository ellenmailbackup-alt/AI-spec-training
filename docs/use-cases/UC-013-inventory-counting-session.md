# UC-013: Conduct Inventory Counting Session

The admin conducts a physical inventory count by recording the actual quantities of products found at their storage locations. Completed sessions produce a variance analysis comparing counted stock against expected stock levels, and finalizing a session records inventory corrections to align the system inventory with the physical count.

## Metadata
- **Domain:** Inventory / Operations
- **Primary Actor:** Admin
- **Priority:** Must
- **Status:** Reviewed
- **Interface:** Admin Dashboard

## Preconditions
- Admin is authenticated and has admin privileges
- Products and product locations are configured in the system

## Main Flow
1. The admin requests an overview of inventory counting sessions.
2. The system displays all counting sessions showing: ID, session name, status (open, completed, cancelled), started-at date and time, and notes.
3. The admin indicates they want to start a new counting session.
4. The system asks for a session name and optional notes.
5. The admin provides the session details and confirms.
6. The system records the new session with a status of open, marked with the current date and time and the identity of the admin who started it.
7. The admin selects the session to begin counting.
8. The system shows the session detail with a count summary (total products counted, total entries, session status) and the list of counted items grouped by product. Each count entry shows: quantity with unit, location, inventory status, expiry date, and batch/notes.
9. The admin indicates they want to add a count entry.
10. The system asks for the product, location, counted quantity (with packaging unit selection and automatic gram conversion), inventory status (in stock or in use), and optionally an expiry date and batch number.
11. The admin provides the count details and confirms.
12. The system records the count entry against the session.
13. The admin repeats steps 9 through 12 for all products being counted. The admin may return to the session across multiple visits before proceeding to finalization.
14. The admin reviews the variance analysis, which shows for each counted product: product name, expected stock (calculated from all stock movements), counted quantity, variance (counted minus expected), variance percentage, and a status indicator (match, surplus, or missing).
15. When counting is complete, the admin indicates they want to finalize the session.
16. The system asks the admin to confirm finalization, explaining that this will commit the counts, record inventory corrections, and make the session read-only.
17. The admin confirms.
18. The system calculates the variance for each counted product, records an inventory correction for every product where the variance is non-zero, adjusts the physical inventory records, and marks the session as completed.

## Alternative Flows
- **AF-1: Correct a Count Entry** -- At step 13, the admin selects an existing count entry and changes its quantity, location, status, expiry date, or batch number. The system records the correction. The flow continues at step 13.
- **AF-2: Remove a Count Entry** -- At step 13, the admin selects an existing count entry to remove. The system asks the admin to confirm the removal. Upon confirmation, the system removes the entry. The flow continues at step 13.
- **AF-3: Cancel a Session** -- At any point between steps 7 and 15, the admin indicates they want to cancel the session. The system asks the admin to confirm the cancellation, explaining that cancelled sessions cannot be reopened. Upon confirmation, the system marks the session as cancelled. No inventory corrections are recorded. The use case ends.
- **AF-4: Filter Sessions by Status** -- At step 2, the admin narrows the overview to a specific status (open, completed, or cancelled). The system shows only sessions matching the selected status. The flow continues at step 3.
- **AF-5: Search Sessions** -- At step 2, the admin searches by name, notes, or ID. The system shows only matching sessions. The flow continues at step 3.
- **AF-6: Change Session Details** -- At step 8, the admin changes the session name or notes. The system records the changes. The flow continues at step 9.

## Exception Flows
- **EF-1: No Product Locations Configured** -- At step 10, if no product locations exist in the system, the system informs the admin that at least one location must be configured before count entries can be recorded. The count entry is not recorded. The flow continues at step 9.

## Postconditions
- A counting session exists with all recorded count entries
- If the session was finalized: inventory corrections have been recorded for all products with non-zero variance, physical inventory records have been adjusted, and the session is marked as completed
- If the session was cancelled: no inventory corrections were recorded

## Business Rules
- **BR-1:** Sessions follow a lifecycle: open leads to either completed (via finalization) or cancelled. Completed and cancelled sessions cannot be changed back to open.
- **BR-2:** Count entries can only be added, changed, or removed while the session is open.
- **BR-3:** Expected stock is calculated in real time as the sum of all stock movements for a product. This means the variance analysis reflects any sales or purchases that occur during counting.
- **BR-4:** Finalization records one inventory correction per product that has a non-zero variance.

## Presentation Guidelines
- **PG-1:** Session status is displayed as a color-coded indicator: open (blue), completed (green), cancelled (grey).
- **PG-2:** Variance status indicators use color coding: match (green), surplus (blue), missing (red).
- **PG-3:** The session detail page presents count entries and variance analysis as two separate views that the admin can switch between.
- **PG-4:** Count entries are grouped by product, with each product group showing the aggregated total quantity across all entries for that product.
- **PG-5:** Variance analysis summary shows four counts at a glance: total products, matched, surplus, and missing.

## Implementation Notes
- Session status is stored using a database enum with values: open, completed, cancelled. There is no separate "finalized" status -- finalization sets the status to completed.
- Count entries are stored in the product_item table, linked to a session via counting_session_id.
- The finalize operation runs in a database transaction: it calculates variances, inserts correction stock movements (reason: CORRECTION), upserts product_item records for the canonical inventory, and sets the session status to completed.
- Variance formula: counted quantity minus expected quantity. Positive = surplus, negative = shrinkage, zero = match.
- Multiple count entries may exist for the same product across different locations, statuses, or batch numbers within a single session. The total counted quantity for a product is the sum across all its entries.
- Quantities for gram-based products are converted automatically from the selected packaging unit to grams. Conversion uses the active sales_prices for the product to determine grams-per-unit.
- Inventory statuses (in_stock, in_use) are mapped to product_item_status records by name. The service layer also supports quarantine and damaged statuses, but the UI currently only offers in_stock and in_use.
- The server-side finalize endpoint rejects requests for non-open sessions as a safety guard, even though the UI only shows the finalize action on open sessions.

## Implemented By
- Routes: `GET /api/counting-sessions`, `POST /api/counting-sessions`, `GET /api/counting-sessions/:id`, `PUT /api/counting-sessions/:id`, `POST /api/counting-sessions/:id/finalize`, `POST /api/counting-sessions/:id/cancel`, `GET /api/counting-sessions/:id/records`, `POST /api/counting-sessions/:id/records`, `PUT /api/counting-session-records/:id`, `DELETE /api/counting-session-records/:id`, `GET /api/counting-sessions/:sessionId/products/:productId/total`, `GET /api/counting-sessions/:id/variance-analysis`, `GET /api/counting-sessions/:sessionId/products/:productId/variance`, `GET /api/counting-sessions-stats/open-count`, `GET /api/products/:id/packaging-units`, `GET /api/products/:id/expected-stock`, `GET /api/product-locations`
- Services: `server/countingSessionService.ts`
- Components: `client/src/pages/admin/CountingSessions.tsx`, `client/src/pages/admin/CountingSessionDetail.tsx`, `client/src/components/admin/CountingSessionDialog.tsx`, `client/src/components/admin/MultiUnitEntryDialog.tsx`, `client/src/components/admin/VarianceAnalysisTable.tsx`
