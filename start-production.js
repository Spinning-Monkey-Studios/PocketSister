#!/usr/bin/env node

// Force production mode and start the compiled server
console.log("🚀 STARTING PRODUCTION SERVER");
console.log("🚀 Setting environment variables...");

// Force production environment
process.env.NODE_ENV = "production";
process.env.REPLIT_DEPLOYMENT = "1";

console.log("🚀 Environment:", {
  NODE_ENV: process.env.NODE_ENV,
  REPLIT_DEPLOYMENT: process.env.REPLIT_DEPLOYMENT,
  PORT: process.env.PORT,
  DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
  CURRENT_DIR: process.cwd(),
});

// First, ensure the build exists
import fs from "fs";
import path from "path";

const distPath = path.resolve(process.cwd(), "dist", "index.js");
console.log("🚀 Looking for compiled server at:", distPath);
console.log("🚀 Compiled server exists:", fs.existsSync(distPath));

if (!fs.existsSync(distPath)) {
  console.error("💥 CRITICAL: Compiled server not found, building now...");
  const { execSync } = await import("child_process");
  try {
    execSync("npm run build", { stdio: "inherit" });
    console.log("✅ Build completed successfully");
  } catch (buildError) {
    console.error("💥 Build failed:", buildError);
    process.exit(1);
  }
}

console.log("🚀 Starting compiled server from dist/index.js...");

// Import and run the compiled server
import("./dist/index.js").catch((error) => {
  console.error("💥 Failed to start production server:", error);
  console.error("💥 Stack:", error.stack);
  process.exit(1);
});
