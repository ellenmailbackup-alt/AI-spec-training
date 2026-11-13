import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, pgEnum, jsonb, index, date, smallint, serial } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum("user_role", ["admin", "customer"]);
export const productTypeEnum = pgEnum("product_type_enum", ["coffee", "tea", "equipment", "other"]);
export const salesStatusEnum = pgEnum("sales_status_enum", ["pending", "processing", "completed", "paid", "cancelled"]);
export const paymentMethodEnum = pgEnum("payment_method_enum", ["cash", "card", "transfer", "other"]);
export const stockMovementReasonEnum = pgEnum("stock_movement_reason_enum", ["purchase", "sale", "adjustment", "waste", "return"]);
export const quoteCategoryEnum = pgEnum("quote_category_enum", ["coffee", "tea", "general"]);
export const countingSessionStatusEnum = pgEnum("counting_session_status_enum", ["open", "completed", "cancelled"]);
export const inventoryStatusEnum = pgEnum("inventory_status_enum", ["in_stock", "in_use", "quarantine", "damaged"]);

// Session storage table (Replit Auth requirement)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (Replit Auth with role-based access)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").notNull().default("customer"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Product Type reference table - MySQL structure
export const productTypes = pgTable("product_type", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameDutch: text("name_dutch"),
  imageUrl: text("image_url"),
  showOnHomepage: boolean("show_on_homepage").notNull().default(false),
  homepageSortOrder: integer("homepage_sort_order").notNull().default(0),
  creationDate: timestamp("creation_date").notNull().default(sql`now()`),
  modificationDate: timestamp("modification_date").notNull().default(sql`now()`),
});

// Product Subtype reference table - MySQL structure
export const productSubtypes = pgTable("product_subtype", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  productTypeId: integer("product_type_id").references(() => productTypes.id),
  creationDate: timestamp("creation_date").notNull().default(sql`now()`),
  modificationDate: timestamp("modification_date").notNull().default(sql`now()`),
});

// Payment Method reference table - MySQL structure
export const paymentMethods = pgTable("payment_method", {
  id: serial("id").primaryKey(),
  paymentMethod: text("payment_method").notNull(),
});

// Sales Status reference table - MySQL structure
export const salesStatuses = pgTable("sales_status", {
  id: serial("id").primaryKey(),
  salesStatus: text("sales_status").notNull(),
});

// Stock Movement Reason reference table - MySQL structure
export const stockMovementReasons = pgTable("stock_movement_reason", {
  id: serial("id").primaryKey(),
  reason: text("reason").notNull(),
});

// Product Item Status reference table
export const productItemStatuses = pgTable("product_item_status", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  creationDate: timestamp("creation_date").notNull().default(sql`now()`),
});

// Product Item table - FIFO inventory tracking
export const productItems = pgTable("product_item", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id),
  locationId: integer("location_id").notNull().references(() => productLocations.id),
  statusId: integer("status_id").notNull().default(2).references(() => productItemStatuses.id),
  countingSessionId: integer("counting_session_id").references(() => countingSessions.id, { onDelete: "set null" }),
  quantity: decimal("quantity", { precision: 15, scale: 5 }).notNull().default("0"),
  expiryDate: date("expiry_date"),
  batchNumber: text("batch_number"),
  creationDate: timestamp("creation_date").notNull().default(sql`now()`),
  modificationDate: timestamp("modification_date").notNull().default(sql`now()`),
});

// Quotes table - For rotating receipt quotes
export const quotes = pgTable("quote", {
  id: serial("id").primaryKey(),
  quoteText: text("quote_text").notNull(),
  author: text("author"),
  category: quoteCategoryEnum("category").notNull().default("general"),
  active: boolean("active").notNull().default(true),
  creationDate: timestamp("creation_date").notNull().default(sql`now()`),
  modificationDate: timestamp("modification_date").notNull().default(sql`now()`),
});

