/**
 * Counting Session Service Layer
 *
 * Handles inventory counting session operations.
 * Supports Story 1: Create Counting Session
 * Supports Story 2: Multi-Unit Blind Entry
 */

import { db } from "./db";
import {
  countingSessions,
  salesPrices,
  stockMovements,
  productItems,
  productItemStatuses,
  productLocations,
  products,
  type CountingSession,
  type InsertCountingSession,
  type InsertCountingSessionRecord,
  type InsertProductItem,
  type ProductItem
} from "@shared/schema";
import { eq, desc, and, sql, inArray, isNull, lte, gte, or } from "drizzle-orm";
import { STOCK_MOVEMENT_REASONS } from "./stockMovementService";

export class CountingSessionService {
  private static readonly allowedInventoryStatuses = [
    "in_stock",
    "in_use",
    "quarantine",
    "damaged",
  ] as const;

  /**
   * Creates a new counting session.
   *
   * Story 1: Sessions start blank with status 'open'.
   * Multiple sessions can be open simultaneously.
   *
   * @param data - Session data (sessionName, startedBy, optional notes)
   * @returns The created counting session
   */
  async createSession(data: InsertCountingSession): Promise<CountingSession> {
    const [session] = await db
      .insert(countingSessions)
      .values({
        ...data,
        status: "open", // Story 1: New sessions always start with status OPEN
        startedAt: new Date(),
      })
      .returning();

    return session;
  }

  /**
   * Gets all counting sessions, optionally filtered by status.
   * Ordered by most recent first.
   *
   * @param status - Optional status filter ('open', 'completed', 'cancelled')
   * @returns Array of counting sessions
   */
  async getAllSessions(status?: string): Promise<CountingSession[]> {
    const query = db
      .select()
      .from(countingSessions)
      .orderBy(desc(countingSessions.startedAt));

    if (status) {
      return query.where(eq(countingSessions.status, status as any));
    }

    return query;
  }

  /**
   * Gets a single counting session by ID.
   *
   * @param id - Session ID
   * @returns The counting session or undefined if not found
   */
  async getSessionById(id: number): Promise<CountingSession | undefined> {
    const [session] = await db
      .select()
      .from(countingSessions)
      .where(eq(countingSessions.id, id));

    return session;
  }

  /**
   * Updates a counting session.
   *
   * @param id - Session ID
   * @param data - Partial session data to update
   * @returns The updated counting session
   */
  async updateSession(
    id: number,
    data: Partial<InsertCountingSession>
  ): Promise<CountingSession> {
    const [session] = await db
      .update(countingSessions)
      .set({
        ...data,
        modificationDate: new Date(),
      })
      .where(eq(countingSessions.id, id))
      .returning();

    return session;
  }

  /**
   * Completes a counting session.
   * Sets status to 'completed' and records completion timestamp.
   *
   * @param id - Session ID
   * @returns The updated counting session
   */
  async completeSession(id: number): Promise<CountingSession> {
    const [session] = await db
      .update(countingSessions)
      .set({
        status: "completed",
        completedAt: new Date(),
        modificationDate: new Date(),
      })
      .where(eq(countingSessions.id, id))
      .returning();

    return session;
  }

  /**
   * Cancels a counting session.
   * Sets status to 'cancelled'.
   *
   * @param id - Session ID
   * @returns The updated counting session
   */
  async cancelSession(id: number): Promise<CountingSession> {
    const [session] = await db
      .update(countingSessions)
      .set({
        status: "cancelled",
        modificationDate: new Date(),
      })
      .where(eq(countingSessions.id, id))
      .returning();

    return session;
  }

  /**
   * Gets count of open sessions.
   * Useful for dashboard metrics.
   *
   * @returns Number of open sessions
   */
  async getOpenSessionsCount(): Promise<number> {
    const [result] = await db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(countingSessions)
      .where(eq(countingSessions.status, "open"));

    return result?.count || 0;
  }

  // ==================== STORY 2: Multi-Unit Blind Entry ====================

