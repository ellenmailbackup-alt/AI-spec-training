import { db } from './db';
import {
  products,
  salesPrices,
  productTypes,
  productSubtypes,
  productUnits,
  customers,
  sales,
  salesLines,
  salePayments,
  stockMovements,
  salesStatuses,
  paymentMethods,
  vatClasses,
  stockMovementReasons,
  invoiceNumbers,
  customerPrices,
  quotes,
  type InsertSale,
  type InsertSalesLine,
  type InsertSalePayment,
  type InsertStockMovement,
  type InsertCustomer,
} from '@shared/schema';
import { eq, and, lte, gte, desc, sql, asc } from 'drizzle-orm';
import { parameterService } from './parameterService';

async function resolveProductUnitAmount(amount: number, unit: string): Promise<number> {
  const allUnits = await db.select().from(productUnits);
  const weightsByUnit = new Map<string, Set<number>>();
  const unitById = new Map<number, { weight: number; unit: string }>();
  allUnits.forEach((pu) => {
    if (!weightsByUnit.has(pu.unit)) weightsByUnit.set(pu.unit, new Set());
    weightsByUnit.get(pu.unit)!.add(pu.weight);
    unitById.set(pu.id, { weight: pu.weight, unit: pu.unit });
  });
  const knownWeights = weightsByUnit.get(unit) || new Set();
  if (knownWeights.has(amount)) return amount;
  const resolved = unitById.get(amount);
  if (resolved) return resolved.weight;
  return amount;
}

async function buildProductUnitResolver() {
  const allUnits = await db.select().from(productUnits);
  const weightsByUnit = new Map<string, Set<number>>();
  const unitById = new Map<number, { weight: number; unit: string }>();
  allUnits.forEach((pu) => {
    if (!weightsByUnit.has(pu.unit)) weightsByUnit.set(pu.unit, new Set());
    weightsByUnit.get(pu.unit)!.add(pu.weight);
    unitById.set(pu.id, { weight: pu.weight, unit: pu.unit });
  });
  return (amount: number, unit: string): number => {
    const knownWeights = weightsByUnit.get(unit) || new Set();
    if (knownWeights.has(amount)) return amount;
    const resolved = unitById.get(amount);
    if (resolved) return resolved.weight;
    return amount;
  };
}

