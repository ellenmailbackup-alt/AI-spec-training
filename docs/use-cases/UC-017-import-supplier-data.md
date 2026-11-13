# UC-017: Import Boeren en Buren Sales Data

The admin imports monthly transaction data from the Boeren en Buren supplier channel by uploading a spreadsheet file, resolving product mappings, and confirming the import. The system converts the supplier records into sales attributed to the Boeren en Buren channel.

## Metadata
- **Domain:** Sales / Inventory
- **Primary Actor:** Admin
- **Secondary Actors:** None
- **Priority:** Should
- **Status:** Approved
- **Interface:** Admin Dashboard

## Preconditions
- Admin is authenticated and has admin privileges
- A spreadsheet file from the Boeren en Buren supplier is available
- Products and sales prices exist in the system for mapping
- Farm numbers in the file correspond to existing customers (matched by external reference)

## Main Flow
1. The admin requests to import Boeren en Buren data.
2. The admin selects a spreadsheet file to upload.
3. The system reads the file and identifies the transaction rows, each containing: farm number, farm name, sales date, product reference, product name, quantity, and unit price excluding VAT.
4. The system verifies the structure and content of each row, checking that required fields are present, quantities are positive, prices are not negative, dates are valid, and farm numbers correspond to existing customers.
5. The system checks saved product mappings and tries to find matches for unmapped supplier product references among existing products.
6. The system presents a validation summary showing: total rows, valid rows, error count, warning count, and number of unique farms.
7. If unmapped products exist, the system presents each unmapped product reference with its supplier name, a suggested product match (if found), and a confidence level (high, medium, low, or none).
8. The admin reviews each unmapped product and either accepts the suggested mapping or manually selects a product from the system's product list.
9. When the admin accepts a mapping, the system saves the mapping between the supplier product reference and the corresponding sales price for future imports.
10. Once all products are mapped and no validation errors remain, the admin confirms the import.
11. The system asks the admin to confirm that sales will be recorded based on the validated data.
12. The system groups the rows by farm and date, so that one sale is recorded per farm per date.
13. For each group, the system looks up the customer, determines the sales price from each product mapping, checks for customer-specific pricing, and combines lines for the same product within the group into a single line.
14. The system records the sales with their line items, processing each farm-date group independently.
15. The system presents the import result showing: number of sales recorded, number of sale lines recorded, and any errors encountered for individual farm-date groups.

## Alternative Flows
- **AF-1: Review Saved Mappings** -- Before step 2, the admin requests to view all existing supplier-to-product mappings. The system presents the list showing: supplier product reference, mapped product name, weight/unit, and price. The admin reviews the mappings and returns to step 2.
- **AF-2: Remove Saved Mapping** -- During AF-1, the admin selects a mapping to remove. The system asks for confirmation, then removes the mapping. The flow rejoins AF-1 at the mapping list.
- **AF-3: Restart with Different File** -- At step 6, 7, or 10, the admin decides to go back and select a different file. The flow restarts at step 1.

## Exception Flows
- **EF-1: Invalid File Format** -- At step 3, the file cannot be read or does not contain recognizable data. The system informs the admin of the parsing failure. The import does not proceed.
- **EF-2: File Too Large** -- At step 3, the uploaded file exceeds the maximum allowed size. The system informs the admin. The import does not proceed.
- **EF-3: Unresolvable Validation Errors** -- At step 10, validation errors remain that prevent the import (such as missing farm numbers, invalid dates, or zero quantities). The system prevents the admin from proceeding until all errors are resolved in the source file and re-uploaded.
- **EF-4: Unmapped Products Remain** -- At step 10, one or more supplier product references still have no mapping and no suggestion could be accepted. The system prevents the admin from proceeding until all mappings are resolved.
- **EF-5: Farm-Date Group Failure** -- At step 14, recording fails for a specific farm-date group (for example, a missing mapping or missing sales price). That group is not recorded, but other groups may still succeed. The system reports which groups failed and why.

## Postconditions
- Sales are recorded for the imported Boeren en Buren transactions, one sale per farm per date
- Each sale has line items with product, quantity, weight, unit, and pricing (including customer-specific prices where applicable)
- New product mappings accepted during the import are saved for reuse in future imports
- All recorded sales have status "new" and can be reviewed in the sales overview

## Business Rules
- **BR-1:** Each farm number in the file must match an existing customer by external reference; rows with unrecognized farm numbers are flagged as errors
- **BR-2:** All supplier product references must be mapped to a sales price before the import can proceed
- **BR-3:** When a customer-specific price exists for the mapped sales price, that price is used instead of the standard B2C price
- **BR-4:** Quantity must be greater than zero; unit price must not be negative

## Implementation Notes
- The supplier file is an Excel (.xls, .xlsx) or CSV format; the system uses the XLSX library to parse rows from memory
- Maximum file size is 10 MB, enforced at the upload layer
- Product name matching uses substring comparison against Dutch name, English name, and POS short name fields to generate mapping suggestions
- When a product name contains a weight and unit suffix (e.g., "Earl Grey - 100 g"), the system extracts amount and unit to refine the match against sales prices
- Farm numbers are matched via the `woocommerceId` field on the customer record
- The mapping table (`map_sud_boeren`) stores supplier product reference to sales price ID relationships
- Lines within the same farm-date group that map to the same sales price are combined into a single sale line with combined quantity
- Each farm-date group is recorded within its own transaction -- if any line within a group fails, no lines from that group are recorded, but other groups may still succeed
- Sales are recorded with status 1 (new) and payment method 1 (default), with invoice remark "Imported from Boeren en Buren"

## Implemented By
- Routes: `POST /api/boeren-import/parse`, `POST /api/boeren-import/suggest-mapping`, `POST /api/boeren-import/save-mapping`, `POST /api/boeren-import/execute`, `GET /api/boeren-import/mappings`, `DELETE /api/boeren-import/mappings/:reference`
- Services: `server/boerenImportService.ts`
- Components: `client/src/pages/admin/BoerenImport.tsx`
