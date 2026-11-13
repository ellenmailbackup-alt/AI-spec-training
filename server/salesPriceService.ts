/**
 * Sales Price Service Layer
 *
 * Handles business logic for sales prices including:
 * - Duplicate date detection
 * - Date overlap management (closing existing prices)
 * - Webshop default enforcement (only one per product)
 *
 * Follows the roastService.ts reference pattern:
 * - Routes: HTTP concerns only
 * - Service: Business logic + transactions (this file)
 * - Storage: CRUD queries
 */

import { db } from "./db";
import {
  salesPrices,
  productUnits,
  type SalesPrice,
  type InsertSalesPrice,
} from "@shared/schema";
import { eq, and, lt, gt, lte, gte, not, asc, desc } from "drizzle-orm";

export class SalesPriceService {
  /**
   * Get all active sales prices with resolved unit weights.
   */
  async getActivePrices(): Promise<SalesPrice[]> {
    const today = new Date().toISOString().split('T')[0];
    const activePrices = await db
      .select()
      .from(salesPrices)
      .where(
        and(
          lte(salesPrices.validFrom, today),
          gte(salesPrices.validUntil, today)
        )
      )
      .orderBy(salesPrices.productId, salesPrices.amount);

    return this.resolveUnitWeights(activePrices);
  }

  /**
   * Get sales prices for a product with resolved unit weights.
   */
  async getPricesForProduct(productId: number): Promise<SalesPrice[]> {
    const prices = await db
      .select()
      .from(salesPrices)
      .where(eq(salesPrices.productId, productId))
      .orderBy(asc(salesPrices.amount), desc(salesPrices.validFrom));

    return this.resolveUnitWeights(prices);
  }

  /**
   * Resolves unit weights for sales prices using the productUnits table.
   */
  private async resolveUnitWeights(prices: SalesPrice[]): Promise<SalesPrice[]> {
    if (prices.length === 0) return prices;

    const allUnits = await db.select().from(productUnits);
    const weightsByUnit = new Map<string, Set<number>>();
    const unitById = new Map<number, { weight: number; unit: string }>();
    allUnits.forEach((pu) => {
      if (!weightsByUnit.has(pu.unit)) weightsByUnit.set(pu.unit, new Set());
      weightsByUnit.get(pu.unit)!.add(pu.weight);
      unitById.set(pu.id, { weight: pu.weight, unit: pu.unit });
    });

    return prices.map((sp) => {
      const knownWeights = weightsByUnit.get(sp.unit) || new Set();
      if (knownWeights.has(sp.amount)) return sp;
      const resolved = unitById.get(sp.amount);
      if (resolved && resolved.unit === sp.unit) {
        return { ...sp, amount: resolved.weight };
      }
      return sp;
    });
  }

  /**
   * Creates a sales price with business rules:
   * - Rejects duplicate validFrom date for same product/unit/amount
   * - Closes overlapping existing prices
   * - Truncates new price if future prices exist
   * - Enforces single webshop default per product
   */
  async createPrice(data: InsertSalesPrice): Promise<SalesPrice> {
    return await db.transaction(async (tx) => {
      // Check for duplicate price with the same validFrom date
      const duplicatePrice = await tx
        .select()
        .from(salesPrices)
        .where(
          and(
            eq(salesPrices.productId, data.productId),
            eq(salesPrices.unit, data.unit),
            eq(salesPrices.amount, data.amount),
            eq(salesPrices.validFrom, data.validFrom)
          )
        );

      if (duplicatePrice.length > 0) {
        const err = new Error("A price with this start date already exists for this product/unit/amount combination");
        (err as any).statusCode = 409;
        throw err;
      }

      // Find existing prices that overlap: start before new and end on/after new validFrom
      const existingPrices = await tx
        .select()
        .from(salesPrices)
        .where(
          and(
            eq(salesPrices.productId, data.productId),
            eq(salesPrices.unit, data.unit),
            eq(salesPrices.amount, data.amount),
            lt(salesPrices.validFrom, data.validFrom),
            gte(salesPrices.validUntil, data.validFrom)
          )
        );

      // Close existing prices by setting validUntil to day before new price starts
      if (existingPrices.length > 0) {
        const newValidFrom = new Date(data.validFrom);
        newValidFrom.setDate(newValidFrom.getDate() - 1);
        const closingDate = newValidFrom.toISOString().split('T')[0];

        for (const existingPrice of existingPrices) {
          await tx
            .update(salesPrices)
            .set({ validUntil: closingDate, modificationDate: new Date() })
            .where(eq(salesPrices.id, existingPrice.id));
        }
      }

      // Find future prices to truncate new price's validUntil if needed
      const futurePrices = await tx
        .select()
        .from(salesPrices)
        .where(
          and(
            eq(salesPrices.productId, data.productId),
            eq(salesPrices.unit, data.unit),
            eq(salesPrices.amount, data.amount),
            gt(salesPrices.validFrom, data.validFrom)
          )
        )
        .orderBy(salesPrices.validFrom);

      let finalValidUntil = data.validUntil;
      if (futurePrices.length > 0) {
        const firstFuturePrice = futurePrices[0];
        const futureStart = new Date(firstFuturePrice.validFrom);
        futureStart.setDate(futureStart.getDate() - 1);
        const truncatedUntil = futureStart.toISOString().split('T')[0];
        if (truncatedUntil < finalValidUntil) {
          finalValidUntil = truncatedUntil;
        }
      }

      const [created] = await tx.insert(salesPrices).values({
        ...data,
        validUntil: finalValidUntil,
      }).returning();

      // Enforce: only one webshop default per product
      if (data.webshopDefault) {
        await tx
          .update(salesPrices)
          .set({ webshopDefault: false })
          .where(
            and(
              eq(salesPrices.productId, data.productId),
              not(eq(salesPrices.id, created.id))
            )
          );
      }

      return created;
    });
  }

  /**
   * Updates a sales price with webshop default enforcement.
   */
  async updatePrice(priceId: number, data: InsertSalesPrice): Promise<SalesPrice> {
    return await db.transaction(async (tx) => {
      const [result] = await tx
        .update(salesPrices)
        .set({ ...data, modificationDate: new Date() })
        .where(eq(salesPrices.id, priceId))
        .returning();

      if (!result) {
        const err = new Error("Sales price not found");
        (err as any).statusCode = 404;
        throw err;
      }

      // Enforce: only one webshop default per product
      if (data.webshopDefault) {
        await tx
          .update(salesPrices)
          .set({ webshopDefault: false })
          .where(
            and(
              eq(salesPrices.productId, result.productId),
              not(eq(salesPrices.id, priceId))
            )
          );
      }

      return result;
    });
  }

  /**
   * Deletes a sales price by ID.
   */
  async deletePrice(priceId: number): Promise<SalesPrice | null> {
    const [deleted] = await db
      .delete(salesPrices)
      .where(eq(salesPrices.id, priceId))
      .returning();
    return deleted || null;
  }
}

export const salesPriceService = new SalesPriceService();
