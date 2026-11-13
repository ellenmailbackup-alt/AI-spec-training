import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import { pool } from "./db";

const app = express();

// --- Helper: Local Logging Function ---
function log(message: string) {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [express] ${message}`);
}

// 1. TRUST PROXY (Critical for Cloud Run & Rate Limiting)
app.set('trust proxy', 1);

// 2. LOGGING MIDDLEWARE (Moved to TOP so it sees everything)
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) logLine = logLine.slice(0, 79) + "…";
      log(logLine);
    }
  });

  next();
});

// 3. SECURITY HEADERS (Helmet)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://code.jquery.com", "https://cdn.jsdelivr.net"],
        imgSrc: ["'self'", "data:", "https:", "https://www.gravatar.com"],
        connectSrc: ["'self'", "wss:", "ws:", "https://*.supabase.co", "https://*.mollie.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "https://fonts.googleapis.com"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    xssFilter: true,
    noSniff: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  })
);

// 4. CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ?.split(",")
  .map(origin => origin.trim())
  .filter(origin => origin.length > 0) || [];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (process.env.NODE_ENV === "development") {
        log(`CORS: Allowing ${origin} (development mode)`);
        return callback(null, true);
      }

      if (allowedOrigins.length === 0) {
        log(`CORS: ALLOWED_ORIGINS not set, allowing ${origin}`);
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        log(`CORS: Allowing whitelisted origin: ${origin}`);
        callback(null, true);
      } else {
        log(`CORS: Blocked origin ${origin} (allowed: ${allowedOrigins.join(", ")})`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "PUT", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// 5. PARSERS
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// 6. RATE LIMITING
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 1000,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 20, // Brute-force protection on auth endpoints
  message: "Too many authentication attempts, please try again later.",
  skipSuccessfulRequests: true,
});

app.use("/api", apiLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/signup", authLimiter);
app.use("/api/auth/oauth", authLimiter);

// 7. HEALTH CHECK ENDPOINTS (registered synchronously, responds immediately)
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    port: process.env.PORT || '5000'
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString()
  });
});

// START SERVER IMMEDIATELY (before async operations)
const port = parseInt(process.env.PORT || '5000', 10);
const server = app.listen(port, "0.0.0.0", () => {
  console.log(`✅ Server listening on port ${port}`);
  console.log(`🌐 Health check available at: http://0.0.0.0:${port}/health`);
});

// Auto-run all SQL migration files from db/migrations/ in alphabetical order
async function runMigrations() {
  const migrationsDir = path.join(process.cwd(), 'db', 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    console.log('⚠️ No migrations directory found, skipping');
    return;
  }

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  if (files.length === 0) return;

  const client = await pool.connect();
  try {
    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      try {
        await client.query(sql);
        console.log(`✅ Migration applied: ${file}`);
      } catch (err: any) {
        // Log but continue — most failures are benign (IF NOT EXISTS / ON CONFLICT)
        console.warn(`⚠️ Migration ${file} warning: ${err.message}`);
      }
    }
  } finally {
    client.release();
  }
}

// 8. ASYNC ROUTE REGISTRATION (runs AFTER server starts)
(async () => {
  const startupStart = Date.now();
  console.log('🚀 Starting async initialization...');

  try {
    // Run database migrations first
    console.log('🗄️ Running database migrations...');
    await runMigrations();
    console.log('✅ Migrations complete');

    // Register API Routes
    console.log('📋 Registering routes...');
    const routeStart = Date.now();
    await registerRoutes(app, server); // Pass existing server
    console.log(`✅ Routes registered in ${Date.now() - routeStart}ms`);

    // Global Error Handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
    });

    // Environment Setup
    if (process.env.NODE_ENV !== "production") {
      const { setupVite } = await import("./vite");
      await setupVite(app, server);
    } else {
      const { serveStatic } = await import("./static");
      serveStatic(app);
    }

    console.log(`🎉 Full initialization completed in ${Date.now() - startupStart}ms`);
  } catch (error) {
    console.error('❌ Route registration failed:', error);
    // Don't exit - server still running for health checks
  }
})();
