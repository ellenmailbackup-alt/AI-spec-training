/**
 * Checkout Service
 *
 * Handles webshop checkout flow:
 * - Creating webshop orders
 * - Creating Mollie payments
 * - Processing Mollie webhooks
 * - Converting paid orders into sales records
 */

import { db } from "./db";
import {
  webshopOrders,
  sales,
  salesLines,
  salePayments,
  customers,
  salesPrices,
  stockMovements,
  stockMovementReasons,
} from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { parameterService } from "./parameterService";
import { shippingService } from "./shippingService";
import { getResendClient } from "./resendClient";

const MOLLIE_API_BASE = "https://api.mollie.com/v2";

// Status IDs (matching salesService.ts)
const NEW_STATUS_ID = 1;
const PAID_STATUS_ID = 4;

function getMollieApiKey(): string {
  const key = process.env.MOLLIE_API_KEY;
  if (!key) {
    throw new Error("MOLLIE_API_KEY environment variable is not set");
  }
  return key;
}

function getBaseUrl(): string {
  if (process.env.APP_URL) return process.env.APP_URL;
  if (process.env.REPLIT_DEV_DOMAIN) return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  return "https://kruze.be";
}

function generateOrderNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `WS-${year}${month}${day}-${random}`;
}

export interface CheckoutItem {
  productId: number;
  priceId: number;
  name: string;
  price: number;
  unit: string;
  quantity: number;
  imageUrl?: string;
  category: string;
  grindSize?: string;
}

export interface CheckoutRequest {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  birthday?: string;
  companyName?: string;
  vatNumber?: string;
  billingStreet: string;
  billingBus?: string;
  billingPostalCode: string;
  billingCity: string;
  billingCountry?: string;
  shippingStreet?: string;
  shippingBus?: string;
  shippingPostalCode?: string;
  shippingCity?: string;
  shippingCountry?: string;
  items: CheckoutItem[];
  notes?: string;
  isGuest?: boolean;
}

