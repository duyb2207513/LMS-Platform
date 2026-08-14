import * as Sentry from "@sentry/node";
import { env } from "./env.js";

if (env.sentryDsn) {
  Sentry.init({
    dsn: env.sentryDsn,
    environment: env.nodeEnv,
    sendDefaultPii: false,
    tracesSampleRate: env.nodeEnv === "production" ? 0.1 : 0
  });
}

export { Sentry };
