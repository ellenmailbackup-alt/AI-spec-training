import * as XLSX from 'xlsx';
import { db } from './db';
import {
  customers,
  sales,
  salesLines,
  salesPrices,
  products,
  mapSudBoeren,
  customerPrices,
  productUnits
} from '@shared/schema';
import { eq, and, like, or, sql } from 'drizzle-orm';
import { z } from 'zod';

// ============== TYPES ==============

export interface ExcelRow {
  rowNumber: number;
  farmNumber: string;          // Column B
  farmName: string;             // Column C
  salesDate: string;            // Column D
  productReference: string;     // Column E
  productName: string;          // Column F
  quantity: number;             // Column I
  unitPriceExclVAT: number;     // Column J
}

export interface ValidationError {
  rowNumber: number;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface MappingSuggestion {
  productReference: string;     // Column E value
  productName: string;          // Column F value
  suggestedSalesPriceId: number | null;
  suggestedProduct?: {
    id: number;
    name: string;
    nameDutch: string;
  };
  suggestedSalesPrice?: {
    id: number;
    productId: number;
    amount: number;
    unit: string;
    b2cPriceWithoutVat: string;
    b2cPriceWithVat: string;
  };
  confidence: 'high' | 'medium' | 'low' | 'none';
}

export interface ParsedImport {
  rows: ExcelRow[];
  validationErrors: ValidationError[];
  unmappedProducts: MappingSuggestion[];
  summary: {
    totalRows: number;
    validRows: number;
    errorRows: number;
    warningRows: number;
    uniqueFarms: number;
  };
}

export interface ImportResult {
  success: boolean;
  salesCreated: number;
  salesLinesCreated: number;
  errors: string[];
}

// ============== SERVICE CLASS ==============

class BoerenImportService {

