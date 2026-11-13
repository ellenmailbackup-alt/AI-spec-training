/**
 * Sales Service Layer
 *
 * Handles all sales-related business logic including:
 * - Sale creation with invoice number generation
 * - Sale updates with line item management
 * - Sale deletion with cascade cleanup
 * - Transaction management for data consistency
 */

import { db } from "./db";
import { storage } from "./storage";
import { invoiceService } from "./invoiceService";
import {
  sales,
  salesLines,
  salePayments,
  customers,
  products,
  vatClasses,
  paymentMethods,
  salesStatuses,
  stockMovements,
  stockMovementReasons,
  type Sale,
  type InsertSale,
  type InsertSalesLine,
  type InsertSalePayment,
  type SaleWithLines,
} from "@shared/schema";
import { eq, sql as sqlOp } from "drizzle-orm";

// Status IDs
const NEW_STATUS_ID = 1;
const SHIPPED_STATUS_ID = 2;
const INVOICED_STATUS_ID = 3;
const PAID_STATUS_ID = 4;

export interface CreateSaleRequest {
  customerId: number;
  salesDate: Date;
  salesStatus: number;
  paymentMethod: number;
  webshopSale?: boolean;
  shippingCostWithoutVat?: string;
  shippingCostWithVat?: string;
  discountPercentage?: string;
  discountWithoutVat?: string;
  discountWithVat?: string;
  lineItems: InsertSalesLine[];
  requiresInvoiceNumber: boolean;
}

export interface UpdateSaleRequest {
  customerId: number;
  salesDate: Date;
  salesStatus: number;
  paymentMethod: number;
  webshopSale?: boolean;
  stockUpdated?: boolean;
  uploadedAccounting?: boolean;
  shippingCostWithoutVat?: string;
  shippingCostWithVat?: string;
  discountPercentage?: string;
  discountWithoutVat?: string;
  discountWithVat?: string;
  lineItems: InsertSalesLine[];
}

export class SalesService {
  /**
   * Creates a new sale with automatic invoice number generation for B2B customers.
   *
   * This method:
   * 1. Generates invoice number if required (B2B customer)
   * 2. Creates the sale record
   * 3. Creates all line items
   * All within a single transaction for atomicity.
   *
   * @param request - The sale creation request
   * @returns The created sale with line items
   * @throws Error if validation fails or transaction fails
   */
  async createSale(request: CreateSaleRequest): Promise<SaleWithLines> {
    // Validate line items
    if (!request.lineItems || request.lineItems.length === 0) {
      throw new Error('Sale must have at least one line item');
    }

    return await db.transaction(async (tx) => {
      let invoiceNumber: string;

      // Generate invoice number for B2B customers
      if (request.requiresInvoiceNumber) {
        const nextNumber = await invoiceService.generateInvoiceNumber(tx);
        invoiceNumber = nextNumber.toString();
      } else {
        // B2C customers get "0"
        invoiceNumber = "0";
      }

      // Prepare sale data with defaults
      // Handle salesDate - it can be either a string (YYYY-MM-DD) or a Date object
      const salesDateString = typeof request.salesDate === 'string' 
        ? request.salesDate 
        : request.salesDate.toISOString().split('T')[0];

      const saleData: InsertSale = {
        customerId: request.customerId,
        invoiceNumber,
        salesDate: salesDateString,
        salesStatus: request.salesStatus,
        paymentMethod: request.paymentMethod,
        webshopSale: request.webshopSale ?? false,
        shippingCostWithoutVat: request.shippingCostWithoutVat ?? "0",
        shippingCostWithVat: request.shippingCostWithVat ?? "0",
        discountPercentage: request.discountPercentage ?? "0",
        discountWithoutVat: request.discountWithoutVat ?? "0",
        discountWithVat: request.discountWithVat ?? "0",
        stockUpdated: false,
        uploadedAccounting: false,
      };

      // Create sale
      const [sale] = await tx
        .insert(sales)
        .values(saleData)
        .returning();

      // Create line items
      const insertedLines = await tx
        .insert(salesLines)
        .values(request.lineItems.map(item => ({ ...item, saleId: sale.id })))
        .returning();

      // Calculate total from line items, shipping, and discount for payment record
      const lineItemsTotal = insertedLines.reduce((sum, line) => {
        return sum + parseFloat(line.totalWithVat);
      }, 0);
      const shippingCost = parseFloat(request.shippingCostWithVat ?? "0");
      const discountAmount = parseFloat(request.discountWithVat ?? "0");
      const totalAmount = lineItemsTotal + shippingCost - discountAmount;

      // Create payment record in sale_payment table
      const [payment] = await tx
        .insert(salePayments)
        .values({
          saleId: sale.id,
          paymentMethodId: request.paymentMethod,
          amount: totalAmount.toFixed(5),
        })
        .returning();

      // Fetch customer data within transaction
      const [customer] = await tx
        .select()
        .from(customers)
        .where(eq(customers.id, sale.customerId));

      // Fetch complete line items with product and VAT info within transaction
      const completeLines = await tx
        .select({
          salesLine: salesLines,
          product: products,
          vatPercentage: vatClasses.percentage,
        })
        .from(salesLines)
        .leftJoin(products, eq(salesLines.productId, products.id))
        .leftJoin(vatClasses, eq(products.vatClassId, vatClasses.id))
        .where(eq(salesLines.saleId, sale.id));

      // Construct and return SaleWithLines
      return {
        ...sale,
        salesLines: completeLines.map(({ salesLine, product, vatPercentage }) => ({
          ...salesLine,
          product: product!,
          vatPercentage: vatPercentage || '0',
        })),
        salePayments: [payment],
        customer: customer || null,
      };
    });
  }

