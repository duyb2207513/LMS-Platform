import { Router } from "express";
import { authenticate } from "../../common/middlewares/authenticate.js";
import { authorize } from "../../common/middlewares/authorize.js";
import { validateRequest } from "../../common/middlewares/validateRequest.js";
import { asyncHandler } from "../../common/utils/asyncHandler.js";
import { getCourseProgressController, updateLessonProgressController } from "./progress.controller.js";
import { validateUpdateLessonProgressInput } from "./progress.validation.js";

const student = [authenticate, authorize("STUDENT")] as const;
export const lessonProgressRouter = Router({ mergeParams: true });
/**
 * @openapi
 * /lessons/{lessonId}/progress:
 *   patch:
 *     summary: Save video position or mark a lesson complete
 *     tags: [Progress]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: lessonId, required: true, schema: { type: string, format: uuid } }]
 *     requestBody: { required: true, content: { application/json: { schema: { $ref: '#/components/schemas/UpdateLessonProgressRequest' } } } }
 *     responses:
 *       200: { description: Progress saved and course percentage recalculated, content: { application/json: { schema: { $ref: '#/components/schemas/LessonProgressResponse' } } } }
 *       400: { description: Invalid watch position }
 *       403: { description: Active enrollment required }
 *       404: { description: Published lesson not found }
 */
lessonProgressRouter.patch("/", ...student, validateRequest(validateUpdateLessonProgressInput), asyncHandler(updateLessonProgressController));

export const courseProgressRouter = Router({ mergeParams: true });
/**
 * @openapi
 * /courses/{courseId}/progress:
 *   get:
 *     summary: Get the student's course completion percentage
 *     tags: [Progress]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: courseId, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200: { description: Course progress retrieved successfully, content: { application/json: { schema: { $ref: '#/components/schemas/CourseProgressResponse' } } } }
 *       403: { description: Active enrollment required }
 */
courseProgressRouter.get("/", ...student, asyncHandler(getCourseProgressController));
