/**
 * Invoice Service Layer
 *
 * Handles invoice number generation with atomic, race-condition-safe operations.
 * Invoice numbers are sequential per year and must never have duplicates.
 */

import { db } from "./db";
import { invoiceNumbers, type InvoiceNumber } from "@shared/schema";
import { eq } from "drizzle-orm";
import { parameterService } from "./parameterService";

export class InvoiceService {
  /**
   * Gets the next invoice number for preview (read-only).
   * Does not increment the counter or reserve the number.
   *
   * @returns The next invoice number that will be assigned
   * @throws Error if current year not configured or invoice record not found
   */
  async getNextInvoiceNumber(): Promise<number> {
    const currentYear = await parameterService.getCurrentYear();

    const [invoiceNumberRecord] = await db
      .select()
      .from(invoiceNumbers)
      .where(eq(invoiceNumbers.invoiceYear, currentYear));

    if (!invoiceNumberRecord) {
      throw new Error(
        `Invoice number record not found for year ${currentYear}. ` +
        `Please initialize the invoice_number table for this year.`
      );
    }

    return invoiceNumberRecord.invoiceLastNumber + 1;
  }

  /**
   * Generates and reserves the next invoice number atomically.
   *
   * This method uses row-level locking (SELECT ... FOR UPDATE) to prevent
   * race conditions when multiple requests try to generate invoice numbers
   * simultaneously.
   *
   * Must be called within a transaction context.
   *
   * @param tx - The database transaction context
   * @returns The newly assigned invoice number
   * @throws Error if invoice record not found
   */
  async generateInvoiceNumber(tx: any): Promise<number> {
    const currentYear = await parameterService.getCurrentYear();

    // Get and lock the invoice number record for this year
    const [invoiceNumberRecord] = await tx
      .select()
      .from(invoiceNumbers)
      .where(eq(invoiceNumbers.invoiceYear, currentYear))
      .for('update'); // Row-level lock prevents concurrent modifications

    if (!invoiceNumberRecord) {
      throw new Error(
        `Invoice number record not found for year ${currentYear}. ` +
        `Please initialize the invoice_number table for this year.`
      );
    }

    // Calculate new invoice number
    const newInvoiceNumber = invoiceNumberRecord.invoiceLastNumber + 1;

    // Update the invoice_number table within the transaction
    await tx
      .update(invoiceNumbers)
      .set({ invoiceLastNumber: newInvoiceNumber })
      .where(eq(invoiceNumbers.invoiceYear, currentYear));

    return newInvoiceNumber;
  }

  /**
   * Initializes invoice numbering for a new year.
   * Creates a record starting at 0 (so first invoice will be 1).
   *
   * @param year - The year to initialize
   * @returns The created invoice number record
   * @throws Error if record already exists for this year
   */
  async initializeYear(year: number): Promise<InvoiceNumber> {
    // Check if year already exists
    const [existing] = await db
      .select()
      .from(invoiceNumbers)
      .where(eq(invoiceNumbers.invoiceYear, year));

    if (existing) {
      throw new Error(
        `Invoice numbering already initialized for year ${year}. ` +
        `Current last number: ${existing.invoiceLastNumber}`
      );
    }

    const [created] = await db
      .insert(invoiceNumbers)
      .values({
        invoiceYear: year,
        invoiceLastNumber: 0,
      })
      .returning();

    return created;
  }

  /**
   * Gets the current invoice number status for a year.
   *
   * @param year - The year to check (defaults to current year)
   * @returns The invoice number record or undefined if not found
   */
  async getYearStatus(year?: number): Promise<InvoiceNumber | undefined> {
    const targetYear = year ?? (await parameterService.getCurrentYear());

    const [record] = await db
      .select()
      .from(invoiceNumbers)
      .where(eq(invoiceNumbers.invoiceYear, targetYear));

    return record;
  }
}

export const invoiceService = new InvoiceService();