// Customers table - Full structure from MySQL
export const customers = pgTable("customer", {
  id: serial("id").primaryKey(),
  woocommerceId: text("woocommerce_id"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  birthday: date("birthday"),
  email: varchar("email", { length: 100 }),
  phone: varchar("phone", { length: 30 }),
  companyName: text("company_name"),
  vatNumber: text("vat_number"),
  b2bClient: boolean("b2b_client").notNull().default(false),
  b2bPrices: boolean("b2b_prices").notNull().default(false),
  billingAddressStreet: text("billing_address_street"),
  billingAddressBus: text("billing_address_bus"),
  billingAddressPostalCode: text("billing_address_postal_code"),
  billingAddressCity: text("billing_address_city"),
  shippingAddressStreet: text("shipping_address_street"),
  shippingAddressBus: text("shipping_address_bus"),
  shippingAddressPostalCode: text("shipping_address_postal_code"),
  shippingAddressCity: text("shipping_address_city"),
  creationDate: timestamp("creation_date").notNull().default(sql`now()`),
  modificationDate: timestamp("modification_date").notNull().default(sql`now()`),
});

// Products table - Full structure from MySQL
export const products = pgTable("product", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameDutch: text("name_dutch").notNull(),
  posShortNameDutch: text("pos_short_name_dutch"),
  picture: text("picture"),
  productTypeId: integer("product_type_id").notNull().references(() => productTypes.id),
  productSubtypeId: integer("product_subtype_id").references(() => productSubtypes.id),
  vatClassId: integer("vat_class_id").notNull(),
  status: text("status").notNull().default("1"),
  supplierId: integer("supplier_id").notNull(),
  supplierProductId: text("supplier_product_id"),
  woocommerceId: text("woocommerce_id"),
  ownBlend: boolean("own_blend").notNull().default(false),
  webshopEnabled: boolean("webshop_enabled").notNull().default(false),
  webshopDescription: text("webshop_description"),
  originCountry: text("origin_country"),
  originContinent: text("origin_continent"),
  region: text("region"),
  tastingNote: text("tasting_note"),
  process: text("process"),
  strength: text("strength"),
  brewTemp: text("brew_temp"),
  brewTime: text("brew_time"),
  brewDosage: text("brew_dosage"),
  shortDescription: text("short_description"),
  juraSeries: text("jura_series"),
  juraPriceRange: text("jura_price_range"),
  specs: text("specs"),
  awards: text("awards"),
  seasonal: boolean("seasonal").notNull().default(false),
  featured: boolean("featured").notNull().default(false),
  webshopSortOrder: integer("webshop_sort_order").notNull().default(0),
  creationDate: timestamp("creation_date").notNull().default(sql`now()`),
  modificationDate: timestamp("modification_date").notNull().default(sql`now()`),
});

// Sales table (replaces orders)
export const sales = pgTable("sale", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  invoiceNumber: text("invoice_number").notNull(),
  salesDate: date("sales_date").notNull(),
  salesStatus: integer("sales_status").notNull().references(() => salesStatuses.id),
  shippingClass: text("shipping_class"),
  shippingCostWithoutVat: decimal("shipping_cost_without_vat", { precision: 10, scale: 5 }).notNull().default("0"),
  shippingCostWithVat: decimal("shipping_cost_with_vat", { precision: 10, scale: 5 }).notNull().default("0"),
  discountPercentage: decimal("discount_percentage", { precision: 4, scale: 2 }).notNull().default("0"),
  discountWithoutVat: decimal("discount_without_vat", { precision: 10, scale: 5 }).notNull().default("0"),
  discountWithVat: decimal("discount_with_vat", { precision: 10, scale: 5 }).notNull().default("0"),
  paymentMethod: integer("payment_method").notNull().references(() => paymentMethods.id),
  webshopSale: boolean("webshop_sale").notNull().default(false),
  stockUpdated: boolean("stock_updated").notNull().default(false),
  uploadedAccounting: boolean("uploaded_accounting").notNull().default(false),
  creationDate: timestamp("creation_date").notNull().default(sql`now()`),
  modificationDate: timestamp("modification_date").notNull().default(sql`now()`),
});

// Salesline table (replaces order_items)
export const salesLines = pgTable("salesline", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id").notNull().references(() => sales.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => products.id),
  weight: decimal("weight", { precision: 10, scale: 2 }).notNull(),
  unit: text("unit").notNull(), // gram, stuk, etc
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  unitPriceWithoutVat: decimal("unit_price_without_vat", { precision: 10, scale: 5 }).notNull(),
  unitPriceWithVat: decimal("unit_price_with_vat", { precision: 10, scale: 5 }).notNull(),
  totalWithoutVat: decimal("total_without_vat", { precision: 10, scale: 5 }).notNull(),
  totalWithVat: decimal("total_with_vat", { precision: 10, scale: 5 }).notNull(),
  grindSize: text("grind_size"), // e.g. 'Hele bonen', 'Espresso', 'Filterkoffie'
  creationDate: timestamp("creation_date").notNull().default(sql`now()`),
  modificationDate: timestamp("modification_date").notNull().default(sql`now()`),
});

