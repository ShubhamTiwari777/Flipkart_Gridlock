import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { join } from "path";
import { existsSync } from "fs";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes always take priority
app.use("/api", router);

// In production, serve the built React dashboard from the same Express server.
// This avoids cross-origin issues — the dashboard and API share one URL.
if (process.env.NODE_ENV === "production") {
  const dashboardDist = join(
    import.meta.dirname,
    "../../gridlock-dashboard/dist/public",
  );
  if (existsSync(dashboardDist)) {
    app.use(express.static(dashboardDist));
    // SPA fallback — serve index.html for any non-API route
    app.get("/{*splat}", (_req, res) => {
      res.sendFile(join(dashboardDist, "index.html"));
    });
    logger.info({ dashboardDist }, "Serving dashboard static files");
  }
}

export default app;
