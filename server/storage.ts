// Storage layer implementation - adapted for new MySQL-matched schema
import {
  products,
  customers,
  sales,
  salesLines,
  salePayments,
  productTypes,
  productSubtypes,
  paymentMethods,
  salesStatuses,
  stockMovementReasons,
  productItemStatuses,
  productItems,
  users,
  suppliers,
  supplierOrders,
  supplierOrderLines,
  buyingPrices,
  vatClasses,
  productUnits,
  productLocations,
  greenRoastedCoffees,
  roasts,
  type Product,
  type InsertProduct,
  type Customer,
  type InsertCustomer,
  type Sale,
  type InsertSale,
  type SalesLine,
  type InsertSalesLine,
  type SaleWithLines,
  type User,
  type UpsertUser,
  type ProductType,
  type InsertProductType,
  type ProductSubtype,
  type InsertProductSubtype,
  type PaymentMethod,
  type InsertPaymentMethod,
  type SalesStatus,
  type InsertSalesStatus,
  type StockMovementReason,
  type InsertStockMovementReason,
  type ProductItemStatus,
  type InsertProductItemStatus,
  type ProductItem,
  type InsertProductItem,
  stockMovements,
  type StockMovement,
  type InsertStockMovement,
  type Supplier,
  type InsertSupplier,
  type SupplierOrder,
  type InsertSupplierOrder,
  type SupplierOrderLine,
  type InsertSupplierOrderLine,
  type SupplierOrderWithLines,
  type BuyingPrice,
  type VatClass,
  type InsertVatClass,
  type ProductUnit,
  type InsertProductUnit,
  type ProductLocation,
  type InsertProductLocation,
  type GreenRoastedCoffee,
  type InsertGreenRoastedCoffee,
  type Roast,
  type InsertRoast,
  announcements,
  type Announcement,
  type InsertAnnouncement,
  salesPrices,
  grindSizes,
  freeShippingPostalCodes,
  customerPrices,
  productComponents,
  type GrindSize,
  type InsertGrindSize,
  type FreeShippingPostalCode,
  type InsertFreeShippingPostalCode,
  type CustomerPrice,
  type InsertCustomerPrice,
  type ProductComponent,
  type InsertProductComponent,
  type InsertBuyingPrice,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, sql, lt, lte, gte } from "drizzle-orm";

export interface IStorage {
  // Users (Replit Auth requirement)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  getProductWebshopDetails(id: number): Promise<any | undefined>;
  getProductsByType(typeId: number): Promise<Product[]>;
  getWebshopProducts(): Promise<any[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  checkProductHasSales(productId: number): Promise<boolean>;
  
  // Product Statistics
  getProductStatistics(productId: number, currentYear: number): Promise<{
    ytdSales: number;
    currentStock: number;
    highestMonthlySale: number;
    totalRevenue: number;
  }>;
  getProductMonthlySales(productId: number, year: number): Promise<Array<{
    month: number;
    sales: number;
    revenue: number;
  }>>;
  getProductYearlySales(productId: number): Promise<Array<{
    year: number;
    totalSales: number;
    totalRevenue: number;
    orderCount: number;
  }>>;

  // Customers
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  getCustomerByEmail(email: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: number): Promise<boolean>;
  checkCustomerHasSales(customerId: number): Promise<boolean>;

  // Customer Statistics
  getCustomerStatistics(customerId: number, currentYear: number): Promise<{
    lifetimeValue: number;
    currentYearRevenue: number;
    previousYearRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    firstPurchaseDate: string | null;
    lastPurchaseDate: string | null;
  }>;
  getCustomerYearlySales(customerId: number): Promise<Array<{
    year: number;
    totalRevenue: number;
    orderCount: number;
  }>>;
  getCustomerProductsPurchased(customerId: number): Promise<Array<{
    productId: number;
    productName: string;
    totalQuantity: number;
    totalRevenue: number;
  }>>;

  // Sales (replaces Orders)
  getSales(): Promise<Sale[]>;
  getSale(id: number): Promise<SaleWithLines | undefined>;
  getSalesByCustomer(customerId: number): Promise<Sale[]>;
  createSale(sale: InsertSale, items: InsertSalesLine[]): Promise<SaleWithLines>;
  updateSaleStatus(id: number, statusId: number): Promise<Sale | undefined>;
  getRevenueForDateRange(startDate: string, endDate: string, statusIds: number[]): Promise<number>;
  getRevenueForChannel(startDate: string, endDate: string, channel: string, statusIds: number[]): Promise<number>;

  // Dashboard Analytics
  getRevenueByCategory(startDate: string, endDate: string, statusIds: number[]): Promise<Array<{
    categoryId: number;
    categoryName: string;
    revenue: number;
  }>>;
  getOutstandingInvoices(): Promise<{ amount: number; count: number }>;
  getOverdueInvoices(daysThreshold: number): Promise<{ amount: number; count: number }>;
  getAverageDaysToPayment(months: number): Promise<number>;
  getLowStockProducts(limit: number, monthsForAverage: number): Promise<Array<{
    productId: number;
    productName: string;
    currentStock: number;
    avgMonthlySales: number;
    daysRemaining: number;
  }>>;
  getAllInventoryLevels(limit: number, monthsForAverage: number): Promise<Array<{
    productId: number;
    productName: string;
    currentStock: number;
    avgMonthlySales: number;
    daysRemaining: number;
    unit: string;
  }>>;
  getTotalCustomers(): Promise<number>;
  getNewCustomersThisMonth(year: number, month: number): Promise<number>;
  getOneTimeCustomers(): Promise<number>;
  getInactiveCustomers(monthsThreshold: number): Promise<number>;
  getSalesCount(year: number): Promise<number>;
  getTopCustomersByRevenue(year: number, statusIds: number[], limit: number): Promise<Array<{
    customerId: number;
    customerName: string;
    revenue: number;
  }>>;
  getTopProductsByRevenue(year: number, statusIds: number[], limit: number): Promise<Array<{
    productId: number;
    productName: string;
    revenue: number;
    quantitySold: number;
  }>>;

  // Sales Analytics (Phase 3)
  getMonthlyRevenueByYears(years: number[], statusIds: number[]): Promise<Array<{
    month: number;
    year: number;
    revenue: number;
  }>>;
  getAnnualRevenue(statusIds: number[]): Promise<Array<{
    year: number;
    revenue: number;
  }>>;
  getAllTimeRevenue(statusIds: number[]): Promise<number>;
  getBestRevenueMonth(statusIds: number[]): Promise<{
    year: number;
    month: number;
    revenue: number;
  } | null>;
  getMonthlyRevenueTimeline(statusIds: number[]): Promise<Array<{
    year: number;
    month: number;
    monthKey: string;
    revenue: number;
  }>>;
  getChannelRevenueByYears(years: number[], statusIds: number[], referenceDate: Date): Promise<Array<{
    channel: string;
    year: number;
    revenue: number;
  }>>;
  getChannelRevenueForDateRange(startDate: string, endDate: string, statusIds: number[]): Promise<Array<{
    channel: string;
    revenue: number;
  }>>;

  // Reference Tables - Product Types
  getProductTypes(): Promise<ProductType[]>;
  createProductType(data: InsertProductType): Promise<ProductType>;
  updateProductType(id: number, data: Partial<InsertProductType>): Promise<ProductType | undefined>;
  deleteProductType(id: number): Promise<boolean>;

  // Product Subtypes
  getProductSubtypes(): Promise<ProductSubtype[]>;
  createProductSubtype(data: InsertProductSubtype): Promise<ProductSubtype>;
  updateProductSubtype(id: number, data: Partial<InsertProductSubtype>): Promise<ProductSubtype | undefined>;
  deleteProductSubtype(id: number): Promise<boolean>;

  // Payment Methods
  getPaymentMethods(): Promise<PaymentMethod[]>;
  createPaymentMethod(data: InsertPaymentMethod): Promise<PaymentMethod>;
  updatePaymentMethod(id: number, data: Partial<InsertPaymentMethod>): Promise<PaymentMethod | undefined>;
  deletePaymentMethod(id: number): Promise<boolean>;

  // Sales Statuses
  getSalesStatuses(): Promise<SalesStatus[]>;
  createSalesStatus(data: InsertSalesStatus): Promise<SalesStatus>;
  updateSalesStatus(id: number, data: Partial<InsertSalesStatus>): Promise<SalesStatus | undefined>;
  deleteSalesStatus(id: number): Promise<boolean>;

  // Stock Movement Reasons
  getStockMovementReasons(): Promise<StockMovementReason[]>;
  createStockMovementReason(data: InsertStockMovementReason): Promise<StockMovementReason>;
  updateStockMovementReason(id: number, data: Partial<InsertStockMovementReason>): Promise<StockMovementReason | undefined>;
  deleteStockMovementReason(id: number): Promise<boolean>;

  // Product Item Statuses
  getProductItemStatuses(): Promise<ProductItemStatus[]>;
  createProductItemStatus(data: InsertProductItemStatus): Promise<ProductItemStatus>;
  updateProductItemStatus(id: number, data: Partial<InsertProductItemStatus>): Promise<ProductItemStatus | undefined>;
  deleteProductItemStatus(id: number): Promise<boolean>;

  // Product Items
  getProductItems(): Promise<ProductItem[]>;
  getProductItemsByProduct(productId: number): Promise<ProductItem[]>;
  createProductItem(data: InsertProductItem): Promise<ProductItem>;
  updateProductItem(id: number, data: Partial<InsertProductItem>): Promise<ProductItem | undefined>;
  deleteProductItem(id: number): Promise<boolean>;

  // Stock Movements
  getStockMovements(): Promise<StockMovement[]>;
  getStockMovementsByProduct(productId: number): Promise<StockMovement[]>;
  createStockMovement(data: InsertStockMovement): Promise<StockMovement>;
  updateStockMovement(id: number, data: Partial<InsertStockMovement>): Promise<StockMovement | undefined>;
  deleteStockMovement(id: number): Promise<boolean>;

  // Suppliers
  getSuppliers(): Promise<Supplier[]>;
  createSupplier(data: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: number, data: Partial<InsertSupplier>): Promise<Supplier | undefined>;
  deleteSupplier(id: number): Promise<boolean>;

  // Supplier Orders
  getSupplierOrders(): Promise<SupplierOrderWithLines[]>;
  getSupplierOrder(id: number): Promise<SupplierOrderWithLines | undefined>;
  createSupplierOrder(data: InsertSupplierOrder): Promise<SupplierOrder>;
  updateSupplierOrder(id: number, data: Partial<InsertSupplierOrder>): Promise<SupplierOrder | undefined>;
  deleteSupplierOrder(id: number): Promise<boolean>;
  confirmSupplierOrder(id: number): Promise<SupplierOrder | undefined>;

  // Supplier Order Lines
  getSupplierOrderLines(supplierOrderId: number): Promise<SupplierOrderLine[]>;
  createSupplierOrderLine(data: InsertSupplierOrderLine): Promise<SupplierOrderLine>;
  updateSupplierOrderLine(id: number, data: Partial<InsertSupplierOrderLine>): Promise<SupplierOrderLine | undefined>;
  deleteSupplierOrderLine(id: number): Promise<boolean>;

  // VAT Classes
  getVatClasses(): Promise<VatClass[]>;
  createVatClass(data: InsertVatClass): Promise<VatClass>;
  updateVatClass(id: number, data: Partial<InsertVatClass>): Promise<VatClass | undefined>;
  deleteVatClass(id: number): Promise<boolean>;

  // Product Units
  getProductUnits(): Promise<ProductUnit[]>;
  createProductUnit(data: InsertProductUnit): Promise<ProductUnit>;
  updateProductUnit(id: number, data: Partial<InsertProductUnit>): Promise<ProductUnit | undefined>;
  deleteProductUnit(id: number): Promise<boolean>;

  // Product Locations
  getProductLocations(): Promise<ProductLocation[]>;
  createProductLocation(data: InsertProductLocation): Promise<ProductLocation>;
  updateProductLocation(id: number, data: Partial<InsertProductLocation>): Promise<ProductLocation | undefined>;
  deleteProductLocation(id: number): Promise<boolean>;

  // Green Roasted Coffee Configurations
  getGreenRoastedCoffees(): Promise<GreenRoastedCoffee[]>;
  createGreenRoastedCoffee(data: InsertGreenRoastedCoffee): Promise<GreenRoastedCoffee>;
  updateGreenRoastedCoffee(id: number, data: Partial<InsertGreenRoastedCoffee>): Promise<GreenRoastedCoffee | undefined>;
  deleteGreenRoastedCoffee(id: number): Promise<boolean>;

  // Roasts
  getRoasts(): Promise<any[]>;
  getRoast(id: number): Promise<Roast | undefined>;
  createRoast(data: InsertRoast): Promise<Roast>;
  updateRoast(id: number, data: Partial<InsertRoast>): Promise<Roast | undefined>;
  deleteRoast(id: number): Promise<boolean>;

  // Announcements
  getAnnouncements(): Promise<Announcement[]>;
  getActiveAnnouncements(): Promise<Announcement[]>;
  createAnnouncement(data: InsertAnnouncement): Promise<Announcement>;
  updateAnnouncement(id: number, data: Partial<InsertAnnouncement>): Promise<Announcement | undefined>;
  deleteAnnouncement(id: number): Promise<boolean>;

  // Homepage categories
  getHomepageCategories(): Promise<ProductType[]>;

  // Grind Sizes
  getGrindSizes(): Promise<GrindSize[]>;
  createGrindSize(data: InsertGrindSize): Promise<GrindSize>;
  updateGrindSize(id: number, data: Partial<InsertGrindSize>): Promise<GrindSize | undefined>;
  deleteGrindSize(id: number): Promise<boolean>;

  // Free Shipping Postal Codes
  getFreeShippingPostalCodes(): Promise<FreeShippingPostalCode[]>;
  createFreeShippingPostalCode(data: InsertFreeShippingPostalCode): Promise<FreeShippingPostalCode>;
  deleteFreeShippingPostalCode(id: number): Promise<boolean>;

  // Customer Prices
  getCustomerPrices(customerId: number): Promise<CustomerPrice[]>;
  createCustomerPrice(data: InsertCustomerPrice): Promise<CustomerPrice>;
  updateCustomerPrice(id: number, customerId: number, data: Partial<InsertCustomerPrice>): Promise<CustomerPrice | undefined>;
  deleteCustomerPrice(id: number, customerId: number): Promise<boolean>;

  // Buying Prices
  getBuyingPrices(productId: number): Promise<BuyingPrice[]>;
  createBuyingPrice(data: InsertBuyingPrice): Promise<BuyingPrice>;
  updateBuyingPrice(id: number, data: Partial<InsertBuyingPrice>): Promise<BuyingPrice | undefined>;
  deleteBuyingPrice(id: number): Promise<BuyingPrice | undefined>;

  // Product Components
  getProductComponents(productId: number): Promise<any[]>;
  createProductComponent(data: InsertProductComponent): Promise<ProductComponent>;
  updateProductComponent(id: number, data: Partial<InsertProductComponent>): Promise<ProductComponent | undefined>;
  deleteProductComponent(id: number): Promise<ProductComponent | undefined>;
}

export class DatabaseStorage implements IStorage {
  // Users (Replit Auth requirement)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // Use INSERT ... ON CONFLICT on ID (primary key) to atomically handle user upsert
    // With OIDC, the same user should always have the same ID (sub claim)
    // However, in testing scenarios, we may have duplicate emails with different IDs
    // We handle this by updating the existing user's ID to maintain data integrity
    