// Sale Payment table - supports split payments
export const salePayments = pgTable("sale_payment", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id").notNull().references(() => sales.id, { onDelete: "cascade" }),
  paymentMethodId: integer("payment_method_id").notNull().references(() => paymentMethods.id),
  amount: decimal("amount", { precision: 10, scale: 5 }).notNull(),
  creationDate: timestamp("creation_date").notNull().default(sql`now()`),
  modificationDate: timestamp("modification_date").notNull().default(sql`now()`),
});

// Stock Movement table
export const stockMovements = pgTable("stock_movement", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id").references(() => sales.id),
  saleslineId: integer("salesline_id").references(() => salesLines.id),
  productId: integer("product_id").notNull().references(() => products.id),
  roastId: integer("roast_id"),
  orderId: integer("order_id"),
  date: date("date").notNull(),
  quantity: decimal("quantity", { precision: 15, scale: 5 }).notNull(),
  reason: integer("reason").notNull().references(() => stockMovementReasons.id),
  remark: text("remark"),
  creationDate: timestamp("creation_date").notNull().default(sql`now()`),
  modificationDate: timestamp("modification_date").notNull().default(sql`now()`),
});

// Supplier table
export const suppliers = pgTable("supplier", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  contactFirstname: text("contact_firstname"),
  contactLastname: text("contact_lastname"),
  contactPhone: varchar("contact_phone", { length: 25 }),
  contactEmail: varchar("contact_email", { length: 60 }),
  creationDate: timestamp("creation_date").notNull().default(sql`now()`),
  modificationDate: timestamp("modification_date").notNull().default(sql`now()`),
});

// Order table
export const orders = pgTable("order", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").notNull().references(() => suppliers.id),
  orderDate: timestamp("order_date").notNull(),
  creationDate: timestamp("creation_date").notNull().default(sql`now()`),
  modificationDate: timestamp("modification_date").notNull().default(sql`now()`),
});

// Buying Price table
export const buyingPrices = pgTable("buying_price", {
  id: serial("id").primaryKey(),
  workId: integer("work_id"),
  productId: integer("product_id").notNull().references(() => products.id),
  validFrom: timestamp("valid_from").notNull(),
  validUntil: timestamp("valid_until").notNull(),
  price: decimal("price", { precision: 10, scale: 5 }).notNull(),
  currency: varchar("currency", { length: 10 }).notNull(),
  productUnit: varchar("product_unit", { length: 50 }).notNull(),
  creationDate: timestamp("creation_date").notNull().default(sql`now()`),
  modificationDate: timestamp("modification_date").notNull().default(sql`now()`),
});

// Order Line table
export const orderLines = pgTable("orderline", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => products.id),
  buyinPriceId: integer("buyin_price_id").references(() => buyingPrices.id),
  unitsToOrder: decimal("units_to_order", { precision: 15, scale: 5 }).notNull(),
  creationDate: timestamp("creation_date").notNull().default(sql`now()`),
  modificationDate: timestamp("modification_date").notNull().default(sql`now()`),
});

// Supplier Order table
export const supplierOrders = pgTable("supplier_order", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").notNull().references(() => suppliers.id),
  orderDate: date("order_date").notNull(),
  confirmed: boolean("confirmed").notNull().default(false),
  confirmationDate: timestamp("confirmation_date"),
  remark: text("remark"),
  creationDate: timestamp("creation_date").notNull().default(sql`now()`),
  modificationDate: timestamp("modification_date").notNull().default(sql`now()`),
});

// Supplier Order Line table
export const supplierOrderLines = pgTable("supplier_order_line", {
  id: serial("id").primaryKey(),
  supplierOrderId: integer("supplier_order_id").notNull().references(() => supplierOrders.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: decimal("quantity", { precision: 15, scale: 5 }).notNull(),
  creationDate: timestamp("creation_date").notNull().default(sql`now()`),
  modificationDate: timestamp("modification_date").notNull().default(sql`now()`),
});

// VAT Class table
export const vatClasses = pgTable("vat_class", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  percentage: decimal("percentage", { precision: 5, scale: 2 }).notNull(),
  creationDate: timestamp("creation_date").notNull().default(sql`now()`),
  modificationDate: timestamp("modification_date").notNull().default(sql`now()`),
});

