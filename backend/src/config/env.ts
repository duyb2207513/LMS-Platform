import "dotenv/config";

function requireEnvironmentVariable(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not configured`);
  }

  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 3000),
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5173",
  databaseUrl: requireEnvironmentVariable("DATABASE_URL"),
  jwtAccessSecret: requireEnvironmentVariable("JWT_ACCESS_SECRET"),
  jwtRefreshSecret: requireEnvironmentVariable("JWT_REFRESH_SECRET"),
  mockPaymentWebhookSecret: process.env.MOCK_PAYMENT_WEBHOOK_SECRET ?? "local-mock-payment-webhook-secret",
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX ?? 300),
  authRateLimitWindowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000),
  authRateLimitMax: Number(process.env.AUTH_RATE_LIMIT_MAX ?? 20)
} as const;