  /**
   * Parse Excel file buffer and validate data
   */
  async parseExcelFile(buffer: Buffer): Promise<ParsedImport> {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      // Convert to JSON (skip header row)
      const rawData: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      const rows: ExcelRow[] = [];
      const validationErrors: ValidationError[] = [];
      const unmappedReferences = new Set<string>();

      // Start from row 2 (index 1, after header at index 0)
      for (let i = 1; i < rawData.length; i++) {
        const row = rawData[i];
        const rowNumber = i + 1; // Excel row numbers start at 1, +1 for header

        // Skip empty rows
        if (!row || row.length === 0 || !row[1]) {
          continue;
        }

        // Parse row data (Excel is 0-indexed)
        const farmNumber = String(row[1] || '').trim();       // Column B
        const farmName = String(row[2] || '').trim();         // Column C
        const salesDate = this.parseExcelDate(row[3]);        // Column D
        const productReference = String(row[4] || '').trim(); // Column E
        const productName = String(row[5] || '').trim();      // Column F
        const quantity = parseInt(row[8]) || 0;               // Column I
        const unitPriceExclVAT = parseFloat(row[9]) || 0;     // Column J

        // Validate required fields
        if (!farmNumber) {
          validationErrors.push({
            rowNumber,
            field: 'farmNumber',
            message: 'Farm number is missing',
            severity: 'error'
          });
        }

        if (!productReference) {
          validationErrors.push({
            rowNumber,
            field: 'productReference',
            message: 'Product reference is missing',
            severity: 'error'
          });
        }

        if (!salesDate || salesDate === 'Invalid Date') {
          validationErrors.push({
            rowNumber,
            field: 'salesDate',
            message: 'Invalid or missing sales date',
            severity: 'error'
          });
        }

        if (quantity <= 0) {
          validationErrors.push({
            rowNumber,
            field: 'quantity',
            message: 'Quantity must be greater than 0',
            severity: 'error'
          });
        }

        if (unitPriceExclVAT < 0) {
          validationErrors.push({
            rowNumber,
            field: 'unitPriceExclVAT',
            message: 'Unit price cannot be negative',
            severity: 'error'
          });
        }

        // Track unmapped references
        if (productReference) {
          unmappedReferences.add(productReference);
        }

        rows.push({
          rowNumber,
          farmNumber,
          farmName,
          salesDate,
          productReference,
          productName,
          quantity,
          unitPriceExclVAT
        });
      }

      // Check which product references are not mapped
      const unmappedProducts = await this.findUnmappedProducts(Array.from(unmappedReferences), rows);

      // Check if farms exist as customers
      await this.validateFarmsExist(rows, validationErrors);

      const uniqueFarms = new Set(rows.map(r => r.farmNumber)).size;
      const errorRows = new Set(validationErrors.filter(e => e.severity === 'error').map(e => e.rowNumber)).size;
      const warningRows = new Set(validationErrors.filter(e => e.severity === 'warning').map(e => e.rowNumber)).size;

      return {
        rows,
        validationErrors,
        unmappedProducts,
        summary: {
          totalRows: rows.length,
          validRows: rows.length - errorRows,
          errorRows,
          warningRows,
          uniqueFarms
        }
      };

    } catch (error) {
      console.error('Error parsing Excel file:', error);
      throw new Error('Failed to parse Excel file: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  /**
   * Parse Excel date value (handles both serial numbers and date strings)
   */
  private parseExcelDate(value: any): string {
    if (!value) return 'Invalid Date';

    // If it's already a string that looks like a date
    if (typeof value === 'string') {
      // Try to parse various date formats
      // Handle ISO format: 2025-07-31
      const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (isoMatch) {
        return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
      }
      // Handle DD/MM/YYYY or DD-MM-YYYY format
      const euMatch = value.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
      if (euMatch) {
        const day = String(euMatch[1]).padStart(2, '0');
        const month = String(euMatch[2]).padStart(2, '0');
        const year = euMatch[3];
        return `${year}-${month}-${day}`;
      }
      return 'Invalid Date';
    }

    // If it's an Excel serial number
    if (typeof value === 'number') {
      // Excel stores dates as days since January 0, 1900 (with a bug for Feb 29, 1900)
      // The correct calculation: serial 1 = Jan 1, 1900
      // We need to convert to a JavaScript Date correctly
      // Excel serial 1 = 1900-01-01, so base is 1899-12-31
      const baseDate = new Date(Date.UTC(1899, 11, 31)); // Dec 31, 1899 in UTC
      const days = Math.floor(value);
      // Adjust for Excel's leap year bug (Excel thinks 1900 was a leap year)
      const adjustedDays = days > 59 ? days - 1 : days;
      const resultDate = new Date(baseDate.getTime() + adjustedDays * 24 * 60 * 60 * 1000);
      
      if (!isNaN(resultDate.getTime())) {
        const year = resultDate.getUTCFullYear();
        const month = String(resultDate.getUTCMonth() + 1).padStart(2, '0');
        const day = String(resultDate.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    }

    return 'Invalid Date';
  }

  /**
   * Validate that all farms exist as customers
   */
  private async validateFarmsExist(rows: ExcelRow[], validationErrors: ValidationError[]): Promise<void> {
    const uniqueFarms = [...new Set(rows.map(r => r.farmNumber))];

    for (const farmNumber of uniqueFarms) {
      const customer = await db
        .select()
        .from(customers)
        .where(eq(customers.woocommerceId, farmNumber))
        .limit(1);

      if (customer.length === 0) {
        // Find all rows with this farm number
        const affectedRows = rows.filter(r => r.farmNumber === farmNumber).map(r => r.rowNumber);
        affectedRows.forEach(rowNumber => {
          validationErrors.push({
            rowNumber,
            field: 'farmNumber',
            message: `Farm "${farmNumber}" not found in customers (check woocommerce_id field)`,
            severity: 'error'
          });
        });
      }
    }
  }

  /**
   * Find unmapped product references and suggest mappings
   */
  private async findUnmappedProducts(references: string[], rows: ExcelRow[]): Promise<MappingSuggestion[]> {
    const suggestions: MappingSuggestion[] = [];

    for (const reference of references) {
      // Check if mapping exists
      const mapping = await db
        .select()
        .from(mapSudBoeren)
        .where(eq(mapSudBoeren.mapBoerenId, reference))
        .limit(1);

      if (mapping.length === 0) {
        // Find the product name from the first row with this reference
        const row = rows.find(r => r.productReference === reference);
        const productName = row?.productName || '';

        // Try to suggest a mapping
        const suggestion = await this.suggestMapping(productName, reference);
        suggestions.push(suggestion);
      }
    }

    return suggestions;
  }

  /**
   * Suggest a sales_price mapping based on product name
   */
  async suggestMapping(productNameWithUnit: string, productReference: string): Promise<MappingSuggestion> {
    try {
      // Parse product name and unit
      const { productName, amount, unit } = this.parseProductNameAndUnit(productNameWithUnit);

      if (!productName) {
        return {
          productReference,
          productName: productNameWithUnit,
          suggestedSalesPriceId: null,
          confidence: 'none'
        };
      }

      // Search for products with fuzzy matching
      const matchedProducts = await db
        .select()
        .from(products)
        .where(
          or(
            like(products.nameDutch, `%${productName}%`),
            like(products.name, `%${productName}%`),
            like(products.posShortNameDutch, `%${productName}%`)
          )
        )
        .limit(5);

      if (matchedProducts.length === 0) {
        return {
          productReference,
          productName: productNameWithUnit,
          suggestedSalesPriceId: null,
          confidence: 'none'
        };
      }

      // If we have a weight/unit, try to find exact match in sales_prices
      let bestMatch: any = null;
      let confidence: 'high' | 'medium' | 'low' = 'low';

      if (amount && unit) {
        for (const product of matchedProducts) {
          const priceMatches = await db
            .select()
            .from(salesPrices)
            .where(
              and(
                eq(salesPrices.productId, product.id),
                eq(salesPrices.amount, amount),
                eq(salesPrices.unit, unit),
                eq(salesPrices.posItem, true)
              )
            )
            .limit(1);

          if (priceMatches.length > 0) {
            bestMatch = {
              product,
              salesPrice: priceMatches[0]
            };
            confidence = 'high';
            break;
          }
        }
      }

      // If no exact match, suggest first product's POS price
      if (!bestMatch && matchedProducts.length > 0) {
        const firstProduct = matchedProducts[0];
        const anyPrice = await db
          .select()
          .from(salesPrices)
          .where(
            and(
              eq(salesPrices.productId, firstProduct.id),
              eq(salesPrices.posItem, true)
            )
          )
          .limit(1);

        if (anyPrice.length > 0) {
          bestMatch = {
            product: firstProduct,
            salesPrice: anyPrice[0]
          };
          confidence = amount && unit ? 'medium' : 'low';
        }
      }

      if (bestMatch) {
        return {
          productReference,
          productName: productNameWithUnit,
          suggestedSalesPriceId: bestMatch.salesPrice.id,
          suggestedProduct: {
            id: bestMatch.product.id,
            name: bestMatch.product.name,
            nameDutch: bestMatch.product.nameDutch
          },
          suggestedSalesPrice: {
            id: bestMatch.salesPrice.id,
            productId: bestMatch.salesPrice.productId,
            amount: bestMatch.salesPrice.amount,
            unit: bestMatch.salesPrice.unit,
            b2cPriceWithoutVat: bestMatch.salesPrice.b2cPriceWithoutVat,
            b2cPriceWithVat: bestMatch.salesPrice.b2cPriceWithVat
          },
          confidence
        };
      }

      return {
        productReference,
        productName: productNameWithUnit,
        suggestedSalesPriceId: null,
        confidence: 'none'
      };

    } catch (error) {
      console.error('Error suggesting mapping:', error);
      return {
        productReference,
        productName: productNameWithUnit,
        suggestedSalesPriceId: null,
        confidence: 'none'
      };
    }
  }

  /**
   * Parse product name and extract weight/unit
   * Example: "Earl Grey - 100 g" => { productName: "Earl Grey", amount: 100, unit: "g" }
   */
  private parseProductNameAndUnit(fullName: string): { productName: string; amount: number | null; unit: string | null } {
    // Match patterns like "100 g", "1 kg", "250g", "1kg"
    const unitPattern = /(\d+)\s*(g|kg|ml|l)$/i;
    const match = fullName.match(unitPattern);

    if (match) {
      const amount = parseInt(match[1]);
      const unit = match[2].toLowerCase();
      const productName = fullName.replace(unitPattern, '').replace(/\s*-\s*$/, '').trim();

      return { productName, amount, unit };
    }

    return { productName: fullName.trim(), amount: null, unit: null };
  }

  /**
   * Save a mapping to map_sud_boeren table
   */
  async saveMapping(productReference: string, salesPriceId: number): Promise<void> {
    try {
      // Check if mapping already exists
      const existing = await db
        .select()
        .from(mapSudBoeren)
        .where(eq(mapSudBoeren.mapBoerenId, productReference))
        .limit(1);

      if (existing.length > 0) {
        // Update existing mapping
        await db
          .update(mapSudBoeren)
          .set({ mapSudId: String(salesPriceId) })
          .where(eq(mapSudBoeren.mapBoerenId, productReference));
      } else {
        // Insert new mapping
        await db
          .insert(mapSudBoeren)
          .values({
            mapBoerenId: productReference,
            mapSudId: String(salesPriceId)
          });
      }
    } catch (error) {
      console.error('Error saving mapping:', error);
      throw new Error('Failed to save mapping');
    }
  }

  /**
   * Execute import: create sales and sales_lines records
   */
  async executeImport(rows: ExcelRow[]): Promise<ImportResult> {
    const errors: string[] = [];
    let salesCreated = 0;
    let salesLinesCreated = 0;

    try {
      // Group rows by farm number AND date (one sale per farm per date)
      const rowsByFarmAndDate = new Map<string, ExcelRow[]>();
      for (const row of rows) {
        const key = `${row.farmNumber}_${row.salesDate}`;
        if (!rowsByFarmAndDate.has(key)) {
          rowsByFarmAndDate.set(key, []);
        }
        rowsByFarmAndDate.get(key)!.push(row);
      }

      // Create one sale per farm per date
      for (const [farmDateKey, farmRows] of rowsByFarmAndDate.entries()) {
        const farmNumber = farmRows[0].farmNumber;
        const salesDate = farmRows[0].salesDate;
        
        try {
          await db.transaction(async (tx) => {
            // Get customer ID
            const [customer] = await tx
              .select()
              .from(customers)
              .where(eq(customers.woocommerceId, farmNumber))
              .limit(1);

            if (!customer) {
              errors.push(`Farm ${farmNumber} (${salesDate}): Customer not found`);
              return;
            }

            // Create sale record with status = NEW (1)
            const [sale] = await tx
              .insert(sales)
              .values({
                customerId: customer.id,
                invoiceNumber: '0',
                salesDate,
                salesStatus: 1, // NEW
                paymentMethod: 1, // Default payment method
                shippingClass: null,
                shippingCostWithoutVat: '0',
                shippingCostWithVat: '0',
                discountPercentage: '0',
                discountWithoutVat: '0',
                discountWithVat: '0',
                invoiceRemark: 'Imported from Boeren en Buren',
                creationDate: new Date(),
                modificationDate: new Date()
              })
              .returning();

            // Aggregate quantities by product reference + weight
            const aggregatedLines = new Map<string, {
              salesPriceId: number;
              productId: number;
              amount: number;
              unit: string;
              quantity: number;
              unitPriceWithoutVat: string;
              unitPriceWithVat: string;
              customerId: number;
            }>();

            for (const row of farmRows) {
              // Get mapping
              const [mapping] = await tx
                .select()
                .from(mapSudBoeren)
                .where(eq(mapSudBoeren.mapBoerenId, row.productReference))
                .limit(1);

              if (!mapping) {
                throw new Error(`Row ${row.rowNumber}: No mapping found for ${row.productReference}`);
              }

              const salesPriceId = parseInt(mapping.mapSudId);

              // Get sales price details
              const [salesPrice] = await tx
                .select()
                .from(salesPrices)
                .where(eq(salesPrices.id, salesPriceId))
                .limit(1);

              if (!salesPrice) {
                throw new Error(`Row ${row.rowNumber}: Sales price ${salesPriceId} not found`);
              }

              // Check for customer-specific pricing (allows special prices for farms)
              const [customerPrice] = await tx
                .select()
                .from(customerPrices)
                .where(
                  and(
                    eq(customerPrices.salesUnitDefaultId, salesPriceId),
                    eq(customerPrices.customerId, customer.id)
                  )
                )
                .limit(1);

              // Use customer price if available, otherwise B2C price
              const unitPriceWithoutVat = customerPrice
                ? customerPrice.customerUnitPriceWithoutVat
                : salesPrice.b2cPriceWithoutVat;
              const unitPriceWithVat = customerPrice
                ? customerPrice.customerUnitPriceWithVat
                : salesPrice.b2cPriceWithVat;

              // Create aggregation key: salesPriceId + amount + unit
              const aggKey = `${salesPriceId}_${salesPrice.amount}_${salesPrice.unit}`;

              if (aggregatedLines.has(aggKey)) {
                // Add to existing quantity
                const existing = aggregatedLines.get(aggKey)!;
                existing.quantity += row.quantity;
              } else {
                // New line
                aggregatedLines.set(aggKey, {
                  salesPriceId,
                  productId: salesPrice.productId,
                  amount: salesPrice.amount,
                  unit: salesPrice.unit,
                  quantity: row.quantity,
                  unitPriceWithoutVat,
                  unitPriceWithVat,
                  customerId: customer.id
                });
              }
            }

            // Ensure we have lines to create
            if (aggregatedLines.size === 0) {
              throw new Error(`Farm ${farmNumber}: No valid sales lines to import`);
            }

            // Create sales lines
            for (const lineData of aggregatedLines.values()) {
              const lineTotalWithoutVat = (parseFloat(lineData.unitPriceWithoutVat) * lineData.quantity).toFixed(5);
              const lineTotalWithVat = (parseFloat(lineData.unitPriceWithVat) * lineData.quantity).toFixed(5);

              // Ensure weight and unit have valid values
              // Handle null, undefined, 0, NaN and string "null" cases
              let weight: number;
              if (lineData.amount === null || lineData.amount === undefined || lineData.amount === 0 || 
                  String(lineData.amount) === 'null' || isNaN(Number(lineData.amount))) {
                weight = 1; // Default to 1 if no valid weight
              } else {
                weight = Number(lineData.amount);
              }
              
              const unit = lineData.unit || 'stuk';

              if (!weight || weight <= 0 || isNaN(weight)) {
                weight = 1; // Final fallback to ensure we never have invalid weight
              }

              await tx
                .insert(salesLines)
                .values({
                  saleId: sale.id,
                  productId: lineData.productId,
                  weight: String(weight),
                  unit: unit,
                  amount: lineData.quantity,
                  unitPriceWithoutVat: lineData.unitPriceWithoutVat,
                  unitPriceWithVat: lineData.unitPriceWithVat,
                  totalWithoutVat: lineTotalWithoutVat,
                  totalWithVat: lineTotalWithVat,
                  creationDate: new Date(),
                  modificationDate: new Date()
                });

              salesLinesCreated++;
            }

            // Only increment salesCreated after successful transaction
            salesCreated++;
          });

        } catch (error) {
          console.error(`Error processing farm ${farmNumber}:`, error);
          errors.push(`Farm ${farmNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return {
        success: errors.length === 0,
        salesCreated,
        salesLinesCreated,
        errors
      };

    } catch (error) {
      console.error('Error executing import:', error);
      throw new Error('Failed to execute import: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  /**
   * Get all current mappings
   */
  async getMappings(): Promise<Array<{
    mapBoerenId: string;
    mapSudId: string;
    productName?: string;
    salesPriceInfo?: string;
  }>> {
    try {
      const mappings = await db
        .select({
          mapBoerenId: mapSudBoeren.mapBoerenId,
          mapSudId: mapSudBoeren.mapSudId,
          productId: salesPrices.productId,
          productName: products.nameDutch,
          amount: salesPrices.amount,
          unit: salesPrices.unit,
          price: salesPrices.b2cPriceWithVat
        })
        .from(mapSudBoeren)
        .leftJoin(
          salesPrices,
          sql`CAST(${mapSudBoeren.mapSudId} AS INTEGER) = ${salesPrices.id}`
        )
        .leftJoin(products, eq(salesPrices.productId, products.id))
        .orderBy(mapSudBoeren.mapBoerenId);

      return mappings.map(m => ({
        mapBoerenId: m.mapBoerenId,
        mapSudId: m.mapSudId,
        productName: m.productName || undefined,
        salesPriceInfo: m.amount && m.unit
          ? `${m.amount}${m.unit} - €${m.price}`
          : undefined
      }));
    } catch (error) {
      console.error('Error fetching mappings:', error);
      throw new Error('Failed to fetch mappings');
    }
  }

  /**
   * Delete a mapping
   */
  async deleteMapping(productReference: string): Promise<boolean> {
    try {
      const result = await db
        .delete(mapSudBoeren)
        .where(eq(mapSudBoeren.mapBoerenId, productReference))
        .returning();

      return result.length > 0;
    } catch (error) {
      console.error('Error deleting mapping:', error);
      throw new Error('Failed to delete mapping');
    }
  }
}

export const boerenImportService = new BoerenImportService();