// Product Unit table
export const productUnits = pgTable("product_unit", {
  id: serial("id").primaryKey(),
  weight: integer("weight").notNull(),
  unit: varchar("unit", { length: 20 }).notNull(),
  creationDate: timestamp("creation_date").notNull().default(sql`now()`),
  modificationDate: timestamp("modification_date").notNull().default(sql`now()`),
});

// Sales Price table - B2B and B2C pricing with date ranges
export const salesPrices = pgTable("sales_price", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id),
  amount: integer("amount").notNull(),
  unit: text("unit").notNull(),
  posItem: boolean("pos_item").notNull(),
  webshopPrice: boolean("webshop_price").notNull().default(false),
  webshopDefault: boolean("webshop_default").notNull().default(false),
  b2cPriceWithoutVat: decimal("b2c_price_without_vat", { precision: 10, scale: 5 }).notNull().default("0"),
  b2cPriceWithVat: decimal("b2c_price_with_vat", { precision: 10, scale: 5 }).notNull().default("0"),
  b2bPriceWithoutVat: decimal("b2b_price_without_vat", { precision: 10, scale: 5 }).notNull().default("0"),
  b2bPriceWithVat: decimal("b2b_price_with_vat", { precision: 10, scale: 5 }).notNull().default("0"),
  validFrom: date("valid_from").notNull(),
  validUntil: date("valid_until").notNull(),
  creationDate: timestamp("creation_date").notNull().default(sql`now()`),
  modificationDate: timestamp("modification_date").notNull().default(sql`now()`),
});

// Customer Price table - Customer-specific pricing overrides
export const customerPrices = pgTable("customer_price", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  salesUnitDefaultId: integer("sales_unit_default_id").notNull().references(() => salesPrices.id, { onDelete: "cascade" }),
  customerUnitPriceWithoutVat: decimal("customer_unit_price_without_vat", { precision: 10, scale: 5 }).notNull(),
  customerUnitPriceWithVat: decimal("customer_unit_price_with_vat", { precision: 10, scale: 5 }).notNull(),
  customerPriceValidFrom: date("customer_price_valid_from").notNull(),
  customerPriceValidUntil: date("customer_price_valid_until").notNull(),
  customerPriceCreationDate: timestamp("customer_price_creation_date").notNull().default(sql`now()`),
  customerPriceModificationDate: timestamp("customer_price_modification_date").notNull().default(sql`now()`),
});

// Product Component table - for blended products
export const productComponents = pgTable("product_component", {
  id: serial("id").primaryKey(),
  finalProductId: integer("final_product_id").notNull().references(() => products.id),
  componentProductId: integer("component_product_id").notNull().references(() => products.id),
  componentPercentage: decimal("component_percentage", { precision: 4, scale: 2 }).notNull(),
});

// Product Location table
export const productLocations = pgTable("product_location", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
});

// Roast table - tracks coffee roasting
export const roasts = pgTable("roast", {
  id: serial("id").primaryKey(),
  greenCoffeeId: integer("green_coffee_id").notNull().references(() => products.id),
  greenCoffeeAmount: smallint("green_coffee_amount").notNull(),
  roastedCoffeeAmount: smallint("roasted_coffee_amount").notNull(),
  roastDate: date("roast_date").notNull(),
  remark: text("remark").notNull(),
});

// Green Roasted Coffee mapping table
export const greenRoastedCoffees = pgTable("green_roasted_coffee", {
  id: serial("id").primaryKey(),
  greenCoffeeId: integer("green_coffee_id").notNull().references(() => products.id),
  roastedCoffeeId: integer("roasted_coffee_id").notNull().references(() => products.id),
});

// Loyalty table - customer loyalty program
export const loyalty = pgTable("loyalty", {
  id: smallint("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  totalConsumption: integer("total_consumption").notNull(),
  savedConsumption: integer("saved_consumption").notNull(),
  loyaltyDeductions: integer("loyalty_deductions").notNull(),
});

// Invoice Number table - tracks invoice numbering by year
export const invoiceNumbers = pgTable("invoice_number", {
  id: serial("id").primaryKey(),
  invoiceYear: smallint("invoice_year").notNull(),
  invoiceLastNumber: integer("invoice_last_number").notNull(),
  creditNoteLastNumber: integer("credit_note_last_number").notNull(),
});

// Map Sud Boeren table - mapping table (no primary key in original)
export const mapSudBoeren = pgTable("map_sud_boeren", {
  mapSudId: text("map_sud_id").notNull(),
  mapBoerenId: text("map_boeren_id").notNull(),
});

// Parameter table - application parameters
export const parameterTable = pgTable("parameter_table", {
  id: serial("id").primaryKey(),
  parameterName: text("parameter_name").notNull().unique(),
  parameterValue: text("parameter_value").notNull(),
});

// Announcements table - for homepage announcement bar
export const announcements = pgTable("announcement", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  link: text("link"),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  creationDate: timestamp("creation_date").notNull().default(sql`now()`),
  modificationDate: timestamp("modification_date").notNull().default(sql`now()`),
});

