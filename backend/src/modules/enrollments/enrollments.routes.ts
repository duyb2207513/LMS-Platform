import { Router } from "express";
import { authenticate } from "../../common/middlewares/authenticate.js";
import { authorize } from "../../common/middlewares/authorize.js";
import { asyncHandler } from "../../common/utils/asyncHandler.js";
import { enrollFreeCourseController, listMyEnrollmentsController } from "./enrollments.controller.js";

export const courseEnrollmentRouter = Router({ mergeParams: true });
/**
 * @openapi
 * /courses/{courseId}/enroll:
 *   post:
 *     summary: Enroll in a free published course
 *     tags: [Enrollments]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: courseId, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       201: { description: Course enrolled successfully, content: { application/json: { schema: { $ref: '#/components/schemas/EnrollmentResponse' } } } }
 *       403: { description: Student role required }
 *       404: { description: Published course not found }
 *       409: { description: Paid course or duplicate enrollment }
 */
courseEnrollmentRouter.post("/", authenticate, authorize("STUDENT"), asyncHandler(enrollFreeCourseController));

export const enrollmentsRouter = Router();
/**
 * @openapi
 * /enrollments/me:
 *   get:
 *     summary: List the authenticated student's enrollments
 *     tags: [Enrollments]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Enrollments retrieved successfully }, 403: { description: Student role required } }
 */
enrollmentsRouter.get("/me", authenticate, authorize("STUDENT"), asyncHandler(listMyEnrollmentsController));