  /**
   * Gets all available packaging units for a product from sales_prices.
   * Story 2: Dynamic Unit Loading.
   *
   * Returns units with their weights in grams for conversion.
   *
   * @param productId - Product ID
   * @returns Array of packaging units with amount and unit
   */
  async getProductPackagingUnits(productId: number) {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const units = await db
      .select({
        id: salesPrices.id,
        amount: salesPrices.amount,
        unit: salesPrices.unit,
      })
      .from(salesPrices)
      .where(
        and(
          eq(salesPrices.productId, productId),
          lte(salesPrices.validFrom, todayStr),
          gte(salesPrices.validUntil, todayStr)
        )
      )
      .orderBy(desc(salesPrices.amount));

    // Convert all units to grams for consistency
    return units.map(unit => ({
      ...unit,
      gramsPerUnit: this.convertToGrams(unit.amount, unit.unit),
    }));
  }

  /**
   * Converts a unit to grams.
   * Story 2: Auto-Conversion.
   *
   * Supports: g (grams), kg (kilograms), stuk (pieces - assumes 1g per piece)
   *
   * @param amount - Amount value
   * @param unit - Unit string (g, kg, stuk, etc.)
   * @returns Weight in grams
   */
  private convertToGrams(amount: number, unit: string): number {
    const unitLower = unit.toLowerCase();

    if (unitLower === 'kg' || unitLower === 'kilo') {
      return amount * 1000;
    } else if (unitLower === 'g' || unitLower === 'gram') {
      return amount;
    } else if (unitLower === 'stuk' || unitLower === 'piece' || unitLower === 'pc') {
      // For pieces, we assume 1 gram per piece as a default
      // This can be overridden if needed
      return amount;
    }

    // Default: assume grams
    return amount;
  }

  /**
   * Converts frontend status string to database status ID.
   * in_stock → 2, in_use → 1
   */
  private statusStringToId(status: string): number {
    return status === "in_stock" ? 2 : 1;
  }

  /**
   * Upserts a product item (insert or update).
   * Story 2: Multi-Unit Blind Entry with auto-conversion.
   *
   * Upserts based on (product_id, location_id, status_id, expiry_date).
   * If exists: updates quantity.
   * If new: inserts record.
   *
   * @param data - Product item data
   * @returns The upserted product item
   */
  async createSessionRecord(
    data: InsertCountingSessionRecord & {
      statusId?: number;
      locationId?: number;
      expiryDate?: string | null;
      batchNumber?: string | null;
    }
  ): Promise<ProductItem> {
    const defaultLocationId = await this.getDefaultLocationId();
    const statusId =
      data.statusId ??
      (data.inventoryStatus
        ? await this.getOrCreateProductItemStatusId(
            db,
            this.getProductItemStatusName(data.inventoryStatus)
          )
        : undefined);

    const [record] = await db
      .insert(productItems)
      .values({
        productId: data.productId,
        locationId: data.locationId ?? defaultLocationId,
        statusId: statusId ?? 2,
        countingSessionId: data.sessionId,
        quantity: Number(data.countedQuantity).toFixed(5),
        expiryDate: data.expiryDate ?? null,
        batchNumber: data.batchNumber ?? data.notes ?? null,
      })
      .returning();

    return record;
  }

