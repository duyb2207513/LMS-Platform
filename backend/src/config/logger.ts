import pino from "pino";
import { env } from "./env.js";

export const logger = pino({
  level: env.logLevel,
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "res.headers['set-cookie']",
      "password",
      "newPassword",
      "currentPassword",
      "token",
      "refreshToken"
    ],
    censor: "[REDACTED]"
  },
  base: { service: "lms-backend", environment: env.nodeEnv }
});
