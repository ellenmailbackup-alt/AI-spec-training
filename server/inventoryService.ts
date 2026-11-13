/**
 * Inventory Service Layer
 *
 * Handles Phase 4 inventory business logic and aggregates.
 */
import { storage } from "./storage";
import { db } from "./db";
import { products, stockMovements, productTypes, salesLines, sales } from "@shared/schema";
import { eq, sql, desc, gte, and, inArray } from "drizzle-orm";

const INVOICED_STATUS_ID = 3;
const PAID_STATUS_ID = 4;
const REVENUE_STATUS_IDS = [INVOICED_STATUS_ID, PAID_STATUS_ID];

type StockStatus = "critical" | "low" | "good" | "unknown";

export type ProductStockLevel = {
  id: number;
  productName: string;
  category: string;
  currentStock: number;
  avgMonthlyUsage: number;
  daysRemaining: number | null;
  status: StockStatus;
};

export type StockMovementSummaryByCategory = {
  category: string;
  stockIn: number;
  stockOut: number;
  netChange: number;
};

export type RecentStockMovement = {
  date: string;
  productName: string;
  type: string;
  quantity: number;
  notes: string | null;
};

const calculateDaysRemaining = (currentStock: number, avgMonthlyUsage: number): number | null => {
  if (avgMonthlyUsage === 0) {
    return null;
  }
  return (currentStock / avgMonthlyUsage) * 30;
};

const getStockStatus = (daysRemaining: number | null): StockStatus => {
  if (daysRemaining === null) {
    return "unknown";
  }
  if (daysRemaining < 15) {
    return "critical";
  }
  if (daysRemaining < 30) {
    return "low";
  }
  return "good";
};

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export class InventoryService {
  /**
   * Get stock levels for all products with sales velocity and days remaining
   */
  async getStockLevels(params: {
    category?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }): Promise<ProductStockLevel[]> {
    const { category, search, sortBy = "daysRemaining", sortOrder = "asc" } = params;

    // Calculate 12 months ago
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    const twelveMonthsAgoStr = formatDate(twelveMonthsAgo);

    // Get current stock per product
    const currentStockQuery = db
      .select({
        productId: stockMovements.productId,
        currentStock: sql<number>`CAST(COALESCE(SUM(${stockMovements.quantity}), 0) AS FLOAT)`.as("current_stock"),
      })
      .from(stockMovements)
      .groupBy(stockMovements.productId)
      .as("stock");

    // Get average monthly usage (last 12 months)
    const avgUsageQuery = db
      .select({
        productId: salesLines.productId,
        avgMonthlyUsage: sql<number>`CAST(COALESCE(SUM(${salesLines.weight}) / 12.0, 0) AS FLOAT)`.as("avg_monthly_usage"),
      })
      .from(salesLines)
      .innerJoin(sales, eq(sales.id, salesLines.saleId))
      .where(
        and(
          inArray(sales.salesStatus, REVENUE_STATUS_IDS),
          gte(sales.salesDate, twelveMonthsAgoStr)
        )
      )
      .groupBy(salesLines.productId)
      .as("usage");

    // Main query joining products with stock and usage
    let query = db
      .select({
        id: products.id,
        productName: products.name,
        categoryId: products.productTypeId,
        categoryName: productTypes.name,
        currentStock: sql<number>`CAST(COALESCE(${currentStockQuery.currentStock}, 0) AS FLOAT)`.as("product_current_stock"),
        avgMonthlyUsage: sql<number>`CAST(COALESCE(${avgUsageQuery.avgMonthlyUsage}, 0) AS FLOAT)`.as("product_avg_usage"),
      })
      .from(products)
      .innerJoin(productTypes, eq(products.productTypeId, productTypes.id))
      .leftJoin(currentStockQuery, eq(products.id, currentStockQuery.productId))
      .leftJoin(avgUsageQuery, eq(products.id, avgUsageQuery.productId));

    // Apply filters
    const conditions = [];
    if (category && category !== "all") {
      conditions.push(eq(productTypes.name, category));
    }
    if (search) {
      conditions.push(sql`LOWER(${products.name}) LIKE LOWER(${"%" + search + "%"})`);
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const results = await query;

    // Calculate days remaining and status
    const stockLevels = results.map((row) => {
      const daysRemaining = calculateDaysRemaining(row.currentStock, row.avgMonthlyUsage);
      const status = getStockStatus(daysRemaining);

      return {
        id: row.id,
        productName: row.productName,
        category: row.categoryName,
        currentStock: row.currentStock,
        avgMonthlyUsage: row.avgMonthlyUsage,
        daysRemaining,
        status,
      };
    });

    // Sort results
    stockLevels.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "daysRemaining":
          // Nulls last
          if (a.daysRemaining === null && b.daysRemaining === null) {
            comparison = 0;
          } else if (a.daysRemaining === null) {
            comparison = 1;
          } else if (b.daysRemaining === null) {
            comparison = -1;
          } else {
            comparison = a.daysRemaining - b.daysRemaining;
          }
          break;
        case "productName":
          comparison = a.productName.localeCompare(b.productName);
          break;
        case "category":
          comparison = a.category.localeCompare(b.category);
          break;
        case "currentStock":
          comparison = a.currentStock - b.currentStock;
          break;
        case "avgMonthlyUsage":
          comparison = a.avgMonthlyUsage - b.avgMonthlyUsage;
          break;
        default:
          comparison = 0;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return stockLevels;
  }

  /**
   * Get stock movement summary by category for last N days
   */
  async getMovementSummary(days: number = 30): Promise<StockMovementSummaryByCategory[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = formatDate(startDate);

    const results = await db
      .select({
        category: productTypes.name,
        stockIn: sql<number>`CAST(COALESCE(SUM(CASE WHEN ${stockMovements.quantity} > 0 THEN ${stockMovements.quantity} ELSE 0 END), 0) AS FLOAT)`,
        stockOut: sql<number>`CAST(COALESCE(SUM(CASE WHEN ${stockMovements.quantity} < 0 THEN ABS(${stockMovements.quantity}) ELSE 0 END), 0) AS FLOAT)`,
        netChange: sql<number>`CAST(COALESCE(SUM(${stockMovements.quantity}), 0) AS FLOAT)`,
      })
      .from(stockMovements)
      .innerJoin(products, eq(stockMovements.productId, products.id))
      .innerJoin(productTypes, eq(products.productTypeId, productTypes.id))
      .where(gte(stockMovements.date, startDateStr))
      .groupBy(productTypes.name)
      .orderBy(productTypes.name);

    return results.map((row) => ({
      category: row.category,
      stockIn: row.stockIn,
      stockOut: row.stockOut,
      netChange: row.netChange,
    }));
  }

  /**
   * Get recent stock movements
   */
  async getRecentMovements(limit: number = 20): Promise<RecentStockMovement[]> {
    const results = await db
      .select({
        date: stockMovements.date,
        productName: products.name,
        quantity: stockMovements.quantity,
        remark: stockMovements.remark,
      })
      .from(stockMovements)
      .innerJoin(products, eq(stockMovements.productId, products.id))
      .orderBy(desc(stockMovements.date), desc(stockMovements.creationDate))
      .limit(limit);

    return results.map((row) => ({
      date: row.date,
      productName: row.productName,
      type: parseFloat(row.quantity) > 0 ? "Stock In" : "Stock Out",
      quantity: parseFloat(row.quantity),
      notes: row.remark,
    }));
  }
}

export const inventoryService = new InventoryService();
