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
  mobileAppUrl: process.env.MOBILE_APP_URL ?? "lmsplatform://",
  databaseUrl: requireEnvironmentVariable("DATABASE_URL"),
  jwtAccessSecret: requireEnvironmentVariable("JWT_ACCESS_SECRET"),
  jwtRefreshSecret: requireEnvironmentVariable("JWT_REFRESH_SECRET"),
  mockPaymentWebhookSecret: process.env.MOCK_PAYMENT_WEBHOOK_SECRET ?? "local-mock-payment-webhook-secret",
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX ?? 300),
  authRateLimitWindowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000),
  authRateLimitMax: Number(process.env.AUTH_RATE_LIMIT_MAX ?? (process.env.NODE_ENV === "production" ? 100 : 1000)),
  loginMaxAttempts: Number(process.env.LOGIN_MAX_ATTEMPTS ?? 5),
  loginLockMinutes: Number(process.env.LOGIN_LOCK_MINUTES ?? 15),
  requireEmailVerification: process.env.REQUIRE_EMAIL_VERIFICATION === "true",
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  githubClientId: process.env.GITHUB_CLIENT_ID || "dev_github_client_id",
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET || "dev_github_client_secret",
  githubCallbackUrl: process.env.GITHUB_CALLBACK_URL || `http://localhost:${process.env.PORT ?? 3000}/api/v1/auth/github/callback`,
  smtpHost: process.env.SMTP_HOST ?? "",
  smtpPort: Number(process.env.SMTP_PORT ?? 587),
  smtpSecure: process.env.SMTP_SECURE === "true",
  smtpUser: process.env.SMTP_USER ?? "",
  smtpPassword: process.env.SMTP_PASSWORD ?? "",
  mailFrom: process.env.MAIL_FROM ?? "LMS Platform <no-reply@lms.local>",
  assignmentReminderIntervalMinutes: Number(process.env.ASSIGNMENT_REMINDER_INTERVAL_MINUTES ?? 15),
  commercePlatformFeePercent: Number(process.env.COMMERCE_PLATFORM_FEE_PERCENT ?? 20),
  commerceRefundWindowDays: Number(process.env.COMMERCE_REFUND_WINDOW_DAYS ?? 1),
  commerceRefundMaxProgressPercent: Number(process.env.COMMERCE_REFUND_MAX_PROGRESS_PERCENT ?? 20),
  commerceEarningReleaseIntervalMinutes: Number(process.env.COMMERCE_EARNING_RELEASE_INTERVAL_MINUTES ?? 60),
  sentryDsn: process.env.SENTRY_DSN ?? "",
  logLevel: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === "production" ? "info" : "debug")
} as const;