// Grind Sizes table - configurable list of coffee grind options
export const grindSizes = pgTable("grind_size", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  sortOrder: integer("sort_order").notNull().default(0),
  creationDate: timestamp("creation_date").notNull().default(sql`now()`),
  modificationDate: timestamp("modification_date").notNull().default(sql`now()`),
});

// Free Shipping Postal Codes table - postal codes that qualify for free shipping
export const freeShippingPostalCodes = pgTable("free_shipping_postal_code", {
  id: serial("id").primaryKey(),
  postalCode: varchar("postal_code", { length: 10 }).notNull().unique(),
  city: text("city"),
  creationDate: timestamp("creation_date").notNull().default(sql`now()`),
  modificationDate: timestamp("modification_date").notNull().default(sql`now()`),
});

// Webshop Order table - tracks checkout orders with Mollie payments
export const webshopOrders = pgTable("webshop_order", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 30 }),
  companyName: text("company_name"),
  vatNumber: text("vat_number"),
  billingStreet: text("billing_street").notNull(),
  billingBus: text("billing_bus"),
  billingPostalCode: text("billing_postal_code").notNull(),
  billingCity: text("billing_city").notNull(),
  billingCountry: text("billing_country").notNull().default("BE"),
  shippingStreet: text("shipping_street"),
  shippingBus: text("shipping_bus"),
  shippingPostalCode: text("shipping_postal_code"),
  shippingCity: text("shipping_city"),
  shippingCountry: text("shipping_country"),
  orderNumber: text("order_number").notNull().unique(),
  status: text("status").notNull().default("pending"),
  items: jsonb("items").notNull(),
  subtotalExclVat: decimal("subtotal_excl_vat", { precision: 10, scale: 2 }).notNull(),
  vatAmount: decimal("vat_amount", { precision: 10, scale: 2 }).notNull(),
  shippingCost: decimal("shipping_cost", { precision: 10, scale: 2 }).notNull().default("0"),
  totalInclVat: decimal("total_incl_vat", { precision: 10, scale: 2 }).notNull(),
  molliePaymentId: text("mollie_payment_id"),
  molliePaymentStatus: text("mollie_payment_status"),
  notes: text("notes"),
  saleId: integer("sale_id").references(() => sales.id),
  creationDate: timestamp("creation_date").notNull().default(sql`now()`),
  modificationDate: timestamp("modification_date").notNull().default(sql`now()`),
});

// Counting Session table - inventory counting sessions
export const countingSessions = pgTable("counting_session", {
  id: serial("id").primaryKey(),
  sessionName: text("session_name").notNull(),
  status: countingSessionStatusEnum("status").notNull().default("open"),
  startedBy: varchar("started_by").notNull(),
  startedAt: timestamp("started_at").notNull().default(sql`now()`),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  creationDate: timestamp("creation_date").notNull().default(sql`now()`),
  modificationDate: timestamp("modification_date").notNull().default(sql`now()`),
});

// Counting Session Record table has been replaced by product_item table
// Physical inventory is now tracked directly in product_item during counting

// Relations
export const productTypesRelations = relations(productTypes, ({ many }) => ({
  products: many(products),
  subtypes: many(productSubtypes),
}));

export const productSubtypesRelations = relations(productSubtypes, ({ one, many }) => ({
  productType: one(productTypes, {
    fields: [productSubtypes.productTypeId],
    references: [productTypes.id],
  }),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  productType: one(productTypes, {
    fields: [products.productTypeId],
    references: [productTypes.id],
  }),
  productSubtype: one(productSubtypes, {
    fields: [products.productSubtypeId],
    references: [productSubtypes.id],
  }),
  salesLines: many(salesLines),
  stockMovements: many(stockMovements),
  buyingPrices: many(buyingPrices),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  sales: many(sales),
}));

