import { Router } from "express";
import { authenticate } from "../../common/middlewares/authenticate.js";
import { authorize } from "../../common/middlewares/authorize.js";
import { validateRequest } from "../../common/middlewares/validateRequest.js";
import { asyncHandler } from "../../common/utils/asyncHandler.js";
import { createAnnouncementController, deleteAnnouncementController, listAnnouncementsController, publishAnnouncementController, updateAnnouncementController } from "./announcement.controller.js";
import { validateCreateAnnouncement, validateUpdateAnnouncement } from "./announcement.validation.js";

export const courseAnnouncementsRouter = Router({ mergeParams: true });
/**
 * @openapi
 * /courses/{courseId}/announcements:
 *   get:
 *     summary: List course announcements; students only receive published items
 *     tags: [Course announcements]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: courseId, required: true, schema: { type: string, format: uuid } }]
 *     responses: { 200: { description: Announcements retrieved }, 403: { description: Enrollment or ownership required } }
 *   post:
 *     summary: Create an announcement draft
 *     tags: [Course announcements]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: courseId, required: true, schema: { type: string, format: uuid } }]
 *     requestBody: { required: true, content: { application/json: { schema: { $ref: '#/components/schemas/AnnouncementRequest' } } } }
 *     responses: { 201: { description: Draft created }, 403: { description: Course ownership required } }
 */
courseAnnouncementsRouter.get("/", authenticate, asyncHandler(listAnnouncementsController));
courseAnnouncementsRouter.post("/", authenticate, authorize("INSTRUCTOR", "ADMIN"), validateRequest(validateCreateAnnouncement), asyncHandler(createAnnouncementController));

export const announcementsRouter = Router();
/**
 * @openapi
 * /announcements/{id}:
 *   patch:
 *     summary: Update an owned draft announcement
 *     tags: [Course announcements]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string, format: uuid } }]
 *     requestBody: { required: true, content: { application/json: { schema: { $ref: '#/components/schemas/UpdateAnnouncementRequest' } } } }
 *     responses: { 200: { description: Draft updated }, 409: { description: Published announcements cannot be edited } }
 *   delete:
 *     summary: Delete an announcement as author or admin
 *     tags: [Course announcements]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string, format: uuid } }]
 *     responses: { 204: { description: Announcement deleted }, 403: { description: Author or admin required } }
 * /announcements/{id}/publish:
 *   post:
 *     summary: Publish a draft and notify enrolled students exactly once
 *     tags: [Course announcements]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string, format: uuid } }]
 *     responses: { 200: { description: Announcement published }, 409: { description: Announcement already published } }
 */
announcementsRouter.patch("/:id", authenticate, authorize("INSTRUCTOR", "ADMIN"), validateRequest(validateUpdateAnnouncement), asyncHandler(updateAnnouncementController));
announcementsRouter.post("/:id/publish", authenticate, authorize("INSTRUCTOR", "ADMIN"), asyncHandler(publishAnnouncementController));
announcementsRouter.delete("/:id", authenticate, authorize("INSTRUCTOR", "ADMIN"), asyncHandler(deleteAnnouncementController));
