import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { roastService } from "./roastService";
import { salesService } from "./salesService";
import { invoiceService } from "./invoiceService";
import { stockMovementService } from "./stockMovementService";
import { customerService, type AccountProfileData } from "./customerService";
import { productService } from "./productService";
import { parameterService } from "./parameterService";
import { posService } from "./posService";
import { pdfInvoiceService } from "./pdfInvoiceService";
import { boerenImportService } from "./boerenImportService";
import { countingSessionService } from "./countingSessionService";
import { dashboardService } from "./dashboardService";
import { salesAnalyticsService } from "./salesAnalyticsService";
import { inventoryService } from "./inventoryService";
import { accountingReportService } from "./accountingReportService";
import { checkoutService, type CheckoutRequest } from "./checkoutService";
import { salesPriceService } from "./salesPriceService";
import { shippingService } from "./shippingService";
import {
  insertProductSchema, insertCustomerSchema, updateCustomerSchema,
  insertSaleSchema, insertSalesLineSchema, insertGreenRoastedCoffeeSchema,
  insertRoastSchema, insertCustomerPriceSchema, parameterTable, sales,
  webshopOrders, salesLines, products, stockMovements, buyingPrices,
  productComponents, grindSizes, freeShippingPostalCodes, customerPrices,
  salesPrices, productUnits,
  insertSalesPriceSchema, insertStockMovementSchema, insertBuyingPriceSchema,
  updateBuyingPriceSchema, insertProductComponentSchema, insertGrindSizeSchema,
  insertFreeShippingPostalCodeSchema, stockMovementReasons,
  insertCountingSessionSchema,
} from "@shared/schema";
import { z } from "zod";
import { setupAuth, isAuthenticated, isAdmin } from "./supabaseAuth";
import { db } from "./db";
import { eq, desc, asc, sql, and, sum, lte, gte } from "drizzle-orm";
import multer from "multer";
import path from "path";
import { parseIdParam, parseYearParam } from "./security";
import { getResendClient } from "./resendClient";
import { uploadToGCS, deleteFromGCS, listGCSFiles } from "./gcs";

// Image upload multer — memory storage only; files are forwarded to GCS
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
  }
});

const parseYearsParam = (param: string, maxYears = 10): number[] => {
  const years = param
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => parseYearParam(value));

  const uniqueYears = Array.from(new Set(years));
  if (uniqueYears.length === 0) {
    throw new Error("Invalid years: at least one year is required");
  }

  if (uniqueYears.length > maxYears) {
    throw new Error(`Invalid years: maximum ${maxYears} years allowed`);
  }

  return uniqueYears;
};

// Configure multer for Excel file uploads (Boeren import)
const uploadExcel = multer({
  storage: multer.memoryStorage(), // Store in memory for processing
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /xls|xlsx|csv/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const allowedMimes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];
    const mimetype = allowedMimes.includes(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed (xls, xlsx, csv)'));
    }
  }
});

