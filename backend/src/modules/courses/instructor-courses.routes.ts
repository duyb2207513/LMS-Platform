import { Router } from "express";
import { authenticate } from "../../common/middlewares/authenticate.js";
import { authorize } from "../../common/middlewares/authorize.js";
import { validateQuery } from "../../common/middlewares/validateQuery.js";
import { asyncHandler } from "../../common/utils/asyncHandler.js";
import {
  getInstructorCourseController,
  listInstructorCoursesController
} from "./courses.controller.js";
import { validateInstructorCourseQuery } from "./courses.validation.js";

const instructorCoursesRouter = Router();

/**
 * @openapi
 * /instructor/courses:
 *   get:
 *     operationId: listInstructorCourses
 *     summary: List courses managed by the instructor
 *     description: Instructors see only their courses; Admins can see all courses.
 *     tags: [Courses]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer, minimum: 1, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, minimum: 1, maximum: 50, default: 10 } }
 *       - { in: query, name: search, schema: { type: string } }
 *       - { in: query, name: status, schema: { $ref: '#/components/schemas/CourseStatus' } }
 *     responses:
 *       200:
 *         description: Instructor courses retrieved successfully
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CourseListResponse' }
 *       400: { description: Invalid query parameters }
 *       401: { description: Authentication required }
 *       403: { description: Instructor or Admin role required }
 */
instructorCoursesRouter.get(
  "/courses",
  authenticate,
  authorize("INSTRUCTOR", "ADMIN"),
  validateQuery(validateInstructorCourseQuery),
  asyncHandler(listInstructorCoursesController)
);

/**
 * @openapi
 * /instructor/courses/{courseId}:
 *   get:
 *     operationId: getInstructorCourse
 *     summary: Get a course managed by the current instructor
 *     description: Returns draft, published, or archived courses when the caller owns the course. Admins can access every course.
 *     tags: [Courses]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: courseId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Instructor course retrieved successfully
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CourseResponse' }
 *       401: { description: Authentication required }
 *       403: { description: Course ownership or role required }
 *       404: { description: Course not found }
 */
instructorCoursesRouter.get(
  "/courses/:courseId",
  authenticate,
  authorize("INSTRUCTOR", "ADMIN"),
  asyncHandler(getInstructorCourseController)
);

export default instructorCoursesRouter;
