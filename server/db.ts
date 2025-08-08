import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  console.error("💥 DATABASE_URL must be set. Did you forget to provision a database?");
  
  // In production, don't crash - just log the error
  if (process.env.REPLIT_DEPLOYMENT === '1' || process.env.NODE_ENV === 'production') {
    console.error("💥 Production deployment detected - continuing with degraded functionality");
  } else {
    throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
  }
}

// Create database connection with error handling
let pool: Pool | null = null;
let db: any = null;

try {
  if (process.env.DATABASE_URL) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle({ client: pool, schema });
    console.log('✅ Database connection initialized successfully');
  } else {
    console.error('💥 DATABASE_URL not found - database operations will fail');
  }
} catch (error) {
  console.error('💥 Database initialization failed:', error);
  
  // In production, create a mock connection that logs errors instead of crashing
  if (process.env.REPLIT_DEPLOYMENT === '1' || process.env.NODE_ENV === 'production') {
    console.error('💥 Creating degraded database connection for production');
    db = new Proxy({}, {
      get: () => () => {
        console.error('💥 Database operation attempted but connection failed');
        throw new Error('Database connection not available');
      }
    });
  }
}

export { pool, db };