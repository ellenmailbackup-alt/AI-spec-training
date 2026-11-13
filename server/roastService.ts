/**
 * Roast Service Layer
 *
 * This service encapsulates all business logic related to roasts,
 * including automatic stock movement creation and management.
 *
 * Clean Architecture Principles:
 * - Storage Layer: Simple CRUD operations (storage.ts)
 * - Service Layer: Business logic, transactions, orchestration (this file)
 * - Routes Layer: HTTP handling, validation, auth (routes.ts)
 */

import { db } from "./db";
import { storage } from "./storage";
import {
  roasts,
  stockMovements,
  greenRoastedCoffees,
  stockMovementReasons,
  type Roast,
  type InsertRoast,
  type StockMovement,
} from "@shared/schema";
import { eq, sql } from "drizzle-orm";

export interface RoastServiceError {
  code: string;
  message: string;
  details?: any;
}

export class RoastService {
  /**
   * Creates a roast with automatic stock movement generation.
   *
   * This method:
   * 1. Creates the roast record
   * 2. Finds the green-to-roasted coffee mapping
   * 3. Creates two stock movements in a transaction:
   *    - Green coffee OUT (negative quantity)
   *    - Roasted coffee IN (positive quantity)
   *
   * @param data - The roast data to insert
   * @returns The created roast
   * @throws Error if mapping or reason not found, or transaction fails
   */
  async createRoast(data: InsertRoast): Promise<Roast> {
    // Use transaction to ensure atomicity
    return await db.transaction(async (tx) => {
      // 1. Create the roast
      const [roast] = await tx.insert(roasts).values(data).returning();

      // 2. Find the roasted coffee product from the mapping
      const [mapping] = await tx
        .select()
        .from(greenRoastedCoffees)
        .where(eq(greenRoastedCoffees.greenCoffeeId, data.greenCoffeeId));

      if (!mapping) {
        throw new Error(
          `No roasted coffee mapping found for green coffee ID ${data.greenCoffeeId}. ` +
          `Please create a mapping in the green-roasted coffee settings first.`
        );
      }

      // 3. Find the "roast" reason ID (case-insensitive)
      const [roastReason] = await tx
        .select()
        .from(stockMovementReasons)
        .where(sql`UPPER(${stockMovementReasons.reason}) = UPPER('roast')`);

      if (!roastReason) {
        throw new Error(
          `Stock movement reason 'roast' not found. ` +
          `Please ensure the reference data is properly initialized.`
        );
      }

      // 4. Create stock movement for green coffee (negative - consumed)
      await tx.insert(stockMovements).values({
        productId: data.greenCoffeeId,
        roastId: roast.id,
        date: data.roastDate,
        quantity: (-data.greenCoffeeAmount).toString(),
        reason: roastReason.id,
        remark: data.remark || null,
      });

      // 5. Create stock movement for roasted coffee (positive - produced)
      await tx.insert(stockMovements).values({
        productId: mapping.roastedCoffeeId,
        roastId: roast.id,
        date: data.roastDate,
        quantity: data.roastedCoffeeAmount.toString(),
        reason: roastReason.id,
        remark: data.remark || null,
      });

      return roast;
    });
  }

