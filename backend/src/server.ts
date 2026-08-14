import { createServer } from "node:http";
import app from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { prisma } from "./config/database.js";
import { closeSocket, initializeSocket } from "./services/realtime/socket.service.js";
import { startAssignmentReminderJob } from "./jobs/assignment-reminders.job.js";

const HOST = "0.0.0.0";

const server = createServer(app);
initializeSocket(server);
const stopReminderJob = startAssignmentReminderJob(env.assignmentReminderIntervalMinutes);
server.listen(env.port, HOST, () => {
  logger.info({ port: env.port, host: HOST }, "LMS API started");
});

async function shutdown(signal: string) {
  logger.info({ signal }, "Graceful shutdown started");
  stopReminderJob();
  await closeSocket();
  server.close(async () => {
    await prisma.$disconnect();
    logger.info("LMS API stopped");
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
