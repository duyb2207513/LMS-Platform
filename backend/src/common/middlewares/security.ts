import type { RequestHandler } from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { env } from "../../config/env.js";

export const securityHeaders = helmet({
  // OAuth popup callbacks must retain window.opener long enough to post the
  // result back to the LMS tab. This remains isolated from unrelated origins.
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: env.nodeEnv === "production" ? undefined : false,
});

const response = (message: string) => ({ success: false, message, data: null });
export const apiRateLimiter: RequestHandler = rateLimit({
  windowMs: env.rateLimitWindowMs,
  limit: env.rateLimitMax,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: (request) => request.path.endsWith("/health"),
  handler: (_request, res) => {
    res.status(429).json(response("Too many requests, please try again later"));
  },
});
export const authRateLimiter: RequestHandler = rateLimit({
  windowMs: env.authRateLimitWindowMs,
  limit: env.authRateLimitMax,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (_request, res) => {
    res
      .status(429)
      .json(
        response("Too many authentication attempts, please try again later"),
      );
  },
});
