import app from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { prisma } from "./config/database.js";

const HOST = "0.0.0.0";

const server = app.listen(env.port, HOST, () => {
  logger.info({ port: env.port, host: HOST }, "LMS API started");
});

async function shutdown(signal: string) {
  logger.info({ signal }, "Graceful shutdown started");
  server.close(async () => {
    await prisma.$disconnect();
    logger.info("LMS API stopped");
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
