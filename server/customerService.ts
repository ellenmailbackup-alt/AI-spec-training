/**
 * Customer Service Layer
 *
 * Handles customer-related business logic and statistics calculations.
 * Optimizes queries to avoid N+1 patterns (was 6 queries, now 2 queries).
 */

import { db } from "./db";
import { storage } from "./storage";
import { sales, salesLines, customers, users, type Customer } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { parameterService } from "./parameterService";

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export interface CustomerStatistics {
  lifetimeValue: number;
  currentYearRevenue: number;
  previousYearRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  firstPurchaseDate: string | null;
  lastPurchaseDate: string | null;
}

export class CustomerService {
  /**
   * Gets comprehensive statistics for a customer.
   *
   * This method consolidates 6 separate queries into 2 optimized queries
   * for 3x better performance:
   * - Query 1: Revenue statistics (lifetime, current year, previous year, counts)
   * - Query 2: Date statistics (first and last purchase)
   *
   * @param customerId - The customer ID
   * @returns Customer statistics
   */
  async getCustomerStatistics(customerId: number): Promise<CustomerStatistics> {
    const currentYear = await parameterService.getCurrentYear();
    const previousYear = currentYear - 1;

    // Query 1: All revenue-related statistics in one query using conditional aggregation
    const [revenueStats] = await db
      .select({
        lifetimeValue: sql<number>`
          COALESCE(SUM(${salesLines.totalWithoutVat}::numeric), 0)
        `,
        currentYearRevenue: sql<number>`
          COALESCE(
            SUM(CASE
              WHEN EXTRACT(YEAR FROM ${sales.salesDate}) = ${currentYear}
              THEN ${salesLines.totalWithoutVat}::numeric
              ELSE 0
            END),
            0
          )
        `,
        previousYearRevenue: sql<number>`
          COALESCE(
            SUM(CASE
              WHEN EXTRACT(YEAR FROM ${sales.salesDate}) = ${previousYear}
              THEN ${salesLines.totalWithoutVat}::numeric
              ELSE 0
            END),
            0
          )
        `,
        totalOrders: sql<number>`COUNT(DISTINCT ${sales.id})`,
      })
      .from(sales)
      .leftJoin(salesLines, eq(salesLines.saleId, sales.id))
      .where(eq(sales.customerId, customerId));

    // Query 2: Purchase date statistics
    const [dateStats] = await db
      .select({
        firstPurchaseDate: sql<string>`MIN(${sales.salesDate})`,
        lastPurchaseDate: sql<string>`MAX(${sales.salesDate})`,
      })
      .from(sales)
      .where(eq(sales.customerId, customerId));

    const lifetimeValue = Number(revenueStats?.lifetimeValue || 0);
    const currentYearRevenue = Number(revenueStats?.currentYearRevenue || 0);
    const previousYearRevenue = Number(revenueStats?.previousYearRevenue || 0);
    const totalOrders = Number(revenueStats?.totalOrders || 0);
    const averageOrderValue = totalOrders > 0 ? lifetimeValue / totalOrders : 0;

    return {
      lifetimeValue,
      currentYearRevenue,
      previousYearRevenue,
      totalOrders,
      averageOrderValue,
      firstPurchaseDate: dateStats?.firstPurchaseDate
        ? new Date(dateStats.firstPurchaseDate).toISOString()
        : null,
      lastPurchaseDate: dateStats?.lastPurchaseDate
        ? new Date(dateStats.lastPurchaseDate).toISOString()
        : null,
    };
  }

  /**
   * Gets yearly sales summary for a customer.
   * Delegates to storage layer as it's already optimized.
   *
   * @param customerId - The customer ID
   * @returns Array of yearly sales data
   */
  async getCustomerYearlySales(customerId: number): Promise<Array<{
    year: number;
    totalRevenue: number;
    orderCount: number;
  }>> {
    return storage.getCustomerYearlySales(customerId);
  }

  /**
   * Gets products purchased by a customer.
   * Delegates to storage layer as it's already optimized.
   *
   * @param customerId - The customer ID
   * @returns Array of products with purchase details
   */
  async getCustomerProductsPurchased(customerId: number): Promise<any[]> {
    return storage.getCustomerProductsPurchased(customerId);
  }