  /**
   * Updates an existing sale and its line items.
   *
   * This method:
   * 1. Updates the sale record
   * 2. Deletes old line items
   * 3. Creates new line items
   * 4. Fetches complete sale with joins
   * All within a single transaction.
   *
   * Note: This preserves the invoice number - invoices cannot be renumbered.
   *
   * @param saleId - The ID of the sale to update
   * @param request - The update request
   * @returns The updated sale with details
   * @throws Error if sale not found or update fails
   */
  async updateSale(saleId: number, request: UpdateSaleRequest): Promise<any> {
    // Validate line items
    if (!request.lineItems || request.lineItems.length === 0) {
      throw new Error('Sale must have at least one line item');
    }

    return await db.transaction(async (tx) => {
      // Check if sale is paid before allowing update
      const [existingSale] = await tx
        .select({
          salesStatus: sales.salesStatus,
          statusName: salesStatuses.salesStatus,
        })
        .from(sales)
        .leftJoin(salesStatuses, eq(sales.salesStatus, salesStatuses.id))
        .where(eq(sales.id, saleId))
        .limit(1);

      if (!existingSale) {
        throw new Error('Sale not found');
      }

      if (existingSale.salesStatus === PAID_STATUS_ID) {
        throw new Error('Cannot edit a sale that has been marked as paid');
      }

      // Update sale record
      const updateData: any = {
        customerId: request.customerId,
        salesDate: request.salesDate,
        salesStatus: request.salesStatus,
        paymentMethod: request.paymentMethod,
      };

      // Include optional fields if provided
      if (request.webshopSale !== undefined) {
        updateData.webshopSale = request.webshopSale;
      }
      if (request.stockUpdated !== undefined) {
        updateData.stockUpdated = request.stockUpdated;
      }
      if (request.uploadedAccounting !== undefined) {
        updateData.uploadedAccounting = request.uploadedAccounting;
      }
      if (request.shippingCostWithoutVat !== undefined) {
        updateData.shippingCostWithoutVat = request.shippingCostWithoutVat;
      }
      if (request.shippingCostWithVat !== undefined) {
        updateData.shippingCostWithVat = request.shippingCostWithVat;
      }
      if (request.discountPercentage !== undefined) {
        updateData.discountPercentage = request.discountPercentage;
      }
      if (request.discountWithoutVat !== undefined) {
        updateData.discountWithoutVat = request.discountWithoutVat;
      }
      if (request.discountWithVat !== undefined) {
        updateData.discountWithVat = request.discountWithVat;
      }

      const [updatedSale] = await tx
        .update(sales)
        .set(updateData)
        .where(eq(sales.id, saleId))
        .returning();

      if (!updatedSale) {
        throw new Error('Sale not found');
      }

      // Delete existing line items
      await tx.delete(salesLines).where(eq(salesLines.saleId, saleId));

      // Insert new line items
      const insertedLines = await tx
        .insert(salesLines)
        .values(request.lineItems.map(item => ({ ...item, saleId })))
        .returning();

      // Calculate total from line items, shipping, and discount for payment record
      const lineItemsTotal = insertedLines.reduce((sum, line) => {
        return sum + parseFloat(line.totalWithVat);
      }, 0);
      const shippingCost = parseFloat(request.shippingCostWithVat ?? "0");
      const discountAmount = parseFloat(request.discountWithVat ?? "0");
      const totalAmount = lineItemsTotal + shippingCost - discountAmount;

      // Delete existing payment records
      await tx.delete(salePayments).where(eq(salePayments.saleId, saleId));

      // Create new payment record
      await tx
        .insert(salePayments)
        .values({
          saleId,
          paymentMethodId: request.paymentMethod,
          amount: totalAmount.toFixed(5),
        });

      // Fetch sale with joins for complete response
      const [saleWithDetails] = await tx
        .select({
          id: sales.id,
          invoiceNumber: sales.invoiceNumber,
          customerId: sales.customerId,
          salesDate: sales.salesDate,
          paymentMethod: sales.paymentMethod,
          salesStatus: sales.salesStatus,
          webshopSale: sales.webshopSale,
          stockUpdated: sales.stockUpdated,
          uploadedAccounting: sales.uploadedAccounting,
          shippingCostWithoutVat: sales.shippingCostWithoutVat,
          shippingCostWithVat: sales.shippingCostWithVat,
          discountPercentage: sales.discountPercentage,
          discountWithoutVat: sales.discountWithoutVat,
          discountWithVat: sales.discountWithVat,
          customerName: customers.firstName,
          paymentMethodName: paymentMethods.paymentMethod,
          salesStatusName: salesStatuses.salesStatus,
        })
        .from(sales)
        .leftJoin(customers, eq(sales.customerId, customers.id))
        .leftJoin(paymentMethods, eq(sales.paymentMethod, paymentMethods.id))
        .leftJoin(salesStatuses, eq(sales.salesStatus, salesStatuses.id))
        .where(eq(sales.id, saleId));

      return {
        ...saleWithDetails,
        lines: insertedLines,
      };
    });
  }

