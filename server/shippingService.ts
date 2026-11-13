/**
 * Shipping Service
 *
 * Handles shipping cost calculation for webshop orders.
 * Rules:
 * - Shipping cost comes from the shipping product's sales price (not a separate parameter)
 * - Free shipping when cart total >= threshold (configurable via parameter_table)
 * - Free shipping for specific postal codes (Belgian local pickup area)
 * - Shipping VAT follows the highest VAT rate among the ordered products
 * - Uses existing shipping products: ID 145 (6% VAT) or ID 146 (21% VAT)
 */

import { db } from "./db";
import { freeShippingPostalCodes, products, vatClasses, salesPrices } from "@shared/schema";
import { eq, inArray } from "drizzle-orm";
import { parameterService } from "./parameterService";

// Shipping product IDs (existing products in the database)
const SHIPPING_PRODUCT_6_PCT = 145;  // "SHIPPING 6 % VAT" / "VERZENDKOSTEN 6% BTW"
const SHIPPING_PRODUCT_21_PCT = 146; // "SHIPPING COSTS 21 % VAT" / "VERZENDKOSTEN 21 % VAT"

export interface ShippingResult {
  shippingCostInclVat: number;
  shippingCostExclVat: number;
  shippingVatAmount: number;
  shippingVatRate: number;
  shippingProductId: number;
  isFree: boolean;
  freeReason: "threshold" | "postalCode" | null;
  freeShippingThreshold: number;
  amountUntilFreeShipping: number;
}

export class ShippingService {
  /**
   * Calculate shipping cost for a given cart total and postal code.
   * The shipping cost is looked up from the shipping product's sales price.
   */
  async calculateShipping(
    cartTotalInclVat: number,
    postalCode: string,
    country: string = "BE",
    productIds: number[] = []
  ): Promise<ShippingResult> {
    const thresholdStr = await parameterService.getParameter("free_shipping_threshold_incl_vat");
    const threshold = parseFloat(thresholdStr || "100");

    // Determine VAT rate for shipping: use the highest VAT rate among ordered products
    let vatRate = 0.06; // Default to 6% (food/beverage)
    if (productIds.length > 0) {
      vatRate = await this.getHighestVatRate(productIds);
    }

    // Select the correct shipping product based on VAT rate
    const shippingProductId = vatRate > 0.06 ? SHIPPING_PRODUCT_21_PCT : SHIPPING_PRODUCT_6_PCT;

    // Look up shipping cost from the shipping product's sales price
    const { costInclVat, costExclVat } = await this.getShippingProductPrice(shippingProductId);

    // Determine if free shipping applies
    let isFree = false;
    let freeReason: "threshold" | "postalCode" | null = null;

    // Rule 1: Free shipping when cart total >= threshold
    if (cartTotalInclVat >= threshold) {
      isFree = true;
      freeReason = "threshold";
    }

    // Rule 2: Free shipping for specific postal codes (only for Belgium)
    if (!isFree && postalCode && country.toUpperCase() === "BE") {
      const [match] = await db
        .select()
        .from(freeShippingPostalCodes)
        .where(eq(freeShippingPostalCodes.postalCode, postalCode))
        .limit(1);

      if (match) {
        isFree = true;
        freeReason = "postalCode";
      }
    }

    const shippingCostInclVat = isFree ? 0 : costInclVat;
    const shippingCostExclVat = isFree ? 0 : costExclVat;
    const shippingVatAmount = shippingCostInclVat - shippingCostExclVat;

    const amountUntilFreeShipping = isFree
      ? 0
      : Math.max(0, threshold - cartTotalInclVat);

    return {
      shippingCostInclVat,
      shippingCostExclVat,
      shippingVatAmount,
      shippingVatRate: vatRate,
      shippingProductId,
      isFree,
      freeReason,
      freeShippingThreshold: threshold,
      amountUntilFreeShipping,
    };
  }

  /**
   * Look up the B2C sales price for a shipping product.
   */
  private async getShippingProductPrice(productId: number): Promise<{ costInclVat: number; costExclVat: number }> {
    const [price] = await db
      .select()
      .from(salesPrices)
      .where(eq(salesPrices.productId, productId))
      .limit(1);

    if (!price || !price.b2cPriceWithVat || !price.b2cPriceWithoutVat) {
      return { costInclVat: 0, costExclVat: 0 };
    }

    return {
      costInclVat: parseFloat(price.b2cPriceWithVat),
      costExclVat: parseFloat(price.b2cPriceWithoutVat),
    };
  }

  /**
   * Get the highest VAT rate (as a decimal, e.g. 0.21) among the given product IDs.
   * VAT percentages are stored as decimals in the DB (0.06, 0.21).
   */
  private async getHighestVatRate(productIds: number[]): Promise<number> {
    const rows = await db
      .select({ percentage: vatClasses.percentage })
      .from(products)
      .innerJoin(vatClasses, eq(products.vatClassId, vatClasses.id))
      .where(inArray(products.id, productIds));

    if (rows.length === 0) return 0.06;

    const maxPercentage = Math.max(...rows.map((r) => parseFloat(r.percentage)));
    return maxPercentage; // Already in decimal form (0.06, 0.21)
  }

  /**
   * Get shipping configuration (for cart page display before postal code is known).
   * Uses the 6% shipping product price as default since most orders are food/beverage.
   */
  async getShippingConfig(): Promise<{ shippingCostInclVat: number; freeShippingThreshold: number }> {
    const { costInclVat } = await this.getShippingProductPrice(SHIPPING_PRODUCT_6_PCT);
    const thresholdStr = await parameterService.getParameter("free_shipping_threshold_incl_vat");

    return {
      shippingCostInclVat: costInclVat,
      freeShippingThreshold: parseFloat(thresholdStr || "100"),
    };
  }
}

export const shippingService = new ShippingService();