  /**
   * Gets all product items (physical inventory).
   * Story 2: Display current physical inventory.
   *
   * Note: Session ID is ignored since product_item doesn't track sessions.
   * Shows ALL product items (current physical inventory state).
   *
   * @param sessionId - Session ID (ignored, kept for API compatibility)
   * @returns Array of product items with product and location details
   */
  async getSessionRecords(sessionId: number) {
    const records = await db
      .select({
        id: productItems.id,
        sessionId: productItems.countingSessionId,
        productId: productItems.productId,
        productName: products.name,
        countedQuantity: productItems.quantity,
        inventoryStatus: sql<string>`COALESCE(${productItemStatuses.name}, '')`,
        locationId: productItems.locationId,
        locationName: productLocations.name,
        expiryDate: productItems.expiryDate,
        batchNumber: productItems.batchNumber,
        countedAt: productItems.creationDate,
      })
      .from(productItems)
      .leftJoin(products, eq(productItems.productId, products.id))
      .leftJoin(productItemStatuses, eq(productItems.statusId, productItemStatuses.id))
      .leftJoin(productLocations, eq(productItems.locationId, productLocations.id))
      .where(eq(productItems.countingSessionId, sessionId))
      .orderBy(desc(productItems.creationDate));

    // Get unit info for each product from sales_price table
    const productIds = Array.from(new Set(records.map(r => r.productId)));
    const productUnitsMap = new Map<number, string>();
    
    if (productIds.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      const unitResults = await db
        .select({
          productId: salesPrices.productId,
          unit: salesPrices.unit,
        })
        .from(salesPrices)
        .where(
          and(
            inArray(salesPrices.productId, productIds),
            lte(salesPrices.validFrom, today),
            or(
              gte(salesPrices.validUntil, today),
              isNull(salesPrices.validUntil)
            )
          )
        );
      
      for (const row of unitResults) {
        if (row.unit && !productUnitsMap.has(row.productId)) {
          productUnitsMap.set(row.productId, row.unit);
        }
      }
    }

    // Add unit to each record
    return records.map(r => ({
      ...r,
      unit: productUnitsMap.get(r.productId) || "gram",
    }));
  }

  /**
   * Updates a product item (uses upsert internally).
   * Kept for API compatibility.
   */
  async updateProductItem(
    id: number,
    data: Partial<
      InsertCountingSessionRecord & {
        statusId?: number;
        locationId?: number;
        expiryDate?: string | null;
        batchNumber?: string | null;
      }
    >
  ): Promise<ProductItem> {
    const updateData: Partial<InsertProductItem> = {
      modificationDate: new Date(),
    };

    if (data.productId) {
      updateData.productId = data.productId;
    }

    if (data.countedQuantity !== undefined) {
      updateData.quantity = Number(data.countedQuantity).toFixed(5);
    }

    if (data.statusId) {
      updateData.statusId = data.statusId;
    } else if (data.inventoryStatus) {
      const statusId = await this.getOrCreateProductItemStatusId(
        db,
        this.getProductItemStatusName(data.inventoryStatus)
      );
      updateData.statusId = statusId;
    }

    if (data.locationId) {
      updateData.locationId = data.locationId;
    }

    if (data.expiryDate !== undefined) {
      updateData.expiryDate = data.expiryDate ?? null;
    }

    if (data.batchNumber !== undefined) {
      updateData.batchNumber = data.batchNumber ?? null;
    }

    if (data.notes !== undefined) {
      updateData.batchNumber = data.notes ?? null;
    }

    const [record] = await db
      .update(productItems)
      .set(updateData)
      .where(eq(productItems.id, id))
      .returning();

    return record;
  }

  /**
   * Deletes a product item.
   *
   * @param id - Product item ID
   */
  async deleteProductItem(id: number): Promise<void> {
    await db
      .delete(productItems)
      .where(eq(productItems.id, id));
  }

