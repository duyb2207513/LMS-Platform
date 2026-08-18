import { AppError } from "../../common/errors/AppError.js";
import type { RequestValidationResult } from "../../common/middlewares/validateRequest.js";
import type { NotificationListQuery, RegisterPushDeviceInput } from "./notification.types.js";

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

export function validatePushDeviceInput(body: unknown): RequestValidationResult<RegisterPushDeviceInput> {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { errors: { body: "Request body must be a JSON object" } };
  const input = body as Record<string, unknown>, errors: Record<string, string> = {};
  for (const key of Object.keys(input)) if (!["expoPushToken", "platform", "deviceName"].includes(key)) errors[key] = `${key} cannot be set through this endpoint`;
  const token = typeof input.expoPushToken === "string" ? input.expoPushToken.trim() : "";
  if (!/^(Exponent|Expo)PushToken\[[^\]]+\]$/.test(token)) errors.expoPushToken = "expoPushToken must be a valid Expo push token";
  if (input.platform !== "ios" && input.platform !== "android") errors.platform = "platform must be ios or android";
  const deviceName = typeof input.deviceName === "string" ? input.deviceName.trim() : undefined;
  if (deviceName && deviceName.length > 120) errors.deviceName = "deviceName must not exceed 120 characters";
  return Object.keys(errors).length ? { errors } : { data: { expoPushToken: token, platform: input.platform as "ios" | "android", ...(deviceName ? { deviceName } : {}) } };
}