export class CheckoutService {
  /**
   * Creates a webshop order, customer, sale, and initiates a Mollie payment.
   * The sale is created with status NEW before redirecting to Mollie,
   * so we always have a trace even if the return redirect fails.
   */
  async createOrder(request: CheckoutRequest): Promise<{ checkoutUrl: string; orderNumber: string }> {
    // Calculate product totals
    const productTotalInclVat = request.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const vatRate = 0.06; // 6% BTW for food/beverage in Belgium
    const productVatAmount = productTotalInclVat * (vatRate / (1 + vatRate));
    const subtotalExclVat = productTotalInclVat - productVatAmount;

    // Calculate shipping cost
    const effectivePostalCode = request.shippingPostalCode || request.billingPostalCode;
    const effectiveCountry = request.shippingCountry || request.billingCountry || "BE";
    const productIds = request.items.map((item) => item.productId);
    const shipping = await shippingService.calculateShipping(
      productTotalInclVat,
      effectivePostalCode,
      effectiveCountry,
      productIds
    );

    const totalInclVat = productTotalInclVat + shipping.shippingCostInclVat;
    const vatAmount = productVatAmount + shipping.shippingVatAmount;

    const orderNumber = generateOrderNumber();

    // 1. Find or create customer
    const customerId = await this.findOrCreateCustomer(request);

    // 2. Payment method: bank transfer (ID 1)
    const transferMethodId = this.getTransferPaymentMethodId();

    // 3. Create sale + saleslines + payment in a transaction
    const saleId = await db.transaction(async (tx) => {
      // Create sale record (status = NEW, will become PAID on webhook)
      const todayStr = new Date().toISOString().split("T")[0];
      const [sale] = await tx
        .insert(sales)
        .values({
          customerId,
          invoiceNumber: "0", // B2C
          salesDate: todayStr,
          salesStatus: NEW_STATUS_ID,
          paymentMethod: transferMethodId,
          webshopSale: true,
          shippingCostWithoutVat: shipping.shippingCostExclVat.toFixed(5),
          shippingCostWithVat: shipping.shippingCostInclVat.toFixed(5),
          discountPercentage: "0",
          discountWithoutVat: "0",
          discountWithVat: "0",
          stockUpdated: false,
          uploadedAccounting: false,
        })
        .returning();

      // Create sales lines from checkout items
      for (const item of request.items) {
        // Look up the sales price to get proper unit prices and weight
        const [salesPrice] = await tx
          .select()
          .from(salesPrices)
          .where(eq(salesPrices.id, item.priceId))
          .limit(1);

        const weight = salesPrice ? salesPrice.amount : 1;
        const unit = salesPrice ? salesPrice.unit : item.unit;
        const unitPriceWithVat = item.price;
        const unitPriceWithoutVat = unitPriceWithVat / (1 + vatRate);
        const totalWithVat = unitPriceWithVat * item.quantity;
        const totalWithoutVat = unitPriceWithoutVat * item.quantity;

        await tx.insert(salesLines).values({
          saleId: sale.id,
          productId: item.productId,
          weight: weight.toString(),
          unit,
          amount: item.quantity.toString(),
          unitPriceWithoutVat: unitPriceWithoutVat.toFixed(5),
          unitPriceWithVat: unitPriceWithVat.toFixed(5),
          totalWithoutVat: totalWithoutVat.toFixed(5),
          totalWithVat: totalWithVat.toFixed(5),
          grindSize: item.grindSize ?? null,
        });
      }

      // Add shipping cost as a sales line using the correct shipping product
      if (shipping.shippingCostInclVat > 0) {
        await tx.insert(salesLines).values({
          saleId: sale.id,
          productId: shipping.shippingProductId,
          weight: "1",
          unit: "stuk",
          amount: "1",
          unitPriceWithoutVat: shipping.shippingCostExclVat.toFixed(5),
          unitPriceWithVat: shipping.shippingCostInclVat.toFixed(5),
          totalWithoutVat: shipping.shippingCostExclVat.toFixed(5),
          totalWithVat: shipping.shippingCostInclVat.toFixed(5),
          grindSize: null,
        });
      }

      // Create payment record
      await tx.insert(salePayments).values({
        saleId: sale.id,
        paymentMethodId: transferMethodId,
        amount: totalInclVat.toFixed(5),
      });

      return sale.id;
    });

    // 4. Create the webshop order in DB (linked to the sale)
    const [order] = await db
      .insert(webshopOrders)
      .values({
        email: request.email,
        firstName: request.firstName,
        lastName: request.lastName,
        phone: request.phone || null,
        companyName: request.companyName || null,
        vatNumber: request.vatNumber || null,
        billingStreet: request.billingStreet,
        billingBus: request.billingBus || null,
        billingPostalCode: request.billingPostalCode,
        billingCity: request.billingCity,
        billingCountry: request.billingCountry || "BE",
        shippingStreet: request.shippingStreet || null,
        shippingBus: request.shippingBus || null,
        shippingPostalCode: request.shippingPostalCode || null,
        shippingCity: request.shippingCity || null,
        shippingCountry: request.shippingCountry || null,
        orderNumber,
        status: "pending",
        items: request.items,
        subtotalExclVat: subtotalExclVat.toFixed(2),
        vatAmount: vatAmount.toFixed(2),
        shippingCost: shipping.shippingCostInclVat.toFixed(2),
        totalInclVat: totalInclVat.toFixed(2),
        notes: request.notes || null,
        saleId,
      })
      .returning();

    // 5. Create Mollie payment
    const baseUrl = getBaseUrl();
    const mollieApiKey = getMollieApiKey();

    const mollieResponse = await fetch(`${MOLLIE_API_BASE}/payments`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${mollieApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: {
          currency: "EUR",
          value: totalInclVat.toFixed(2),
        },
        description: `Kruze Bestelling ${orderNumber}`,
        redirectUrl: `${baseUrl}/shop/order-confirmation?order=${orderNumber}`,
        webhookUrl: `${baseUrl}/api/checkout/webhook`,
        metadata: {
          order_id: order.id,
          order_number: orderNumber,
        },
      }),
    });

    if (!mollieResponse.ok) {
      const errorText = await mollieResponse.text();
      console.error("Mollie payment creation failed:", errorText);
      // Clean up: delete webshop order, sale payment, sales lines, and sale
      await db.delete(webshopOrders).where(eq(webshopOrders.id, order.id));
      await db.delete(salePayments).where(eq(salePayments.saleId, saleId));
      await db.delete(salesLines).where(eq(salesLines.saleId, saleId));
      await db.delete(sales).where(eq(sales.id, saleId));
      throw new Error("Payment creation failed. Please try again.");
    }

    const molliePayment = await mollieResponse.json() as {
      id: string;
      status: string;
      _links: { checkout: { href: string } };
    };

    // 6. Update order with Mollie payment ID
    await db
      .update(webshopOrders)
      .set({
        molliePaymentId: molliePayment.id,
        molliePaymentStatus: molliePayment.status,
        modificationDate: new Date(),
      })
      .where(eq(webshopOrders.id, order.id));

    return {
      checkoutUrl: molliePayment._links.checkout.href,
      orderNumber,
    };
  }

  /**
   * Processes Mollie webhook notification.
   * When payment is "paid": updates sale status to PAID, creates stock movements,
   * and sends admin notification email.
   */
  async handleWebhook(paymentId: string): Promise<void> {
    const mollieApiKey = getMollieApiKey();

    // Fetch payment status from Mollie
    const response = await fetch(`${MOLLIE_API_BASE}/payments/${paymentId}`, {
      headers: {
        "Authorization": `Bearer ${mollieApiKey}`,
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch Mollie payment:", await response.text());
      return;
    }

    const payment = await response.json() as {
      id: string;
      status: string;
      metadata: { order_id: number; order_number: string };
    };

    // Update order status based on Mollie payment status
    const statusMap: Record<string, string> = {
      paid: "paid",
      expired: "expired",
      failed: "failed",
      canceled: "cancelled",
    };

    const newStatus = statusMap[payment.status] || payment.status;

    await db
      .update(webshopOrders)
      .set({
        molliePaymentStatus: payment.status,
        status: newStatus,
        modificationDate: new Date(),
      })
      .where(eq(webshopOrders.molliePaymentId, paymentId));

    console.log(`Webshop order ${payment.metadata.order_number} updated to status: ${newStatus}`);

    // When paid: update the linked sale to PAID, create stock movements, notify admins
    if (newStatus === "paid") {
      await this.completeSale(paymentId);
    }
  }

  /**
   * Completes the sale when payment is confirmed:
   * - Sets sale status to PAID
   * - Creates stock movements (auto-deduct inventory)
   * - Sends notification email to store admins
   */
  private async completeSale(molliePaymentId: string): Promise<void> {
    // Find the webshop order
    const [order] = await db
      .select()
      .from(webshopOrders)
      .where(eq(webshopOrders.molliePaymentId, molliePaymentId))
      .limit(1);

    if (!order || !order.saleId) {
      console.error(`No webshop order or linked sale found for Mollie payment ${molliePaymentId}`);
      return;
    }

    // Check if sale is already paid (idempotency for duplicate webhooks)
    const [existingSale] = await db
      .select()
      .from(sales)
      .where(eq(sales.id, order.saleId))
      .limit(1);

    if (!existingSale) {
      console.error(`Sale ${order.saleId} not found`);
      return;
    }

    if (existingSale.salesStatus === PAID_STATUS_ID) {
      console.log(`Sale ${order.saleId} already paid, skipping duplicate webhook`);
      return;
    }

    // Update sale to PAID and create stock movements in a transaction
    await db.transaction(async (tx) => {
      // Update sale status to PAID
      await tx
        .update(sales)
        .set({
          salesStatus: PAID_STATUS_ID,
          stockUpdated: true,
          modificationDate: new Date(),
        })
        .where(eq(sales.id, order.saleId!));

      // Create stock movements (deduct inventory)
      const saleLines = await tx
        .select()
        .from(salesLines)
        .where(eq(salesLines.saleId, order.saleId!));

      // Get SALE stock movement reason
      const [saleReason] = await tx
        .select()
        .from(stockMovementReasons)
        .where(sql`UPPER(${stockMovementReasons.reason}) = 'SALE'`)
        .limit(1);

      if (saleReason) {
        const movementDate = existingSale.salesDate;
        for (const line of saleLines) {
          const stockQuantity = parseFloat(line.weight) * parseFloat(line.amount);
          await tx.insert(stockMovements).values({
            productId: line.productId,
            quantity: (-stockQuantity).toFixed(5),
            reason: saleReason.id,
            saleId: order.saleId!,
            date: movementDate,
          });
        }
      } else {
        console.warn("SALE stock movement reason not found, skipping stock deduction");
      }
    });

    // Send emails (outside transaction, non-critical)
    try {
      await this.sendCustomerConfirmation(order);
    } catch (err) {
      console.error("Failed to send customer confirmation email:", err);
    }
    try {
      await this.sendAdminNotification(order, existingSale);
    } catch (err) {
      console.error("Failed to send admin notification email:", err);
    }
  }

  /**
   * Sends order confirmation email to the customer after successful payment.
   */
  private async sendCustomerConfirmation(
    order: typeof webshopOrders.$inferSelect
  ): Promise<void> {
    if (!order.email) {
      console.warn(`No email on webshop order ${order.orderNumber}, skipping customer confirmation`);
      return;
    }

    const items = order.items as CheckoutItem[];
    const itemsList = items
      .map((item) => `  ${item.quantity}x ${item.name} (${item.unit})${item.grindSize ? ` — Maalgraad: ${item.grindSize}` : ""} — €${(item.price * item.quantity).toFixed(2)}`)
      .join("\n");

    const shippingCost = parseFloat(order.shippingCost);
    const shippingAddress = order.shippingStreet
      ? `${order.shippingStreet}${order.shippingBus ? " " + order.shippingBus : ""}\n${order.shippingPostalCode} ${order.shippingCity}`
      : `${order.billingStreet}${order.billingBus ? " " + order.billingBus : ""}\n${order.billingPostalCode} ${order.billingCity}`;

    const body = [
      `Beste ${order.firstName},`,
      ``,
      `Bedankt voor je bestelling bij Kruze Coffee & Tea!`,
      `Je betaling is ontvangen en je bestelling wordt zo snel mogelijk verwerkt.`,
      ``,
      `Bestelnummer: ${order.orderNumber}`,
      ``,
      `Artikelen:`,
      itemsList,
      ``,
      shippingCost > 0
        ? `Verzendkosten: €${shippingCost.toFixed(2)}`
        : `Verzendkosten: Gratis`,
      `Totaal (incl. BTW): €${parseFloat(order.totalInclVat).toFixed(2)}`,
      ``,
      `Verzendadres:`,
      shippingAddress,
      ``,
      order.notes ? `Opmerking: ${order.notes}\n` : null,
      `Heb je vragen over je bestelling? Neem gerust contact met ons op via info@kruze.be.`,
      ``,
      `Met vriendelijke groeten,`,
      `Kruze Coffee & Tea`,
    ]
      .filter((line) => line !== null)
      .join("\n");

    const { client: resend, fromEmail } = await getResendClient();

    await resend.emails.send({
      from: fromEmail,
      to: [order.email],
      subject: `Bevestiging van je bestelling ${order.orderNumber} — Kruze Coffee & Tea`,
      text: body,
    });

    console.log(`Customer confirmation sent for order ${order.orderNumber}`);
  }

  /**
   * Sends a plain text notification email to store admins about a completed webshop order.
   */
  private async sendAdminNotification(
    order: typeof webshopOrders.$inferSelect,
    sale: typeof sales.$inferSelect
  ): Promise<void> {
    const adminEmailsStr = await parameterService.getParameter("store_admin_emails");
    if (!adminEmailsStr) {
      console.warn("No store_admin_emails parameter configured, skipping admin notification");
      return;
    }

    const adminEmails = adminEmailsStr.split(",").map((e) => e.trim()).filter(Boolean);
    if (adminEmails.length === 0) {
      console.warn("store_admin_emails parameter is empty, skipping admin notification");
      return;
    }

    const items = order.items as CheckoutItem[];
    const itemsList = items
      .map((item) => `- ${item.quantity}x ${item.name} (${item.unit})${item.grindSize ? ` — ${item.grindSize}` : ""} — €${(item.price * item.quantity).toFixed(2)}`)
      .join("\n");

    const body = [
      `Nieuwe webshop bestelling ontvangen!`,
      ``,
      `Bestelnummer: ${order.orderNumber}`,
      `Klant: ${order.firstName} ${order.lastName}`,
      `E-mail: ${order.email}`,
      order.phone ? `Telefoon: ${order.phone}` : null,
      ``,
      `Artikelen:`,
      itemsList,
      ``,
      parseFloat(order.shippingCost) > 0
        ? `Verzendkosten: €${parseFloat(order.shippingCost).toFixed(2)}`
        : `Verzendkosten: Gratis`,
      `Totaal (incl. BTW): €${parseFloat(order.totalInclVat).toFixed(2)}`,
      ``,
      `Adres:`,
      `${order.billingStreet}${order.billingBus ? " " + order.billingBus : ""}`,
      `${order.billingPostalCode} ${order.billingCity}`,
    ]
      .filter((line) => line !== null)
      .join("\n");

    const { client: resend, fromEmail } = await getResendClient();

    await resend.emails.send({
      from: fromEmail,
      to: adminEmails,
      subject: `Nieuwe webshop bestelling ${order.orderNumber}`,
      text: body,
    });

    console.log(`Admin notification sent for order ${order.orderNumber}`);
  }

  /** Guest customer ID (Kruze store customer used for anonymous orders) */
  private static readonly GUEST_CUSTOMER_ID = 673;

  /**
   * Finds an existing customer by email, or creates a new one from checkout info.
   * For guest orders, returns the shared guest customer (ID 673).
   * Shipping/billing info for labels is stored in the webshop_orders table.
   */
  private async findOrCreateCustomer(request: CheckoutRequest): Promise<number> {
    // Guest orders use the shared guest customer record
    if (request.isGuest) {
      return CheckoutService.GUEST_CUSTOMER_ID;
    }

    // Try to find existing customer by email
    if (request.email) {
      const [existing] = await db
        .select()
        .from(customers)
        .where(eq(customers.email, request.email))
        .limit(1);

      if (existing) {
        // Update birthday if provided and not yet set
        if (request.birthday && !existing.birthday) {
          await db
            .update(customers)
            .set({ birthday: request.birthday })
            .where(eq(customers.id, existing.id));
        }
        return existing.id;
      }
    }

    // Create new customer for registered users
    const [newCustomer] = await db
      .insert(customers)
      .values({
        firstName: request.firstName,
        lastName: request.lastName,
        email: request.email,
        phone: request.phone || null,
        birthday: request.birthday || null,
        companyName: request.companyName || null,
        vatNumber: request.vatNumber || null,
        b2bClient: false,
        b2bPrices: false,
        billingAddressStreet: request.billingStreet,
        billingAddressBus: request.billingBus || null,
        billingAddressPostalCode: request.billingPostalCode,
        billingAddressCity: request.billingCity,
        shippingAddressStreet: request.shippingStreet || null,
        shippingAddressBus: request.shippingBus || null,
        shippingAddressPostalCode: request.shippingPostalCode || null,
        shippingAddressCity: request.shippingCity || null,
      })
      .returning();

    return newCustomer.id;
  }

  /**
   * Returns the payment method ID for bank transfer (ID 1).
   */
  private getTransferPaymentMethodId(): number {
    return 1; // bank transfer
  }

  /**
   * Fetches an order by order number.
   */
  async getOrderByNumber(orderNumber: string) {
    const [order] = await db
      .select()
      .from(webshopOrders)
      .where(eq(webshopOrders.orderNumber, orderNumber))
      .limit(1);
    return order || null;
  }
}

export const checkoutService = new CheckoutService();