  /**
   * Gets a customer by ID.
   * Delegates to storage layer for simple read operations.
   *
   * @param customerId - The customer ID
   * @returns The customer or undefined if not found
   */
  async getCustomer(customerId: number): Promise<Customer | undefined> {
    return storage.getCustomer(customerId);
  }

  /**
   * Gets all customers.
   * Delegates to storage layer for simple read operations.
   *
   * @returns Array of all customers
   */
  async getCustomers(): Promise<Customer[]> {
    return storage.getCustomers();
  }

  /**
   * Updates the storefront account profile for a registered user.
   *
   * Wraps the update in a transaction so that the user record and
   * the linked customer record are always kept in sync. Creates the
   * customer record if it does not exist yet.
   *
   * @param userId   - The Supabase user ID (UUID)
   * @param email    - The user's email address (used to locate the customer record)
   * @param data     - The profile fields to update
   */
  async updateAccountProfile(userId: string, email: string, data: AccountProfileData): Promise<void> {
    await db.transaction(async (tx: DbTransaction) => {
      await tx
        .update(users)
        .set({
          firstName: data.firstName,
          lastName: data.lastName,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      const [existingCustomer] = await tx
        .select()
        .from(customers)
        .where(eq(customers.email, email));

      if (existingCustomer) {
        await tx
          .update(customers)
          .set({
            firstName: data.firstName ?? existingCustomer.firstName,
            lastName: data.lastName ?? existingCustomer.lastName,
            phone: data.phone ?? existingCustomer.phone,
            birthday: data.birthday ?? existingCustomer.birthday,
            companyName: data.companyName ?? existingCustomer.companyName,
            vatNumber: data.vatNumber ?? existingCustomer.vatNumber,
            billingAddressStreet: data.billingAddressStreet ?? existingCustomer.billingAddressStreet,
            billingAddressBus: data.billingAddressBus ?? existingCustomer.billingAddressBus,
            billingAddressPostalCode: data.billingAddressPostalCode ?? existingCustomer.billingAddressPostalCode,
            billingAddressCity: data.billingAddressCity ?? existingCustomer.billingAddressCity,
            shippingAddressStreet: data.shippingAddressStreet ?? existingCustomer.shippingAddressStreet,
            shippingAddressBus: data.shippingAddressBus ?? existingCustomer.shippingAddressBus,
            shippingAddressPostalCode: data.shippingAddressPostalCode ?? existingCustomer.shippingAddressPostalCode,
            shippingAddressCity: data.shippingAddressCity ?? existingCustomer.shippingAddressCity,
            modificationDate: new Date(),
          })
          .where(eq(customers.id, existingCustomer.id));
      } else {
        await tx.insert(customers).values({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          email,
          phone: data.phone || null,
          birthday: data.birthday || null,
          companyName: data.companyName || null,
          vatNumber: data.vatNumber || null,
          billingAddressStreet: data.billingAddressStreet || null,
          billingAddressBus: data.billingAddressBus || null,
          billingAddressPostalCode: data.billingAddressPostalCode || null,
          billingAddressCity: data.billingAddressCity || null,
          shippingAddressStreet: data.shippingAddressStreet || null,
          shippingAddressBus: data.shippingAddressBus || null,
          shippingAddressPostalCode: data.shippingAddressPostalCode || null,
          shippingAddressCity: data.shippingAddressCity || null,
        });
      }
    });
  }

  /**
   * Checks if a customer is a B2B client.
   * Used to determine if invoice numbers are required.
   *
   * @param customerId - The customer ID
   * @returns true if B2B client, false otherwise
   * @throws Error if customer not found
   */
  async isB2BClient(customerId: number): Promise<boolean> {
    const customer = await this.getCustomer(customerId);

    if (!customer) {
      throw new Error(`Customer not found: ${customerId}`);
    }

    return customer.b2bClient ?? false;
  }
}

export interface AccountProfileData {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  birthday?: string | null;
  companyName?: string | null;
  vatNumber?: string | null;
  billingAddressStreet?: string | null;
  billingAddressBus?: string | null;
  billingAddressPostalCode?: string | null;
  billingAddressCity?: string | null;
  shippingAddressStreet?: string | null;
  shippingAddressBus?: string | null;
  shippingAddressPostalCode?: string | null;
  shippingAddressCity?: string | null;
}

export const customerService = new CustomerService();