export async function registerRoutes(app: Express, server?: Server): Promise<Server> {
  // Setup authentication
  const authStart = Date.now();
  await setupAuth(app);
  console.log(`✅ Auth setup completed in ${Date.now() - authStart}ms`);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Reference data endpoints (public read)
  app.get("/api/product-types", async (req, res) => {
    try {
      const types = await storage.getProductTypes();
      res.json(types);
    } catch (error) {
      console.error("Error fetching product types:", error);
      res.status(500).json({ error: "Failed to fetch product types" });
    }
  });

  app.get("/api/announcements/active", async (req, res) => {
    try {
      const items = await storage.getActiveAnnouncements();
      res.json(items);
    } catch (error) {
      console.error("Error fetching active announcements:", error);
      res.status(500).json({ error: "Failed to fetch announcements" });
    }
  });

  app.get("/api/webshop/products", async (req, res) => {
    try {
      const items = await storage.getWebshopProducts();
      res.json(items);
    } catch (error) {
      console.error("Error fetching webshop products:", error);
      res.status(500).json({ error: "Failed to fetch webshop products" });
    }
  });

  app.get("/api/webshop/grind-sizes", async (_req, res) => {
    try {
      const sizes = await storage.getGrindSizes();
      res.json(sizes);
    } catch (error) {
      console.error("Error fetching grind sizes:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ error: "Failed to fetch grind sizes" });
    }
  });

  // Public shipping cost calculation endpoint
  app.get("/api/webshop/shipping-cost", async (req, res) => {
    try {
      const cartTotal = parseFloat(req.query.cartTotal as string) || 0;
      const postalCode = (req.query.postalCode as string) || "";
      const country = (req.query.country as string) || "BE";
      // productIds can be passed as comma-separated string
      const productIdsStr = (req.query.productIds as string) || "";
      const productIds = productIdsStr ? productIdsStr.split(",").map(Number).filter(n => !isNaN(n)) : [];

      const result = await shippingService.calculateShipping(cartTotal, postalCode, country, productIds);
      res.json(result);
    } catch (error) {
      console.error("Error calculating shipping cost:", error);
      res.status(500).json({ error: "Failed to calculate shipping cost" });
    }
  });

  // Public shipping config endpoint (for cart page - no postal code needed)
  app.get("/api/webshop/shipping-config", async (_req, res) => {
    try {
      const config = await shippingService.getShippingConfig();
      res.json(config);
    } catch (error) {
      console.error("Error fetching shipping config:", error);
      res.status(500).json({ error: "Failed to fetch shipping config" });
    }
  });

  app.get("/api/homepage-categories", async (req, res) => {
    try {
      const categories = await storage.getHomepageCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching homepage categories:", error);
      res.status(500).json({ error: "Failed to fetch homepage categories" });
    }
  });

  app.get("/api/product-subtypes", async (req, res) => {
    try {
      const subtypes = await storage.getProductSubtypes();
      res.json(subtypes);
    } catch (error) {
      console.error("Error fetching product subtypes:", error);
      res.status(500).json({ error: "Failed to fetch product subtypes" });
    }
  });

  app.get("/api/payment-methods", async (req, res) => {
    try {
      const methods = await storage.getPaymentMethods();
      res.json(methods);
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      res.status(500).json({ error: "Failed to fetch payment methods" });
    }
  });

  app.get("/api/sales-statuses", async (req, res) => {
    try {
      const statuses = await storage.getSalesStatuses();
      res.json(statuses);
    } catch (error) {
      console.error("Error fetching sales statuses:", error);
      res.status(500).json({ error: "Failed to fetch sales statuses" });
    }
  });

  app.get("/api/product-units", async (req, res) => {
    try {
      const productUnits = await storage.getProductUnits();
      res.json(productUnits);
    } catch (error) {
      console.error("Error fetching product units:", error);
      res.status(500).json({ error: "Failed to fetch product units" });
    }
  });

  // Products endpoints (public read, admin write)
  app.get("/api/products", async (req, res) => {
    try {
      const { type } = req.query;
      
      if (type && typeof type === 'string') {
        const typeId = parseIdParam(type, "product type ID");
        const products = await storage.getProductsByType(typeId);
        res.json(products);
      } else {
        const products = await storage.getProducts();
        res.json(products);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = parseIdParam(req.params.id, "product ID");
      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      if (error instanceof Error && error.message.includes("Invalid")) {
        return res.status(400).json({ error: error.message });
      }
      console.error("Error fetching product:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  app.get("/api/products/:id/webshop-details", isAdmin, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id, "product ID");
      const details = await storage.getProductWebshopDetails(id);
      if (!details) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(details);
    } catch (error) {
      if (error instanceof Error && error.message.includes("Invalid")) {
        return res.status(400).json({ error: error.message });
      }
      console.error("Error fetching product webshop details:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ error: "Failed to fetch product webshop details" });
    }
  });

  app.post("/api/products", isAdmin, async (req, res) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid product data", details: error.errors });
      }
      console.error("Error creating product:", error);
      res.status(500).json({ error: "Failed to create product" });
    }
  });

  app.patch("/api/products/:id", isAdmin, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id, "product ID");
      const validatedData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(id, validatedData);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      if (error instanceof Error && error.message.includes("Invalid")) {
        return res.status(400).json({ error: error.message });
      }
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Invalid product data",
          ...(process.env.NODE_ENV === 'development' && { details: error.errors })
        });
      }
      console.error("Error updating product:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", isAdmin, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id, "product ID");

      // Check if product has sales
      const hasSales = await storage.checkProductHasSales(id);
      if (hasSales) {
        return res.status(400).json({
          error: "Cannot delete product that has been used in sales"
        });
      }

      const success = await storage.deleteProduct(id);
      if (!success) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.status(204).send();
    } catch (error) {
      if (error instanceof Error && error.message.includes("Invalid")) {
        return res.status(400).json({ error: error.message });
      }
      console.error("Error deleting product:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // Image upload endpoint with error handling
  app.post("/api/products/upload-image", isAdmin, (req, res) => {
    upload.single('image')(req, res, async (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              error: "File too large",
              reason: "Image size must be less than 5MB"
            });
          }
          return res.status(400).json({ error: "Upload error", reason: err.message });
        }
        return res.status(400).json({
          error: "Invalid file",
          reason: err.message || "Only image files are allowed (jpeg, jpg, png, gif, webp)"
        });
      }

      if (!req.file) {
        return res.status(400).json({
          error: "No file provided",
          reason: "Please select an image file to upload"
        });
      }

      try {
        const filename = path.basename(req.file.originalname);
        const objectName = `images/products/${filename}`;
        const url = await uploadToGCS(req.file.buffer, objectName, req.file.mimetype);
        res.json({ path: url });
      } catch (uploadErr: any) {
        console.error("GCS upload error:", uploadErr);
        res.status(500).json({ error: "Upload failed", reason: uploadErr.message });
      }
    });
  });

  // Media Library endpoints (admin only)
  // GET /api/media — list all images in GCS bucket
  app.get("/api/media", isAdmin, async (_req, res) => {
    try {
      const files = await listGCSFiles();
      res.json(files);
    } catch (error: any) {
      console.error("Error listing media files:", error);
      res.status(500).json({ error: "Failed to list media files", reason: error.message });
    }
  });

  // POST /api/media/upload — generic upload (used by media library upload button)
  app.post("/api/media/upload", isAdmin, (req, res) => {
    upload.single("image")(req, res, async (err) => {
      if (err) {
        if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: "File too large", reason: "Image must be less than 5MB" });
        }
        return res.status(400).json({ error: "Invalid file", reason: err.message });
      }
      if (!req.file) return res.status(400).json({ error: "No file provided" });

      try {
        const folder = (req.query.folder as string) === "categories" ? "images/categories" : "images/products";
        const filename = path.basename(req.file.originalname);
        const objectName = `${folder}/${filename}`;
        const url = await uploadToGCS(req.file.buffer, objectName, req.file.mimetype);
        res.json({ url, name: objectName });
      } catch (uploadErr: any) {
        console.error("GCS upload error:", uploadErr);
        res.status(500).json({ error: "Upload failed", reason: uploadErr.message });
      }
    });
  });

  // DELETE /api/media — delete a GCS object by name (passed as query param)
  app.delete("/api/media", isAdmin, async (req, res) => {
    const objectName = req.query.name as string;
    if (!objectName) return res.status(400).json({ error: "Missing name parameter" });
    try {
      await deleteFromGCS(objectName);
      res.json({ ok: true });
    } catch (error: any) {
      console.error("Error deleting media file:", error);
      res.status(500).json({ error: "Failed to delete file", reason: error.message });
    }
  });

  // Product Statistics endpoints (admin only)
  app.get("/api/products/:id/statistics", isAdmin, async (req, res) => {
    try {
      const productId = parseIdParam(req.params.id, "product ID");

      // Get current year from parameter service
      const yearStr = await parameterService.getParameter("current_year");
      const currentYear = yearStr ? parseInt(yearStr) : new Date().getFullYear();

      const statistics = await storage.getProductStatistics(productId, currentYear);
      res.json(statistics);
    } catch (error) {
      if (error instanceof Error && error.message.includes("Invalid")) {
        return res.status(400).json({ error: error.message });
      }
      console.error("Error fetching product statistics:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ error: "Failed to fetch product statistics" });
    }
  });

  app.get("/api/products/:id/monthly-sales", isAdmin, async (req, res) => {
    try {
      const productId = parseIdParam(req.params.id, "product ID");
      const year = req.query.year ? parseYearParam(req.query.year as string) : new Date().getFullYear();

      const monthlySales = await storage.getProductMonthlySales(productId, year);
      res.json(monthlySales);
    } catch (error) {
      if (error instanceof Error && error.message.includes("Invalid")) {
        return res.status(400).json({ error: error.message });
      }
      console.error("Error fetching monthly sales:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ error: "Failed to fetch monthly sales" });
    }
  });

  app.get("/api/products/:id/yearly-sales", isAdmin, async (req, res) => {
    try {
      const productId = parseIdParam(req.params.id, "product ID");
      const yearlySales = await storage.getProductYearlySales(productId);
      res.json(yearlySales);
    } catch (error) {
      if (error instanceof Error && error.message.includes("Invalid")) {
        return res.status(400).json({ error: error.message });
      }
      console.error("Error fetching yearly sales:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ error: "Failed to fetch yearly sales" });
    }
  });

  app.get("/api/products/:id/sales-prices", isAdmin, async (req, res) => {
    try {
      const productId = parseIdParam(req.params.id, "product ID");
      const prices = await salesPriceService.getPricesForProduct(productId);
      res.json(prices);
    } catch (error) {
      console.error("Error fetching sales prices:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ error: "Failed to fetch sales prices" });
    }
  });

  app.post("/api/sales-prices", isAdmin, async (req, res) => {
    try {
      const validatedData = insertSalesPriceSchema.parse(req.body);
      const newPrice = await salesPriceService.createPrice(validatedData);
      res.status(201).json(newPrice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      const statusCode = (error as any)?.statusCode;
      if (statusCode) {
        return res.status(statusCode).json({ error: (error as Error).message });
      }
      console.error("Error creating sales price:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ error: "Failed to create sales price" });
    }
  });

  app.patch("/api/sales-prices/:id", isAdmin, async (req, res) => {
    try {
      const priceId = parseIdParam(req.params.id, "sales price ID");
      const validatedData = insertSalesPriceSchema.parse(req.body);
      const updatedPrice = await salesPriceService.updatePrice(priceId, validatedData);
      res.json(updatedPrice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      const statusCode = (error as any)?.statusCode;
      if (statusCode) {
        return res.status(statusCode).json({ error: (error as Error).message });
      }
      if (error instanceof Error && error.message.includes("Invalid")) {
        return res.status(400).json({ error: error.message });
      }
      console.error("Error updating sales price:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ error: "Failed to update sales price" });
    }
  });

  app.delete("/api/sales-prices/:id", isAdmin, async (req, res) => {
    try {
      const priceId = parseIdParam(req.params.id, "sales price ID");
      const deleted = await salesPriceService.deletePrice(priceId);
      if (!deleted) {
        return res.status(404).json({ error: "Sales price not found" });
      }
      res.json(deleted);
    } catch (error) {
      if (error instanceof Error && error.message.includes("Invalid")) {
        return res.status(400).json({ error: error.message });
      }
      console.error("Error deleting sales price:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ error: "Failed to delete sales price" });
    }
  });

  // Customers endpoints (admin only)
  app.get("/api/customers/stats", isAdmin, async (req, res) => {
    try {
      const stats = await storage.getCustomerStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching customer stats:", error);
      res.status(500).json({ error: "Failed to fetch customer stats" });
    }
  });

  app.get("/api/customers", isAdmin, async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ error: "Failed to fetch customers" });
    }
  });

  app.get("/api/customers/:id", isAdmin, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id, "customer ID");
      const customer = await storage.getCustomer(id);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      if (error instanceof Error && error.message.includes("Invalid")) {
        return res.status(400).json({ error: error.message });
      }
      console.error("Error fetching customer:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ error: "Failed to fetch customer" });
    }
  });

  app.post("/api/customers", isAdmin, async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(validatedData);
      res.status(201).json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Invalid customer data",
          ...(process.env.NODE_ENV === 'development' && { details: error.errors })
        });
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("duplicate key")) {
        console.error("Error creating customer (duplicate key):", errorMessage);
        return res.status(409).json({ error: "A customer with this information already exists" });
      }
      console.error("Error creating customer:", errorMessage);
      res.status(500).json({ error: "Failed to create customer" });
    }
  });

  app.patch("/api/customers/:id", isAdmin, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id, "customer ID");
      const validatedData = updateCustomerSchema.parse(req.body);
      const customer = await storage.updateCustomer(id, validatedData);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      if (error instanceof Error && error.message.includes("Invalid")) {
        return res.status(400).json({ error: error.message });
      }
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Invalid customer data",
          ...(process.env.NODE_ENV === 'development' && { details: error.errors })
        });
      }
      console.error("Error updating customer:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ error: "Failed to update customer" });
    }
  });

  app.delete("/api/customers/:id", isAdmin, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id, "customer ID");

      // Check if customer has any sales
      const hasSales = await storage.checkCustomerHasSales(id);
      if (hasSales) {
        return res.status(400).json({
          error: "Cannot delete customer",
          message: "This customer has existing sales records. Please remove or reassign them first."
        });
      }

      const deleted = await storage.deleteCustomer(id);
      if (!deleted) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json({ success: true, message: "Customer deleted successfully" });
    } catch (error) {
      if (error instanceof Error && error.message.includes("Invalid")) {
        return res.status(400).json({ error: error.message });
      }
      console.error("Error deleting customer:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ error: "Failed to delete customer" });
    }
  });

  // Customer statistics endpoints
  app.get("/api/customers/:id/statistics", isAdmin, async (req, res) => {
    try {
      const customerId = parseIdParam(req.params.id, "customer ID");
      const statistics = await customerService.getCustomerStatistics(customerId);
      res.json(statistics);
    } catch (error) {
      console.error("Error fetching customer statistics:", error);
      const message = error instanceof Error ? error.message : "Failed to fetch customer statistics";
      res.status(500).json({ error: message });
    }
  });

  app.get("/api/customers/:id/yearly-sales", isAdmin, async (req, res) => {
    try {
      const customerId = parseIdParam(req.params.id, "customer ID");
      const yearlySales = await customerService.getCustomerYearlySales(customerId);
      res.json(yearlySales);
    } catch (error) {
      console.error("Error fetching customer yearly sales:", error);
      res.status(500).json({ error: "Failed to fetch customer yearly sales" });
    }
  });

  app.get("/api/customers/:id/products-purchased", isAdmin, async (req, res) => {
    try {
      const customerId = parseIdParam(req.params.id, "customer ID");
      const products = await customerService.getCustomerProductsPurchased(customerId);
      res.json(products);
    } catch (error) {
      console.error("Error fetching customer products purchased:", error);
      res.status(500).json({ error: "Failed to fetch customer products purchased" });
    }
  });

  // Customer pricing endpoints
  app.get("/api/customers/:id/prices", isAdmin, async (req, res) => {
    try {
      const customerId = parseIdParam(req.params.id, "customer ID");
      const prices = await storage.getCustomerPrices(customerId);
      res.json(prices);
    } catch (error) {
      if (error instanceof Error && error.message.includes("Invalid")) {
        return res.status(400).json({ error: error.message });
      }
      console.error("Error fetching customer prices:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ error: "Failed to fetch customer prices" });
    }
  });

  app.post("/api/customers/:id/prices", isAdmin, async (req, res) => {
    try {
      const customerId = parseIdParam(req.params.id, "customer ID");
      const priceData = insertCustomerPriceSchema.parse({ ...req.body, customerId });
      const newPrice = await storage.createCustomerPrice(priceData);
      res.json(newPrice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      if (error instanceof Error && error.message.includes("Invalid")) {
        return res.status(400).json({ error: error.message });
      }
      console.error("Error creating customer price:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ error: "Failed to create customer price" });
    }
  });

  app.patch("/api/customers/:id/prices/:priceId", isAdmin, async (req, res) => {
    try {
      const customerId = parseIdParam(req.params.id, "customer ID");
      const priceId = parseIdParam(req.params.priceId, "price ID");
      const updateData = insertCustomerPriceSchema.partial().parse(req.body);
      const updatedPrice = await storage.updateCustomerPrice(priceId, customerId, updateData);
      if (!updatedPrice) {
        return res.status(404).json({ error: "Customer price not found" });
      }
      res.json(updatedPrice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      if (error instanceof Error && error.message.includes("Invalid")) {
        return res.status(400).json({ error: error.message });
      }
      console.error("Error updating customer price:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ error: "Failed to update customer price" });
    }
  });

  app.delete("/api/customers/:id/prices/:priceId", isAdmin, async (req, res) => {
    try {
      const customerId = parseIdParam(req.params.id, "customer ID");
      const priceId = parseIdParam(req.params.priceId, "price ID");
      const deleted = await storage.deleteCustomerPrice(priceId, customerId);
      if (!deleted) {
        return res.status(404).json({ error: "Customer price not found" });
      }
      res.json({ success: true });
    } catch (error) {
      if (error instanceof Error && error.message.includes("Invalid")) {
        return res.status(400).json({ error: error.message });
      }
      console.error("Error deleting customer price:", error);
      res.status(500).json({ error: "Failed to delete customer price" });
    }
  });

  // Sales endpoints (replaces Orders)
  app.get("/api/sales", isAdmin, async (req, res) => {
    try {
      const { customerId } = req.query;

      if (customerId && typeof customerId === 'string') {
        const id = parseIdParam(customerId, "customer ID");
        const sales = await storage.getSalesByCustomer(id);
        res.json(sales);
      } else {
        const sales = await storage.getSales();
        res.json(sales);
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("Invalid")) {
        return res.status(400).json({ error: error.message });
      }
      console.error("Error fetching sales:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ error: "Failed to fetch sales" });
    }
  });

  app.get("/api/sales/stats/:year", isAdmin, async (req, res) => {
    try {
      const year = parseYearParam(req.params.year);
      const stats = await storage.getSalesStats(year);
      res.json(stats);
    } catch (error) {
      if (error instanceof Error && error.message.includes("Invalid")) {
        return res.status(400).json({ error: error.message });
      }
      console.error("Error fetching sales stats:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ error: "Failed to fetch sales statistics" });
    }
  });

  app.get("/api/sales/:id", isAdmin, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id, "sale ID");
      const sale = await storage.getSale(id);
      if (!sale) {
        return res.status(404).json({ error: "Sale not found" });
      }
      res.json(sale);
    } catch (error) {
      if (error instanceof Error && error.message.includes("Invalid")) {
        return res.status(400).json({ error: error.message });
      }
      console.error("Error fetching sale:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ error: "Failed to fetch sale" });
    }
  });

  // Generate and download invoice PDF
  app.get("/api/sales/:id/invoice-pdf", isAdmin, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id, "sale ID");
      const sale = await storage.getSale(id);

      if (!sale) {
        return res.status(404).json({ error: "Sale not found" });
      }

      // Validate that the sale has an invoice number
      if (!sale.invoiceNumber) {
        return res.status(400).json({ error: "Sale does not have an invoice number" });
      }

      // Generate the PDF
      const pdfDoc = pdfInvoiceService.generateInvoice(sale);

      // Set response headers for PDF download
      // Extract year from sales date
      const salesYear = new Date(sale.salesDate).getFullYear();
      const filename = `Factuur_${salesYear}_${sale.invoiceNumber}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      // Pipe the PDF to the response
      pdfDoc.pipe(res);
    } catch (error) {
      if (error instanceof Error && error.message.includes("Invalid")) {
        return res.status(400).json({ error: error.message });
      }
      console.error("Error generating invoice PDF:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ error: "Failed to generate invoice PDF" });
    }
  });

  // Send invoice via email
  app.post("/api/sales/:id/send-invoice", isAdmin, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id, "sale ID");
      const { subject, body } = req.body;

      // Validate required fields
      if (!subject || !body) {
        return res.status(400).json({ error: "Subject and body are required" });
      }

      // Validate length to prevent abuse
      if (subject.length > 200) {
        return res.status(400).json({ error: "Subject too long (max 200 characters)" });
      }

      if (body.length > 5000) {
        return res.status(400).json({ error: "Email body too long (max 5000 characters)" });
      }

      // Get sale with customer info
      const sale = await storage.getSale(id);
      if (!sale || !sale.customer) {
        return res.status(404).json({ error: "Sale or customer not found" });
      }

      // Check if customer has email
      if (!sale.customer.email) {
        return res.status(400).json({ error: "Customer has no email address" });
      }

      // Validate that the sale has an invoice number
      if (!sale.invoiceNumber) {
        return res.status(400).json({ error: "Sale does not have an invoice number" });
      }

      // Get accounting email from parameters
      const accountingEmail = await parameterService.getParameter('accounting_email') || 'boekhouding@example.com';

      // Generate PDF invoice as buffer
      const pdfDoc = pdfInvoiceService.generateInvoice(sale);
      const chunks: Buffer[] = [];
      
      // Collect PDF data into buffer (stream is already ended by the service)
      const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
        pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
        pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
        pdfDoc.on('error', (err: Error) => reject(err));
      });

      // Send email using Resend connection
      const { client: resend, fromEmail } = await getResendClient();
      
      const salesYear = new Date(sale.salesDate).getFullYear();
      const filename = `Factuur_${salesYear}_${sale.invoiceNumber}.pdf`;

      await resend.emails.send({
        from: fromEmail,
        to: sale.customer.email,
        cc: accountingEmail,
        subject: subject,
        text: body, // Plain text email - prevents XSS attacks
        attachments: [
          {
            filename: filename,
            content: pdfBuffer,
          }
        ]
      });

      // Update sale status to INVOICED (creates stock movements if needed)
      await salesService.updateSaleStatus(id, 3, true); // 3 = INVOICED, true = create stock movements
      
      // Set uploadedAccounting flag
      await db
        .update(sales)
        .set({
          uploadedAccounting: true
        })
        .where(eq(sales.id, id));

      res.json({
        success: true,
        message: `Invoice sent to ${sale.customer.email} with CC to ${accountingEmail}`
      });

    } catch (error: any) {
      console.error("Error sending invoice:", error);
      const message = error instanceof Error ? error.message : "Failed to send invoice";
      res.status(500).json({ error: message });
    }
  });

  app.patch("/api/sales/:id/status", isAdmin, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id, "sale ID");
      const { statusId, createStockMovements } = req.body;

      const result = await salesService.updateSaleStatus(
        id, 
        statusId, 
        createStockMovements !== undefined ? createStockMovements : true
      );
      
      if (!result.sale) {
        return res.status(404).json({ error: "Sale not found" });
      }
      
      res.json(result);
    } catch (error) {
      // Return user-friendly error messages for business rule violations
      if (error instanceof Error) {
        console.error("Error updating sale status:", error.message);
        return res.status(400).json({ error: error.message });
      }
      console.error("Error updating sale status:", String(error));
      res.status(500).json({ error: "Failed to update sale status" });
    }
  });

  app.patch("/api/sales/:id", isAdmin, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id, "sale ID");
      const {
        customerId,
        salesDate,
        salesStatus,
        paymentMethod,
        webshopSale,
        stockUpdated,
        uploadedAccounting,
        shippingCostWithoutVat,
        shippingCostWithVat,
        discountPercentage,
        discountWithoutVat,
        discountWithVat,
        lineItems
      } = req.body;

      // Validate required fields
      if (!customerId || !salesDate || !salesStatus || !paymentMethod || !lineItems || lineItems.length === 0) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const result = await salesService.updateSale(id, {
        customerId,
        salesDate,
        salesStatus,
        paymentMethod,
        webshopSale,
        stockUpdated,
        uploadedAccounting,
        shippingCostWithoutVat,
        shippingCostWithVat,
        discountPercentage,
        discountWithoutVat,
        discountWithVat,
        lineItems,
      });

      res.json(result);
    } catch (error: any) {
      console.error("Error updating sale:", error);
      if (error.message === "Sale not found") {
        return res.status(404).json({ error: "Sale not found" });
      }
      const message = error instanceof Error ? error.message : "Failed to update sale";
      res.status(500).json({ error: message });
    }
  });

  app.delete("/api/sales/:id", isAdmin, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id, "sale ID");
      const deleted = await salesService.deleteSale(id);
      if (!deleted) {
        return res.status(404).json({ error: "Sale not found" });
      }
      res.json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete sale";
      res.status(500).json({ error: message });
    }
  });

  // Settings/Reference Data Management endpoints (admin only)
  
  // Suppliers
  app.get("/api/settings/suppliers", isAdmin, async (req, res) => {
    try {
      const suppliers = await storage.getSuppliers();
      res.json(suppliers);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      res.status(500).json({ error: "Failed to fetch suppliers" });
    }
  });

  app.post("/api/settings/suppliers", isAdmin, async (req, res) => {
    try {
      const supplier = await storage.createSupplier(req.body);
      res.status(201).json(supplier);
    } catch (error) {
      console.error("Error creating supplier:", error);
      res.status(500).json({ error: "Failed to create supplier" });
    }
  });

  app.patch("/api/settings/suppliers/:id", isAdmin, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id, "ID");
      const supplier = await storage.updateSupplier(id, req.body);
      if (!supplier) return res.status(404).json({ error: "Supplier not found" });
      res.json(supplier);
    } catch (error) {
      console.error("Error updating supplier:", error);
      res.status(500).json({ error: "Failed to update supplier" });
    }
  });

  app.delete("/api/settings/suppliers/:id", isAdmin, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id, "ID");
      const success = await storage.deleteSupplier(id);
      if (!success) return res.status(404).json({ error: "Supplier not found" });
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting supplier:", error);
      res.status(500).json({ error: "Failed to delete supplier" });
    }
  });

  // Supplier Orders
  app.get("/api/supplier-orders", isAdmin, async (req, res) => {
    try {
      const orders = await storage.getSupplierOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching supplier orders:", error);
      res.status(500).json({ error: "Failed to fetch supplier orders" });
    }
  });

  app.get("/api/supplier-orders/:id", isAdmin, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id, "supplier order ID");
      const order = await storage.getSupplierOrder(id);
      if (!order) return res.status(404).json({ error: "Supplier order not found" });
      res.json(order);
    } catch (error) {
      console.error("Error fetching supplier order:", error);
      res.status(500).json({ error: "Failed to fetch supplier order" });
    }
  });

  app.post("/api/supplier-orders", isAdmin, async (req, res) => {
    try {
      const order = await storage.createSupplierOrder(req.body);
      res.status(201).json(order);
    } catch (error) {
      console.error("Error creating supplier order:", error);
      res.status(500).json({ error: "Failed to create supplier order" });
    }
  });

  app.patch("/api/supplier-orders/:id", isAdmin, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id, "supplier order ID");
      const order = await storage.updateSupplierOrder(id, req.body);
      if (!order) return res.status(404).json({ error: "Supplier order not found" });
      res.json(order);
    } catch (error) {
      console.error("Error updating supplier order:", error);
      res.status(500).json({ error: "Failed to update supplier order" });
    }
  });

  app.delete("/api/supplier-orders/:id", isAdmin, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id, "supplier order ID");
      const success = await storage.deleteSupplierOrder(id);
      if (!success) return res.status(404).json({ error: "Supplier order not found" });
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting supplier order:", error);
      res.status(500).json({ error: "Failed to delete supplier order" });
    }
  });

  app.post("/api/supplier-orders/:id/confirm", isAdmin, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id, "supplier order ID");

      // Get the order with its lines
      const order = await storage.getSupplierOrder(id);
      if (!order) return res.status(404).json({ error: "Supplier order not found" });

      if (order.confirmed) {
        return res.status(400).json({ error: "Order is already confirmed" });
      }

      // Confirm the order
      const confirmedOrder = await storage.confirmSupplierOrder(id);
      if (!confirmedOrder) return res.status(500).json({ error: "Failed to confirm order" });

      // Create stock movements for each order line
      const stockMovements = await Promise.all(
        order.orderLines.map(async (line) => {
          return await storage.createStockMovement({
            productId: line.productId,
            quantity: line.quantity,
            date: new Date().toISOString().split('T')[0],
            reason: 2, // BUY reason
            orderId: id,
            remark: `Supplier order #${id} confirmed`,
          });
        })
      );

      res.json({ order: confirmedOrder, stockMovements });
    } catch (error) {
      console.error("Error confirming supplier order:", error);
      res.status(500).json({ error: "Failed to confirm supplier order" });
    }
  });

  // Supplier Order Lines
  app.get("/api/supplier-orders/:orderId/lines", isAdmin, async (req, res) => {
    try {
      const orderId = parseIdParam(req.params.orderId, "order ID");
      const lines = await storage.getSupplierOrderLines(orderId);
      res.json(lines);
    } catch (error) {
      console.error("Error fetching supplier order lines:", error);
      res.status(500).json({ error: "Failed to fetch supplier order lines" });
    }
  });

  app.post("/api/supplier-orders/:orderId/lines", isAdmin, async (req, res) => {
    try {
      const orderId = parseIdParam(req.params.orderId, "order ID");
      const line = await storage.createSupplierOrderLine({
        ...req.body,
        supplierOrderId: orderId,
      });
      res.status(201).json(line);
    } catch (error) {
      console.error("Error creating supplier order line:", error);
      res.status(500).json({ error: "Failed to create supplier order line" });
    }
  });

  app.patch("/api/supplier-order-lines/:id", isAdmin, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id, "line ID");
      const line = await storage.updateSupplierOrderLine(id, req.body);
      if (!line) return res.status(404).json({ error: "Supplier order line not found" });
      res.json(line);
    } catch (error) {
      console.error("Error updating supplier order line:", error);
      res.status(500).json({ error: "Failed to update supplier order line" });
    }
  });

  app.delete("/api/supplier-order-lines/:id", isAdmin, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id, "line ID");
      const success = await storage.deleteSupplierOrderLine(id);
      if (!success) return res.status(404).json({ error: "Supplier order line not found" });
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting supplier order line:", error);
      res.status(500).json({ error: "Failed to delete supplier order line" });
    }
  });

  // VAT Classes (public read-only endpoint for POS)
  app.get("/api/vat-classes", async (req, res) => {
    try {
      const vatClasses = await storage.getVatClasses();
      // Return only necessary fields (id, name, percentage) for POS
      const publicVatClasses = vatClasses.map(vc => ({
        id: vc.id,
        name: vc.name,
        percentage: vc.percentage
      }));
      res.json(publicVatClasses);
    } catch (error) {
      console.error("Error fetching VAT classes:", error);
      res.status(500).json({ error: "Failed to fetch VAT classes" });
    }
  });

  // VAT Classes (admin endpoints)
  app.get("/api/settings/vat-classes", isAdmin, async (req, res) => {
    try {
      const vatClasses = await storage.getVatClasses();
      res.json(vatClasses);
    } catch (error) {
      console.error("Error fetching VAT classes:", error);
      res.status(500).json({ error: "Failed to fetch VAT classes" });
    }
  });

  app.post("/api/settings/vat-classes", isAdmin, async (req, res) => {
    try {
      const vatClass = await storage.createVatClass(req.body);
      res.status(201).json(vatClass);
    } catch (error) {
      console.error("Error creating VAT class:", error);
      res.status(500).json({ error: "Failed to create VAT class" });
    }
  });

  app.patch("/api/settings/vat-classes/:id", isAdmin, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id, "ID");
      const vatClass = await storage.updateVatClass(id, req.body);
      if (!vatClass) return res.status(404).json({ error: "VAT class not found" });
      res.json(vatClass);
    } catch (error) {
      console.error("Error updating VAT class:", error);
      res.status(500).json({ error: "Failed to update VAT class" });
    }
  });

  app.delete("/api/settings/vat-classes/:id", isAdmin, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id, "ID");
      const success = await storage.deleteVatClass(id);
      if (!success) return res.status(404).json({ error: "VAT class not found" });
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting VAT class:", error);
      res.status(500).json({ error: "Failed to delete VAT class" });
    }
  });

  // Product Types
  app.get("/api/settings/product-types", isAdmin, async (req, res) => {
    try {
      const productTypes = await storage.getProductTypes();
      res.json(productTypes);
    } catch (error) {
      console.error("Error fetching product types:", error);
      res.status(500).json({ error: "Failed to fetch product types" });
    }
  });

  app.post("/api/settings/product-types", isAdmin, async (req, res) => {
    try {
      const productType = await storage.createProductType(req.body);
      res.status(201).json(productType);
    } catch (error) {
      console.error("Error creating product type:", error);
      res.status(500).json({ error: "Failed to create product type" });
    }
  });

  app.patch("/api/settings/product-types/:id", isAdmin, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id, "ID");
      const productType = await storage.updateProductType(id, req.body);
      if (!productType) return res.status(404).json({ error: "Product type not found" });
      res.json(productType);
    } catch (error) {
      console.error("Error updating product type:", error);
      res.status(500).json({ error: "Failed to update product type" });
    }
  });

  app.delete("/api/settings/product-types/:id", isAdmin, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id, "ID");
      const success = await storage.deleteProductType(id);
      if (!success) return res.status(404).json({ error: "Product type not found" });
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting product type:", error);
      res.status(500).json({ error: "Failed to delete product type" });
    }
  });

  // Product Type image upload
  app.post("/api/settings/product-types/:id/image", isAdmin, upload.single("image"), async (req, res) => {
    try {
      const id = parseIdParam(req.params.id, "ID");
      if (!req.file) return res.status(400).json({ error: "No image uploaded" });
      const ext = path.extname(req.file.originalname).toLowerCase();
      const objectName = `images/categories/category-${id}${ext}`;
      const imageUrl = await uploadToGCS(req.file.buffer, objectName, req.file.mimetype);
      const productType = await storage.updateProductType(id, { imageUrl } as any);
      if (!productType) return res.status(404).json({ error: "Product type not found" });
      res.json(productType);
    } catch (error: any) {
      console.error("Error uploading category image:", error);
      res.status(500).json({ error: "Failed to upload category image" });
    }
  });

  // Announcements CRUD (admin)
  app.get("/api/settings/announcements", isAdmin, async (req, res) => {
    try {
      const items = await storage.getAnnouncements();
      res.json(items);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      res.status(500).json({ error: "Failed to fetch announcements" });
    }
  });

  app.post("/api/settings/announcements", isAdmin, async (req, res) => {
    try {
      const announcement = await storage.createAnnouncement(req.body);
      res.status(201).json(announcement);
    } catch (error) {
      console.error("Error creating announcement:", error);
      res.status(500).json({ error: "Failed to create announcement" });
    }
  });

  app.patch("/api/settings/announcements/:id", isAdmin, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id, "ID");
      const announcement = await storage.updateAnnouncement(id, req.body);
      if (!announcement) return res.status(404).json({ error: "Announcement not found" });
      res.json(announcement);
    } catch (error) {
      console.error("Error updating announcement:", error);
      res.status(500).json({ error: "Failed to update announcement" });
    }
  });

  app.delete("/api/settings/announcements/:id", isAdmin, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id, "ID");
      const success = await storage.deleteAnnouncement(id);
      if (!success) return res.status(404).json({ error: "Announcement not found" });
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting announcement:", error);
      res.status(500).json({ error: "Failed to delete announcement" });
    }
  });

  // Grind Sizes — GET is isAuthenticated so POS can read it; mutations are admin-only
  app.get("/api/settings/grind-sizes", isAuthenticated, async (req, res) => {
    try {
      const sizes = await storage.getGrindSizes();
      res.json(sizes);
    } catch (error) {
      console.error("Error fetching grind sizes:", error);
      res.status(500).json({ error: "Failed to fetch grind sizes" });
    }
  });

  app.post("/api/settings/grind-sizes", isAdmin, async (req, res) => {
    try {
      const validatedData = insertGrindSizeSchema.parse(req.body);
      const grindSize = await storage.createGrindSize(validatedData);
      res.status(201).json(grindSize);
    } catch (error) {
      console.error("Error creating grind size:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ error: "Failed to create grind size" });
    }
  });

  app.patch("/api/settings/grind-sizes/:id", isAdmin, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id, "ID");
      const grindSize = await storage.updateGrindSize(id, req.body);
      if (!grindSize) return res.status(404).json({ error: "Grind size not found" });
      res.json(grindSize);
    } catch (error) {
      console.error("Error updating grind size:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ error: "Failed to update grind size" });
    }
  });

  app.delete("/api/settings/grind-sizes/:id", isAdmin, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id, "ID");
      await storage.deleteGrindSize(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting grind size:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ error: "Failed to delete grind size" });
    }
  });

  // ==================== FREE SHIPPING POSTAL CODES ====================

  app.get("/api/settings/free-shipping-postal-codes", isAuthenticated, async (req, res) => {
    try {
      const codes = await storage.getFreeShippingPostalCodes();
      res.json(codes);
    } catch (error) {
      console.error("Error fetching free shipping postal codes:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ error: "Failed to fetch free shipping postal codes" });
    }
  });

  app.post("/api/settings/free-shipping-postal-codes", isAdmin, async (req, res) => {
    try {
      const validatedData = insertFreeShippingPostalCodeSchema.parse(req.body);
      const code = await storage.createFreeShippingPostalCode(validatedData);
      res.status(201).json(code);
    } catch (error) {
      console.error("Error creating free shipping postal code:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ error: "Failed to create free shipping postal code" });
    }
  });

  app.delete("/api/settings/free-shipping-postal-codes/:id", isAdmin, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id, "ID");
      await storage.deleteFreeShippingPostalCode(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting free shipping postal code:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ error: "Failed to delete free shipping postal code" });
    }
  });

  // ==================== SHIPPING PARAMETERS ====================

  app.get("/api/settings/shipping-params", isAdmin, async (req, res) => {
    try {
      const threshold = await parameterService.getParameter("free_shipping_threshold_incl_vat") || "100";
      res.json({ freeShippingThreshold: threshold });
    } catch (error) {
      console.error("Error fetching shipping params:", error);
      res.status(500).json({ error: "Failed to fetch shipping params" });
    }
  });

  app.post("/api/settings/shipping-params", isAdmin, async (req, res) => {
    try {
      const { freeShippingThreshold } = req.body;
      if (freeShippingThreshold !== undefined) {
        await parameterService.setParameter("free_shipping_threshold_incl_vat", String(freeShippingThreshold));
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating shipping params:", error);
      res.status(500).json({ error: "Failed to update shipping params" });
    }
  });

  // Product Subtypes
  app.get("/api/settings/product-subtypes", isAdmin, async (req, res) => {
    try {
      const productSubtypes = await storage.getProductSubtypes();
      res.json(productSubtypes);
    } catch (error) {
      console.error("Error fetching product subtypes:", error);
      res.status(500).json({ error: "Failed to fetch product subtypes" });
    }
  });

  app.post("/api/settings/product-subtypes", isAdmin, async (req, res) => {
    try {
      const productSubtype = await storage.createProductSubtype(req.body);
      res.status(201).json(productSubtype);
    } catch (error) {
      console.error("Error creating product subtype:", error);
      res.status(500).json({ error: "Failed to create product subtype" });
    }
  });

  app.patch("/api/settings/product-subtypes/:id", isAdmin, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id, "ID");
      const productSubtype = await storage.updateProductSubtype(id, req.body);
      if (!productSubtype) return res.status(404).json({ error: "Product subtype not found" });
      res.json(productSubtype);
    } catch (error) {
      console.error("Error updating product subtype:", error);
      res.status(500).json({ error: "Failed to update product subtype" });
    }
  });

  app.delete("/api/settings/product-subtypes/:id", isAdmin, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id, "ID");
      const success = await storage.deleteProductSubtype(id);
      if (!success) return res.status(404).json({ error: "Product subtype not found" });
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting product subtype:", error);
      res.status(500).json({ error: "Failed to delete product subtype" });
    }
  });

  // Product Units
  app.get("/api/settings/product-units", isAdmin, async (req, res) => {
    try {
      const productUnits = await storage.getProductUnits();
      res.json(productUnits);
    } catch (error) {
      console.error("Error fetching product units:", error);
      res.status(500).json({ error: "Failed to fetch product units" });
    }
  });

  app.post("/api/settings/product-units", isAdmin, async (req, res) => {
    try {
      const productUnit = await storage.createProductUnit(req.body);
      res.status(201).json(productUnit);
    } catch (error) {
      console.error("Error creating product unit:", error);
      res.status(500).json({ error: "Failed to create product unit" });
    }
  });

  app.patch("/api/settings/product-units/:id", isAdmin, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id, "ID");
      const productUnit = await storage.updateProductUnit(id, req.body);
      if (!productUnit) return res.status(404).json({ error: "Product unit not found" });
      res.json(productUnit);
    } catch (error) {
      console.error("Error updating product unit:", error);
      res.status(500).json({ error: "Failed to update product unit" });
    }
  });

  app.delete("/api/settings/product-units/:id", isAdmin, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id, "ID");
      const success = await storage.deleteProductUnit(id);
      if (!success) return res.status(404).json({ error: "Product unit not found" });
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting product unit:", error);
      res.status(500).json({ error: "Failed to delete product unit" });
    }
  });

  // Product Locations
  app.get("/api/settings/product-locations", isAdmin, async (req, res) => {
    try {
      const productLocations = await storage.getProductLocations();
      res.json(productLocations);
    } catch (error) {
      console.error("Error fetching product locations:", error);
      res.status(500).json({ error: "Failed to fetch product locations" });
    }
  });

  app.post("/api/settings/product-locations", isAdmin, async (req, res) => {
    try {
      const productLocation = await storage.createProductLocation(req.body);
      res.status(201).json(productLocation);
    } catch (error) {
      console.error("Error creating product location:", error);
      res.status(500).json({ error: "Failed to create product location" });
    }
  });

  app.patch("/api/settings/product-locations/:id", isAdmin, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id, "ID");
      const productLocation = await storage.updateProductLocation(id, req.body);
      if (!productLocation) return res.status(404).json({ error: "Product location not found" });
      res.json(productLocation);
    } catch (error) {
      console.error("Error updating product location:", error);
      res.status(500).json({ error: "Failed to update product location" });
    }
  });

  app.delete("/api/settings/product-locations/:id", isAdmin, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id, "ID");
      const success = await storage.deleteProductLocation(id);
      if (!success) return res.status(404).json({ error: "Product location not found" });
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting product location:", error);
      res.status(500).json({ error: "Failed to delete product location" });
    }
  });

  // Product Item Statuses (Inventory Statuses)
  app.get("/api/settings/product-statuses", isAdmin, async (req, res) => {
    try {
      const productItemStatuses = await storage.getProductItemStatuses();
      res.json(productItemStatuses);
    } catch (error) {
      console.error("Error fetching product item statuses:", error);
      res.status(500).json({ error: "Failed to fetch product item statuses" });
    }
  });

  app.post("/api/settings/product-statuses", isAdmin, async (req, res) => {
    try {
      const productItemStatus = await storage.createProductItemStatus(req.body);
      res.status(201).json(productItemStatus);
    } catch (error) {
      console.error("Error creating product item status:", error);
      res.status(500).json({ error: "Failed to create product item status" });
    }
  });

  app.patch("/api/settings/product-statuses/:id", isAdmin, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id, "ID");
      // Protect system critical statuses (ID 1 and 2) from ID changes
      if (req.body.id && req.body.id !== id) {
        return res.status(400).json({ error: "Cannot change product item status ID" });
      }
      const productItemStatus = await storage.updateProductItemStatus(id, req.body);
      if (!productItemStatus) return res.status(404).json({ error: "Product item status not found" });
      res.json(productItemStatus);
    } catch (error) {
      console.error("Error updating product item status:", error);
      res.status(500).json({ error: "Failed to update product item status" });
    }
  });

  app.delete("/api/settings/product-statuses/:id", isAdmin, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id, "ID");
      // Protect system critical statuses (ID 1 and 2) from deletion
      if (id === 1 || id === 2) {
        return res.status(400).json({ error: "Cannot delete system critical product item status" });
      }
      const success = await storage.deleteProductItemStatus(id);
      if (!success) return res.status(404).json({ error: "Product item status not found" });
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting product item status:", error);
      res.status(500).json({ error: "Failed to delete product item status" });
    }
  });

  // Green Roasted Coffee Configurations
  app.get("/api/settings/roast-configurations", isAdmin, async (req, res) => {
    try {
      const configs = await storage.getGreenRoastedCoffees();
      res.json(configs);
    } catch (error) {
      console.error("Error fetching roast configurations:", error);
      res.status(500).json({ error: "Failed to fetch roast configurations" });
    }
  });

  app.post("/api/settings/roast-configurations", isAdmin, async (req, res) => {
    try {
      const validatedData = insertGreenRoastedCoffeeSchema.parse(req.body);
      const config = await storage.createGreenRoastedCoffee(validatedData);
      res.status(201).json(config);
    } catch (error) {
      console.error("Error creating roast configuration:", error);
      res.status(500).json({ error: "Failed to create roast configuration" });
    }
  });

  app.patch("/api/settings/roast-configurations/:id", isAdmin, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id, "ID");
      const validatedData = insertGreenRoastedCoffeeSchema.partial().parse(req.body);
      const config = await storage.updateGreenRoastedCoffee(id, validatedData);
      if (!config) return res.status(404).json({ error: "Roast configuration not found" });
      res.json(config);
    } catch (error) {
      console.error("Error updating roast configuration:", error);
      res.status(500).json({ error: "Failed to update roast configuration" });
    }
  });

  app.delete("/api/settings/roast-configurations/:id", isAdmin, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id, "ID");
      const success = await storage.deleteGreenRoastedCoffee(id);
      if (!success) return res.status(404).json({ error: "Roast configuration not found" });
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting roast configuration:", error);
      res.status(500).json({ error: "Failed to delete roast configuration" });
    }
  });

  // Roasts - Coffee roasting tracking
  app.get("/api/roasts", isAdmin, async (req, res) => {
    try {
      const roasts = await storage.getRoasts();
      res.json(roasts);
    } catch (error) {
      console.error("Error fetching roasts:", error);
      res.status(500).json({ error: "Failed to fetch roasts" });
    }
  });

  app.get("/api/roasts/:id", isAdmin, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id, "roast ID");
      const roast = await storage.getRoast(id);
      if (!roast) return res.status(404).json({ error: "Roast not found" });
      res.json(roast);
    } catch (error) {
      console.error("Error fetching roast:", error);
      res.status(500).json({ error: "Failed to fetch roast" });
    }
  });

  app.post("/api/roasts", isAdmin, async (req, res) => {
    try {
      const validatedData = insertRoastSchema.parse(req.body);
      const roast = await roastService.createRoast(validatedData);
      res.status(201).json(roast);
    } catch (error) {
      console.error("Error creating roast:", error);
      const message = error instanceof Error ? error.message : "Failed to create roast";
      res.status(500).json({ error: message });
    }
  });

  app.patch("/api/roasts/:id", isAdmin, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id, "roast ID");
      const validatedData = insertRoastSchema.partial().parse(req.body);
      const roast = await roastService.updateRoast(id, validatedData);
      if (!roast) return res.status(404).json({ error: "Roast not found" });
      res.json(roast);
    } catch (error) {
      console.error("Error updating roast:", error);
      const message = error instanceof Error ? error.message : "Failed to update roast";
      res.status(500).json({ error: message });
    }
  });

  app.delete("/api/roasts/:id", isAdmin, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id, "roast ID");
      const success = await roastService.deleteRoast(id);
      if (!success) return res.status(404).json({ error: "Roast not found" });
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting roast:", error);
      const message = error instanceof Error ? error.message : "Failed to delete roast";
      res.status(500).json({ error: message });
    }
  });

  // Payment Methods
  app.get("/api/settings/payment-methods", isAdmin, async (req, res) => {
    try {
      const paymentMethods = await storage.getPaymentMethods();
      res.json(paymentMethods);
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      res.status(500).json({ error: "Failed to fetch payment methods" });
    }
  });

  // Sales Statuses
  app.get("/api/settings/sales-statuses", isAdmin, async (req, res) => {
    try {
      const salesStatuses = await storage.getSalesStatuses();
      res.json(salesStatuses);
    } catch (error) {
      console.error("Error fetching sales statuses:", error);
      res.status(500).json({ error: "Failed to fetch sales statuses" });
    }
  });

  // Sales Prices - Get active sales prices for products
  app.get("/api/sales-prices", isAdmin, async (req, res) => {
    try {
      const prices = await salesPriceService.getActivePrices();
      res.json(prices);
    } catch (error) {
      console.error("Error fetching sales prices:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ error: "Failed to fetch sales prices" });
    }
  });

  // Get next invoice number
  app.get("/api/invoice-number/next", isAdmin, async (req, res) => {
    try {
      const nextNumber = await invoiceService.getNextInvoiceNumber();
      const currentYear = await parameterService.getCurrentYear();

      res.json({
        year: currentYear,
        nextNumber: nextNumber,
        formattedNumber: `${nextNumber}`
      });
    } catch (error) {
      console.error("Error fetching next invoice number:", error);
      const message = error instanceof Error ? error.message : "Failed to fetch next invoice number";
      res.status(500).json({ error: message });
    }
  });

  // Create Sale (Invoice)
  app.post("/api/sales", isAdmin, async (req, res) => {
    try {
      const {
        customerId,
        salesDate,
        salesStatus,
        paymentMethod,
        webshopSale,
        shippingCostWithoutVat,
        shippingCostWithVat,
        discountPercentage,
        discountWithoutVat,
        discountWithVat,
        lineItems,
        requiresInvoiceNumber
      } = req.body;

      // Validate required fields
      if (!customerId || !salesDate || !salesStatus || !paymentMethod || !lineItems || lineItems.length === 0) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const sale = await salesService.createSale({
        customerId,
        salesDate,
        salesStatus,
        paymentMethod,
        webshopSale,
        shippingCostWithoutVat,
        shippingCostWithVat,
        discountPercentage,
        discountWithoutVat,
        discountWithVat,
        lineItems,
        requiresInvoiceNumber: requiresInvoiceNumber ?? false,
      });

      res.status(201).json(sale);
    } catch (error) {
      console.error("Error creating sale:", error);
      const message = error instanceof Error ? error.message : "Failed to create sale";
      res.status(500).json({ error: message });
    }
  });

  // Stock Movement Reasons endpoint
  app.get("/api/stock-movement-reasons", isAdmin, async (req, res) => {
    try {
      
      const reasons = await db
        .select()
        .from(stockMovementReasons)
        .orderBy(stockMovementReasons.reason);
      
      res.json(reasons);
    } catch (error) {
      console.error("Error fetching stock movement reasons:", error);
      res.status(500).json({ error: "Failed to fetch stock movement reasons" });
    }
  });

  // Stock Movements endpoints
  app.get("/api/stock-movements", isAdmin, async (req, res) => {
    try {
      const sqlFn = sql;
      
      const year = req.query.year ? parseInt(req.query.year as string) : null;
      const search = req.query.search as string;
      const productId = req.query.productId ? parseInt(req.query.productId as string) : null;
      
      let conditions = [];
      
      if (year) {
        conditions.push(sqlFn`EXTRACT(YEAR FROM ${stockMovements.date}) = ${year}`);
      }
      
      if (productId) {
        conditions.push(eq(stockMovements.productId, productId));
      }
      
      const movements = await db
        .select({
          id: stockMovements.id,
          productId: stockMovements.productId,
          productName: products.name,
          date: stockMovements.date,
          quantity: stockMovements.quantity,
          reasonId: stockMovements.reason,
          reasonName: stockMovementReasons.reason,
          remark: stockMovements.remark,
          saleId: stockMovements.saleId,
          orderId: stockMovements.orderId,
          roastId: stockMovements.roastId,
        })
        .from(stockMovements)
        .leftJoin(products, eq(stockMovements.productId, products.id))
        .leftJoin(stockMovementReasons, eq(stockMovements.reason, stockMovementReasons.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(stockMovements.date), desc(stockMovements.id));
      
      // Apply search filter in memory if provided
      let filteredMovements = movements;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredMovements = movements.filter(m => 
          m.productName?.toLowerCase().includes(searchLower) ||
          m.reasonName?.toLowerCase().includes(searchLower) ||
          m.remark?.toLowerCase().includes(searchLower)
        );
      }
      
      res.json(filteredMovements);
    } catch (error) {
      console.error("Error fetching stock movements:", error);
      res.status(500).json({ error: "Failed to fetch stock movements" });
    }
  });

  app.get("/api/products/:id/stock-movements", isAdmin, async (req, res) => {
    try {
      const productId = parseIdParam(req.params.id, "product ID");
      const stats = await stockMovementService.getProductStockStats(productId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching product stock movements:", error);
      const message = error instanceof Error ? error.message : "Failed to fetch product stock movements";
      res.status(500).json({ error: message });
    }
  });

  // Get available years for stock movements (for year filter dropdown)
  app.get("/api/stock-movements/years", isAdmin, async (req, res) => {
    try {
      const sqlFn = sql;
      
      const productId = req.query.productId ? parseInt(req.query.productId as string) : null;
      
      let query = db
        .selectDistinct({
          year: sqlFn<number>`EXTRACT(YEAR FROM ${stockMovements.date})::integer`,
        })
        .from(stockMovements);
      
      if (productId) {
        query = query.where(eq(stockMovements.productId, productId)) as typeof query;
      }
      
      const years = await query;
      const sortedYears = years.map(y => y.year).sort((a, b) => b - a);
      
      res.json(sortedYears);
    } catch (error) {
      console.error("Error fetching stock movement years:", error);
      res.status(500).json({ error: "Failed to fetch stock movement years" });
    }
  });

  app.get("/api/stock-movements/:id", isAdmin, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id, "stock movement ID");
      
      const [movement] = await db
        .select()
        .from(stockMovements)
        .where(eq(stockMovements.id, id));
      
      if (!movement) {
        return res.status(404).json({ error: "Stock movement not found" });
      }
      
      res.json(movement);
    } catch (error) {
      console.error("Error fetching stock movement:", error);
      res.status(500).json({ error: "Failed to fetch stock movement" });
    }
  });

  app.post("/api/stock-movements", isAdmin, async (req, res) => {
    try {
      // Convert quantity to string if it's a number (schema expects string for decimal)
      const body = { ...req.body };
      if (typeof body.quantity === 'number') {
        body.quantity = String(body.quantity);
      }

      const validatedData = insertStockMovementSchema.parse(body);
      const movement = await stockMovementService.createMovement(validatedData);
      res.status(201).json(movement);
    } catch (error) {
      console.error("Error creating stock movement:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ error: "Failed to create stock movement" });
    }
  });

  app.put("/api/stock-movements/:id", isAdmin, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id, "stock movement ID");
      
      // Convert quantity to string if it's a number (schema expects string for decimal)
      const body = { ...req.body };
      if (typeof body.quantity === 'number') {
        body.quantity = String(body.quantity);
      }
      
      const validatedData = insertStockMovementSchema.partial().parse(body);
      
      const [movement] = await db
        .update(stockMovements)
        .set(validatedData)
        .where(eq(stockMovements.id, id))
        .returning();
      
      if (!movement) {
        return res.status(404).json({ error: "Stock movement not found" });
      }
      
      res.json(movement);
    } catch (error) {
      console.error("Error updating stock movement:", error);
      res.status(500).json({ error: "Failed to update stock movement" });
    }
  });

  app.delete("/api/stock-movements/:id", isAdmin, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id, "stock movement ID");

      const [deleted] = await db
        .delete(stockMovements)
        .where(eq(stockMovements.id, id))
        .returning();

      if (!deleted) {
        return res.status(404).json({ error: "Stock movement not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting stock movement:", error);
      res.status(500).json({ error: "Failed to delete stock movement" });
    }
  });

  // ==================== COUNTING SESSIONS ENDPOINTS ====================

  // Get all counting sessions (with optional status filter)
  app.get("/api/counting-sessions", isAdmin, async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const sessions = await countingSessionService.getAllSessions(status);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching counting sessions:", error);
      res.status(500).json({ error: "Failed to fetch counting sessions" });
    }
  });

  // Get a single counting session by ID
  app.get("/api/counting-sessions/:id", isAdmin, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id, "counting session ID");
      const session = await countingSessionService.getSessionById(id);

      if (!session) {
        return res.status(404).json({ error: "Counting session not found" });
      }

      res.json(session);
    } catch (error) {
      console.error("Error fetching counting session:", error);
      res.status(500).json({ error: "Failed to fetch counting session" });
    }
  });

  // Create a new counting session
  app.post("/api/counting-sessions", isAdmin, async (req: any, res) => {
    try {

      // Validate request body
      const validatedData = insertCountingSessionSchema.parse({
        sessionName: req.body.sessionName,
        startedBy: req.user.id, // Use authenticated user ID
        notes: req.body.notes,
      });

      const session = await countingSessionService.createSession(validatedData);
      res.status(201).json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation error:", error.errors);
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating counting session:", error);
      res.status(500).json({ error: "Failed to create counting session" });
    }
  });

  // Update a counting session
  app.put("/api/counting-sessions/:id", isAdmin, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id, "counting session ID");

      // Validate partial update data
      const validatedData = insertCountingSessionSchema.partial().parse(req.body);

      const session = await countingSessionService.updateSession(id, validatedData);
      res.json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error updating counting session:", error);
      res.status(500).json({ error: "Failed to update counting session" });
    }
  });

  // Complete a counting session
  app.post("/api/counting-sessions/:id/complete", isAdmin, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id, "counting session ID");
      const session = await countingSessionService.completeSession(id);
      res.json(session);
    } catch (error) {
      console.error("Error completing counting session:", error);
      res.status(500).json({ error: "Failed to complete counting session" });
    }
  });

  // Finalize a counting session (Story 4)
  app.post("/api/counting-sessions/:id/finalize", isAdmin, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id, "counting session ID");
      const session = await countingSessionService.finalizeSession(id);
      res.json(session);
    } catch (error) {
      console.error("Error finalizing counting session:", error);
      const message = error instanceof Error ? error.message : "Failed to finalize counting session";
      res.status(500).json({ error: message });
    }
  });

  // Cancel a counting session
  app.post("/api/counting-sessions/:id/cancel", isAdmin, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id, "counting session ID");
      const session = await countingSessionService.cancelSession(id);
      res.json(session);
    } catch (error) {
      console.error("Error cancelling counting session:", error);
      res.status(500).json({ error: "Failed to cancel counting session" });
    }
  });

  // Get count of open sessions
  app.get("/api/counting-sessions-stats/open-count", isAdmin, async (req, res) => {
    try {
      const count = await countingSessionService.getOpenSessionsCount();
      res.json({ count });
    } catch (error) {
      console.error("Error fetching open sessions count:", error);
      res.status(500).json({ error: "Failed to fetch open sessions count" });
    }
  });

  // ==================== COUNTING SESSION RECORDS ENDPOINTS ====================

  // Get product packaging units (Story 2: Dynamic Unit Loading)
  app.get("/api/products/:id/packaging-units", isAdmin, async (req, res) => {
    try {
      const productId = parseIdParam(req.params.id, "product ID");
      const units = await countingSessionService.getProductPackagingUnits(productId);
      res.json(units);
    } catch (error) {
      console.error("Error fetching product packaging units:", error);
      res.status(500).json({ error: "Failed to fetch product packaging units" });
    }
  });

  // Get all product locations (for counting dialog dropdown)
  app.get("/api/product-locations", isAdmin, async (req, res) => {
    try {
      const productLocations = await storage.getProductLocations();
      res.json(productLocations);
    } catch (error) {
      console.error("Error fetching product locations:", error);
      res.status(500).json({ error: "Failed to fetch product locations" });
    }
  });

  // Get all product items (physical inventory)
  app.get("/api/counting-sessions/:id/records", isAdmin, async (req, res) => {
    try {
      const sessionId = parseIdParam(req.params.id, "counting session ID");
      const items = await countingSessionService.getSessionRecords(sessionId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching product items:", error);
      res.status(500).json({ error: "Failed to fetch product items" });
    }
  });

  // Create/update product item (Story 2: Multi-Unit Entry)
  app.post("/api/counting-sessions/:id/records", isAdmin, async (req: any, res) => {
    try {
      const sessionId = parseIdParam(req.params.id, "counting session ID");

      // Validate required fields
      if (!req.body.productId) {
        return res.status(400).json({ error: "Product ID is required" });
      }
      if (!req.body.locationId) {
        return res.status(400).json({ error: "Location ID is required" });
      }
      if (req.body.countedQuantity === undefined || req.body.countedQuantity === null) {
        return res.status(400).json({ error: "Counted quantity is required" });
      }
      if (!req.body.inventoryStatus) {
        return res.status(400).json({ error: "Inventory status is required" });
      }

      // Convert inventoryStatus to statusId (in_stock -> 2, in_use -> 1)
      const statusId = req.body.inventoryStatus === "in_stock" ? 2 : 1;

      // Create session record
      const record = await countingSessionService.createSessionRecord({
        sessionId: sessionId,
        productId: req.body.productId,
        countedQuantity: req.body.countedQuantity,
        inventoryStatus: req.body.inventoryStatus,
        statusId: statusId,
        locationId: req.body.locationId,
        expiryDate: req.body.dueDate || null,
        batchNumber: req.body.notes || null,
      });
      res.status(201).json(record);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Zod validation error:", error.errors);
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating product item:", error);
      res.status(500).json({ error: "Failed to create product item" });
    }
  });

  // Update a product item
  app.put("/api/counting-session-records/:id", isAdmin, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id, "product item ID");

      // Build update data object
      const updateData: {
        quantity?: number;
        statusId?: number;
        expiryDate?: string | null;
        batchNumber?: string | null;
      } = {};

      if (req.body.countedQuantity !== undefined) {
        updateData.quantity = req.body.countedQuantity;
      }
      if (req.body.inventoryStatus !== undefined) {
        updateData.statusId = req.body.inventoryStatus === "in_stock" ? 2 : 1;
      }
      if (req.body.dueDate !== undefined) {
        updateData.expiryDate = req.body.dueDate || null;
      }
      if (req.body.notes !== undefined) {
        updateData.batchNumber = req.body.notes || null;
      }

      const record = await countingSessionService.updateProductItem(id, {
        countedQuantity: updateData.quantity,
        statusId: updateData.statusId,
        locationId: req.body.locationId,
        expiryDate: updateData.expiryDate,
        batchNumber: updateData.batchNumber,
      });
      res.json(record);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error updating product item:", error);
      res.status(500).json({ error: "Failed to update product item" });
    }
  });

  // Delete a product item
  app.delete("/api/counting-session-records/:id", isAdmin, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id, "product item ID");
      await countingSessionService.deleteProductItem(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting product item:", error);
      res.status(500).json({ error: "Failed to delete product item" });
    }
  });

  // Get total counted quantity for a product (across all locations/statuses)
  app.get("/api/counting-sessions/:sessionId/products/:productId/total", isAdmin, async (req, res) => {
    try {
      const sessionId = parseIdParam(req.params.sessionId, "counting session ID");
      const productId = parseIdParam(req.params.productId, "product ID");
      const total = await countingSessionService.getProductTotalQuantity(productId, sessionId);
      res.json({ total });
    } catch (error) {
      console.error("Error fetching product total:", error);
      res.status(500).json({ error: "Failed to fetch product total" });
    }
  });

  // ==================== VARIANCE ANALYSIS ENDPOINTS (Story 3) ====================

  // Get variance analysis for a counting session
  app.get("/api/counting-sessions/:id/variance-analysis", isAdmin, async (req, res) => {
    try {
      const sessionId = parseIdParam(req.params.id, "counting session ID");
      const analysis = await countingSessionService.getSessionVarianceAnalysis(sessionId);
      res.json(analysis);
    } catch (error) {
      console.error("Error fetching variance analysis:", error);
      res.status(500).json({ error: "Failed to fetch variance analysis" });
    }
  });

  // Get variance for a specific product in a session
  app.get("/api/counting-sessions/:sessionId/products/:productId/variance", isAdmin, async (req, res) => {
    try {
      const sessionId = parseIdParam(req.params.sessionId, "counting session ID");
      const productId = parseIdParam(req.params.productId, "product ID");
      const variance = await countingSessionService.getProductVarianceInSession(sessionId, productId);
      res.json(variance);
    } catch (error) {
      console.error("Error fetching product variance:", error);
      res.status(500).json({ error: "Failed to fetch product variance" });
    }
  });

  // Get expected stock for a product (real-time from stock_movements)
  app.get("/api/products/:id/expected-stock", isAdmin, async (req, res) => {
    try {
      const productId = parseIdParam(req.params.id, "product ID");
      const expectedStock = await countingSessionService.getExpectedStock(productId);
      res.json({ expectedStock });
    } catch (error) {
      console.error("Error fetching expected stock:", error);
      res.status(500).json({ error: "Failed to fetch expected stock" });
    }
  });

  // ==================== POS ENDPOINTS ====================

  // Get POS products with variants
  app.get("/api/pos/products", isAuthenticated, async (req, res) => {
    try {
      const customerId = req.query.customerId ? parseInt(req.query.customerId as string) : undefined;
      const products = await posService.getPOSProducts(customerId);
      res.json(products);
    } catch (error) {
      console.error("Error fetching POS products:", error);
      const message = error instanceof Error ? error.message : "Failed to fetch POS products";
      res.status(500).json({ error: message });
    }
  });

  // Get product variants
  app.get("/api/pos/products/:id/variants", isAuthenticated, async (req, res) => {
    try {
      const productId = parseIdParam(req.params.id, "product ID");
      const customerId = req.query.customerId ? parseIdParam(req.query.customerId as string, "customer ID") : undefined;
      const variants = await posService.getProductVariants(productId, customerId);
      res.json(variants);
    } catch (error) {
      console.error("Error fetching product variants:", error);
      const message = error instanceof Error ? error.message : "Failed to fetch product variants";
      res.status(500).json({ error: message });
    }
  });

  // Search customers
  app.get("/api/pos/customers/search", isAuthenticated, async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.length < 2) {
        return res.json([]);
      }
      const customers = await posService.searchCustomers(query);
      res.json(customers);
    } catch (error) {
      console.error("Error searching customers:", error);
      const message = error instanceof Error ? error.message : "Failed to search customers";
      res.status(500).json({ error: message });
    }
  });

  // Get guest customer
  app.get("/api/pos/customers/guest", isAuthenticated, async (req, res) => {
    try {
      const guest = await posService.getGuestCustomer();
      res.json(guest);
    } catch (error) {
      console.error("Error fetching guest customer:", error);
      const message = error instanceof Error ? error.message : "Failed to fetch guest customer";
      res.status(404).json({ error: message });
    }
  });

  // Quick register customer
  app.post("/api/pos/customers/register", isAuthenticated, async (req, res) => {
    try {
      const { firstName, lastName, email, birthday } = req.body;

      // Validation
      if (!firstName || !lastName || !email || !birthday) {
        return res.status(400).json({ error: "All fields are required" });
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }

      const customer = await posService.registerCustomer({
        firstName,
        lastName,
        email,
        birthday,
      });

      res.status(201).json(customer);
    } catch (error) {
      console.error("Error registering customer:", error);
      const message = error instanceof Error ? error.message : "Failed to register customer";
      res.status(500).json({ error: message });
    }
  });

  // Create POS sale
  app.post("/api/pos/sales", isAuthenticated, async (req, res) => {
    try {
      const { customerId, items, discount, payments } = req.body;

      // Validation
      if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Invalid sale data: customerId and items are required" });
      }

      if (!payments || !Array.isArray(payments) || payments.length === 0) {
        return res.status(400).json({ error: "At least one payment method is required" });
      }

      // Validate payment total matches sale total
      const itemsTotal = items.reduce((sum, item) => {
        return sum + (parseFloat(item.unitPriceWithVat) * item.amount);
      }, 0);

      let discountAmount = 0;
      if (discount) {
        if (discount.type === 'percentage') {
          discountAmount = itemsTotal * (discount.value / 100);
        } else {
          discountAmount = discount.value;
        }
      }

      const expectedTotal = itemsTotal - discountAmount;
      const paymentsTotal = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

      if (Math.abs(expectedTotal - paymentsTotal) > 0.01) {
        return res.status(400).json({
          error: "Payment total does not match sale total",
          expected: expectedTotal.toFixed(2),
          received: paymentsTotal.toFixed(2),
        });
      }

      const result = await posService.createPOSSale({
        customerId,
        items,
        discount,
        payments,
      });

      res.status(201).json(result);
    } catch (error) {
      console.error("Error creating POS sale:", error);
      const message = error instanceof Error ? error.message : "Failed to create POS sale";
      res.status(500).json({ error: message });
    }
  });

  // Get receipt
  app.get("/api/pos/sales/:id/receipt", isAuthenticated, async (req, res) => {
    try {
      const saleId = parseIdParam(req.params.id, "sale ID");
      const receipt = await posService.getReceipt(saleId);
      res.json(receipt);
    } catch (error) {
      console.error("Error fetching receipt:", error);
      const message = error instanceof Error ? error.message : "Failed to fetch receipt";
      if (message.includes('not found')) {
        return res.status(404).json({ error: message });
      }
      res.status(500).json({ error: message });
    }
  });

  // Get daily sales report
  app.get("/api/pos/reports/daily", isAuthenticated, async (req, res) => {
    try {
      const date = req.query.date as string | undefined;
      const report = await posService.getDailySalesReport(date);
      res.json(report);
    } catch (error) {
      console.error("Error fetching daily report:", error);
      const message = error instanceof Error ? error.message : "Failed to fetch daily report";
      res.status(500).json({ error: message });
    }
  });

  // ==================== END POS ENDPOINTS ====================

  // ==================== BUYING PRICE ENDPOINTS ====================
  
  // Get buying prices for a product
  app.get("/api/products/:productId/buying-prices", isAdmin, async (req, res) => {
    try {
      const productId = parseIdParam(req.params.productId, "product ID");
      const prices = await storage.getBuyingPrices(productId);
      res.json(prices);
    } catch (error) {
      console.error("Error fetching buying prices:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ error: "Failed to fetch buying prices" });
    }
  });

  // Create a new buying price
  app.post("/api/buying-prices", isAdmin, async (req, res) => {
    try {
      const dataWithDates = {
        ...req.body,
        validFrom: req.body.validFrom ? new Date(req.body.validFrom) : undefined,
        validUntil: req.body.validUntil ? new Date(req.body.validUntil) : undefined,
      };
      const validatedData = insertBuyingPriceSchema.parse(dataWithDates);
      const buyingPrice = await storage.createBuyingPrice(validatedData);
      res.status(201).json(buyingPrice);
    } catch (error) {
      console.error("Error creating buying price:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ error: "Failed to create buying price" });
    }
  });

  // Update a buying price
  app.patch("/api/buying-prices/:id", isAdmin, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id, "buying price ID");
      const dataWithDates = {
        ...req.body,
        ...(req.body.validFrom && { validFrom: new Date(req.body.validFrom) }),
        ...(req.body.validUntil && { validUntil: new Date(req.body.validUntil) }),
      };
      const validatedData = updateBuyingPriceSchema.parse(dataWithDates);
      const buyingPrice = await storage.updateBuyingPrice(id, validatedData);
      if (!buyingPrice) {
        return res.status(404).json({ error: "Buying price not found" });
      }
      res.json(buyingPrice);
    } catch (error) {
      console.error("Error updating buying price:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ error: "Failed to update buying price" });
    }
  });

  // Delete a buying price
  app.delete("/api/buying-prices/:id", isAdmin, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id, "buying price ID");
      const deleted = await storage.deleteBuyingPrice(id);
      if (!deleted) {
        return res.status(404).json({ error: "Buying price not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting buying price:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ error: "Failed to delete buying price" });
    }
  });

  // ==================== END BUYING PRICE ENDPOINTS ====================

  // ==================== PRODUCT COMPONENT ENDPOINTS ====================
  
  // Get components for a blend product
  app.get("/api/products/:productId/components", isAdmin, async (req, res) => {
    try {
      const productId = parseIdParam(req.params.productId, "product ID");
      const components = await storage.getProductComponents(productId);
      res.json(components);
    } catch (error) {
      console.error("Error fetching product components:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ error: "Failed to fetch product components" });
    }
  });

  // Create a new product component
  app.post("/api/product-components", isAdmin, async (req, res) => {
    try {
      const validatedData = insertProductComponentSchema.parse(req.body);
      const component = await storage.createProductComponent(validatedData);
      res.status(201).json(component);
    } catch (error) {
      console.error("Error creating product component:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ error: "Failed to create product component" });
    }
  });

  // Update a product component
  app.patch("/api/product-components/:id", isAdmin, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id, "component ID");
      const validatedData = insertProductComponentSchema.partial().parse(req.body);
      const component = await storage.updateProductComponent(id, validatedData);
      if (!component) {
        return res.status(404).json({ error: "Product component not found" });
      }
      res.json(component);
    } catch (error) {
      console.error("Error updating product component:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ error: "Failed to update product component" });
    }
  });

  // Delete a product component
  app.delete("/api/product-components/:id", isAdmin, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id, "component ID");
      const deleted = await storage.deleteProductComponent(id);
      if (!deleted) {
        return res.status(404).json({ error: "Product component not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting product component:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ error: "Failed to delete product component" });
    }
  });

  // ==================== END PRODUCT COMPONENT ENDPOINTS ====================

  // ==================== BOEREN IMPORT ENDPOINTS ====================

  // Parse and validate Excel file
  app.post("/api/boeren-import/parse", isAdmin, (req, res) => {
    uploadExcel.single('file')(req, res, async (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              error: "File too large",
              reason: "File size must be less than 10MB"
            });
          }
          return res.status(400).json({
            error: "Upload error",
            reason: err.message
          });
        }
        return res.status(400).json({
          error: "Invalid file",
          reason: err.message || "Only Excel files are allowed (xls, xlsx, csv)"
        });
      }

      if (!req.file) {
        return res.status(400).json({
          error: "No file provided",
          reason: "Please select an Excel file to upload"
        });
      }

      try {
        const result = await boerenImportService.parseExcelFile(req.file.buffer);
        res.json(result);
      } catch (error) {
        console.error("Error parsing Excel file:", error);
        const message = error instanceof Error ? error.message : "Failed to parse Excel file";
        res.status(500).json({ error: message });
      }
    });
  });

  // Get mapping suggestion for a product
  app.post("/api/boeren-import/suggest-mapping", isAdmin, async (req, res) => {
    try {
      const { productName, productReference } = req.body;

      if (!productName || !productReference) {
        return res.status(400).json({ error: "Product name and reference are required" });
      }

      const suggestion = await boerenImportService.suggestMapping(productName, productReference);
      res.json(suggestion);
    } catch (error) {
      console.error("Error suggesting mapping:", error);
      const message = error instanceof Error ? error.message : "Failed to suggest mapping";
      res.status(500).json({ error: message });
    }
  });

  // Save a mapping
  app.post("/api/boeren-import/save-mapping", isAdmin, async (req, res) => {
    try {
      const { productReference, salesPriceId } = req.body;

      if (!productReference || !salesPriceId) {
        return res.status(400).json({ error: "Product reference and sales price ID are required" });
      }

      // Validate salesPriceId is a positive integer
      const priceId = parseInt(salesPriceId);
      if (isNaN(priceId) || priceId <= 0) {
        return res.status(400).json({ error: "Invalid sales price ID" });
      }

      await boerenImportService.saveMapping(productReference, priceId);
      res.json({ success: true, message: "Mapping saved successfully" });
    } catch (error) {
      console.error("Error saving mapping:", error);
      const message = error instanceof Error ? error.message : "Failed to save mapping";
      res.status(500).json({ error: message });
    }
  });

  // Execute import
  app.post("/api/boeren-import/execute", isAdmin, async (req, res) => {
    try {
      const { rows } = req.body;

      if (!rows || !Array.isArray(rows) || rows.length === 0) {
        return res.status(400).json({ error: "No rows provided for import" });
      }

      const result = await boerenImportService.executeImport(rows);
      res.json(result);
    } catch (error) {
      console.error("Error executing import:", error);
      const message = error instanceof Error ? error.message : "Failed to execute import";
      res.status(500).json({ error: message });
    }
  });

  // Get all mappings
  app.get("/api/boeren-import/mappings", isAdmin, async (req, res) => {
    try {
      const mappings = await boerenImportService.getMappings();
      res.json(mappings);
    } catch (error) {
      console.error("Error fetching mappings:", error);
      const message = error instanceof Error ? error.message : "Failed to fetch mappings";
      res.status(500).json({ error: message });
    }
  });

  // Delete a mapping
  app.delete("/api/boeren-import/mappings/:reference", isAdmin, async (req, res) => {
    try {
      const reference = req.params.reference;

      if (!reference) {
        return res.status(400).json({ error: "Product reference is required" });
      }

      const success = await boerenImportService.deleteMapping(reference);

      if (!success) {
        return res.status(404).json({ error: "Mapping not found" });
      }

      res.json({ success: true, message: "Mapping deleted successfully" });
    } catch (error) {
      console.error("Error deleting mapping:", error);
      const message = error instanceof Error ? error.message : "Failed to delete mapping";
      res.status(500).json({ error: message });
    }
  });

  // ==================== END BOEREN IMPORT ENDPOINTS ====================

  // Analytics endpoints
  app.get("/api/analytics/dashboard", isAdmin, async (req, res) => {
    try {
      const today = new Date();
      const year  = parseInt(req.query.year  as string) || today.getFullYear();
      const month = parseInt(req.query.month as string) || today.getMonth() + 1;
      // Use the last day of the requested month so complete month data is returned.
      // Cap at today so future months don't skew YTD calculations.
      const lastDayOfMonth = new Date(year, month, 0);
      const referenceDate = lastDayOfMonth > today ? today : lastDayOfMonth;

      const [
        revenueOverview,
        revenueByChannel,
        monthlySalesTrend,
        salesByCategory,
        invoiceHealth,
        stockAlerts,
        customerStats,
        topCustomers,
        topProducts,
      ] = await Promise.all([
        dashboardService.getRevenueOverview(referenceDate),
        dashboardService.getRevenueByChannel(referenceDate),
        dashboardService.getMonthlySalesTrend(referenceDate),
        dashboardService.getSalesByCategory(referenceDate),
        dashboardService.getInvoiceHealth(),
        dashboardService.getStockAlerts(),
        dashboardService.getCustomerStats(),
        dashboardService.getTopCustomers(),
        dashboardService.getTopProducts(),
      ]);

      res.json({
        revenueOverview,
        revenueByChannel,
        monthlySalesTrend,
        salesByCategory,
        invoiceHealth,
        stockAlerts,
        customerStats,
        topCustomers,
        topProducts,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // Sales Analysis Dashboard endpoint
  app.get("/api/analytics/sales-analysis", isAdmin, async (req, res) => {
    try {
      const yearsParam = req.query.years as string | undefined;
      const years = yearsParam
        ? yearsParam.split(',').map(Number)
        : [2022, 2023, 2024, 2025];

      const [
        monthlyComparison,
        lifetimeStats,
        yearOverYearGrowth,
        channelPerformance,
      ] = await Promise.all([
        dashboardService.getMultiYearRevenueComparison(years),
        dashboardService.getLifetimeStatistics(),
        dashboardService.getYearOverYearGrowth(),
        dashboardService.getChannelPerformanceOverTime(years),
      ]);

      res.json({
        monthlyComparison,
        lifetimeStats,
        yearOverYearGrowth,
        channelPerformance,
        years,
      });
    } catch (error) {
      console.error("Error fetching sales analysis:", error);
      res.status(500).json({ error: "Failed to fetch sales analysis" });
    }
  });

  // Inventory Dashboard endpoint
  app.get("/api/analytics/inventory", isAdmin, async (req, res) => {
    try {
      const [
        stockMovementSummary,
        inventoryLevels,
        recentMovements,
      ] = await Promise.all([
        dashboardService.getStockMovementSummary(30),
        dashboardService.getInventoryLevels(),
        dashboardService.getRecentStockMovements(20),
      ]);

      res.json({
        stockMovementSummary,
        inventoryLevels,
        recentMovements,
      });
    } catch (error) {
      console.error("Error fetching inventory data:", error);
      res.status(500).json({ error: "Failed to fetch inventory data" });
    }
  });

  // Debug endpoint to check sales statuses and December revenue
  app.get("/api/analytics/debug", isAdmin, async (req, res) => {
    try {
      // Get all sales statuses
      const statuses = await storage.getSalesStatuses();

      // Get December sales with status info
      const decemberSales = await db.execute(sql`
        SELECT
          s.id,
          s.sales_date,
          s.sales_status,
          ss.sales_status as status_name,
          COUNT(sl.id) as salesline_count,
          COALESCE(SUM(sl.total_without_vat), 0) as total
        FROM sale s
        LEFT JOIN sales_status ss ON ss.id = s.sales_status
        LEFT JOIN salesline sl ON sl.sale_id = s.id
        WHERE s.sales_date >= '2025-12-01'
        GROUP BY s.id, s.sales_date, s.sales_status, ss.sales_status
        ORDER BY s.sales_date DESC
        LIMIT 10
      `);

      // Calculate revenue using statuses 3 and 4
      const revenueWith3And4 = await storage.getRevenueForDateRange('2025-12-01', '2025-12-31', [3, 4]);

      // Find PAID status ID
      const paidStatus = statuses.find(s => s.salesStatus.toLowerCase() === 'paid');
      const invoicedStatus = statuses.find(s => s.salesStatus.toLowerCase() === 'invoiced');

      // Calculate revenue using actual PAID/INVOICED IDs
      let revenueWithCorrectIds = 0;
      if (paidStatus || invoicedStatus) {
        const correctIds = [paidStatus?.id, invoicedStatus?.id].filter(Boolean) as number[];
        revenueWithCorrectIds = await storage.getRevenueForDateRange('2025-12-01', '2025-12-31', correctIds);
      }

      res.json({
        allStatuses: statuses,
        paidStatusId: paidStatus?.id,
        invoicedStatusId: invoicedStatus?.id,
        decemberSales: decemberSales.rows,
        revenueWith3And4,
        revenueWithCorrectIds,
        message: "Check if PAID/INVOICED status IDs match the hardcoded values (3, 4) in dashboardService.ts"
      });
    } catch (error) {
      console.error("Error in debug endpoint:", error);
      res.status(500).json({ error: "Debug failed", details: String(error) });
    }
  });

  // ==================== ACCOUNTING REPORT ENDPOINTS ====================

  // Get beginning cash balance for a year (kas_beginsaldo_{year} parameter)
  app.get("/api/accounting/kas-beginsaldo", isAdmin, async (req, res) => {
    try {
      const year = req.query.year ? parseInt(req.query.year as string, 10) : new Date().getFullYear();
      if (isNaN(year)) return res.status(400).json({ error: "Invalid year parameter" });
      const value = await parameterService.getParameter(`kas_beginsaldo_${year}`) || '0';
      res.json({ year, value: parseFloat(value) || 0 });
    } catch (error) {
      console.error("Error fetching kas beginsaldo:", error);
      res.status(500).json({ error: "Failed to fetch beginning balance" });
    }
  });

  // Set beginning cash balance for a year
  app.put("/api/accounting/kas-beginsaldo", isAdmin, async (req, res) => {
    try {
      const { year, value } = req.body;
      const yearNum = parseInt(String(year), 10);
      if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
        return res.status(400).json({ error: "Invalid year" });
      }
      const numValue = parseFloat(String(value));
      if (isNaN(numValue)) {
        return res.status(400).json({ error: "Invalid value" });
      }
      await parameterService.setParameter(`kas_beginsaldo_${yearNum}`, String(numValue));
      res.json({ success: true, year: yearNum, value: numValue });
    } catch (error) {
      console.error("Error saving kas beginsaldo:", error);
      res.status(500).json({ error: "Failed to save beginning balance" });
    }
  });

  app.get("/api/accounting/reports/boeren-buren", isAdmin, async (req, res) => {
    try {
      const year = req.query.year ? parseInt(req.query.year as string, 10) : new Date().getFullYear();
      if (isNaN(year)) return res.status(400).json({ error: "Invalid year parameter" });
      const buffer = await accountingReportService.generateBoerenBurenReport(year);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="BoerenBuren_${year}.xlsx"`);
      res.send(buffer);
    } catch (error) {
      console.error("Error generating Boeren en Buren report:", error);
      const message = error instanceof Error ? error.message : "Failed to generate report";
      res.status(500).json({ error: message });
    }
  });

  app.get("/api/accounting/reports/b2c-sales", isAdmin, async (req, res) => {
    try {
      const year = req.query.year ? parseInt(req.query.year as string, 10) : new Date().getFullYear();
      if (isNaN(year)) return res.status(400).json({ error: "Invalid year parameter" });
      const buffer = await accountingReportService.generateB2CSalesReport(year);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="B2C_Sales_${year}.xlsx"`);
      res.send(buffer);
    } catch (error) {
      console.error("Error generating B2C sales report:", error);
      const message = error instanceof Error ? error.message : "Failed to generate report";
      res.status(500).json({ error: message });
    }
  });

  app.get("/api/accounting/reports/cash-payments", isAdmin, async (req, res) => {
    try {
      const year = req.query.year ? parseInt(req.query.year as string, 10) : new Date().getFullYear();
      if (isNaN(year)) return res.status(400).json({ error: "Invalid year parameter" });
      const buffer = await accountingReportService.generateCashPaymentsReport(year);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="Cash_Payments_${year}.xlsx"`);
      res.send(buffer);
    } catch (error) {
      console.error("Error generating cash payments report:", error);
      const message = error instanceof Error ? error.message : "Failed to generate report";
      res.status(500).json({ error: message });
    }
  });

  // ==================== END ACCOUNTING REPORT ENDPOINTS ====================

  // ==================== CHECKOUT / WEBSHOP ORDER ENDPOINTS ====================

  // Get customer data for authenticated user (checkout pre-fill)
  app.get("/api/checkout/customer-data", isAuthenticated, async (req: any, res) => {
    try {
      const email = req.user?.email;
      if (!email) {
        return res.json(null);
      }
      const customer = await storage.getCustomerByEmail(email);
      if (!customer) {
        return res.json(null);
      }
      res.json({
        phone: customer.phone,
        birthday: customer.birthday,
        companyName: customer.companyName,
        vatNumber: customer.vatNumber,
        billingStreet: customer.billingAddressStreet,
        billingBus: customer.billingAddressBus,
        billingPostalCode: customer.billingAddressPostalCode,
        billingCity: customer.billingAddressCity,
        shippingStreet: customer.shippingAddressStreet,
        shippingBus: customer.shippingAddressBus,
        shippingPostalCode: customer.shippingAddressPostalCode,
        shippingCity: customer.shippingAddressCity,
      });
    } catch (error) {
      console.error("Error fetching customer data for checkout:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Zod schema for checkout request validation
  const checkoutItemSchema = z.object({
    productId: z.number().int().positive(),
    priceId: z.number().int().positive(),
    name: z.string().min(1).max(500),
    price: z.number().positive(),
    unit: z.string().min(1).max(50),
    quantity: z.number().int().positive().max(999),
    imageUrl: z.string().max(2000).optional(),
    category: z.string().min(1).max(200),
    grindSize: z.string().max(100).optional(),
  });

  const checkoutRequestSchema = z.object({
    email: z.string().email().max(320),
    firstName: z.string().min(1).max(200),
    lastName: z.string().min(1).max(200),
    phone: z.string().max(50).optional(),
    birthday: z.string().max(20).optional(),
    companyName: z.string().max(300).optional(),
    vatNumber: z.string().max(50).optional(),
    billingStreet: z.string().min(1).max(500),
    billingBus: z.string().max(50).optional(),
    billingPostalCode: z.string().min(1).max(20),
    billingCity: z.string().min(1).max(200),
    billingCountry: z.string().max(10).optional(),
    shippingStreet: z.string().max(500).optional(),
    shippingBus: z.string().max(50).optional(),
    shippingPostalCode: z.string().max(20).optional(),
    shippingCity: z.string().max(200).optional(),
    shippingCountry: z.string().max(10).optional(),
    items: z.array(checkoutItemSchema).min(1, "Je winkelwagen is leeg."),
    notes: z.string().max(2000).optional(),
    isGuest: z.boolean().optional(),
  });

  // Create a checkout order and get Mollie payment URL
  app.post("/api/checkout/create", async (req, res) => {
    try {
      const body = checkoutRequestSchema.parse(req.body);

      const result = await checkoutService.createOrder(body);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0]?.message || "Ongeldige invoer." });
      }
      console.error("Checkout error:", error instanceof Error ? error.message : "Unknown error");
      const message = error instanceof Error ? error.message : "Checkout failed";
      res.status(500).json({ error: message });
    }
  });

  // Mollie webhook - called by Mollie when payment status changes
  // Security: webhook receives payment ID, then we fetch actual status from Mollie's API
  // using our server-side API key. A forged ID results in a 404 from Mollie.
  const mollieWebhookSchema = z.object({
    id: z.string().regex(/^tr_[a-zA-Z0-9]+$/, "Invalid Mollie payment ID format"),
  });

  app.post("/api/checkout/webhook", async (req, res) => {
    try {
      const { id } = mollieWebhookSchema.parse(req.body);
      await checkoutService.handleWebhook(id);
      res.status(200).send("OK");
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).send("Invalid webhook payload");
      }
      console.error("Webhook error:", error instanceof Error ? error.message : "Unknown error");
      res.status(500).send("Webhook processing failed");
    }
  });

  // Get order status by order number (for confirmation page)
  app.get("/api/checkout/order/:orderNumber", async (req, res) => {
    try {
      const { orderNumber } = req.params;
      if (!orderNumber || typeof orderNumber !== "string") {
        return res.status(400).json({ error: "Invalid order number" });
      }
      const order = await checkoutService.getOrderByNumber(orderNumber);
      if (!order) {
        return res.status(404).json({ error: "Bestelling niet gevonden." });
      }
      // Return a safe subset (no internal IDs)
      res.json({
        orderNumber: order.orderNumber,
        status: order.status,
        email: order.email,
        firstName: order.firstName,
        lastName: order.lastName,
        items: order.items,
        subtotalExclVat: order.subtotalExclVat,
        vatAmount: order.vatAmount,
        shippingCost: order.shippingCost,
        totalInclVat: order.totalInclVat,
        creationDate: order.creationDate,
      });
    } catch (error) {
      console.error("Order lookup error:", error);
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });

  // ==================== END CHECKOUT ENDPOINTS ====================

  // ==================== CUSTOMER ACCOUNT ENDPOINTS ====================

  // Get account profile (user + customer data)
  app.get("/api/account/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      let customer = null;
      if (user.email) {
        customer = await storage.getCustomerByEmail(user.email);
      }

      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        customer: customer
          ? {
              id: customer.id,
              phone: customer.phone,
              birthday: customer.birthday,
              companyName: customer.companyName,
              vatNumber: customer.vatNumber,
              billingAddressStreet: customer.billingAddressStreet,
              billingAddressBus: customer.billingAddressBus,
              billingAddressPostalCode: customer.billingAddressPostalCode,
              billingAddressCity: customer.billingAddressCity,
              shippingAddressStreet: customer.shippingAddressStreet,
              shippingAddressBus: customer.shippingAddressBus,
              shippingAddressPostalCode: customer.shippingAddressPostalCode,
              shippingAddressCity: customer.shippingAddressCity,
            }
          : null,
      });
    } catch (error) {
      console.error("Error fetching account profile:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  // Update account profile
  app.put("/api/account/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || !user.email) {
        return res.status(404).json({ error: "User not found" });
      }

      const profileData: AccountProfileData = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        phone: req.body.phone,
        birthday: req.body.birthday,
        companyName: req.body.companyName,
        vatNumber: req.body.vatNumber,
        billingAddressStreet: req.body.billingAddressStreet,
        billingAddressBus: req.body.billingAddressBus,
        billingAddressPostalCode: req.body.billingAddressPostalCode,
        billingAddressCity: req.body.billingAddressCity,
        shippingAddressStreet: req.body.shippingAddressStreet,
        shippingAddressBus: req.body.shippingAddressBus,
        shippingAddressPostalCode: req.body.shippingAddressPostalCode,
        shippingAddressCity: req.body.shippingAddressCity,
      };

      await customerService.updateAccountProfile(userId, user.email, profileData);

      res.json({ message: "Profile updated" });
    } catch (error) {
      console.error("Error updating account profile:", error);
      const message = error instanceof Error ? error.message : "Failed to update profile";
      res.status(500).json({ error: message });
    }
  });

  // Get account order history
  app.get("/api/account/orders", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user?.email) {
        return res.json([]);
      }

      const orders = await db
        .select()
        .from(webshopOrders)
        .where(eq(webshopOrders.email, user.email))
        .orderBy(desc(webshopOrders.creationDate));

      res.json(
        orders.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          status: o.status,
          items: o.items,
          totalInclVat: o.totalInclVat,
          shippingCost: o.shippingCost,
          creationDate: o.creationDate,
          molliePaymentStatus: o.molliePaymentStatus,
        }))
      );
    } catch (error) {
      console.error("Error fetching account orders:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  // Get most ordered products
  app.get("/api/account/top-products", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user?.email) {
        return res.json([]);
      }

      const customer = await storage.getCustomerByEmail(user.email);
      if (!customer) {
        return res.json([]);
      }

      const topProducts = await db
        .select({
          productId: salesLines.productId,
          name: products.name,
          nameDutch: products.nameDutch,
          picture: products.picture,
          productTypeId: products.productTypeId,
          totalOrdered: sum(salesLines.amount).as("total_ordered"),
        })
        .from(salesLines)
        .innerJoin(sales, eq(salesLines.saleId, sales.id))
        .innerJoin(products, eq(salesLines.productId, products.id))
        .where(
          and(
            eq(sales.customerId, customer.id),
            eq(products.webshopEnabled, true)
          )
        )
        .groupBy(salesLines.productId, products.id, products.name, products.nameDutch, products.picture, products.productTypeId)
        .orderBy(desc(sql`total_ordered`))
        .limit(6);

      res.json(topProducts);
    } catch (error) {
      console.error("Error fetching top products:", error);
      res.status(500).json({ error: "Failed to fetch top products" });
    }
  });

  // ==================== END CUSTOMER ACCOUNT ENDPOINTS ====================

  // Create or use provided server
  const httpServer = server || createServer(app);
  return httpServer;
}