  /**
   * Updates a roast and its associated stock movements.
   *
   * This method:
   * 1. Updates the roast record
   * 2. Updates the existing stock movements (preserves history)
   * 3. Handles changes to green coffee type (re-creates movements if needed)
   *
   * @param id - The roast ID
   * @param data - The partial roast data to update
   * @returns The updated roast or undefined if not found
   * @throws Error if update fails
   */
  async updateRoast(id: number, data: Partial<InsertRoast>): Promise<Roast | undefined> {
    return await db.transaction(async (tx) => {
      // 1. Update the roast
      const [roast] = await tx
        .update(roasts)
        .set(data)
        .where(eq(roasts.id, id))
        .returning();

      if (!roast) {
        return undefined;
      }

      // 2. Get existing stock movements for this roast
      const existingMovements = await tx
        .select()
        .from(stockMovements)
        .where(eq(stockMovements.roastId, id));

      // If no movements exist yet, create them (shouldn't happen, but handle gracefully)
      if (existingMovements.length === 0) {
        console.warn(`No stock movements found for roast ${id}, creating new ones`);
        return await this.createStockMovementsForRoast(tx, roast);
      }

      // 3. Find the current roasted coffee mapping
      const [mapping] = await tx
        .select()
        .from(greenRoastedCoffees)
        .where(eq(greenRoastedCoffees.greenCoffeeId, roast.greenCoffeeId));

      if (!mapping) {
        throw new Error(
          `No roasted coffee mapping found for green coffee ID ${roast.greenCoffeeId}`
        );
      }

      // 4. Find the "roast" reason ID (case-insensitive)
      const [roastReason] = await tx
        .select()
        .from(stockMovementReasons)
        .where(sql`UPPER(${stockMovementReasons.reason}) = UPPER('roast')`);

      if (!roastReason) {
        throw new Error(`Stock movement reason 'roast' not found`);
      }

      // 5. Update stock movements
      // Strategy: Delete and recreate if green coffee changed, otherwise update in place
      const greenCoffeeChanged = data.greenCoffeeId !== undefined &&
                                  data.greenCoffeeId !== roast.greenCoffeeId;

      if (greenCoffeeChanged) {
        // Delete old movements and create new ones with correct product IDs
        await tx.delete(stockMovements).where(eq(stockMovements.roastId, id));
        return await this.createStockMovementsForRoast(tx, roast);
      } else {
        // Update existing movements in place (preserves timestamps)
        for (const movement of existingMovements) {
          const isGreenCoffee = movement.productId === roast.greenCoffeeId;

          await tx
            .update(stockMovements)
            .set({
              date: roast.roastDate,
              quantity: isGreenCoffee
                ? (-roast.greenCoffeeAmount).toString()
                : roast.roastedCoffeeAmount.toString(),
              remark: roast.remark || null,
            })
            .where(eq(stockMovements.id, movement.id));
        }
      }

      return roast;
    });
  }

  /**
   * Deletes a roast and its associated stock movements.
   *
   * This method:
   * 1. Deletes all stock movements linked to this roast
   * 2. Deletes the roast record
   *
   * All operations are wrapped in a transaction for atomicity.
   *
   * @param id - The roast ID to delete
   * @returns true if deleted, false if not found
   */
  async deleteRoast(id: number): Promise<boolean> {
    return await db.transaction(async (tx) => {
      // 1. Delete associated stock movements first (foreign key constraint)
      await tx.delete(stockMovements).where(eq(stockMovements.roastId, id));

      // 2. Delete the roast
      const result = await tx.delete(roasts).where(eq(roasts.id, id));

      return result.rowCount ? result.rowCount > 0 : false;
    });
  }

  /**
   * Helper method to create stock movements for a roast within a transaction.
   * Used by both create and update operations.
   *
   * @param tx - The transaction object
   * @param roast - The roast to create movements for
   * @returns The roast (for chaining)
   */
  private async createStockMovementsForRoast(tx: any, roast: Roast): Promise<Roast> {
    // Find the roasted coffee product from the mapping
    const [mapping] = await tx
      .select()
      .from(greenRoastedCoffees)
      .where(eq(greenRoastedCoffees.greenCoffeeId, roast.greenCoffeeId));

    if (!mapping) {
      throw new Error(
        `No roasted coffee mapping found for green coffee ID ${roast.greenCoffeeId}`
      );
    }

    // Find the "roast" reason ID (case-insensitive)
    const [roastReason] = await tx
      .select()
      .from(stockMovementReasons)
      .where(sql`UPPER(${stockMovementReasons.reason}) = UPPER('roast')`);

    if (!roastReason) {
      throw new Error(`Stock movement reason 'roast' not found`);
    }

    // Create stock movement for green coffee (negative - consumed)
    await tx.insert(stockMovements).values({
      productId: roast.greenCoffeeId,
      roastId: roast.id,
      date: roast.roastDate,
      quantity: (-roast.greenCoffeeAmount).toString(),
      reason: roastReason.id,
      remark: roast.remark || null,
    });

    // Create stock movement for roasted coffee (positive - produced)
    await tx.insert(stockMovements).values({
      productId: mapping.roastedCoffeeId,
      roastId: roast.id,
      date: roast.roastDate,
      quantity: roast.roastedCoffeeAmount.toString(),
      reason: roastReason.id,
      remark: roast.remark || null,
    });

    return roast;
  }

  /**
   * Gets a roast by ID.
   * Delegates to storage layer for simple read operations.
   *
   * @param id - The roast ID
   * @returns The roast or undefined if not found
   */
  async getRoast(id: number): Promise<Roast | undefined> {
    return storage.getRoast(id);
  }

  /**
   * Gets all roasts.
   * Delegates to storage layer for simple read operations.
   *
   * @returns Array of all roasts
   */
  async getRoasts(): Promise<Roast[]> {
    return storage.getRoasts();
  }
}

export const roastService = new RoastService();
