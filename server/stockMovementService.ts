/**
 * Stock Movement Service Layer
 *
 * Handles stock movement calculations and queries with optimized performance.
 * Consolidates multiple queries into single operations to avoid N+1 patterns.
 */

import { db } from "./db";
import { stockMovements, sales, type StockMovement, type InsertStockMovement } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import { parameterService } from "./parameterService";

export interface ProductStockStats {
  currentYear: number;
  startStock: number;
  totalBought: number;
  totalSold: number;
  currentStock: number;
}

/**
 * Stock Movement Reason IDs (from stock_movement_reason table)
 * 
 * These IDs correspond to the stock_movement_reason table:
 * 1=START STOCK, 2=BUY, 3=SALE, 4=CORRECTION, 5=OWN USE,
 * 6=SPONSORSHIP, 7=DUE DATE EXPIRED, 8=FREE SAMPLE,
 * 9=REDIVISION BLEND, 10=COURSE MATERIAL, 11=ROAST, 12=FINAL STOCK
 */
export const STOCK_MOVEMENT_REASONS = {
  START_STOCK: 1,
  BUY: 2,
  SALE: 3,
  CORRECTION: 4,
  OWN_USE: 5,
  ROAST: 11,
  FINAL_STOCK: 12,
} as const;

export class StockMovementService {
  /**
   * Gets comprehensive stock statistics for a product.
   *
   * This method consolidates 4 separate queries into 1 optimized query
   * for 4x better performance.
   *
   * Returns:
   * - Current year (from parameter table)
   * - Start stock (START_STOCK movement for current year, reason=1)
   * - Total bought (sum of BUY movements in current year, reason=2)
   * - Total sold (sum of SALE movements in current year, reason=3)
   * - Current stock (sum of all movements)
   *
   * @param productId - The product ID
   * @returns Stock statistics for the product
   */
  async getProductStockStats(productId: number): Promise<ProductStockStats> {
    const currentYear = await parameterService.getCurrentYear();

    // Single optimized query with conditional aggregation
    const [result] = await db
      .select({
        startStock: sql<number>`
          COALESCE(
            SUM(CASE
              WHEN EXTRACT(YEAR FROM ${stockMovements.date}) = ${currentYear}
                AND ${stockMovements.reason} = ${STOCK_MOVEMENT_REASONS.START_STOCK}
              THEN ${stockMovements.quantity}::numeric
              ELSE 0
            END),
            0
          )
        `,
        totalBought: sql<number>`
          COALESCE(
            SUM(CASE
              WHEN EXTRACT(YEAR FROM ${stockMovements.date}) = ${currentYear}
                AND ${stockMovements.reason} = ${STOCK_MOVEMENT_REASONS.BUY}
              THEN ${stockMovements.quantity}::numeric
              ELSE 0
            END),
            0
          )
        `,
        totalSold: sql<number>`
          COALESCE(
            SUM(CASE
              WHEN EXTRACT(YEAR FROM ${stockMovements.date}) = ${currentYear}
                AND ${stockMovements.reason} = ${STOCK_MOVEMENT_REASONS.SALE}
              THEN ${stockMovements.quantity}::numeric
              ELSE 0
            END),
            0
          )
        `,
        currentStock: sql<number>`
          COALESCE(SUM(${stockMovements.quantity}::numeric), 0)
        `,
      })
      .from(stockMovements)
      .where(eq(stockMovements.productId, productId));

    return {
      currentYear,
      startStock: Number(result?.startStock || 0),
      totalBought: Number(result?.totalBought || 0),
      totalSold: Number(result?.totalSold || 0),
      currentStock: Number(result?.currentStock || 0),
    };
  }

  /**
   * Gets current stock level for a product.
   * Simple sum of all stock movements.
   *
   * @param productId - The product ID
   * @returns Current stock quantity
   */
  async getCurrentStock(productId: number): Promise<number> {
    const [result] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${stockMovements.quantity}::numeric), 0)`,
      })
      .from(stockMovements)
      .where(eq(stockMovements.productId, productId));

    return Number(result?.total || 0);
  }

  /**
   * Gets stock movements for a product within a date range.
   *
   * @param productId - The product ID
   * @param startDate - Start date (optional)
   * @param endDate - End date (optional)
   * @returns Array of stock movements
   */
  async getMovementsByDateRange(
    productId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<StockMovement[]> {
    let query = db
      .select()
      .from(stockMovements)
      .where(eq(stockMovements.productId, productId));

    // Add date filters if provided
    if (startDate && endDate) {
      const movements = await query;
      return movements.filter(m => {
        const movementDate = new Date(m.date);
        return movementDate >= startDate && movementDate <= endDate;
      });
    } else if (startDate) {
      const movements = await query;
      return movements.filter(m => new Date(m.date) >= startDate);
    } else if (endDate) {
      const movements = await query;
      return movements.filter(m => new Date(m.date) <= endDate);
    }

    return await query;
  }

  /**
   * Gets stock movements by reason for a product.
   *
   * @param productId - The product ID
   * @param reasonId - The stock movement reason ID
   * @returns Array of stock movements
   */
  async getMovementsByReason(
    productId: number,
    reasonId: number
  ): Promise<StockMovement[]> {
    return await db
      .select()
      .from(stockMovements)
      .where(
        and(
          eq(stockMovements.productId, productId),
          eq(stockMovements.reason, reasonId)
        )
      );
  }

  /**
   * Calculates total quantity for movements matching criteria.
   *
   * @param productId - The product ID
   * @param reasonId - Optional reason ID filter
   * @param year - Optional year filter
   * @returns Total quantity
   */
  async getTotalQuantity(
    productId: number,
    reasonId?: number,
    year?: number
  ): Promise<number> {
    const conditions = [eq(stockMovements.productId, productId)];

    if (reasonId !== undefined) {
      conditions.push(eq(stockMovements.reason, reasonId));
    }

    let query = db
      .select({
        total: sql<number>`COALESCE(SUM(${stockMovements.quantity}::numeric), 0)`,
      })
      .from(stockMovements)
      .where(and(...conditions));

    // Year filter requires raw SQL in WHERE clause
    if (year !== undefined) {
      const [result] = await db
        .select({
          total: sql<number>`COALESCE(SUM(${stockMovements.quantity}::numeric), 0)`,
        })
        .from(stockMovements)
        .where(
          and(
            ...conditions,
            sql`EXTRACT(YEAR FROM ${stockMovements.date}) = ${year}`
          )
        );

      return Number(result?.total || 0);
    }

    const [result] = await query;
    return Number(result?.total || 0);
  }
  /**
   * Creates a stock movement and optionally marks the linked sale's stock as updated.
   * Uses a transaction to ensure atomicity when a saleId is provided.
   */
  async createMovement(data: InsertStockMovement): Promise<StockMovement> {
    if (data.saleId) {
      return await db.transaction(async (tx) => {
        const [movement] = await tx.insert(stockMovements).values(data).returning();
        await tx.update(sales).set({ stockUpdated: true }).where(eq(sales.id, data.saleId!));
        return movement;
      });
    }

    const [movement] = await db.insert(stockMovements).values(data).returning();
    return movement;
  }
}

export const stockMovementService = new StockMovementService();