export const salesRelations = relations(sales, ({ one, many }) => ({
  customer: one(customers, {
    fields: [sales.customerId],
    references: [customers.id],
  }),
  salesStatus: one(salesStatuses, {
    fields: [sales.salesStatus],
    references: [salesStatuses.id],
  }),
  paymentMethodRef: one(paymentMethods, {
    fields: [sales.paymentMethod],
    references: [paymentMethods.id],
  }),
  salesLines: many(salesLines),
  salePayments: many(salePayments),
  stockMovements: many(stockMovements),
}));

export const salesLinesRelations = relations(salesLines, ({ one }) => ({
  sale: one(sales, {
    fields: [salesLines.saleId],
    references: [sales.id],
  }),
  product: one(products, {
    fields: [salesLines.productId],
    references: [products.id],
  }),
}));

export const salePaymentsRelations = relations(salePayments, ({ one }) => ({
  sale: one(sales, {
    fields: [salePayments.saleId],
    references: [sales.id],
  }),
  paymentMethod: one(paymentMethods, {
    fields: [salePayments.paymentMethodId],
    references: [paymentMethods.id],
  }),
}));

export const stockMovementsRelations = relations(stockMovements, ({ one }) => ({
  sale: one(sales, {
    fields: [stockMovements.saleId],
    references: [sales.id],
  }),
  product: one(products, {
    fields: [stockMovements.productId],
    references: [products.id],
  }),
  reason: one(stockMovementReasons, {
    fields: [stockMovements.reason],
    references: [stockMovementReasons.id],
  }),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  products: many(products),
  orders: many(orders),
  supplierOrders: many(supplierOrders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [orders.supplierId],
    references: [suppliers.id],
  }),
  orderLines: many(orderLines),
}));

export const buyingPricesRelations = relations(buyingPrices, ({ one }) => ({
  product: one(products, {
    fields: [buyingPrices.productId],
    references: [products.id],
  }),
}));

export const orderLinesRelations = relations(orderLines, ({ one }) => ({
  order: one(orders, {
    fields: [orderLines.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderLines.productId],
    references: [products.id],
  }),
  buyingPrice: one(buyingPrices, {
    fields: [orderLines.buyinPriceId],
    references: [buyingPrices.id],
  }),
}));

export const supplierOrdersRelations = relations(supplierOrders, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [supplierOrders.supplierId],
    references: [suppliers.id],
  }),
  orderLines: many(supplierOrderLines),
}));

export const supplierOrderLinesRelations = relations(supplierOrderLines, ({ one }) => ({
  supplierOrder: one(supplierOrders, {
    fields: [supplierOrderLines.supplierOrderId],
    references: [supplierOrders.id],
  }),
  product: one(products, {
    fields: [supplierOrderLines.productId],
    references: [products.id],
  }),
}));

// Product Item Relations
export const productItemsRelations = relations(productItems, ({ one }) => ({
  product: one(products, {
    fields: [productItems.productId],
    references: [products.id],
  }),
  location: one(productLocations, {
    fields: [productItems.locationId],
    references: [productLocations.id],
  }),
  status: one(productItemStatuses, {
    fields: [productItems.statusId],
    references: [productItemStatuses.id],
  }),
}));

// Zod schemas for inserts
export const insertProductTypeSchema = createInsertSchema(productTypes).omit({
  id: true,
});

export const insertProductSubtypeSchema = createInsertSchema(productSubtypes).omit({
  id: true,
});

export const insertPaymentMethodSchema = createInsertSchema(paymentMethods).omit({
  id: true,
});

export const insertSalesStatusSchema = createInsertSchema(salesStatuses).omit({
  id: true,
});

export const insertStockMovementReasonSchema = createInsertSchema(stockMovementReasons).omit({
  id: true,
});

export const insertProductItemStatusSchema = createInsertSchema(productItemStatuses).omit({
  id: true,
  creationDate: true,
});

export const insertProductItemSchema = createInsertSchema(productItems).omit({
  id: true,
  creationDate: true,
  modificationDate: true,
});

export const insertQuoteSchema = createInsertSchema(quotes).omit({
  id: true,
  creationDate: true,
  modificationDate: true,
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  creationDate: true,
  modificationDate: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  creationDate: true,
  modificationDate: true,
});

export const insertSaleSchema = createInsertSchema(sales).omit({
  id: true,
  creationDate: true,
  modificationDate: true,
});

export const insertSalesLineSchema = createInsertSchema(salesLines).omit({
  id: true,
  saleId: true,
  creationDate: true,
  modificationDate: true,
});

export const insertSalePaymentSchema = createInsertSchema(salePayments).omit({
  id: true,
  creationDate: true,
  modificationDate: true,
});