    // First, check if a user with this email already exists (but different ID)
    if (userData.email) {
      const existingUsers = await db
        .select()
        .from(users)
        .where(eq(users.email, userData.email))
        .limit(1);
      
      if (existingUsers.length > 0 && existingUsers[0].id !== userData.id) {
        // Email exists with different ID
        // In production, this shouldn't happen (OIDC sub is stable)
        // In testing, we update the existing user to use the new ID
        // This preserves any existing data/relationships
        const existingUser = existingUsers[0];
        
        // OIDC should always provide an ID (sub claim), but check to be safe
        if (!userData.id) {
          return existingUser;
        }
        
        // Check if the new ID is already taken by a different user
        const newIdUsers = await db
          .select()
          .from(users)
          .where(eq(users.id, userData.id as string))
          .limit(1);
        
        if (newIdUsers.length > 0) {
          // Both the email and new ID exist as different users
          // This is a critical security issue - reject the login
          if (process.env.NODE_ENV === 'development') {
            // In dev/test: delete the user with the new ID (stale test user)
            await db.delete(users).where(eq(users.id, userData.id as string));
          } else {
            // In production: reject the login - manual remediation required
            console.error(`CRITICAL: OIDC collision detected. Email ${userData.email} exists with ID ${existingUser.id}, but login attempted with existing ID ${userData.id}. Login REJECTED.`);
            throw new Error('Account authentication conflict detected. Please contact support.');
          }
        }
        
        // Update the existing user's ID to the new OIDC ID
        const [updatedUser] = await db
          .update(users)
          .set({
            id: userData.id,
            firstName: userData.firstName,
            lastName: userData.lastName,
            profileImageUrl: userData.profileImageUrl,
            role: userData.role,
            updatedAt: new Date(),
          })
          .where(eq(users.email, userData.email))
          .returning();
        
        return updatedUser;
      }
    }
    
    // Standard upsert: insert new or update existing by ID
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          role: userData.role,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Products
  async getProducts(): Promise<any[]> {
    const result = await db
      .select({
        id: products.id,
        name: products.name,
        nameDutch: products.nameDutch,
        posShortNameDutch: products.posShortNameDutch,
        picture: products.picture,
        productTypeId: products.productTypeId,
        productTypeName: productTypes.name,
        productSubtypeId: products.productSubtypeId,
        productSubtypeName: productSubtypes.name,
        vatClassId: products.vatClassId,
        vatClassName: vatClasses.name,
        vatPercentage: vatClasses.percentage,
        status: products.status,
        supplierId: products.supplierId,
        supplierName: suppliers.name,
        supplierProductId: products.supplierProductId,
        woocommerceId: products.woocommerceId,
        ownBlend: products.ownBlend,
        creationDate: products.creationDate,
        modificationDate: products.modificationDate,
      })
      .from(products)
      .leftJoin(productTypes, eq(products.productTypeId, productTypes.id))
      .leftJoin(productSubtypes, eq(products.productSubtypeId, productSubtypes.id))
      .leftJoin(suppliers, eq(products.supplierId, suppliers.id))
      .leftJoin(vatClasses, eq(products.vatClassId, vatClasses.id))
      .orderBy(desc(products.id));
    return result;
  }

  async getProduct(id: number): Promise<any | undefined> {
    const [product] = await db
      .select({
        id: products.id,
        name: products.name,
        nameDutch: products.nameDutch,
        posShortNameDutch: products.posShortNameDutch,
        picture: products.picture,
        productTypeId: products.productTypeId,
        productTypeName: productTypes.name,
        productSubtypeId: products.productSubtypeId,
        productSubtypeName: productSubtypes.name,
        vatClassId: products.vatClassId,
        vatClassName: vatClasses.name,
        vatPercentage: vatClasses.percentage,
        isActive: products.status,
        supplierId: products.supplierId,
        supplierName: suppliers.name,
        supplierProductId: products.supplierProductId,
        woocommerceId: products.woocommerceId,
        ownBlend: products.ownBlend,
        creationDate: products.creationDate,
        modificationDate: products.modificationDate,
      })
      .from(products)
      .leftJoin(productTypes, eq(products.productTypeId, productTypes.id))
      .leftJoin(productSubtypes, eq(products.productSubtypeId, productSubtypes.id))
      .leftJoin(suppliers, eq(products.supplierId, suppliers.id))
      .leftJoin(vatClasses, eq(products.vatClassId, vatClasses.id))
      .where(eq(products.id, id));
    return product || undefined;
  }

  async getProductWebshopDetails(id: number): Promise<any | undefined> {
    const [product] = await db
      .select({
        id: products.id,
        productTypeId: products.productTypeId,
        webshopEnabled: products.webshopEnabled,
        webshopDescription: products.webshopDescription,
        originCountry: products.originCountry,
        originContinent: products.originContinent,
        region: products.region,
        tastingNote: products.tastingNote,
        process: products.process,
        strength: products.strength,
        brewTemp: products.brewTemp,
        brewTime: products.brewTime,
        brewDosage: products.brewDosage,
        shortDescription: products.shortDescription,
        juraSeries: products.juraSeries,
        juraPriceRange: products.juraPriceRange,
        specs: products.specs,
        awards: products.awards,
        seasonal: products.seasonal,
        featured: products.featured,
        webshopSortOrder: products.webshopSortOrder,
      })
      .from(products)
      .where(eq(products.id, id));
    return product || undefined;
  }

