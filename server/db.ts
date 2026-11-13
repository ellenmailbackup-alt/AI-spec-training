// Database connection using Supabase PostgreSQL
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  console.error(
    "⚠️ WARNING: DATABASE_URL not set. Database features will not work."
  );
  // Don't throw - allow app to start for health checks
}

// Create PostgreSQL connection pool for Supabase
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost', // Fallback to prevent crash
  max: 20, // Maximum number of connections in the pool
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 30000, // Extended from 10s to 30s for Cloud Run cold starts
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

// Test connection asynchronously (non-blocking)
pool.connect()
  .then(client => {
    console.log('✅ Database connection established');
    client.release();
  })
  .catch(error => {
    console.error('❌ Database connection failed:', error.message);
    // Don't crash - app can still serve health checks
  });

export const db = drizzle(pool, { schema });