export const insertStockMovementSchema = createInsertSchema(stockMovements).omit({
  id: true,
  creationDate: true,
  modificationDate: true,
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  creationDate: true,
  modificationDate: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  creationDate: true,
  modificationDate: true,
});

const baseBuyingPriceSchema = createInsertSchema(buyingPrices).omit({
  id: true,
  creationDate: true,
  modificationDate: true,
});

export const insertBuyingPriceSchema = baseBuyingPriceSchema.refine((data) => {
  return new Date(data.validUntil) >= new Date(data.validFrom);
}, {
  message: "Valid until date must be on or after valid from date",
  path: ["validUntil"],
});

export const updateBuyingPriceSchema = baseBuyingPriceSchema.partial();

export const insertOrderLineSchema = createInsertSchema(orderLines).omit({
  id: true,
  creationDate: true,
  modificationDate: true,
});

export const insertSupplierOrderSchema = createInsertSchema(supplierOrders).omit({
  id: true,
  creationDate: true,
  modificationDate: true,
});

export const insertSupplierOrderLineSchema = createInsertSchema(supplierOrderLines).omit({
  id: true,
  creationDate: true,
  modificationDate: true,
});

export const insertVatClassSchema = createInsertSchema(vatClasses).omit({
  creationDate: true,
  modificationDate: true,
});

export const insertProductUnitSchema = createInsertSchema(productUnits).omit({
  id: true,
  creationDate: true,
  modificationDate: true,
});

export const insertSalesPriceSchema = createInsertSchema(salesPrices).omit({
  id: true,
  creationDate: true,
  modificationDate: true,
}).refine((data) => {
  return new Date(data.validUntil) >= new Date(data.validFrom);
}, {
  message: "Valid until date must be on or after valid from date",
  path: ["validUntil"],
});

export const insertCustomerPriceSchema = createInsertSchema(customerPrices).omit({
  id: true,
  customerPriceCreationDate: true,
  customerPriceModificationDate: true,
});

export const insertProductComponentSchema = createInsertSchema(productComponents).omit({
  id: true,
});

export const insertProductLocationSchema = createInsertSchema(productLocations).omit({
  id: true,
});

export const insertRoastSchema = createInsertSchema(roasts).omit({
  id: true,
});

export const insertGreenRoastedCoffeeSchema = createInsertSchema(greenRoastedCoffees).omit({
  id: true,
});

export const insertLoyaltySchema = createInsertSchema(loyalty);

export const insertInvoiceNumberSchema = createInsertSchema(invoiceNumbers).omit({
  id: true,
});

export const insertMapSudBoerenSchema = createInsertSchema(mapSudBoeren);

export const insertParameterSchema = createInsertSchema(parameterTable).omit({
  id: true,
});

export const insertCountingSessionSchema = createInsertSchema(countingSessions).omit({
  id: true,
  creationDate: true,
  modificationDate: true,
});

export const insertAnnouncementSchema = createInsertSchema(announcements).omit({
  id: true,
  creationDate: true,
  modificationDate: true,
});

export const insertGrindSizeSchema = createInsertSchema(grindSizes).omit({
  id: true,
  creationDate: true,
  modificationDate: true,
});

export const insertFreeShippingPostalCodeSchema = createInsertSchema(freeShippingPostalCodes).omit({
  id: true,
  creationDate: true,
  modificationDate: true,
});

export const insertWebshopOrderSchema = createInsertSchema(webshopOrders).omit({
  id: true,
  creationDate: true,
  modificationDate: true,
});

// Update schemas (partial updates allowed)
export const updateCustomerSchema = insertCustomerSchema.partial();

// TypeScript types
export type ProductType = typeof productTypes.$inferSelect;
export type InsertProductType = z.infer<typeof insertProductTypeSchema>;

export type ProductSubtype = typeof productSubtypes.$inferSelect;
export type InsertProductSubtype = z.infer<typeof insertProductSubtypeSchema>;

export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type InsertPaymentMethod = z.infer<typeof insertPaymentMethodSchema>;

export type SalesStatus = typeof salesStatuses.$inferSelect;
export type InsertSalesStatus = z.infer<typeof insertSalesStatusSchema>;

export type StockMovementReason = typeof stockMovementReasons.$inferSelect;
export type InsertStockMovementReason = z.infer<typeof insertStockMovementReasonSchema>;

export type ProductItemStatus = typeof productItemStatuses.$inferSelect;
export type InsertProductItemStatus = z.infer<typeof insertProductItemStatusSchema>;

