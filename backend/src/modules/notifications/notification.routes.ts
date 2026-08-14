import { Router } from "express";
import { authenticate } from "../../common/middlewares/authenticate.js";
import { asyncHandler } from "../../common/utils/asyncHandler.js";
import { deleteNotificationController, listNotificationsController, readAllNotificationsController, readNotificationController, unreadCountController } from "./notification.controller.js";

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
 */
router.use(authenticate);
router.get("/", asyncHandler(listNotificationsController));
router.get("/unread-count", asyncHandler(unreadCountController));
router.patch("/read-all", asyncHandler(readAllNotificationsController));
router.patch("/:id/read", asyncHandler(readNotificationController));
router.delete("/:id", asyncHandler(deleteNotificationController));
export default router;
