import { Router } from "express";
import { authenticate } from "../../common/middlewares/authenticate.js";
import { authorize } from "../../common/middlewares/authorize.js";
import { validateRequest } from "../../common/middlewares/validateRequest.js";
import { asyncHandler } from "../../common/utils/asyncHandler.js";
import { uploadLessonFile } from "../../config/upload.js";
import { createLessonController, deleteLessonController, updateLessonController, uploadLessonFileController } from "./lessons.controller.js";
import { ensureLessonManagePermission } from "./lessons.middleware.js";
import { validateCreateLessonInput, validateUpdateLessonInput } from "./lessons.validation.js";

const manage = [authenticate, authorize("INSTRUCTOR", "ADMIN")] as const;
export const sectionLessonsRouter = Router({ mergeParams: true });
/**
 * @openapi
 * /sections/{sectionId}/lessons:
 *   post:
 *     summary: Create a lesson
 *     tags: [Lessons]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: sectionId, required: true, schema: { type: string, format: uuid } }]
 *     requestBody: { required: true, content: { application/json: { schema: { $ref: '#/components/schemas/CreateLessonRequest' } } } }
 *     responses: { 201: { description: Lesson created successfully }, 403: { description: Course ownership required }, 404: { description: Section not found } }
 */
sectionLessonsRouter.post("/", ...manage, validateRequest(validateCreateLessonInput), asyncHandler(createLessonController));

export const lessonsRouter = Router();
/**
 * @openapi
 * /lessons/{lessonId}:
 *   patch:
 *     summary: Update a lesson
 *     tags: [Lessons]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: lessonId, required: true, schema: { type: string, format: uuid } }]
 *     requestBody: { required: true, content: { application/json: { schema: { $ref: '#/components/schemas/UpdateLessonRequest' } } } }
 *     responses: { 200: { description: Lesson updated successfully }, 403: { description: Ownership required }, 404: { description: Lesson not found } }
 *   delete:
 *     summary: Delete a lesson
 *     tags: [Lessons]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: lessonId, required: true, schema: { type: string, format: uuid } }]
 *     responses: { 204: { description: Lesson deleted successfully }, 403: { description: Ownership required }, 404: { description: Lesson not found } }
 * /lessons/{lessonId}/file:
 *   post:
 *     summary: Upload a video or document for a lesson
 *     tags: [Lessons]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: lessonId, required: true, schema: { type: string, format: uuid } }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema: { type: object, required: [file], properties: { file: { type: string, format: binary } } }
 *     responses: { 200: { description: Lesson file uploaded successfully }, 400: { description: Invalid or oversized file }, 403: { description: Ownership required } }
 */
lessonsRouter.patch("/:lessonId", ...manage, validateRequest(validateUpdateLessonInput), asyncHandler(updateLessonController));
lessonsRouter.delete("/:lessonId", ...manage, asyncHandler(deleteLessonController));
lessonsRouter.post("/:lessonId/file", ...manage, asyncHandler(ensureLessonManagePermission), uploadLessonFile, asyncHandler(uploadLessonFileController));