  /**
   * Deletes a sale and all its line items.
   *
   * This method:
   * 1. Deletes all line items first (foreign key constraint)
   * 2. Deletes the sale record
   * All within a single transaction.
   *
   * @param saleId - The ID of the sale to delete
   * @returns true if deleted, false if not found
   */
  async deleteSale(saleId: number): Promise<boolean> {
    return await db.transaction(async (tx) => {
      // Check if sale is paid before allowing delete
      const [existingSale] = await tx
        .select({
          salesStatus: sales.salesStatus,
          statusName: salesStatuses.salesStatus,
        })
        .from(sales)
        .leftJoin(salesStatuses, eq(sales.salesStatus, salesStatuses.id))
        .where(eq(sales.id, saleId))
        .limit(1);

      if (!existingSale) {
        return false;
      }

      if (existingSale.salesStatus === PAID_STATUS_ID) {
        throw new Error('Cannot delete a sale that has been marked as paid');
      }

      // Delete payment records first
      await tx.delete(salePayments).where(eq(salePayments.saleId, saleId));

      // Delete line items (foreign key constraint)
      await tx.delete(salesLines).where(eq(salesLines.saleId, saleId));

      // Delete sale
      const result = await tx.delete(sales).where(eq(sales.id, saleId));

      return result.rowCount ? result.rowCount > 0 : false;
    });
  }

  /**
   * Helper method to create stock movements for a sale.
   * Creates negative quantity movements (deductions) for all line items.
   *
   * @param tx - Transaction context
   * @param saleId - The ID of the sale
   */
  private async createStockMovementsForSale(tx: any, saleId: number): Promise<void> {
    // Get the sale to retrieve the sales date
    const [sale] = await tx
      .select()
      .from(sales)
      .where(eq(sales.id, saleId))
      .limit(1);

    if (!sale) {
      throw new Error('Sale not found');
    }

    // Get sale line items
    const saleLines = await tx
      .select()
      .from(salesLines)
      .where(eq(salesLines.saleId, saleId));

    if (saleLines.length === 0) {
      // No line items - skip stock movement creation
      console.log(`Sale ${saleId} has no line items, skipping stock movements`);
      return;
    }

    // Get SALE stock movement reason
    const [saleReason] = await tx
      .select()
      .from(stockMovementReasons)
      .where(sqlOp`UPPER(${stockMovementReasons.reason}) = 'SALE'`)
      .limit(1);

    if (!saleReason) {
      throw new Error('SALE stock movement reason not found in database');
    }

    // Use the sale's date for stock movements instead of current date
    const movementDate = sale.salesDate;

    // Create stock movements for each line item
    for (const line of saleLines) {
      // weight is the per-unit weight; amount is the number of units sold
      const stockQuantity = parseFloat(line.weight) * parseFloat(line.amount);
      await tx.insert(stockMovements).values({
        productId: line.productId,
        quantity: (-stockQuantity).toFixed(5), // Negative for sales (deduction)
        reason: saleReason.id,
        saleId: saleId,
        date: movementDate,
      });
    }
  }

