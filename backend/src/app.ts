import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import path from "node:path";
import swaggerUi from "swagger-ui-express";
import pinoHttp from "pino-http";
import { swaggerSpec } from "./config/swagger.js";
import apiRouter from "./routes/index.js";
import { apiRateLimiter, authRateLimiter, securityHeaders } from "./common/middlewares/security.js";
import { auditTrail } from "./common/middlewares/auditTrail.js";
import { logger } from "./config/logger.js";
import "./config/monitoring.js";

import { errorHandler } from "./common/middlewares/errorHandler.js";

const app = express();
app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(securityHeaders);
app.use(pinoHttp({
  logger,
  autoLogging: { ignore: request => request.url?.endsWith("/health") === true },
  customLogLevel: (_request, response, error) => error || response.statusCode >= 500 ? "error" : response.statusCode >= 400 ? "warn" : "info"
}));

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:3000",
  "https://lms-platform-lemon-theta.vercel.app"
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      // Cho phép requests không có origin (ví dụ Mobile apps, Curl, Postman)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app") ||
        origin.includes("localhost")
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true
  })
);

app.use(express.json({ limit: "750mb" }));
app.use(express.urlencoded({ limit: "750mb", extended: true }));
app.use(cookieParser());
app.use("/uploads/course-thumbnails", express.static(path.resolve("uploads", "course-thumbnails")));
app.use("/uploads/avatars", express.static(path.resolve("uploads", "avatars")));
app.use("/uploads/lesson-files", express.static(path.resolve("uploads", "lesson-files")));

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);

app.use("/api/v1", apiRateLimiter);
app.use("/api/v1/auth", authRateLimiter);
app.use("/api/v1", auditTrail);
app.use("/api/v1", apiRouter);

app.use((_request, response) => {
  response.status(404).json({
    success: false,
    message: "API endpoint not found"
  });
});

app.use(errorHandler);

export default app;