  /**
   * Gets total quantity for a product across all locations and statuses.
   * Useful for showing aggregated inventory.
   *
   * @param productId - Product ID
   * @param sessionId - Session ID
   * @returns Total quantity in grams
   */
  async getProductTotalQuantity(productId: number, sessionId: number): Promise<number> {
    const [result] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${productItems.quantity}::numeric), 0)`,
      })
      .from(productItems)
      .where(
        and(
          eq(productItems.countingSessionId, sessionId),
          eq(productItems.productId, productId)
        )
      );

    return result?.total || 0;
  }

  // ==================== STORY 3: Review & Variance Analysis ====================

  /**
   * Gets expected stock for a product by summing all stock movements.
   * Story 3: Real-time calculation (not a static snapshot).
   *
   * This ensures if a sale happens during counting, refreshing updates the expected stock.
   *
   * @param productId - Product ID
   * @returns Expected stock quantity in grams
   */
  async getExpectedStock(productId: number): Promise<number> {
    const [result] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${stockMovements.quantity}::numeric), 0)`,
      })
      .from(stockMovements)
      .where(eq(stockMovements.productId, productId));

    return result?.total || 0;
  }

  /**
   * Gets variance analysis comparing physical inventory vs expected stock.
   * Story 3: Compares product_item quantities vs stock_movements.
   *
   * Variance = Counted (product_item) - Expected (stock_movements)
   * - Positive: Surplus (more than expected)
   * - Negative: Missing (less than expected)
   * - Zero: Match
   *
   * @param sessionId - Session ID (ignored, kept for API compatibility)
   * @returns Array of variance analysis records
   */
  async getSessionVarianceAnalysis(sessionId?: number) {
    // Get all products with physical inventory (grouped by product)
    const physicalInventory = await db
      .select({
        productId: productItems.productId,
        productName: products.name,
        countedQuantity: sql<number>`SUM(${productItems.quantity}::numeric)`,
      })
      .from(productItems)
      .leftJoin(products, eq(productItems.productId, products.id))
      .where(eq(productItems.countingSessionId, sessionId!))
      .groupBy(productItems.productId, products.name);

    // For each product, get expected stock and determine unit from sales_prices
    const varianceAnalysis = await Promise.all(
      physicalInventory.map(async (counted) => {
        const expectedStock = await this.getExpectedStock(counted.productId);
        const countedQty = Number(counted.countedQuantity);
        const variance = countedQty - expectedStock;

        // Get unit from sales_prices table - check if any price has "stuk" unit
        const priceUnits = await db
          .select({ unit: salesPrices.unit })
          .from(salesPrices)
          .where(eq(salesPrices.productId, counted.productId))
          .limit(1);
        
        const unit = priceUnits.length > 0 && priceUnits[0].unit.toLowerCase() === 'stuk' ? 'stuk' : 'g';

        return {
          productId: counted.productId,
          productName: counted.productName,
          unit: unit,
          countedQuantity: countedQty,
          expectedStock: expectedStock,
          variance: variance,
          variancePercentage: expectedStock !== 0 ? (variance / expectedStock) * 100 : 0,
          status: variance === 0 ? 'match' : variance > 0 ? 'surplus' : 'missing',
        };
      })
    );

    // Sort by absolute variance (highest discrepancies first)
    return varianceAnalysis.sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));
  }

  /**
   * Gets variance analysis for a specific product.
   * Story 3: Single product variance check.
   *
   * @param sessionId - Session ID (ignored, kept for API compatibility)
   * @param productId - Product ID
   * @returns Variance analysis for the product
   */
  async getProductVarianceInSession(sessionId: number | undefined, productId: number) {
    const countedTotal = sessionId ? await this.getProductTotalQuantity(productId, sessionId) : 0;
    const expectedStock = await this.getExpectedStock(productId);
    const variance = countedTotal - expectedStock;

    const [product] = await db
      .select({
        name: products.name,
      })
      .from(products)
      .where(eq(products.id, productId));

    return {
      productId,
      productName: product?.name || 'Unknown',
      countedQuantity: countedTotal,
      expectedStock: expectedStock,
      variance: variance,
      variancePercentage: expectedStock !== 0 ? (variance / expectedStock) * 100 : 0,
      status: variance === 0 ? 'match' : variance > 0 ? 'surplus' : 'missing',
    };
  }

  // ==================== STORY 4: Finalize & Commit ====================

  /**
   * Finalizes a counting session by creating correction movements,
   * updating product_item quantities, and closing the session.
   *
   * @param sessionId - Session ID
   * @returns Updated counting session
   */
  async finalizeSession(sessionId: number): Promise<CountingSession> {
    return await db.transaction(async (tx) => {
      const [session] = await tx
        .select()
        .from(countingSessions)
        .where(eq(countingSessions.id, sessionId))
        .limit(1);

      if (!session) {
        throw new Error("Counting session not found");
      }

      if (session.status !== "open") {
        throw new Error("Counting session is not open");
      }

      const recordTotals = await tx
        .select({
          productId: productItems.productId,
          statusId: productItems.statusId,
          countedQuantity: sql<number>`SUM(${productItems.quantity}::numeric)`,
        })
        .from(productItems)
        .where(eq(productItems.countingSessionId, sessionId))
        .groupBy(productItems.productId, productItems.statusId);

      const productTotals = new Map<number, number>();
      for (const record of recordTotals) {
        const current = productTotals.get(record.productId) ?? 0;
        productTotals.set(record.productId, current + Number(record.countedQuantity));
      }

      const productIds = Array.from(productTotals.keys());
      const expectedByProduct = new Map<number, number>();

      if (productIds.length > 0) {
        const expectedTotals = await tx
          .select({
            productId: stockMovements.productId,
            expectedStock: sql<number>`COALESCE(SUM(${stockMovements.quantity}::numeric), 0)`,
          })
          .from(stockMovements)
          .where(inArray(stockMovements.productId, productIds))
          .groupBy(stockMovements.productId);

        for (const expected of expectedTotals) {
          expectedByProduct.set(expected.productId, Number(expected.expectedStock));
        }
      }

      const movementDate = new Date().toISOString().split('T')[0]; // Format as YYYY-MM-DD
      const remark = `Stock Count: ${session.sessionName}`;

      for (const [productId, countedQuantity] of Array.from(productTotals.entries())) {
        const expectedStock = expectedByProduct.get(productId) ?? 0;
        const variance = countedQuantity - expectedStock;

        if (variance !== 0) {
          await tx.insert(stockMovements).values({
            productId,
            quantity: variance.toFixed(5),
            reason: STOCK_MOVEMENT_REASONS.CORRECTION,
            remark,
            date: movementDate,
          });
        }
      }

      if (recordTotals.length > 0) {
        const [defaultLocation] = await tx
          .select({
            id: productLocations.id,
          })
          .from(productLocations)
          .orderBy(productLocations.id)
          .limit(1);

        if (!defaultLocation) {
          throw new Error("No product location available for inventory updates");
        }

        for (const record of recordTotals) {
          const [existingItem] = await tx
            .select({
              id: productItems.id,
            })
            .from(productItems)
            .where(
              and(
                eq(productItems.productId, record.productId),
                eq(productItems.statusId, record.statusId),
                isNull(productItems.countingSessionId)
              )
            )
            .limit(1);

          if (existingItem) {
            await tx
              .update(productItems)
              .set({
                quantity: Number(record.countedQuantity).toFixed(5),
                modificationDate: new Date(),
              })
              .where(eq(productItems.id, existingItem.id));
          } else {
            await tx.insert(productItems).values({
              productId: record.productId,
              statusId: record.statusId,
              locationId: defaultLocation.id,
              quantity: Number(record.countedQuantity).toFixed(5),
            });
          }
        }
      }

      const [completedSession] = await tx
        .update(countingSessions)
        .set({
          status: "completed",
          completedAt: new Date(),
          modificationDate: new Date(),
        })
        .where(eq(countingSessions.id, sessionId))
        .returning();

      return completedSession;
    });
  }

  private getProductItemStatusName(inventoryStatus: string): string {
    const normalized = inventoryStatus.toLowerCase().trim();
    const mapping: Record<string, string> = {
      in_stock: "In Stock",
      in_use: "In Use",
      quarantine: "Quarantine",
      damaged: "Damaged",
    };

    if (!CountingSessionService.allowedInventoryStatuses.includes(normalized as any)) {
      return "In Stock";
    }

    return mapping[normalized] ?? "In Stock";
  }

  private async getOrCreateProductItemStatusId(
    tx: any,
    statusName: string
  ): Promise<number> {
    const [status] = await tx
      .select({ id: productItemStatuses.id })
      .from(productItemStatuses)
      .where(sql`LOWER(${productItemStatuses.name}) = LOWER(${statusName})`)
      .limit(1);

    if (status) {
      return status.id;
    }

    const [created] = await tx
      .insert(productItemStatuses)
      .values({
        name: statusName,
        description: "Auto-created from counting session finalize",
      })
      .returning();

    return created.id;
  }

  private async getDefaultLocationId(): Promise<number> {
    const [defaultLocation] = await db
      .select({ id: productLocations.id })
      .from(productLocations)
      .orderBy(productLocations.id)
      .limit(1);

    if (!defaultLocation) {
      throw new Error("No product location available for inventory updates");
    }

    return defaultLocation.id;
  }
}

export const countingSessionService = new CountingSessionService();
