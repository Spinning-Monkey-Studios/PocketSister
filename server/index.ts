import express from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Stripe webhooks must come BEFORE express.json()
app.use("/webhooks/stripe", express.raw({ type: "application/json" }));

// Normal JSON after that
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Simple request logger
app.use((req, _res, next) => {
  const start = Date.now();
  resOnFinish(req, start);
  next();
});
function resOnFinish(req: express.Request, start: number) {
  // noop hook; keeps parity with your healthy app’s timing log if you want to fill it in later
}

// --- ENVIRONMENT DETECTION (single source of truth) ---
const isProd =
  process.env.NODE_ENV === "production" ||
  process.env.REPLIT_DEPLOYMENT === "1";

(async () => {
  const server = app as any; // if you’re attaching Vite middlewares, this is fine

  // Register API routes FIRST - this is critical for production
  await registerRoutes(app);

  if (isProd) {
    // ✅ Production: serve built static files from dist/public + SPA fallback
    // IMPORTANT: Static files are served AFTER API routes to prevent conflicts
    serveStatic(app);
  } else {
    // 🛠 Development: Vite dev middleware (hot reload, @react-refresh, etc.)
    await setupVite(app, server);
  }

  // Listen on Replit’s provided port
  const port = parseInt(process.env.PORT || "5000", 10);
  (server as any).listen?.({ port, host: "0.0.0.0", reusePort: true }, () =>
    log(`serving on port ${port}`),
  );
})();