  async getProductsByType(typeId: number): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.productTypeId, typeId));
  }

  async getWebshopProducts(): Promise<any[]> {
    const today = new Date().toISOString().split("T")[0];
    const result = await db
      .select({
        id: products.id,
        name: products.name,
        nameDutch: products.nameDutch,
        picture: products.picture,
        productTypeId: products.productTypeId,
        productTypeName: productTypes.name,
        productSubtypeId: products.productSubtypeId,
        productSubtypeName: productSubtypes.name,
        webshopEnabled: products.webshopEnabled,
        webshopDescription: products.webshopDescription,
        originCountry: products.originCountry,
        originContinent: products.originContinent,
        region: products.region,
        tastingNote: products.tastingNote,
        process: products.process,
        strength: products.strength,
        brewTemp: products.brewTemp,
        brewTime: products.brewTime,
        brewDosage: products.brewDosage,
        shortDescription: products.shortDescription,
        juraSeries: products.juraSeries,
        juraPriceRange: products.juraPriceRange,
        specs: products.specs,
        awards: products.awards,
        seasonal: products.seasonal,
        featured: products.featured,
        webshopSortOrder: products.webshopSortOrder,
        priceWithVat: salesPrices.b2cPriceWithVat,
        priceWithoutVat: salesPrices.b2cPriceWithoutVat,
        priceAmount: salesPrices.amount,
        priceUnit: salesPrices.unit,
        priceId: salesPrices.id,
        priceWebshopDefault: salesPrices.webshopDefault,
      })
      .from(products)
      .leftJoin(productTypes, eq(products.productTypeId, productTypes.id))
      .leftJoin(productSubtypes, eq(products.productSubtypeId, productSubtypes.id))
      .leftJoin(
        salesPrices,
        and(
          eq(salesPrices.productId, products.id),
          eq(salesPrices.webshopPrice, true),
          lte(salesPrices.validFrom, today),
          gte(salesPrices.validUntil, today)
        )
      )
      .where(
        and(
          eq(products.webshopEnabled, true),
          eq(products.status, "1")
        )
      )
      .orderBy(products.webshopSortOrder, products.nameDutch);

    const grouped = new Map<number, any>();
    for (const row of result) {
      if (!grouped.has(row.id)) {
        grouped.set(row.id, {
          ...row,
          prices: [],
        });
      }
      if (row.priceWithVat) {
        grouped.get(row.id)!.prices.push({
          id: row.priceId,
          priceWithVat: row.priceWithVat,
          priceWithoutVat: row.priceWithoutVat,
          amount: row.priceAmount,
          unit: row.priceUnit,
          webshopDefault: row.priceWebshopDefault ?? false,
        });
      }
    }

    return Array.from(grouped.values()).map(({ priceWithVat, priceWithoutVat, priceAmount, priceUnit, priceId, priceWebshopDefault, ...rest }) => rest);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db
      .insert(products)
      .values(insertProduct)
      .returning();
    return product;
  }

  async updateProduct(id: number, updateData: Partial<InsertProduct>): Promise<Product | undefined> {
    const [product] = await db
      .update(products)
      .set({ ...updateData, modificationDate: new Date() })
      .where(eq(products.id, id))
      .returning();
    return product || undefined;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async checkProductHasSales(productId: number): Promise<boolean> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(salesLines)
      .where(eq(salesLines.productId, productId));
    return (result?.count ?? 0) > 0;
  }

  // Product Statistics
  async getProductStatistics(productId: number, currentYear: number): Promise<{
    ytdSales: number;
    currentStock: number;
    highestMonthlySale: number;
    totalRevenue: number;
  }> {
    // YTD Sales - sum of quantities sold in current year from saleslines
    const ytdResult = await db.execute(sql`
      SELECT COALESCE(SUM(sl.amount * sl.weight), 0) as ytd_sales
      FROM salesline sl
      JOIN sale s ON sl.sale_id = s.id
      WHERE sl.product_id = ${productId}
        AND EXTRACT(YEAR FROM s.sales_date) = ${currentYear}
    `);
    const ytdSales = Number((ytdResult.rows[0] as any)?.ytd_sales || 0);

    // Current Stock - sum of all stock movements
    const stockResult = await db.execute(sql`
      SELECT COALESCE(SUM(quantity), 0) as current_stock
      FROM stock_movement
      WHERE product_id = ${productId}
    `);
    const currentStock = Number((stockResult.rows[0] as any)?.current_stock || 0);

    // Highest Monthly Sale - maximum monthly quantity from saleslines
    const highestMonthlyResult = await db.execute(sql`
      SELECT COALESCE(MAX(monthly_sales), 0) as highest_monthly
      FROM (
        SELECT SUM(sl.amount * sl.weight) as monthly_sales
        FROM salesline sl
        JOIN sale s ON sl.sale_id = s.id
        WHERE sl.product_id = ${productId}
        GROUP BY DATE_TRUNC('month', s.sales_date)
      ) monthly_totals
    `);
    const highestMonthlySale = Number((highestMonthlyResult.rows[0] as any)?.highest_monthly || 0);

    // Total Revenue - sum of all salesline totals
    const revenueResult = await db.execute(sql`
      SELECT COALESCE(SUM(total_without_vat), 0) as total_revenue
      FROM salesline
      WHERE product_id = ${productId}
    `);
    const totalRevenue = Number((revenueResult.rows[0] as any)?.total_revenue || 0);

    return {
      ytdSales,
      currentStock,
      highestMonthlySale,
      totalRevenue,
    };
  }

  async getProductMonthlySales(productId: number, year: number): Promise<Array<{
    month: number;
    sales: number;
    revenue: number;
  }>> {
    const result = await db.execute(sql`
      SELECT 
        EXTRACT(MONTH FROM s.sales_date)::int as month,
        COALESCE(SUM(sl.amount * sl.weight), 0) as sales,
        COALESCE(SUM(sl.total_without_vat), 0) as revenue
      FROM salesline sl
      JOIN sale s ON sl.sale_id = s.id
      WHERE sl.product_id = ${productId}
        AND EXTRACT(YEAR FROM s.sales_date) = ${year}
      GROUP BY EXTRACT(MONTH FROM s.sales_date)
      ORDER BY month
    `);

    return result.rows.map((row: any) => ({
      month: Number(row.month),
      sales: Number(row.sales),
      revenue: Number(row.revenue),
    }));
  }

  async getProductYearlySales(productId: number): Promise<Array<{
    year: number;
    totalSales: number;
    totalRevenue: number;
    orderCount: number;
  }>> {
    const result = await db.execute(sql`
      SELECT 
        EXTRACT(YEAR FROM s.sales_date)::int as year,
        COALESCE(SUM(sl.amount * sl.weight), 0) as total_sales,
        COALESCE(SUM(sl.total_without_vat), 0) as total_revenue,
        COUNT(DISTINCT s.id) as order_count
      FROM salesline sl
      JOIN sale s ON sl.sale_id = s.id
      WHERE sl.product_id = ${productId}
      GROUP BY EXTRACT(YEAR FROM s.sales_date)
      ORDER BY year DESC
    `);

    return result.rows.map((row: any) => ({
      year: Number(row.year),
      totalSales: Number(row.total_sales),
      totalRevenue: Number(row.total_revenue),
      orderCount: Number(row.order_count),
    }));
  }

  // Customers
  async getCustomers(): Promise<Customer[]> {
    return await db.select().from(customers).orderBy(desc(customers.creationDate));
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || undefined;
  }

  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    if (!email) return undefined;
    const [customer] = await db.select().from(customers).where(eq(customers.email, email));
    return customer || undefined;
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const [customer] = await db
      .insert(customers)
      .values(insertCustomer)
      .returning();
    return customer;
  }

  async updateCustomer(id: number, updateData: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [customer] = await db
      .update(customers)
      .set({ ...updateData, modificationDate: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return customer || undefined;
  }

  async deleteCustomer(id: number): Promise<boolean> {
    const result = await db.delete(customers).where(eq(customers.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async checkCustomerHasSales(customerId: number): Promise<boolean> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(sales)
      .where(eq(sales.customerId, customerId));
    return (result?.count ?? 0) > 0;
  }

  async getCustomerStatistics(customerId: number, currentYear: number): Promise<{
    lifetimeValue: number;
    currentYearRevenue: number;
    previousYearRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    firstPurchaseDate: string | null;
    lastPurchaseDate: string | null;
  }> {
    // Lifetime Value - total revenue from all sales
    const lifetimeResult = await db.execute(sql`
      SELECT COALESCE(SUM(sl.total_without_vat), 0) as lifetime_value
      FROM salesline sl
      JOIN sale s ON sl.sale_id = s.id
      WHERE s.customer_id = ${customerId}
    `);
    const lifetimeValue = Number((lifetimeResult.rows[0] as any)?.lifetime_value || 0);

    // Current Year Revenue
    const currentYearResult = await db.execute(sql`
      SELECT COALESCE(SUM(sl.total_without_vat), 0) as current_year_revenue
      FROM salesline sl
      JOIN sale s ON sl.sale_id = s.id
      WHERE s.customer_id = ${customerId}
        AND EXTRACT(YEAR FROM s.sales_date) = ${currentYear}
    `);
    const currentYearRevenue = Number((currentYearResult.rows[0] as any)?.current_year_revenue || 0);

    // Previous Year Revenue
    const previousYearResult = await db.execute(sql`
      SELECT COALESCE(SUM(sl.total_without_vat), 0) as previous_year_revenue
      FROM salesline sl
      JOIN sale s ON sl.sale_id = s.id
      WHERE s.customer_id = ${customerId}
        AND EXTRACT(YEAR FROM s.sales_date) = ${currentYear - 1}
    `);
    const previousYearRevenue = Number((previousYearResult.rows[0] as any)?.previous_year_revenue || 0);

    // Total Orders and Average Order Value
    const orderStatsResult = await db.execute(sql`
      SELECT
        COUNT(DISTINCT s.id) as total_orders,
        COALESCE(SUM(sl.total_without_vat), 0) as total_revenue
      FROM sale s
      LEFT JOIN salesline sl ON sl.sale_id = s.id
      WHERE s.customer_id = ${customerId}
    `);
    const totalOrders = Number((orderStatsResult.rows[0] as any)?.total_orders || 0);
    const totalRevenue = Number((orderStatsResult.rows[0] as any)?.total_revenue || 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // First and Last Purchase Dates
    const datesResult = await db.execute(sql`
      SELECT
        MIN(s.sales_date) as first_purchase_date,
        MAX(s.sales_date) as last_purchase_date
      FROM sale s
      WHERE s.customer_id = ${customerId}
    `);
    const firstPurchaseDate = (datesResult.rows[0] as any)?.first_purchase_date || null;
    const lastPurchaseDate = (datesResult.rows[0] as any)?.last_purchase_date || null;

    return {
      lifetimeValue,
      currentYearRevenue,
      previousYearRevenue,
      totalOrders,
      averageOrderValue,
      firstPurchaseDate: firstPurchaseDate ? new Date(firstPurchaseDate).toISOString() : null,
      lastPurchaseDate: lastPurchaseDate ? new Date(lastPurchaseDate).toISOString() : null,
    };
  }

  async getCustomerYearlySales(customerId: number): Promise<Array<{
    year: number;
    totalRevenue: number;
    orderCount: number;
  }>> {
    const result = await db.execute(sql`
      SELECT
        EXTRACT(YEAR FROM s.sales_date)::int as year,
        COALESCE(SUM(sl.total_without_vat), 0) as total_revenue,
        COUNT(DISTINCT s.id) as order_count
      FROM sale s
      LEFT JOIN salesline sl ON sl.sale_id = s.id
      WHERE s.customer_id = ${customerId}
      GROUP BY EXTRACT(YEAR FROM s.sales_date)
      ORDER BY year DESC
    `);

    return result.rows.map((row: any) => ({
      year: Number(row.year),
      totalRevenue: Number(row.total_revenue),
      orderCount: Number(row.order_count),
    }));
  }

  async getCustomerProductsPurchased(customerId: number): Promise<Array<{
    productId: number;
    productName: string;
    totalQuantity: number;
    totalRevenue: number;
  }>> {
    const result = await db.execute(sql`
      SELECT
        p.id as product_id,
        p.name as product_name,
        COALESCE(SUM(sl.amount * sl.weight), 0) as total_quantity,
        COALESCE(SUM(sl.total_without_vat), 0) as total_revenue
      FROM salesline sl
      JOIN sale s ON sl.sale_id = s.id
      JOIN product p ON sl.product_id = p.id
      WHERE s.customer_id = ${customerId}
      GROUP BY p.id, p.name
      ORDER BY total_revenue DESC
    `);

    return result.rows.map((row: any) => ({
      productId: Number(row.product_id),
      productName: String(row.product_name),
      totalQuantity: Number(row.total_quantity),
      totalRevenue: Number(row.total_revenue),
    }));
  }

  async getCustomerStats(): Promise<{
    totalCustomers: number;
    b2bCustomers: number;
    b2cCustomers: number;
    oneTimeCustomers: number;
  }> {
    // Use SQL aggregation instead of loading all customers into memory
    const statsResult = await db.execute(sql`
      SELECT
        COUNT(*) as total_customers,
        COUNT(*) FILTER (WHERE b2b_client = true) as b2b_customers,
        COUNT(*) FILTER (WHERE b2b_client = false) as b2c_customers
      FROM customer
    `);

    const stats = statsResult.rows[0] as any;

    const oneTimeResult = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM (
        SELECT customer_id
        FROM sale
        GROUP BY customer_id
        HAVING COUNT(*) = 1
      ) one_time
    `);

    const oneTimeCustomers = Number((oneTimeResult.rows[0] as any)?.count || 0);

    return {
      totalCustomers: Number(stats.total_customers || 0),
      b2bCustomers: Number(stats.b2b_customers || 0),
      b2cCustomers: Number(stats.b2c_customers || 0),
      oneTimeCustomers,
    };
  }

  // Sales (replaces Orders)
  async getSales(): Promise<Sale[]> {
    const result = await db.execute(sql`
      SELECT
        s.id,
        s.invoice_number,
        s.customer_id,
        CASE
          WHEN c.b2b_client = true AND c.company_name IS NOT NULL AND c.company_name != ''
            THEN c.company_name
          ELSE c.first_name || ' ' || c.last_name
        END as customer_name,
        c.first_name || ' ' || c.last_name as contact_name,
        s.sales_date,
        s.payment_method,
        pm.payment_method as payment_method_name,
        s.sales_status,
        ss.sales_status as sales_status_name,
        s.webshop_sale,
        s.stock_updated,
        s.uploaded_accounting,
        s.shipping_cost_with_vat,
        s.discount_with_vat,
        COALESCE(
          (SELECT SUM(sl.total_with_vat) FROM salesline sl WHERE sl.sale_id = s.id),
          0
        ) as saleslines_total
      FROM sale s
      LEFT JOIN customer c ON s.customer_id = c.id
      LEFT JOIN payment_method pm ON s.payment_method = pm.id
      LEFT JOIN sales_status ss ON s.sales_status = ss.id
      ORDER BY s.sales_date DESC
    `);

    return result.rows.map((row: any) => ({
      id: Number(row.id),
      invoiceNumber: row.invoice_number,
      customerId: Number(row.customer_id),
      customerName: row.customer_name || 'Unknown Customer',
      contactName: row.contact_name || null,
      salesDate: row.sales_date,
      paymentMethod: Number(row.payment_method),
      paymentMethodName: row.payment_method_name || 'Unknown',
      salesStatus: Number(row.sales_status),
      salesStatusName: row.sales_status_name || 'Unknown',
      webshopSale: Boolean(row.webshop_sale),
      stockUpdated: Boolean(row.stock_updated),
      uploadedAccounting: Boolean(row.uploaded_accounting),
      shippingCostWithVat: row.shipping_cost_with_vat,
      discountWithVat: row.discount_with_vat,
      saleslinesTotal: row.saleslines_total,
    } as any));
  }

  async getSalesStats(year: number): Promise<any> {
    const result = await db.execute(sql`
      SELECT 
        COUNT(DISTINCT CASE WHEN s.invoice_number IS NOT NULL AND s.invoice_number != '' AND s.invoice_number != '0' THEN s.id END) as total_invoices,
        SUM(CASE WHEN s.webshop_sale = true THEN sl.total_without_vat ELSE 0 END) as revenue_webshop,
        SUM(CASE WHEN UPPER(c.first_name) = 'KRUZE' THEN sl.total_without_vat ELSE 0 END) as revenue_kruze,
        SUM(CASE WHEN UPPER(c.last_name) = 'BUURDERIJ' THEN sl.total_without_vat ELSE 0 END) as revenue_boeren
      FROM sale s
      LEFT JOIN salesline sl ON s.id = sl.sale_id
      LEFT JOIN customer c ON s.customer_id = c.id
      WHERE EXTRACT(YEAR FROM s.sales_date) = ${year}
    `);

    const row = result.rows[0] as any;
    return {
      totalInvoices: Number(row.total_invoices) || 0,
      revenueWebshop: row.revenue_webshop || '0',
      revenueKruze: row.revenue_kruze || '0',
      revenueBoeren: row.revenue_boeren || '0',
    };
  }

  async getSale(id: number): Promise<SaleWithLines | undefined> {
    const [sale] = await db
      .select()
      .from(sales)
      .where(eq(sales.id, id));

    if (!sale) return undefined;

    const items = await db
      .select({
        salesLine: salesLines,
        product: products,
        vatPercentage: vatClasses.percentage,
      })
      .from(salesLines)
      .leftJoin(products, eq(salesLines.productId, products.id))
      .leftJoin(vatClasses, eq(products.vatClassId, vatClasses.id))
      .where(eq(salesLines.saleId, id));

    const payments = await db
      .select()
      .from(salePayments)
      .where(eq(salePayments.saleId, id));

    const customer = await this.getCustomer(sale.customerId);

    return {
      ...sale,
      salesLines: items.map(({ salesLine, product, vatPercentage }) => ({
        ...salesLine,
        product: product!,
        vatPercentage: vatPercentage || '0',
      })),
      salePayments: payments,
      customer: customer || null,
    };
  }

  async getSalesByCustomer(customerId: number): Promise<Sale[]> {
    return await db
      .select()
      .from(sales)
      .where(eq(sales.customerId, customerId))
      .orderBy(desc(sales.creationDate));
  }

  async createSale(insertSale: InsertSale, items: InsertSalesLine[]): Promise<SaleWithLines> {
    // Note: For transactional sale creation with business logic, use salesService.createSale instead.
    // This storage method provides basic CRUD without transaction orchestration.
    const [sale] = await db.insert(sales).values(insertSale).returning();

    if (items.length > 0) {
      await db
        .insert(salesLines)
        .values(items.map((item) => ({ ...item, saleId: sale.id })));
    }

    const fullSale = await this.getSale(sale.id);
    return fullSale!;
  }

  async updateSaleStatus(id: number, statusId: number): Promise<Sale | undefined> {
    const [sale] = await db
      .update(sales)
      .set({ 
        salesStatus: statusId,
        modificationDate: new Date()
      })
      .where(eq(sales.id, id))
      .returning();
    return sale || undefined;
  }

  async getRevenueForDateRange(startDate: string, endDate: string, statusIds: number[]): Promise<number> {
    if (statusIds.length === 0) {
      return 0;
    }

    const statusList = sql.join(statusIds, sql`, `);
    const result = await db.execute(sql`
      SELECT COALESCE(SUM(COALESCE(lines.line_total, 0) + s.shipping_cost_without_vat - s.discount_without_vat), 0) as revenue
      FROM sale s
      LEFT JOIN (
        SELECT sale_id, COALESCE(SUM(total_without_vat), 0) as line_total
        FROM salesline
        GROUP BY sale_id
      ) lines ON lines.sale_id = s.id
      WHERE s.sales_status IN (${statusList})
        AND s.sales_date >= ${startDate}
        AND s.sales_date <= ${endDate}
    `);

    return Number((result.rows[0] as any)?.revenue ?? 0);
  }

  async getRevenueForChannel(startDate: string, endDate: string, channel: string, statusIds: number[]): Promise<number> {
    if (statusIds.length === 0) {
      return 0;
    }

    const statusList = sql.join(statusIds, sql`, `);

    // Derive channel from customer data
    let channelCondition = sql`FALSE`;
    if (channel === 'WEBSHOP') {
      channelCondition = sql`s.webshop_sale = true`;
    } else if (channel === 'B2B') {
      channelCondition = sql`c.b2b_client = true AND s.webshop_sale = false`;
    } else if (channel === 'BOEREN_EN_BUREN') {
      channelCondition = sql`LOWER(c.last_name) LIKE '%buurderij%' AND s.webshop_sale = false`;
    } else if (channel === 'B2C') {
      channelCondition = sql`c.b2b_client = false AND s.webshop_sale = false AND LOWER(c.last_name) NOT LIKE '%buurderij%'`;
    }

    const result = await db.execute(sql`
      SELECT COALESCE(SUM(COALESCE(lines.line_total, 0) + s.shipping_cost_without_vat - s.discount_without_vat), 0) as revenue
      FROM sale s
      JOIN customer c ON s.customer_id = c.id
      LEFT JOIN (
        SELECT sale_id, COALESCE(SUM(total_without_vat), 0) as line_total
        FROM salesline
        GROUP BY sale_id
      ) lines ON lines.sale_id = s.id
      WHERE s.sales_status IN (${statusList})
        AND s.sales_date >= ${startDate}
        AND s.sales_date <= ${endDate}
        AND ${channelCondition}
    `);

    return Number((result.rows[0] as any)?.revenue ?? 0);
  }

  // Dashboard Analytics
  async getRevenueByCategory(startDate: string, endDate: string, statusIds: number[]): Promise<Array<{
    categoryId: number;
    categoryName: string;
    revenue: number;
  }>> {
    if (statusIds.length === 0) {
      return [];
    }

    const statusList = sql.join(statusIds, sql`, `);
    const result = await db.execute(sql`
      SELECT
        pt.id as category_id,
        pt.name as category_name,
        COALESCE(SUM(sl.total_without_vat), 0) as revenue
      FROM salesline sl
      JOIN sale s ON sl.sale_id = s.id
      JOIN product p ON sl.product_id = p.id
      JOIN product_type pt ON p.product_type_id = pt.id
      WHERE s.sales_status IN (${statusList})
        AND s.sales_date >= ${startDate}
        AND s.sales_date <= ${endDate}
      GROUP BY pt.id, pt.name
      ORDER BY revenue DESC
    `);

    return result.rows.map((row: any) => ({
      categoryId: Number(row.category_id),
      categoryName: String(row.category_name),
      revenue: Number(row.revenue),
    }));
  }

  async getOutstandingInvoices(): Promise<{ amount: number; count: number }> {
    // INVOICED (status 3) but not PAID (status 4)
    const result = await db.execute(sql`
      SELECT
        COUNT(*) as count,
        COALESCE(SUM(COALESCE(lines.line_total, 0) + s.shipping_cost_without_vat - s.discount_without_vat), 0) as amount
      FROM sale s
      LEFT JOIN (
        SELECT sale_id, COALESCE(SUM(total_without_vat), 0) as line_total
        FROM salesline
        GROUP BY sale_id
      ) lines ON lines.sale_id = s.id
      WHERE s.sales_status = 3
    `);

    const row = result.rows[0] as any;
    return {
      count: Number(row.count || 0),
      amount: Number(row.amount || 0),
    };
  }

  async getOverdueInvoices(daysThreshold: number): Promise<{ amount: number; count: number }> {
    // Invoices where sales_date + daysThreshold < today and status is still INVOICED (not PAID)
    // Since invoicing happens on sale creation, sales_date = invoice date
    const result = await db.execute(sql`
      SELECT
        COUNT(*) as count,
        COALESCE(SUM(COALESCE(lines.line_total, 0) + s.shipping_cost_without_vat - s.discount_without_vat), 0) as amount
      FROM sale s
      LEFT JOIN (
        SELECT sale_id, COALESCE(SUM(total_without_vat), 0) as line_total
        FROM salesline
        GROUP BY sale_id
      ) lines ON lines.sale_id = s.id
      WHERE s.sales_status = 3
        AND s.sales_date + INTERVAL '${sql.raw(daysThreshold.toString())} days' < NOW()
    `);

    const row = result.rows[0] as any;
    return {
      count: Number(row.count || 0),
      amount: Number(row.amount || 0),
    };
  }

  async getAverageDaysToPayment(months: number): Promise<number> {
    // Calculate average days between sales_date (invoice date) and modification_date (paid date) for PAID sales
    // Since invoicing happens on creation, sales_date = invoice date
    // Since PAID sales can't be modified after payment, modification_date = payment date
    const result = await db.execute(sql`
      SELECT AVG(EXTRACT(DAY FROM (modification_date - sales_date))) as avg_days
      FROM sale
      WHERE sales_status = 4
        AND modification_date >= NOW() - INTERVAL '${sql.raw(months.toString())} months'
    `);

    return Number((result.rows[0] as any)?.avg_days || 0);
  }

  async getLowStockProducts(limit: number, monthsForAverage: number): Promise<Array<{
    productId: number;
    productName: string;
    currentStock: number;
    avgMonthlySales: number;
    daysRemaining: number;
    unit: string;
  }>> {
    // Get products with low stock based on sales velocity
    // Include unit from sales_price table to determine display format
    const result = await db.execute(sql`
      WITH product_sales AS (
        SELECT
          p.id as product_id,
          p.name as product_name,
          COALESCE(SUM(sm.quantity), 0) as current_stock,
          COALESCE(
            SUM(sl.amount * sl.weight) / NULLIF(${monthsForAverage}, 0),
            0
          ) as avg_monthly_sales,
          (SELECT sp.unit FROM sales_price sp WHERE sp.product_id = p.id LIMIT 1) as unit
        FROM product p
        LEFT JOIN stock_movement sm ON p.id = sm.product_id
        LEFT JOIN salesline sl ON p.id = sl.product_id
        LEFT JOIN sale s ON sl.sale_id = s.id
          AND s.sales_date >= NOW() - INTERVAL '${sql.raw(monthsForAverage.toString())} months'
        WHERE p.status = '1'
        GROUP BY p.id, p.name
      )
      SELECT
        product_id,
        product_name,
        current_stock,
        avg_monthly_sales,
        unit,
        CASE
          WHEN avg_monthly_sales > 0
          THEN (current_stock / avg_monthly_sales * 30)::int
          ELSE 999999
        END as days_remaining
      FROM product_sales
      WHERE current_stock > 0
        AND avg_monthly_sales > 0
        AND (current_stock / avg_monthly_sales * 30) < 30
      ORDER BY days_remaining ASC
      LIMIT ${limit}
    `);

    return result.rows.map((row: any) => ({
      productId: Number(row.product_id),
      productName: String(row.product_name),
      currentStock: Number(row.current_stock),
      avgMonthlySales: Number(row.avg_monthly_sales),
      daysRemaining: Number(row.days_remaining),
      unit: String(row.unit || 'gram'),
    }));
  }

  async getAllInventoryLevels(limit: number, monthsForAverage: number): Promise<Array<{
    productId: number;
    productName: string;
    currentStock: number;
    avgMonthlySales: number;
    daysRemaining: number;
    unit: string;
  }>> {
    // Get all products with stock levels (not just low stock)
    // Include unit from sales_price table to determine display format
    const result = await db.execute(sql`
      WITH product_sales AS (
        SELECT
          p.id as product_id,
          p.name as product_name,
          COALESCE(SUM(sm.quantity), 0) as current_stock,
          COALESCE(
            (SELECT SUM(sl2.amount * sl2.weight) 
             FROM salesline sl2 
             JOIN sale s2 ON sl2.sale_id = s2.id 
             WHERE sl2.product_id = p.id 
               AND s2.sales_date >= NOW() - INTERVAL '${sql.raw(monthsForAverage.toString())} months'
            ) / NULLIF(${monthsForAverage}, 0),
            0
          ) as avg_monthly_sales,
          (SELECT sp.unit FROM sales_price sp WHERE sp.product_id = p.id LIMIT 1) as unit
        FROM product p
        LEFT JOIN stock_movement sm ON p.id = sm.product_id
        WHERE p.status = '1'
        GROUP BY p.id, p.name
      )
      SELECT
        product_id,
        product_name,
        current_stock,
        avg_monthly_sales,
        unit,
        CASE
          WHEN avg_monthly_sales > 0
          THEN (current_stock / avg_monthly_sales * 30)::int
          ELSE 999999
        END as days_remaining
      FROM product_sales
      WHERE current_stock > 0 OR avg_monthly_sales > 0
      ORDER BY days_remaining ASC
      LIMIT ${limit}
    `);

    return result.rows.map((row: any) => {
      const daysRemaining = Number(row.days_remaining);
      return {
        productId: Number(row.product_id),
        productName: String(row.product_name),
        currentStock: Number(row.current_stock),
        avgMonthlySales: Number(row.avg_monthly_sales),
        // Treat negative stock (negative days) as 0 days remaining
        daysRemaining: daysRemaining < 0 ? 0 : daysRemaining,
        unit: String(row.unit || 'gram'),
      };
    });
  }

  async getTotalCustomers(): Promise<number> {
    const result = await db.execute(sql`
      SELECT COUNT(*) as count FROM customer
    `);
    return Number((result.rows[0] as any)?.count || 0);
  }

  async getNewCustomersThisMonth(year: number, month: number): Promise<number> {
    const result = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM customer
      WHERE EXTRACT(YEAR FROM creation_date) = ${year}
        AND EXTRACT(MONTH FROM creation_date) = ${month}
    `);
    return Number((result.rows[0] as any)?.count || 0);
  }

  async getOneTimeCustomers(): Promise<number> {
    const result = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM (
        SELECT customer_id
        FROM sale
        GROUP BY customer_id
        HAVING COUNT(*) = 1
      ) one_time_customers
    `);
    return Number((result.rows[0] as any)?.count || 0);
  }

  async getInactiveCustomers(monthsThreshold: number): Promise<number> {
    const result = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM customer c
      WHERE NOT EXISTS (
        SELECT 1
        FROM sale s
        WHERE s.customer_id = c.id
          AND s.sales_date >= NOW() - INTERVAL '${sql.raw(monthsThreshold.toString())} months'
      )
      AND EXISTS (
        SELECT 1
        FROM sale s
        WHERE s.customer_id = c.id
      )
    `);
    return Number((result.rows[0] as any)?.count || 0);
  }

  async getSalesCount(year: number): Promise<number> {
    const result = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM sale
      WHERE EXTRACT(YEAR FROM sales_date) = ${year}
    `);
    return Number((result.rows[0] as any)?.count || 0);
  }

  async getTopCustomersByRevenue(year: number, statusIds: number[], limit: number): Promise<Array<{
    customerId: number;
    customerName: string;
    revenue: number;
  }>> {
    if (statusIds.length === 0) {
      return [];
    }

    const statusList = sql.join(statusIds, sql`, `);
    const result = await db.execute(sql`
      SELECT
        c.id as customer_id,
        CASE
          WHEN c.b2b_client = true THEN c.company_name
          ELSE c.first_name || ' ' || c.last_name
        END as customer_name,
        COALESCE(SUM(sl.total_without_vat), 0) as revenue
      FROM customer c
      JOIN sale s ON c.id = s.customer_id
      JOIN salesline sl ON s.id = sl.sale_id
      WHERE EXTRACT(YEAR FROM s.sales_date) = ${year}
        AND s.sales_status IN (${statusList})
      GROUP BY c.id, c.b2b_client, c.company_name, c.first_name, c.last_name
      ORDER BY revenue DESC
      LIMIT ${limit}
    `);

    return result.rows.map((row: any) => ({
      customerId: Number(row.customer_id),
      customerName: String(row.customer_name),
      revenue: Number(row.revenue),
    }));
  }

  async getTopProductsByRevenue(year: number, statusIds: number[], limit: number): Promise<Array<{
    productId: number;
    productName: string;
    revenue: number;
    quantitySold: number;
  }>> {
    if (statusIds.length === 0) {
      return [];
    }

    const statusList = sql.join(statusIds, sql`, `);
    const result = await db.execute(sql`
      SELECT
        p.id as product_id,
        p.name as product_name,
        COALESCE(SUM(sl.total_without_vat), 0) as revenue,
        COALESCE(SUM(sl.amount * sl.weight), 0) as quantity_sold
      FROM product p
      JOIN salesline sl ON p.id = sl.product_id
      JOIN sale s ON sl.sale_id = s.id
      WHERE EXTRACT(YEAR FROM s.sales_date) = ${year}
        AND s.sales_status IN (${statusList})
      GROUP BY p.id, p.name
      ORDER BY revenue DESC
      LIMIT ${limit}
    `);

    return result.rows.map((row: any) => ({
      productId: Number(row.product_id),
      productName: String(row.product_name),
      revenue: Number(row.revenue),
      quantitySold: Number(row.quantity_sold),
    }));
  }

  async getMonthlyRevenueByYears(years: number[], statusIds: number[]): Promise<Array<{
    month: number;
    year: number;
    revenue: number;
  }>> {
    if (statusIds.length === 0 || years.length === 0) {
      return [];
    }

    const statusList = sql.join(statusIds, sql`, `);
    const yearList = sql.join(years, sql`, `);

    const result = await db.execute(sql`
      SELECT
        EXTRACT(MONTH FROM s.sales_date) as month,
        EXTRACT(YEAR FROM s.sales_date) as year,
        COALESCE(SUM(COALESCE(lines.line_total, 0) + s.shipping_cost_without_vat - s.discount_without_vat), 0) as revenue
      FROM sale s
      LEFT JOIN (
        SELECT sale_id, COALESCE(SUM(total_without_vat), 0) as line_total
        FROM salesline
        GROUP BY sale_id
      ) lines ON lines.sale_id = s.id
      WHERE s.sales_status IN (${statusList})
        AND EXTRACT(YEAR FROM s.sales_date) IN (${yearList})
      GROUP BY month, year
      ORDER BY year, month
    `);

    return result.rows.map((row: any) => ({
      month: Number(row.month),
      year: Number(row.year),
      revenue: Number(row.revenue),
    }));
  }

  async getAnnualRevenue(statusIds: number[]): Promise<Array<{
    year: number;
    revenue: number;
  }>> {
    if (statusIds.length === 0) {
      return [];
    }

    const statusList = sql.join(statusIds, sql`, `);
    const result = await db.execute(sql`
      SELECT
        EXTRACT(YEAR FROM s.sales_date) as year,
        COALESCE(SUM(COALESCE(lines.line_total, 0) + s.shipping_cost_without_vat - s.discount_without_vat), 0) as revenue
      FROM sale s
      LEFT JOIN (
        SELECT sale_id, COALESCE(SUM(total_without_vat), 0) as line_total
        FROM salesline
        GROUP BY sale_id
      ) lines ON lines.sale_id = s.id
      WHERE s.sales_status IN (${statusList})
      GROUP BY year
      ORDER BY year
    `);

    return result.rows.map((row: any) => ({
      year: Number(row.year),
      revenue: Number(row.revenue),
    }));
  }

  async getAllTimeRevenue(statusIds: number[]): Promise<number> {
    if (statusIds.length === 0) {
      return 0;
    }

    const statusList = sql.join(statusIds, sql`, `);
    const result = await db.execute(sql`
      SELECT COALESCE(SUM(COALESCE(lines.line_total, 0) + s.shipping_cost_without_vat - s.discount_without_vat), 0) as revenue
      FROM sale s
      LEFT JOIN (
        SELECT sale_id, COALESCE(SUM(total_without_vat), 0) as line_total
        FROM salesline
        GROUP BY sale_id
      ) lines ON lines.sale_id = s.id
      WHERE s.sales_status IN (${statusList})
    `);

    return Number((result.rows[0] as any)?.revenue ?? 0);
  }

  async getBestRevenueMonth(statusIds: number[]): Promise<{
    year: number;
    month: number;
    revenue: number;
  } | null> {
    if (statusIds.length === 0) {
      return null;
    }

    const statusList = sql.join(statusIds, sql`, `);
    const result = await db.execute(sql`
      SELECT
        EXTRACT(YEAR FROM s.sales_date) as year,
        EXTRACT(MONTH FROM s.sales_date) as month,
        COALESCE(SUM(COALESCE(lines.line_total, 0) + s.shipping_cost_without_vat - s.discount_without_vat), 0) as revenue
      FROM sale s
      LEFT JOIN (
        SELECT sale_id, COALESCE(SUM(total_without_vat), 0) as line_total
        FROM salesline
        GROUP BY sale_id
      ) lines ON lines.sale_id = s.id
      WHERE s.sales_status IN (${statusList})
      GROUP BY year, month
      ORDER BY revenue DESC
      LIMIT 1
    `);

    const row = result.rows[0] as any;
    if (!row) {
      return null;
    }

    return {
      year: Number(row.year),
      month: Number(row.month),
      revenue: Number(row.revenue),
    };
  }

  async getMonthlyRevenueTimeline(statusIds: number[]): Promise<Array<{
    year: number;
    month: number;
    monthKey: string;
    revenue: number;
  }>> {
    if (statusIds.length === 0) {
      return [];
    }

    const statusList = sql.join(statusIds, sql`, `);
    const result = await db.execute(sql`
      SELECT
        EXTRACT(YEAR FROM s.sales_date) as year,
        EXTRACT(MONTH FROM s.sales_date) as month,
        TO_CHAR(s.sales_date, 'YYYY-MM') as month_key,
        COALESCE(SUM(COALESCE(lines.line_total, 0) + s.shipping_cost_without_vat - s.discount_without_vat), 0) as revenue
      FROM sale s
      LEFT JOIN (
        SELECT sale_id, COALESCE(SUM(total_without_vat), 0) as line_total
        FROM salesline
        GROUP BY sale_id
      ) lines ON lines.sale_id = s.id
      WHERE s.sales_status IN (${statusList})
      GROUP BY year, month, month_key
      ORDER BY year, month
    `);

    return result.rows.map((row: any) => ({
      year: Number(row.year),
      month: Number(row.month),
      monthKey: String(row.month_key),
      revenue: Number(row.revenue),
    }));
  }

  async getChannelRevenueByYears(
    years: number[],
    statusIds: number[],
    referenceDate: Date
  ): Promise<Array<{
    channel: string;
    year: number;
    revenue: number;
  }>> {
    if (statusIds.length === 0 || years.length === 0) {
      return [];
    }

    const statusList = sql.join(statusIds, sql`, `);
    const yearList = sql.join(years, sql`, `);
    const referenceDateValue = referenceDate.toISOString().slice(0, 10);

    const channelCase = sql`
      CASE
        WHEN s.webshop_sale = true THEN 'WEBSHOP'
        WHEN c.b2b_client = true AND s.webshop_sale = false THEN 'B2B'
        WHEN LOWER(c.last_name) LIKE '%buurderij%' AND s.webshop_sale = false THEN 'BOEREN_EN_BUREN'
        ELSE 'B2C'
      END
    `;

    const result = await db.execute(sql`
      SELECT
        ${channelCase} as channel,
        EXTRACT(YEAR FROM s.sales_date) as year,
        COALESCE(SUM(COALESCE(lines.line_total, 0) + s.shipping_cost_without_vat - s.discount_without_vat), 0) as revenue
      FROM sale s
      JOIN customer c ON s.customer_id = c.id
      LEFT JOIN (
        SELECT sale_id, COALESCE(SUM(total_without_vat), 0) as line_total
        FROM salesline
        GROUP BY sale_id
      ) lines ON lines.sale_id = s.id
      WHERE s.sales_status IN (${statusList})
        AND EXTRACT(YEAR FROM s.sales_date) IN (${yearList})
        AND s.sales_date <= ${referenceDateValue}
      GROUP BY channel, year
      ORDER BY channel, year
    `);

    return result.rows.map((row: any) => ({
      channel: String(row.channel),
      year: Number(row.year),
      revenue: Number(row.revenue),
    }));
  }

  async getChannelRevenueForDateRange(
    startDate: string,
    endDate: string,
    statusIds: number[]
  ): Promise<Array<{
    channel: string;
    revenue: number;
  }>> {
    if (statusIds.length === 0) {
      return [];
    }

    const statusList = sql.join(statusIds, sql`, `);
    const channelCase = sql`
      CASE
        WHEN s.webshop_sale = true THEN 'WEBSHOP'
        WHEN c.b2b_client = true AND s.webshop_sale = false THEN 'B2B'
        WHEN LOWER(c.last_name) LIKE '%buurderij%' AND s.webshop_sale = false THEN 'BOEREN_EN_BUREN'
        ELSE 'B2C'
      END
    `;

    const result = await db.execute(sql`
      SELECT
        ${channelCase} as channel,
        COALESCE(SUM(COALESCE(lines.line_total, 0) + s.shipping_cost_without_vat - s.discount_without_vat), 0) as revenue
      FROM sale s
      JOIN customer c ON s.customer_id = c.id
      LEFT JOIN (
        SELECT sale_id, COALESCE(SUM(total_without_vat), 0) as line_total
        FROM salesline
        GROUP BY sale_id
      ) lines ON lines.sale_id = s.id
      WHERE s.sales_status IN (${statusList})
        AND s.sales_date >= ${startDate}
        AND s.sales_date <= ${endDate}
      GROUP BY channel
      ORDER BY channel
    `);

    return result.rows.map((row: any) => ({
      channel: String(row.channel),
      revenue: Number(row.revenue),
    }));
  }

  // Reference Tables - Product Types
  async getProductTypes(): Promise<ProductType[]> {
    return await db.select().from(productTypes).orderBy(productTypes.name);
  }

  async createProductType(data: InsertProductType): Promise<ProductType> {
    const [productType] = await db.insert(productTypes).values(data).returning();
    return productType;
  }

  async updateProductType(id: number, data: Partial<InsertProductType>): Promise<ProductType | undefined> {
    const [productType] = await db.update(productTypes).set({ ...data, modificationDate: new Date() }).where(eq(productTypes.id, id)).returning();
    return productType || undefined;
  }

  async deleteProductType(id: number): Promise<boolean> {
    const result = await db.delete(productTypes).where(eq(productTypes.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Product Subtypes
  async getProductSubtypes(): Promise<ProductSubtype[]> {
    return await db.select().from(productSubtypes).orderBy(productSubtypes.name);
  }

  async createProductSubtype(data: InsertProductSubtype): Promise<ProductSubtype> {
    const [productSubtype] = await db.insert(productSubtypes).values(data).returning();
    return productSubtype;
  }

  async updateProductSubtype(id: number, data: Partial<InsertProductSubtype>): Promise<ProductSubtype | undefined> {
    const [productSubtype] = await db.update(productSubtypes).set({ ...data, modificationDate: new Date() }).where(eq(productSubtypes.id, id)).returning();
    return productSubtype || undefined;
  }

  async deleteProductSubtype(id: number): Promise<boolean> {
    const result = await db.delete(productSubtypes).where(eq(productSubtypes.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Payment Methods
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    return await db.select().from(paymentMethods).orderBy(paymentMethods.paymentMethod);
  }

  async createPaymentMethod(data: InsertPaymentMethod): Promise<PaymentMethod> {
    const [paymentMethod] = await db.insert(paymentMethods).values(data).returning();
    return paymentMethod;
  }

  async updatePaymentMethod(id: number, data: Partial<InsertPaymentMethod>): Promise<PaymentMethod | undefined> {
    const [paymentMethod] = await db.update(paymentMethods).set(data).where(eq(paymentMethods.id, id)).returning();
    return paymentMethod || undefined;
  }

  async deletePaymentMethod(id: number): Promise<boolean> {
    const result = await db.delete(paymentMethods).where(eq(paymentMethods.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Sales Statuses
  async getSalesStatuses(): Promise<SalesStatus[]> {
    return await db.select().from(salesStatuses).orderBy(salesStatuses.salesStatus);
  }

  async createSalesStatus(data: InsertSalesStatus): Promise<SalesStatus> {
    const [salesStatus] = await db.insert(salesStatuses).values(data).returning();
    return salesStatus;
  }

  async updateSalesStatus(id: number, data: Partial<InsertSalesStatus>): Promise<SalesStatus | undefined> {
    const [salesStatus] = await db.update(salesStatuses).set(data).where(eq(salesStatuses.id, id)).returning();
    return salesStatus || undefined;
  }

  async deleteSalesStatus(id: number): Promise<boolean> {
    const result = await db.delete(salesStatuses).where(eq(salesStatuses.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Stock Movement Reasons
  async getStockMovementReasons(): Promise<StockMovementReason[]> {
    return await db.select().from(stockMovementReasons).orderBy(stockMovementReasons.reason);
  }

  async createStockMovementReason(data: InsertStockMovementReason): Promise<StockMovementReason> {
    const [stockMovementReason] = await db.insert(stockMovementReasons).values(data).returning();
    return stockMovementReason;
  }

  async updateStockMovementReason(id: number, data: Partial<InsertStockMovementReason>): Promise<StockMovementReason | undefined> {
    const [stockMovementReason] = await db.update(stockMovementReasons).set(data).where(eq(stockMovementReasons.id, id)).returning();
    return stockMovementReason || undefined;
  }

  async deleteStockMovementReason(id: number): Promise<boolean> {
    const result = await db.delete(stockMovementReasons).where(eq(stockMovementReasons.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Product Item Statuses
  async getProductItemStatuses(): Promise<ProductItemStatus[]> {
    return await db.select().from(productItemStatuses).orderBy(productItemStatuses.id);
  }

  async createProductItemStatus(data: InsertProductItemStatus): Promise<ProductItemStatus> {
    const [productItemStatus] = await db.insert(productItemStatuses).values(data).returning();
    return productItemStatus;
  }

  async updateProductItemStatus(id: number, data: Partial<InsertProductItemStatus>): Promise<ProductItemStatus | undefined> {
    const [productItemStatus] = await db.update(productItemStatuses).set(data).where(eq(productItemStatuses.id, id)).returning();
    return productItemStatus || undefined;
  }

  async deleteProductItemStatus(id: number): Promise<boolean> {
    const result = await db.delete(productItemStatuses).where(eq(productItemStatuses.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Product Items
  async getProductItems(): Promise<ProductItem[]> {
    return await db.select().from(productItems).orderBy(productItems.id);
  }

  async getProductItemsByProduct(productId: number): Promise<ProductItem[]> {
    return await db.select().from(productItems).where(eq(productItems.productId, productId)).orderBy(productItems.expiryDate);
  }

  async createProductItem(data: InsertProductItem): Promise<ProductItem> {
    const [productItem] = await db.insert(productItems).values(data).returning();
    return productItem;
  }

  async updateProductItem(id: number, data: Partial<InsertProductItem>): Promise<ProductItem | undefined> {
    const [productItem] = await db.update(productItems).set({ ...data, modificationDate: new Date() }).where(eq(productItems.id, id)).returning();
    return productItem || undefined;
  }

  async deleteProductItem(id: number): Promise<boolean> {
    const result = await db.delete(productItems).where(eq(productItems.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Stock Movements
  async getStockMovements(): Promise<StockMovement[]> {
    return await db.select().from(stockMovements).orderBy(desc(stockMovements.date));
  }

  async getStockMovementsByProduct(productId: number): Promise<StockMovement[]> {
    return await db.select().from(stockMovements).where(eq(stockMovements.productId, productId)).orderBy(desc(stockMovements.date));
  }

  async createStockMovement(data: InsertStockMovement): Promise<StockMovement> {
    const [stockMovement] = await db.insert(stockMovements).values(data).returning();
    return stockMovement;
  }

  async updateStockMovement(id: number, data: Partial<InsertStockMovement>): Promise<StockMovement | undefined> {
    const [stockMovement] = await db.update(stockMovements).set({ ...data, modificationDate: new Date() }).where(eq(stockMovements.id, id)).returning();
    return stockMovement || undefined;
  }

  async deleteStockMovement(id: number): Promise<boolean> {
    const result = await db.delete(stockMovements).where(eq(stockMovements.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Suppliers
  async getSuppliers(): Promise<Supplier[]> {
    return await db.select().from(suppliers).orderBy(suppliers.name);
  }

  async createSupplier(data: InsertSupplier): Promise<Supplier> {
    const [supplier] = await db.insert(suppliers).values(data).returning();
    return supplier;
  }

  async updateSupplier(id: number, data: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const [supplier] = await db.update(suppliers).set({ ...data, modificationDate: new Date() }).where(eq(suppliers.id, id)).returning();
    return supplier || undefined;
  }

  async deleteSupplier(id: number): Promise<boolean> {
    const result = await db.delete(suppliers).where(eq(suppliers.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Supplier Orders
  async getSupplierOrders(): Promise<SupplierOrderWithLines[]> {
    const orders = await db.query.supplierOrders.findMany({
      with: {
        supplier: true,
        orderLines: {
          with: {
            product: true,
          },
        },
      },
      orderBy: (supplierOrders, { desc }) => [desc(supplierOrders.orderDate)],
    });
    return orders as SupplierOrderWithLines[];
  }

  async getSupplierOrder(id: number): Promise<SupplierOrderWithLines | undefined> {
    const order = await db.query.supplierOrders.findFirst({
      where: (supplierOrders, { eq }) => eq(supplierOrders.id, id),
      with: {
        supplier: true,
        orderLines: {
          with: {
            product: true,
          },
        },
      },
    });

    if (!order) return undefined;

    // Fetch active buying prices for each order line
    const now = new Date();
    const orderLinesWithBuyingPrice = await Promise.all(
      order.orderLines.map(async (line) => {
        const activeBuyingPrice = await db.query.buyingPrices.findFirst({
          where: (buyingPrices, { eq, and, lte, gte, or, isNull }) =>
            and(
              eq(buyingPrices.productId, line.productId),
              lte(buyingPrices.validFrom, now),
              or(
                gte(buyingPrices.validUntil, now),
                isNull(buyingPrices.validUntil)
              )
            ),
          orderBy: (buyingPrices, { desc }) => [desc(buyingPrices.validFrom)],
        });

        return {
          ...line,
          buyingPrice: activeBuyingPrice || null,
        };
      })
    );

    return {
      ...order,
      orderLines: orderLinesWithBuyingPrice,
    } as any;
  }

  async createSupplierOrder(data: InsertSupplierOrder): Promise<SupplierOrder> {
    const [order] = await db.insert(supplierOrders).values(data).returning();
    return order;
  }

  async updateSupplierOrder(id: number, data: Partial<InsertSupplierOrder>): Promise<SupplierOrder | undefined> {
    const [order] = await db.update(supplierOrders).set({ ...data, modificationDate: new Date() }).where(eq(supplierOrders.id, id)).returning();
    return order || undefined;
  }

  async deleteSupplierOrder(id: number): Promise<boolean> {
    const result = await db.delete(supplierOrders).where(eq(supplierOrders.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async confirmSupplierOrder(id: number): Promise<SupplierOrder | undefined> {
    const [order] = await db.update(supplierOrders).set({ confirmed: true, confirmationDate: new Date(), modificationDate: new Date() }).where(eq(supplierOrders.id, id)).returning();
    return order || undefined;
  }

  // Supplier Order Lines
  async getSupplierOrderLines(supplierOrderId: number): Promise<SupplierOrderLine[]> {
    return await db.select().from(supplierOrderLines).where(eq(supplierOrderLines.supplierOrderId, supplierOrderId));
  }

  async createSupplierOrderLine(data: InsertSupplierOrderLine): Promise<SupplierOrderLine> {
    const [line] = await db.insert(supplierOrderLines).values(data).returning();
    return line;
  }

  async updateSupplierOrderLine(id: number, data: Partial<InsertSupplierOrderLine>): Promise<SupplierOrderLine | undefined> {
    const [line] = await db.update(supplierOrderLines).set({ ...data, modificationDate: new Date() }).where(eq(supplierOrderLines.id, id)).returning();
    return line || undefined;
  }

  async deleteSupplierOrderLine(id: number): Promise<boolean> {
    const result = await db.delete(supplierOrderLines).where(eq(supplierOrderLines.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // VAT Classes
  async getVatClasses(): Promise<VatClass[]> {
    return await db.select().from(vatClasses).orderBy(vatClasses.name);
  }

  async createVatClass(data: InsertVatClass): Promise<VatClass> {
    const [vatClass] = await db.insert(vatClasses).values(data).returning();
    return vatClass;
  }

  async updateVatClass(id: number, data: Partial<InsertVatClass>): Promise<VatClass | undefined> {
    const [vatClass] = await db.update(vatClasses).set({ ...data, modificationDate: new Date() }).where(eq(vatClasses.id, id)).returning();
    return vatClass || undefined;
  }

  async deleteVatClass(id: number): Promise<boolean> {
    const result = await db.delete(vatClasses).where(eq(vatClasses.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Product Units
  async getProductUnits(): Promise<ProductUnit[]> {
    return await db.select().from(productUnits).orderBy(productUnits.unit);
  }

  async createProductUnit(data: InsertProductUnit): Promise<ProductUnit> {
    const [productUnit] = await db.insert(productUnits).values(data).returning();
    return productUnit;
  }

  async updateProductUnit(id: number, data: Partial<InsertProductUnit>): Promise<ProductUnit | undefined> {
    const [productUnit] = await db.update(productUnits).set({ ...data, modificationDate: new Date() }).where(eq(productUnits.id, id)).returning();
    return productUnit || undefined;
  }

  async deleteProductUnit(id: number): Promise<boolean> {
    const result = await db.delete(productUnits).where(eq(productUnits.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Product Locations
  async getProductLocations(): Promise<ProductLocation[]> {
    return await db.select().from(productLocations).orderBy(productLocations.name);
  }

  async createProductLocation(data: InsertProductLocation): Promise<ProductLocation> {
    const [productLocation] = await db.insert(productLocations).values(data).returning();
    return productLocation;
  }

  async updateProductLocation(id: number, data: Partial<InsertProductLocation>): Promise<ProductLocation | undefined> {
    const [productLocation] = await db.update(productLocations).set(data).where(eq(productLocations.id, id)).returning();
    return productLocation || undefined;
  }

  async deleteProductLocation(id: number): Promise<boolean> {
    const result = await db.delete(productLocations).where(eq(productLocations.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Green Roasted Coffee Configurations
  async getGreenRoastedCoffees(): Promise<GreenRoastedCoffee[]> {
    return await db.select().from(greenRoastedCoffees).orderBy(greenRoastedCoffees.id);
  }

  async createGreenRoastedCoffee(data: InsertGreenRoastedCoffee): Promise<GreenRoastedCoffee> {
    const [config] = await db.insert(greenRoastedCoffees).values(data).returning();
    return config;
  }

  async updateGreenRoastedCoffee(id: number, data: Partial<InsertGreenRoastedCoffee>): Promise<GreenRoastedCoffee | undefined> {
    const [config] = await db.update(greenRoastedCoffees).set(data).where(eq(greenRoastedCoffees.id, id)).returning();
    return config || undefined;
  }

  async deleteGreenRoastedCoffee(id: number): Promise<boolean> {
    const result = await db.delete(greenRoastedCoffees).where(eq(greenRoastedCoffees.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Roasts
  async getRoasts(): Promise<any[]> {
    const result = await db
      .select({
        id: roasts.id,
        greenCoffeeId: roasts.greenCoffeeId,
        greenCoffeeName: products.name,
        greenCoffeeAmount: roasts.greenCoffeeAmount,
        roastedCoffeeAmount: roasts.roastedCoffeeAmount,
        roastDate: roasts.roastDate,
        remark: roasts.remark,
      })
      .from(roasts)
      .leftJoin(products, eq(roasts.greenCoffeeId, products.id))
      .orderBy(desc(roasts.roastDate), desc(roasts.id));
    return result;
  }

  async getRoast(id: number): Promise<Roast | undefined> {
    const [roast] = await db.select().from(roasts).where(eq(roasts.id, id));
    return roast || undefined;
  }

  async createRoast(data: InsertRoast): Promise<Roast> {
    const [roast] = await db.insert(roasts).values(data).returning();
    return roast;
  }

  async updateRoast(id: number, data: Partial<InsertRoast>): Promise<Roast | undefined> {
    const [roast] = await db.update(roasts).set(data).where(eq(roasts.id, id)).returning();
    return roast || undefined;
  }

  async deleteRoast(id: number): Promise<boolean> {
    const result = await db.delete(roasts).where(eq(roasts.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getAnnouncements(): Promise<Announcement[]> {
    return await db.select().from(announcements).orderBy(announcements.sortOrder);
  }

  async getActiveAnnouncements(): Promise<Announcement[]> {
    return await db.select().from(announcements).where(eq(announcements.active, true)).orderBy(announcements.sortOrder);
  }

  async createAnnouncement(data: InsertAnnouncement): Promise<Announcement> {
    const [announcement] = await db.insert(announcements).values(data).returning();
    return announcement;
  }

  async updateAnnouncement(id: number, data: Partial<InsertAnnouncement>): Promise<Announcement | undefined> {
    const [announcement] = await db.update(announcements).set({ ...data, modificationDate: new Date() }).where(eq(announcements.id, id)).returning();
    return announcement || undefined;
  }

  async deleteAnnouncement(id: number): Promise<boolean> {
    const result = await db.delete(announcements).where(eq(announcements.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getHomepageCategories(): Promise<ProductType[]> {
    return await db.select().from(productTypes).where(eq(productTypes.showOnHomepage, true)).orderBy(productTypes.homepageSortOrder);
  }

  // Grind Sizes
  async getGrindSizes(): Promise<GrindSize[]> {
    return await db.select().from(grindSizes).orderBy(asc(grindSizes.sortOrder), asc(grindSizes.id));
  }

  async createGrindSize(data: InsertGrindSize): Promise<GrindSize> {
    const [result] = await db.insert(grindSizes).values(data).returning();
    return result;
  }

  async updateGrindSize(id: number, data: Partial<InsertGrindSize>): Promise<GrindSize | undefined> {
    const [result] = await db.update(grindSizes).set({ ...data, modificationDate: new Date() }).where(eq(grindSizes.id, id)).returning();
    return result || undefined;
  }

  async deleteGrindSize(id: number): Promise<boolean> {
    const result = await db.delete(grindSizes).where(eq(grindSizes.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Free Shipping Postal Codes
  async getFreeShippingPostalCodes(): Promise<FreeShippingPostalCode[]> {
    return await db.select().from(freeShippingPostalCodes).orderBy(asc(freeShippingPostalCodes.postalCode));
  }

  async createFreeShippingPostalCode(data: InsertFreeShippingPostalCode): Promise<FreeShippingPostalCode> {
    const [result] = await db.insert(freeShippingPostalCodes).values(data).returning();
    return result;
  }

  async deleteFreeShippingPostalCode(id: number): Promise<boolean> {
    const result = await db.delete(freeShippingPostalCodes).where(eq(freeShippingPostalCodes.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Customer Prices
  async getCustomerPrices(customerId: number): Promise<CustomerPrice[]> {
    return await db.select().from(customerPrices).where(eq(customerPrices.customerId, customerId));
  }

  async createCustomerPrice(data: InsertCustomerPrice): Promise<CustomerPrice> {
    const [result] = await db.insert(customerPrices).values(data).returning();
    return result;
  }

  async updateCustomerPrice(id: number, customerId: number, data: Partial<InsertCustomerPrice>): Promise<CustomerPrice | undefined> {
    const [result] = await db.update(customerPrices).set(data).where(and(eq(customerPrices.id, id), eq(customerPrices.customerId, customerId))).returning();
    return result || undefined;
  }

  async deleteCustomerPrice(id: number, customerId: number): Promise<boolean> {
    const result = await db.delete(customerPrices).where(and(eq(customerPrices.id, id), eq(customerPrices.customerId, customerId)));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Buying Prices
  async getBuyingPrices(productId: number): Promise<BuyingPrice[]> {
    return await db.select().from(buyingPrices).where(eq(buyingPrices.productId, productId)).orderBy(desc(buyingPrices.validFrom));
  }

  async createBuyingPrice(data: InsertBuyingPrice): Promise<BuyingPrice> {
    const [result] = await db.insert(buyingPrices).values(data).returning();
    return result;
  }

  async updateBuyingPrice(id: number, data: Partial<InsertBuyingPrice>): Promise<BuyingPrice | undefined> {
    const [result] = await db.update(buyingPrices).set({ ...data, modificationDate: new Date() }).where(eq(buyingPrices.id, id)).returning();
    return result || undefined;
  }

  async deleteBuyingPrice(id: number): Promise<BuyingPrice | undefined> {
    const [result] = await db.delete(buyingPrices).where(eq(buyingPrices.id, id)).returning();
    return result || undefined;
  }

  // Product Components
  async getProductComponents(productId: number): Promise<any[]> {
    return await db
      .select({
        id: productComponents.id,
        finalProductId: productComponents.finalProductId,
        componentProductId: productComponents.componentProductId,
        componentPercentage: productComponents.componentPercentage,
        componentName: products.name,
        componentNameDutch: products.nameDutch,
      })
      .from(productComponents)
      .leftJoin(products, eq(productComponents.componentProductId, products.id))
      .where(eq(productComponents.finalProductId, productId));
  }

  async createProductComponent(data: InsertProductComponent): Promise<ProductComponent> {
    const [result] = await db.insert(productComponents).values(data).returning();
    return result;
  }

  async updateProductComponent(id: number, data: Partial<InsertProductComponent>): Promise<ProductComponent | undefined> {
    const [result] = await db.update(productComponents).set(data).where(eq(productComponents.id, id)).returning();
    return result || undefined;
  }

  async deleteProductComponent(id: number): Promise<ProductComponent | undefined> {
    const [result] = await db.delete(productComponents).where(eq(productComponents.id, id)).returning();
    return result || undefined;
  }
}

export const storage = new DatabaseStorage();
