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
  jwtAccessSecret: requireEnvironmentVariable("JWT_ACCESS_SECRET")
} as const;