  /**
   * Updates only the status of a sale with automatic stock movement handling.
   * 
   * Business Rules:
   * 1. SHIPPED status: Automatically creates stock movements (if not exist)
   * 2. INVOICED status: Returns confirmation flag if no stock movements exist
   * 3. PAID status: Cannot be changed once set
   * 4. Cannot move backwards (e.g., SHIPPED → NEW)
   *
   * @param saleId - The ID of the sale
   * @param statusId - The new status ID
   * @param createStockMovements - Whether to create stock movements (for INVOICED confirmation)
   * @returns Object with sale, confirmation flag, and optional message
   */
  async updateSaleStatus(
    saleId: number, 
    statusId: number, 
    createStockMovements: boolean = true
  ): Promise<{
    sale: Sale | undefined;
    needsConfirmation: boolean;
    message?: string;
  }> {
    return await db.transaction(async (tx) => {
      // Get current sale
      const [currentSale] = await tx
        .select()
        .from(sales)
        .where(eq(sales.id, saleId))
        .limit(1);

      if (!currentSale) {
        throw new Error('Sale not found');
      }

      // RULE 1: Prevent changing status from PAID
      if (currentSale.salesStatus === PAID_STATUS_ID && statusId !== PAID_STATUS_ID) {
        throw new Error('Cannot change the status of a paid sale');
      }

      // RULE 2: Prevent backwards status changes
      if (statusId < currentSale.salesStatus && currentSale.salesStatus !== PAID_STATUS_ID) {
        throw new Error('Cannot move to a previous status');
      }

      // Check if stock movements already exist for this sale
      const existingStockMovements = await tx
        .select()
        .from(stockMovements)
        .where(eq(stockMovements.saleId, saleId))
        .limit(1);

      const hasStockMovements = existingStockMovements.length > 0;

      // RULE 3: When changing to SHIPPED - auto-create stock movements
      if (statusId === SHIPPED_STATUS_ID && !hasStockMovements) {
        await this.createStockMovementsForSale(tx, saleId);
        
        // Update status
        const [updatedSale] = await tx
          .update(sales)
          .set({ salesStatus: statusId, stockUpdated: true })
          .where(eq(sales.id, saleId))
          .returning();

        return {
          sale: updatedSale,
          needsConfirmation: false,
          message: 'Status updated to SHIPPED and stock movements created'
        };
      }

      // RULE 4: When changing to INVOICED without stock movements - ask for confirmation
      if (statusId === INVOICED_STATUS_ID && !hasStockMovements && !createStockMovements) {
        // Frontend needs to ask user for confirmation
        return {
          sale: currentSale,
          needsConfirmation: true,
          message: 'No stock movements found. Do you want to create them?'
        };
      }

      // RULE 5: When changing to INVOICED with confirmation YES - create stock movements
      if (statusId === INVOICED_STATUS_ID && !hasStockMovements && createStockMovements) {
        await this.createStockMovementsForSale(tx, saleId);
      }

      // Update status
      const [updatedSale] = await tx
        .update(sales)
        .set({ 
          salesStatus: statusId,
          stockUpdated: hasStockMovements || createStockMovements
        })
        .where(eq(sales.id, saleId))
        .returning();

      return {
        sale: updatedSale,
        needsConfirmation: false
      };
    });
  }

  /**
   * Gets a sale by ID.
   * Delegates to storage layer for simple read operations.
   *
   * @param saleId - The ID of the sale
   * @returns The sale with lines or undefined if not found
   */
  async getSale(saleId: number): Promise<SaleWithLines | undefined> {
    return storage.getSale(saleId);
  }

  /**
   * Gets all sales.
   * Delegates to storage layer for simple read operations.
   *
   * @returns Array of all sales
   */
  async getSales(): Promise<Sale[]> {
    return storage.getSales();
  }

  /**
   * Gets sales for a specific customer.
   * Delegates to storage layer for simple read operations.
   *
   * @param customerId - The customer ID
   * @returns Array of sales for the customer
   */
  async getSalesByCustomer(customerId: number): Promise<Sale[]> {
    return storage.getSalesByCustomer(customerId);
  }
}

export const salesService = new SalesService();
