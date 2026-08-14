import { AppError } from "../../common/errors/AppError.js";
import type { NotificationListQuery } from "./notification.types.js";

export function parseNotificationQuery(query: Record<string, unknown>): NotificationListQuery {
  const page = Number(query.page ?? 1), limit = Number(query.limit ?? 20);
  if (!Number.isInteger(page) || page < 1) throw new AppError(400, "page must be a positive integer");
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new AppError(400, "limit must be an integer from 1 to 100");
  let isRead: boolean | undefined;
  if (query.isRead !== undefined) {
    if (query.isRead !== "true" && query.isRead !== "false") throw new AppError(400, "isRead must be true or false");
    isRead = query.isRead === "true";
  }
  return { page, limit, ...(isRead === undefined ? {} : { isRead }) };
}
