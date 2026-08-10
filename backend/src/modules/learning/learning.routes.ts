import { Router } from "express";
import { authenticate } from "../../common/middlewares/authenticate.js";
import { asyncHandler } from "../../common/utils/asyncHandler.js";
import { getCourseContentController } from "./learning.controller.js";

export const courseLearningRouter = Router({ mergeParams: true });
/**
 * @openapi
 * /courses/{courseId}/content:
 *   get:
 *     summary: Get course sections and lesson content
 *     description: Allowed for Admin, the course owner, or a Student with an active/completed enrollment. Students only receive published lessons.
 *     tags: [Learning]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: courseId, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200: { description: Course content retrieved successfully, content: { application/json: { schema: { $ref: '#/components/schemas/CourseContentResponse' } } } }
 *       401: { description: Authentication required }
 *       403: { description: Enrollment or ownership required }
 *       404: { description: Course not found }
 */
courseLearningRouter.get("/", authenticate, asyncHandler(getCourseContentController));
