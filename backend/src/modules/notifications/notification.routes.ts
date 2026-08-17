import { Router } from "express";
import { authenticate } from "../../common/middlewares/authenticate.js";
import { asyncHandler } from "../../common/utils/asyncHandler.js";
import { validateRequest } from "../../common/middlewares/validateRequest.js";
import { deleteNotificationController, listNotificationsController, readAllNotificationsController, readNotificationController, registerPushDeviceController, unregisterPushDeviceController, unreadCountController } from "./notification.controller.js";
import { validatePushDeviceInput } from "./notification.validation.js";

const router = Router();
/**
 * @openapi
 * /notifications:
 *   get:
 *     summary: List the current user's notifications, newest first
 *     tags: [Notifications]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer, minimum: 1, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, minimum: 1, maximum: 100, default: 20 } }
 *       - { in: query, name: isRead, schema: { type: boolean } }
 *     responses: { 200: { description: Notifications retrieved }, 401: { description: Authentication required } }
 * /notifications/unread-count:
 *   get:
 *     summary: Count unread notifications
 *     tags: [Notifications]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Unread count retrieved } }
 * /notifications/{id}/read:
 *   patch:
 *     summary: Idempotently mark an owned notification as read
 *     tags: [Notifications]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string, format: uuid } }]
 *     responses: { 200: { description: Notification marked as read }, 404: { description: Owned notification not found } }
 * /notifications/read-all:
 *   patch:
 *     summary: Mark all current user's notifications as read
 *     tags: [Notifications]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: All notifications marked as read } }
 * /notifications/{id}:
 *   delete:
 *     summary: Delete an owned notification
 *     tags: [Notifications]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string, format: uuid } }]
 *     responses: { 204: { description: Notification deleted }, 404: { description: Owned notification not found } }
 * /notifications/devices:
 *   post:
 *     summary: Register or refresh an Expo push notification device
 *     tags: [Notifications]
 *     security: [{ bearerAuth: [] }]
 *     requestBody: { required: true, content: { application/json: { schema: { type: object, required: [expoPushToken, platform], properties: { expoPushToken: { type: string }, platform: { type: string, enum: [ios, android] }, deviceName: { type: string } } } } } }
 *     responses: { 200: { description: Push device registered }, 400: { description: Invalid Expo push token } }
 * /notifications/devices/{deviceId}:
 *   delete:
 *     summary: Disable one owned push notification device
 *     tags: [Notifications]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: deviceId, required: true, schema: { type: string, format: uuid } }]
 *     responses: { 204: { description: Push device disabled } }
 */
router.use(authenticate);
router.post("/devices", validateRequest(validatePushDeviceInput), asyncHandler(registerPushDeviceController));
router.delete("/devices/:deviceId", asyncHandler(unregisterPushDeviceController));
router.get("/", asyncHandler(listNotificationsController));
router.get("/unread-count", asyncHandler(unreadCountController));
router.patch("/read-all", asyncHandler(readAllNotificationsController));
router.patch("/:id/read", asyncHandler(readNotificationController));
router.delete("/:id", asyncHandler(deleteNotificationController));
export default router;
