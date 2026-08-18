import { logger } from "../config/logger.js";
import { releasePendingEarnings } from "../modules/earnings/earning.service.js";

export function startEarningReleaseJob(intervalMinutes: number) {
  const safeMinutes = Number.isFinite(intervalMinutes) && intervalMinutes >= 1 ? intervalMinutes : 60;
  const run = () => void releasePendingEarnings().catch(error => logger.error({ err: error }, "Pending earning release job failed"));
  run();
  const timer = setInterval(run, safeMinutes * 60_000);
  timer.unref();
  return () => clearInterval(timer);
}
