import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

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

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize FAB cards cache
  log("Loading FAB cards cache...", "fab-cache");
  const { fabCardsCache } = await import("./fab-cards-cache");
  try {
    await fabCardsCache.load();
    const stats = fabCardsCache.getStats();
    log(`FAB cache loaded: ${stats.totalCards} cards, ${stats.totalSets} sets`, "fab-cache");
  } catch (err: any) {
    log(`FAB cache load failed: ${err.message}`, "fab-cache");
    log("Continuing without FAB card data...", "fab-cache");
  }

  await registerRoutes(app);

  // Initialize default exchange rates if not set
  try {
    const { storage } = await import("./storage");
    const cnySetting = await storage.getSetting("usd_to_cny");
    if (!cnySetting) {
      await storage.setSetting("usd_to_cny", "7.25");
      await storage.setSetting("usd_to_jpy", "150");
      log("Initialized default exchange rates");
    }
  } catch (e) {
    // DB may not be ready yet, skip
  }

  // Price snapshot scheduling
  const { snapshotFollowedCardPrices } = await import("./price-snapshot");

  // Initial snapshot after 30 seconds (let server finish startup)
  setTimeout(() => {
    log("Running initial price snapshot...", "price-snapshot");
    snapshotFollowedCardPrices().catch((err) => {
      log(`Initial snapshot failed: ${err.message}`, "price-snapshot");
    });
  }, 30000);

  // Recurring snapshot every 6 hours
  setInterval(() => {
    log("Running scheduled price snapshot...", "price-snapshot");
    snapshotFollowedCardPrices().catch((err) => {
      log(`Scheduled snapshot failed: ${err.message}`, "price-snapshot");
    });
  }, 6 * 60 * 60 * 1000); // 6 hours in milliseconds

  // Reload FAB cache daily to get latest card data
  setInterval(() => {
    log("Reloading FAB cards cache...", "fab-cache");
    fabCardsCache.reload().catch((err) => {
      log(`FAB cache reload failed: ${err.message}`, "fab-cache");
    });
  }, 24 * 60 * 60 * 1000); // 24 hours in milliseconds

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