export const posService = {
  /**
   * Get POS-enabled products with their variants and pricing
   */
  async getPOSProducts(customerId?: number) {
    const today = new Date().toISOString().split('T')[0];

    // Get customer to determine B2B pricing
    let isB2B = false;
    if (customerId) {
      const [customer] = await db
        .select()
        .from(customers)
        .where(eq(customers.id, customerId))
        .limit(1);

      isB2B = customer?.b2bPrices ?? false;
    }

    // Get customer-specific prices if customer is provided
    let customerSpecificPrices = new Map();
    if (customerId) {
      const customPrices = await db
        .select()
        .from(customerPrices)
        .where(
          and(
            eq(customerPrices.customerId, customerId),
            lte(customerPrices.customerPriceValidFrom, today),
            gte(customerPrices.customerPriceValidUntil, today)
          )
        );

      // Map by sales unit ID for quick lookup
      for (const cp of customPrices) {
        customerSpecificPrices.set(cp.salesUnitDefaultId, cp);
      }
    }

    // Get products with active POS prices
    const posProducts = await db
      .select({
        id: products.id,
        name: products.name,
        nameDutch: products.nameDutch,
        posShortNameDutch: products.posShortNameDutch,
        picture: products.picture,
        productTypeId: products.productTypeId,
        productSubtypeId: products.productSubtypeId,
        vatClassId: products.vatClassId,
        status: products.status,
        // Include pricing info
        priceId: salesPrices.id,
        amount: salesPrices.amount,
        unit: salesPrices.unit,
        b2cPriceWithoutVat: salesPrices.b2cPriceWithoutVat,
        b2cPriceWithVat: salesPrices.b2cPriceWithVat,
        b2bPriceWithoutVat: salesPrices.b2bPriceWithoutVat,
        b2bPriceWithVat: salesPrices.b2bPriceWithVat,
        // Category info
        productTypeName: productTypes.name,
        productSubtypeName: productSubtypes.name,
      })
      .from(products)
      .innerJoin(salesPrices, eq(products.id, salesPrices.productId))
      .leftJoin(productTypes, eq(products.productTypeId, productTypes.id))
      .leftJoin(productSubtypes, eq(products.productSubtypeId, productSubtypes.id))
      .where(
        and(
          eq(products.status, '1'), // Active products
          eq(salesPrices.posItem, true), // POS enabled
          lte(salesPrices.validFrom, today),
          gte(salesPrices.validUntil, today)
        )
      )
      .orderBy(asc(products.productTypeId), asc(products.nameDutch));

    // Build resolver to translate product_unit IDs to actual weights
    const resolveAmount = await buildProductUnitResolver();

    // Group products with their variants
    const productMap = new Map();

    for (const row of posProducts) {
      if (!productMap.has(row.id)) {
        productMap.set(row.id, {
          id: row.id,
          name: row.name,
          nameDutch: row.nameDutch,
          posShortNameDutch: row.posShortNameDutch,
          picture: row.picture,
          productTypeId: row.productTypeId,
          productTypeName: row.productTypeName,
          productSubtypeId: row.productSubtypeId,
          productSubtypeName: row.productSubtypeName,
          vatClassId: row.vatClassId,
          variants: [],
        });
      }

      const product = productMap.get(row.id);
      
      // Check if there's a customer-specific price for this variant
      const customPrice = customerSpecificPrices.get(row.priceId);
      
      product.variants.push({
        priceId: row.priceId,
        amount: resolveAmount(row.amount, row.unit),
        unit: row.unit,
        priceWithoutVat: customPrice 
          ? customPrice.customerUnitPriceWithoutVat 
          : (isB2B ? row.b2bPriceWithoutVat : row.b2cPriceWithoutVat),
        priceWithVat: customPrice 
          ? customPrice.customerUnitPriceWithVat 
          : (isB2B ? row.b2bPriceWithVat : row.b2cPriceWithVat),
      });
    }

    return Array.from(productMap.values());
  },

  /**
   * Get product variants for a specific product
   */
  async getProductVariants(productId: number, customerId?: number) {
    const today = new Date().toISOString().split('T')[0];

    // Get customer to determine B2B pricing
    let isB2B = false;
    if (customerId) {
      const [customer] = await db
        .select()
        .from(customers)
        .where(eq(customers.id, customerId))
        .limit(1);

      isB2B = customer?.b2bPrices ?? false;
    }

    // Get customer-specific prices if customer is provided
    let customerSpecificPrices = new Map();
    if (customerId) {
      const customPrices = await db
        .select()
        .from(customerPrices)
        .where(
          and(
            eq(customerPrices.customerId, customerId),
            lte(customerPrices.customerPriceValidFrom, today),
            gte(customerPrices.customerPriceValidUntil, today)
          )
        );

      // Map by sales unit ID for quick lookup
      for (const cp of customPrices) {
        customerSpecificPrices.set(cp.salesUnitDefaultId, cp);
      }
    }

    const variants = await db
      .select()
      .from(salesPrices)
      .where(
        and(
          eq(salesPrices.productId, productId),
          eq(salesPrices.posItem, true),
          lte(salesPrices.validFrom, today),
          gte(salesPrices.validUntil, today)
        )
      )
      .orderBy(asc(salesPrices.amount));

    const resolveAmount = await buildProductUnitResolver();

    return variants.map(v => {
      const customPrice = customerSpecificPrices.get(v.id);
      
      return {
        priceId: v.id,
        amount: resolveAmount(v.amount, v.unit),
        unit: v.unit,
        priceWithoutVat: customPrice 
          ? customPrice.customerUnitPriceWithoutVat 
          : (isB2B ? v.b2bPriceWithoutVat : v.b2cPriceWithoutVat),
        priceWithVat: customPrice 
          ? customPrice.customerUnitPriceWithVat 
          : (isB2B ? v.b2bPriceWithVat : v.b2cPriceWithVat),
      };
    });
  },

  /**
   * Search customers by name, email, or company
   */
  async searchCustomers(query: string) {
    const searchTerm = `%${query.toLowerCase()}%`;

    const results = await db
      .select({
        id: customers.id,
        firstName: customers.firstName,
        lastName: customers.lastName,
        email: customers.email,
        companyName: customers.companyName,
        b2bClient: customers.b2bClient,
        b2bPrices: customers.b2bPrices,
      })
      .from(customers)
      .where(
        sql`LOWER(${customers.firstName}) LIKE ${searchTerm}
            OR LOWER(${customers.lastName}) LIKE ${searchTerm}
            OR LOWER(${customers.email}) LIKE ${searchTerm}
            OR LOWER(${customers.companyName}) LIKE ${searchTerm}`
      )
      .limit(20);

    return results;
  },

  /**
   * Get guest customer (Kruze - ID 673)
   */
  async getGuestCustomer() {
    const [guest] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, 673))
      .limit(1);

    if (!guest) {
      throw new Error('Guest customer (ID 673) not found. Please create a customer with ID 673 named "Kruze" for guest sales.');
    }

    return guest;
  },

  /**
   * Quick register B2C customer
   */
  async registerCustomer(data: {
    firstName: string;
    lastName: string;
    email: string;
    birthday: string;
  }) {
    const customerData: InsertCustomer = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      birthday: data.birthday,
      b2bClient: false,
      b2bPrices: false,
    };

    const [customer] = await db
      .insert(customers)
      .values(customerData)
      .returning();

    return customer;
  },

  /**
   * Generate next invoice number for B2B customers
   */
  async generateInvoiceNumber(): Promise<string> {
    const currentYear = new Date().getFullYear();

    // Use a transaction to ensure atomicity
    return await db.transaction(async (tx) => {
      // Lock the row for update
      const [invoiceRecord] = await tx
        .select()
        .from(invoiceNumbers)
        .where(eq(invoiceNumbers.invoiceYear, currentYear))
        .for('update');

      if (!invoiceRecord) {
        // Create new record for this year
        const [newRecord] = await tx
          .insert(invoiceNumbers)
          .values({
            invoiceYear: currentYear,
            invoiceLastNumber: 1,
            creditNoteLastNumber: 0,
          })
          .returning();

        return '1';
      }

      // Increment and update
      const nextNumber = invoiceRecord.invoiceLastNumber + 1;

      await tx
        .update(invoiceNumbers)
        .set({ invoiceLastNumber: nextNumber })
        .where(eq(invoiceNumbers.invoiceYear, currentYear));

      return nextNumber.toString();
    });
  },

  /**
   * Create a POS sale with payments and stock movements
   */
  async createPOSSale(data: {
    customerId: number;
    items: Array<{
      productId: number;
      weight: number;
      unit: string;
      amount: number;
      unitPriceWithoutVat: string;
      unitPriceWithVat: string;
      vatClassId: number;
    }>;
    discount?: {
      type: 'percentage' | 'fixed';
      value: number;
    };
    payments: Array<{
      paymentMethodId: number;
      amount: string;
    }>;
  }) {
    return await db.transaction(async (tx) => {
      // 1. Get customer info
      const [customer] = await tx
        .select()
        .from(customers)
        .where(eq(customers.id, data.customerId))
        .limit(1);

      if (!customer) {
        throw new Error('Customer not found');
      }

      // 2. Get "paid" status ID (case-insensitive lookup)
      const [paidStatus] = await tx
        .select()
        .from(salesStatuses)
        .where(sql`UPPER(${salesStatuses.salesStatus}) = UPPER('paid')`)
        .limit(1);

      if (!paidStatus) {
        throw new Error('Paid status not found in database');
      }

      // 3. Get "sale" stock movement reason ID (case-insensitive lookup)
      const [saleReason] = await tx
        .select()
        .from(stockMovementReasons)
        .where(sql`UPPER(${stockMovementReasons.reason}) = UPPER('sale')`)
        .limit(1);

      if (!saleReason) {
        throw new Error('Sale stock movement reason not found in database');
      }

      // 4. Calculate totals
      let subtotalWithoutVat = 0;
      let subtotalWithVat = 0;

      for (const item of data.items) {
        const itemTotalWithoutVat = parseFloat(item.unitPriceWithoutVat) * item.amount;
        const itemTotalWithVat = parseFloat(item.unitPriceWithVat) * item.amount;

        subtotalWithoutVat += itemTotalWithoutVat;
        subtotalWithVat += itemTotalWithVat;
      }

      // 5. Apply discount
      let discountPercentage = 0;
      let discountWithoutVat = 0;
      let discountWithVat = 0;

      if (data.discount) {
        if (data.discount.type === 'percentage') {
          discountPercentage = data.discount.value;
          discountWithoutVat = subtotalWithoutVat * (discountPercentage / 100);
          discountWithVat = subtotalWithVat * (discountPercentage / 100);
        } else {
          // Fixed amount discount - distribute proportionally
          discountWithoutVat = data.discount.value;
          discountWithVat = data.discount.value;
          discountPercentage = (discountWithoutVat / subtotalWithoutVat) * 100;
        }
      }

      // 6. Generate invoice number for B2B customers
      let invoiceNumber = '0';
      if (customer.b2bClient) {
        invoiceNumber = await this.generateInvoiceNumber();
      }

      // 7. Create sale record
      const saleData: InsertSale = {
        customerId: data.customerId,
        invoiceNumber,
        salesDate: new Date().toISOString().split('T')[0],
        salesStatus: paidStatus.id,
        shippingClass: null,
        shippingCostWithoutVat: '0',
        shippingCostWithVat: '0',
        discountPercentage: discountPercentage.toFixed(2),
        discountWithoutVat: discountWithoutVat.toFixed(5),
        discountWithVat: discountWithVat.toFixed(5),
        paymentMethod: data.payments[0].paymentMethodId, // Primary payment for backward compatibility
        webshopSale: false,
        stockUpdated: true,
        uploadedAccounting: false,
      };

      const [sale] = await tx
        .insert(sales)
        .values(saleData)
        .returning();

      // 8. Create sales lines
      const createdLines: any[] = [];

      for (const item of data.items) {
        const totalWithoutVat = parseFloat(item.unitPriceWithoutVat) * item.amount;
        const totalWithVat = parseFloat(item.unitPriceWithVat) * item.amount;

        const lineData: InsertSalesLine = {
          productId: item.productId,
          weight: item.weight.toString(),
          unit: item.unit,
          amount: item.amount.toString(),
          unitPriceWithoutVat: item.unitPriceWithoutVat,
          unitPriceWithVat: item.unitPriceWithVat,
          totalWithoutVat: totalWithoutVat.toFixed(5),
          totalWithVat: totalWithVat.toFixed(5),
        };

        const [line] = await tx
          .insert(salesLines)
          .values({ ...lineData, saleId: sale.id })
          .returning();

        createdLines.push(line);

        // 9. Create stock movement (negative quantity for outgoing)
        const stockMovementData: InsertStockMovement = {
          saleId: sale.id,
          saleslineId: line.id,
          productId: item.productId,
          date: new Date().toISOString().split('T')[0],
          quantity: (-item.amount * item.weight).toString(), // Negative for outgoing
          reason: saleReason.id,
          remark: `POS Sale #${sale.id}`,
        };

        await tx
          .insert(stockMovements)
          .values(stockMovementData);
      }

      // Update sale to mark stock as updated
      await tx
        .update(sales)
        .set({ stockUpdated: true })
        .where(eq(sales.id, sale.id));

      // 10. Create payment records
      for (const payment of data.payments) {
        const paymentData: InsertSalePayment = {
          saleId: sale.id,
          paymentMethodId: payment.paymentMethodId,
          amount: payment.amount,
        };

        await tx
          .insert(salePayments)
          .values(paymentData);
      }

      // 11. Return complete sale with lines
      return {
        sale: { ...sale, stockUpdated: true },
        salesLines: createdLines,
        invoiceNumber,
      };
    });
  },

  /**
   * Get receipt data for a sale
   */
  async getReceipt(saleId: number) {
    // Get sale with customer
    const [sale] = await db
      .select()
      .from(sales)
      .where(eq(sales.id, saleId))
      .limit(1);

    if (!sale) {
      throw new Error('Sale not found');
    }

    // Get customer
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, sale.customerId))
      .limit(1);

    // Get sales lines with product info
    const lines = await db
      .select({
        id: salesLines.id,
        productId: salesLines.productId,
        productName: products.nameDutch,
        weight: salesLines.weight,
        unit: salesLines.unit,
        amount: salesLines.amount,
        unitPriceWithoutVat: salesLines.unitPriceWithoutVat,
        unitPriceWithVat: salesLines.unitPriceWithVat,
        totalWithoutVat: salesLines.totalWithoutVat,
        totalWithVat: salesLines.totalWithVat,
        vatClassId: products.vatClassId,
        vatClassName: vatClasses.name,
        vatPercentage: vatClasses.percentage,
      })
      .from(salesLines)
      .innerJoin(products, eq(salesLines.productId, products.id))
      .innerJoin(vatClasses, eq(products.vatClassId, vatClasses.id))
      .where(eq(salesLines.saleId, saleId));

    // Get payments
    const payments = await db
      .select({
        id: salePayments.id,
        amount: salePayments.amount,
        paymentMethodId: salePayments.paymentMethodId,
        paymentMethodName: paymentMethods.paymentMethod,
      })
      .from(salePayments)
      .innerJoin(paymentMethods, eq(salePayments.paymentMethodId, paymentMethods.id))
      .where(eq(salePayments.saleId, saleId));

    // Get receipt parameters
    const companyName = await parameterService.getParameter('receipt_company_name');
    const address = await parameterService.getParameter('receipt_address');
    const phone = await parameterService.getParameter('receipt_phone');
    const email = await parameterService.getParameter('receipt_email');
    const vatNumber = await parameterService.getParameter('receipt_vat_number');
    const footerText = await parameterService.getParameter('receipt_footer_text');

    // Calculate VAT breakdown
    const vatBreakdown = new Map<number, { className: string; percentage: string; amount: number }>();

    for (const line of lines) {
      const vatAmount = parseFloat(line.totalWithVat) - parseFloat(line.totalWithoutVat);

      if (!vatBreakdown.has(line.vatClassId)) {
        vatBreakdown.set(line.vatClassId, {
          className: line.vatClassName,
          percentage: line.vatPercentage,
          amount: 0,
        });
      }

      const vat = vatBreakdown.get(line.vatClassId)!;
      vat.amount += vatAmount;
    }

    // Calculate totals
    const subtotalWithoutVat = lines.reduce((sum, line) => sum + parseFloat(line.totalWithoutVat), 0);
    const subtotalWithVat = lines.reduce((sum, line) => sum + parseFloat(line.totalWithVat), 0);
    const totalVat = subtotalWithVat - subtotalWithoutVat;

    const discountWithVat = parseFloat(sale.discountWithVat);
    const grandTotal = subtotalWithVat - discountWithVat;

    // Determine customer preference (coffee vs tea) based on order history
    let quoteCategory: 'coffee' | 'tea' | 'general' = 'general';
    
    if (customer && customer.id !== 673) {
      // Get customer's historical orders to determine preference
      const customerHistory = await db
        .select({
          productTypeId: products.productTypeId,
          productTypeName: productTypes.name,
        })
        .from(salesLines)
        .innerJoin(sales, eq(salesLines.saleId, sales.id))
        .innerJoin(products, eq(salesLines.productId, products.id))
        .innerJoin(productTypes, eq(products.productTypeId, productTypes.id))
        .where(eq(sales.customerId, customer.id))
        .limit(100); // Look at last 100 items ordered

      // Count coffee vs tea purchases
      let coffeeCount = 0;
      let teaCount = 0;

      for (const item of customerHistory) {
        const typeName = item.productTypeName.toLowerCase();
        if (typeName.includes('coffee') || typeName.includes('koffie')) {
          coffeeCount++;
        } else if (typeName.includes('tea') || typeName.includes('thee')) {
          teaCount++;
        }
      }

      // Determine preference
      if (coffeeCount > teaCount && coffeeCount > 0) {
        quoteCategory = 'coffee';
      } else if (teaCount > coffeeCount && teaCount > 0) {
        quoteCategory = 'tea';
      }
    }

    // Get active quotes for the determined category (fallback to general if none)
    let availableQuotes = await db
      .select()
      .from(quotes)
      .where(and(
        eq(quotes.active, true),
        eq(quotes.category, quoteCategory)
      ));

    // Fallback to general quotes if no category-specific quotes found
    if (availableQuotes.length === 0) {
      availableQuotes = await db
        .select()
        .from(quotes)
        .where(and(
          eq(quotes.active, true),
          eq(quotes.category, 'general')
        ));
    }

    // Select a quote using sale ID for rotation
    let selectedQuote = null;
    if (availableQuotes.length > 0) {
      const quoteIndex = saleId % availableQuotes.length;
      selectedQuote = availableQuotes[quoteIndex];
    }

    return {
      // Company info
      companyName,
      address,
      phone,
      email,
      vatNumber,
      footerText,

      // Sale info
      saleId: sale.id,
      invoiceNumber: sale.invoiceNumber,
      salesDate: sale.salesDate,
      creationDate: sale.creationDate,

      // Customer info
      customerName: customer && customer.id !== 673 ? `${customer.firstName} ${customer.lastName}` : 'Guest',

      // Line items
      items: lines.map(line => ({
        productName: line.productName,
        weight: line.weight,
        unit: line.unit,
        amount: line.amount,
        unitPrice: line.unitPriceWithVat,
        total: line.totalWithVat,
      })),

      // Payments
      payments: payments.map(p => ({
        method: p.paymentMethodName,
        amount: p.amount,
      })),

      // Totals
      subtotalWithoutVat: subtotalWithoutVat.toFixed(2),
      subtotalWithVat: subtotalWithVat.toFixed(2),
      vatBreakdown: Array.from(vatBreakdown.values()).map(v => ({
        className: v.className,
        percentage: (parseFloat(v.percentage) * 100).toFixed(2),
        amount: v.amount.toFixed(2),
      })),
      discountPercentage: sale.discountPercentage,
      discountAmount: discountWithVat.toFixed(2),
      grandTotal: grandTotal.toFixed(2),

      // Quote
      quote: selectedQuote ? {
        text: selectedQuote.quoteText,
        author: selectedQuote.author,
      } : null,
    };
  },

  /**
   * Get daily sales report
   */
  async getDailySalesReport(date?: string) {
    const reportDate = date || new Date().toISOString().split('T')[0];

    // Get all sales for the day
    const dailySales = await db
      .select({
        id: sales.id,
        invoiceNumber: sales.invoiceNumber,
        customerId: sales.customerId,
        customerName: sql<string>`${customers.firstName} || ' ' || ${customers.lastName}`,
        salesDate: sales.salesDate,
        creationDate: sales.creationDate,
        discountWithVat: sales.discountWithVat,
      })
      .from(sales)
      .innerJoin(customers, eq(sales.customerId, customers.id))
      .where(eq(sales.salesDate, reportDate))
      .orderBy(desc(sales.creationDate));

    // Get all sales lines for these sales
    const saleIds = dailySales.map(s => s.id);

    let salesWithTotals: any[] = [];

    if (saleIds.length > 0) {
      salesWithTotals = await db
        .select({
          saleId: salesLines.saleId,
          total: sql<string>`SUM(${salesLines.totalWithVat})`,
        })
        .from(salesLines)
        .where(sql`${salesLines.saleId} IN (${sql.join(saleIds, sql`, `)})`)
        .groupBy(salesLines.saleId);
    }

    const totalsMap = new Map(salesWithTotals.map(s => [s.saleId, parseFloat(s.total)]));

    // Get payments breakdown
    let paymentsBreakdown: any[] = [];

    if (saleIds.length > 0) {
      paymentsBreakdown = await db
        .select({
          paymentMethodId: salePayments.paymentMethodId,
          paymentMethod: paymentMethods.paymentMethod,
          total: sql<string>`SUM(${salePayments.amount})`,
          count: sql<number>`COUNT(*)`,
        })
        .from(salePayments)
        .innerJoin(paymentMethods, eq(salePayments.paymentMethodId, paymentMethods.id))
        .where(sql`${salePayments.saleId} IN (${sql.join(saleIds, sql`, `)})`)
        .groupBy(salePayments.paymentMethodId, paymentMethods.paymentMethod);
    }

    // Get payment methods for each sale
    let salePaymentsData: any[] = [];
    if (saleIds.length > 0) {
      salePaymentsData = await db
        .select({
          saleId: salePayments.saleId,
          paymentMethod: paymentMethods.paymentMethod,
        })
        .from(salePayments)
        .innerJoin(paymentMethods, eq(salePayments.paymentMethodId, paymentMethods.id))
        .where(sql`${salePayments.saleId} IN (${sql.join(saleIds, sql`, `)})`);
    }

    // Group payment methods by saleId
    const paymentMethodsMap = new Map<number, string[]>();
    for (const payment of salePaymentsData) {
      if (!paymentMethodsMap.has(payment.saleId)) {
        paymentMethodsMap.set(payment.saleId, []);
      }
      paymentMethodsMap.get(payment.saleId)!.push(payment.paymentMethod);
    }

    // Calculate summary
    const transactions = dailySales.map(sale => {
      const subtotal = totalsMap.get(sale.id) || 0;
      const discount = parseFloat(sale.discountWithVat);
      const total = subtotal - discount;
      const paymentMethods = paymentMethodsMap.get(sale.id) || [];

      return {
        id: sale.id,
        invoiceNumber: sale.invoiceNumber,
        customerName: sale.customerName,
        time: new Date(sale.creationDate).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }),
        total: total.toFixed(2),
        paymentMethods: paymentMethods.join(' + '), // e.g., "Cash + Bank Transfer"
      };
    });

    const totalSales = transactions.reduce((sum, t) => sum + parseFloat(t.total), 0);
    const transactionCount = transactions.length;
    const averageSale = transactionCount > 0 ? totalSales / transactionCount : 0;

    return {
      date: reportDate,
      totalSales: totalSales.toFixed(2),
      transactionCount,
      averageSale: averageSale.toFixed(2),
      paymentBreakdown: paymentsBreakdown.map(p => ({
        method: p.paymentMethod,
        total: parseFloat(p.total).toFixed(2),
        count: p.count,
      })),
      transactions,
    };
  },
};
