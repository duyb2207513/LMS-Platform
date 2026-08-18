import type { Request, Response } from "express";
import { sendSuccess } from "../../common/utils/response.js";
import { deleteNotification, getUnreadCount, listNotifications, markAllNotificationsRead, markNotificationRead } from "./notification.service.js";
import { parseNotificationQuery } from "./notification.validation.js";
import { registerPushDevice, unregisterPushDevice } from "./push.service.js";
import type { RegisterPushDeviceInput } from "./notification.types.js";

const id = (request: Request) => String(request.params.id ?? "");
export async function listNotificationsController(request: Request, response: Response) {
  const result = await listNotifications(request.auth.userId, parseNotificationQuery(request.query));
  response.status(200).json({ success: true, message: "Notifications retrieved successfully", data: result.data, meta: result.meta });
}
export async function unreadCountController(request: Request, response: Response) { sendSuccess(response, 200, "Unread notification count retrieved successfully", { unreadCount: await getUnreadCount(request.auth.userId) }); }
export async function readNotificationController(request: Request, response: Response) { sendSuccess(response, 200, "Notification marked as read", await markNotificationRead(request.auth.userId, id(request))); }
export async function readAllNotificationsController(request: Request, response: Response) { sendSuccess(response, 200, "All notifications marked as read", await markAllNotificationsRead(request.auth.userId)); }
export async function deleteNotificationController(request: Request, response: Response) { await deleteNotification(request.auth.userId, id(request)); response.status(204).send(); }
export async function registerPushDeviceController(request: Request, response: Response) { sendSuccess(response, 200, "Push device registered successfully", await registerPushDevice(request.auth.userId, request.body as RegisterPushDeviceInput)); }
export async function unregisterPushDeviceController(request: Request, response: Response) { await unregisterPushDevice(request.auth.userId, String(request.params.deviceId ?? "")); response.status(204).send(); }