export type ProductItem = typeof productItems.$inferSelect;
export type InsertProductItem = z.infer<typeof insertProductItemSchema>;

export type Quote = typeof quotes.$inferSelect;
export type InsertQuote = z.infer<typeof insertQuoteSchema>;

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type UpdateCustomer = z.infer<typeof updateCustomerSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Sale = typeof sales.$inferSelect;
export type InsertSale = z.infer<typeof insertSaleSchema>;

export type SalesLine = typeof salesLines.$inferSelect;
export type InsertSalesLine = z.infer<typeof insertSalesLineSchema>;

export type SalePayment = typeof salePayments.$inferSelect;
export type InsertSalePayment = z.infer<typeof insertSalePaymentSchema>;

export type StockMovement = typeof stockMovements.$inferSelect;
export type InsertStockMovement = z.infer<typeof insertStockMovementSchema>;

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type BuyingPrice = typeof buyingPrices.$inferSelect;
export type InsertBuyingPrice = z.infer<typeof insertBuyingPriceSchema>;

export type OrderLine = typeof orderLines.$inferSelect;
export type InsertOrderLine = z.infer<typeof insertOrderLineSchema>;

export type SupplierOrder = typeof supplierOrders.$inferSelect;
export type InsertSupplierOrder = z.infer<typeof insertSupplierOrderSchema>;

export type SupplierOrderLine = typeof supplierOrderLines.$inferSelect;
export type InsertSupplierOrderLine = z.infer<typeof insertSupplierOrderLineSchema>;

export type VatClass = typeof vatClasses.$inferSelect;
export type InsertVatClass = z.infer<typeof insertVatClassSchema>;

export type ProductUnit = typeof productUnits.$inferSelect;
export type InsertProductUnit = z.infer<typeof insertProductUnitSchema>;

export type SalesPrice = typeof salesPrices.$inferSelect;
export type InsertSalesPrice = z.infer<typeof insertSalesPriceSchema>;

export type CustomerPrice = typeof customerPrices.$inferSelect;
export type InsertCustomerPrice = z.infer<typeof insertCustomerPriceSchema>;

export type ProductComponent = typeof productComponents.$inferSelect;
export type InsertProductComponent = z.infer<typeof insertProductComponentSchema>;

export type ProductLocation = typeof productLocations.$inferSelect;
export type InsertProductLocation = z.infer<typeof insertProductLocationSchema>;

export type Roast = typeof roasts.$inferSelect;
export type InsertRoast = z.infer<typeof insertRoastSchema>;

export type GreenRoastedCoffee = typeof greenRoastedCoffees.$inferSelect;
export type InsertGreenRoastedCoffee = z.infer<typeof insertGreenRoastedCoffeeSchema>;

export type Loyalty = typeof loyalty.$inferSelect;
export type InsertLoyalty = z.infer<typeof insertLoyaltySchema>;

export type InvoiceNumber = typeof invoiceNumbers.$inferSelect;
export type InsertInvoiceNumber = z.infer<typeof insertInvoiceNumberSchema>;

export type MapSudBoeren = typeof mapSudBoeren.$inferSelect;
export type InsertMapSudBoeren = z.infer<typeof insertMapSudBoerenSchema>;

export type Parameter = typeof parameterTable.$inferSelect;
export type InsertParameter = z.infer<typeof insertParameterSchema>;

export type CountingSession = typeof countingSessions.$inferSelect;
export type InsertCountingSession = z.infer<typeof insertCountingSessionSchema>;

export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;

export type GrindSize = typeof grindSizes.$inferSelect;
export type InsertGrindSize = z.infer<typeof insertGrindSizeSchema>;

// Extended types with relations
export type SaleWithLines = Sale & {
  salesLines: (SalesLine & { product: Product; vatPercentage: string })[];
  salePayments?: SalePayment[];
  customer?: Customer | null;
};

export type CustomerWithSales = Customer & {
  sales: SaleWithLines[];
};

export type SupplierOrderWithLines = SupplierOrder & {
  orderLines: (SupplierOrderLine & { product: Product })[];
  supplier?: Supplier | null;
};

export type FreeShippingPostalCode = typeof freeShippingPostalCodes.$inferSelect;
export type InsertFreeShippingPostalCode = z.infer<typeof insertFreeShippingPostalCodeSchema>;

export type WebshopOrder = typeof webshopOrders.$inferSelect;
export type InsertWebshopOrder = z.infer<typeof insertWebshopOrderSchema>;
