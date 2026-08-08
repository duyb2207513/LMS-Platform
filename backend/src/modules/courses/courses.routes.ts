import { Router } from "express";
import { authenticate } from "../../common/middlewares/authenticate.js";
import { authorize } from "../../common/middlewares/authorize.js";
import { validateQuery } from "../../common/middlewares/validateQuery.js";
import { validateRequest } from "../../common/middlewares/validateRequest.js";
import { asyncHandler } from "../../common/utils/asyncHandler.js";
import { uploadCourseThumbnail } from "../../config/upload.js";
import {
  createCourseController,
  deleteCourseController,
  getPublicCourseController,
  listPublicCoursesController,
  publishCourseController,
  unpublishCourseController,
  updateCourseController,
  uploadCourseThumbnailController
} from "./courses.controller.js";
import { ensureCourseManagePermission } from "./courses.middleware.js";
import {
  validateCreateCourseInput,
  validatePublicCourseQuery,
  validateUpdateCourseInput
} from "./courses.validation.js";

const coursesRouter = Router();
const courseManagers = [authenticate, authorize("INSTRUCTOR", "ADMIN")];

/**
 * @openapi
 * /courses:
 *   get:
 *     operationId: listPublicCourses
 *     summary: List published courses
 *     tags: [Courses]
 *     security: []
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer, minimum: 1, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, minimum: 1, maximum: 50, default: 12 } }
 *       - { in: query, name: search, schema: { type: string } }
 *       - { in: query, name: categoryId, schema: { type: string, format: uuid } }
 *       - { in: query, name: level, schema: { $ref: '#/components/schemas/CourseLevel' } }
 *       - { in: query, name: minPrice, schema: { type: number, minimum: 0 } }
 *       - { in: query, name: maxPrice, schema: { type: number, minimum: 0 } }
 *       - { in: query, name: sortBy, schema: { type: string, enum: [createdAt, title, price, publishedAt], default: createdAt } }
 *       - { in: query, name: sortOrder, schema: { type: string, enum: [asc, desc], default: desc } }
 *     responses:
 *       200:
 *         description: Courses retrieved successfully
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CourseListResponse' }
 *       400:
 *         description: Query parameters are invalid
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *   post:
 *     operationId: createCourse
 *     summary: Create a draft course
 *     tags: [Courses]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateCourseRequest' }
 *     responses:
 *       201:
 *         description: Course created successfully
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CourseResponse' }
 *       400: { description: Invalid course data }
 *       401: { description: Authentication required }
 *       403: { description: Instructor or Admin role required }
 */
coursesRouter.get(
  "/",
  validateQuery(validatePublicCourseQuery),
  asyncHandler(listPublicCoursesController)
);
coursesRouter.post(
  "/",
  ...courseManagers,
  validateRequest(validateCreateCourseInput),
  asyncHandler(createCourseController)
);

/**
 * @openapi
 * /courses/{courseId}:
 *   patch:
 *     operationId: updateCourse
 *     summary: Update a course
 *     tags: [Courses]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: courseId, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateCourseRequest' }
 *     responses:
 *       200:
 *         description: Course updated successfully
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CourseResponse' }
 *       400: { description: Invalid course data }
 *       401: { description: Authentication required }
 *       403: { description: Course ownership or role required }
 *       404: { description: Course not found }
 *   delete:
 *     operationId: deleteCourse
 *     summary: Delete a draft course or archive a published course
 *     tags: [Courses]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: courseId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       204: { description: Course deleted or archived successfully }
 *       401: { description: Authentication required }
 *       403: { description: Course ownership or role required }
 *       404: { description: Course not found }
 *       409: { description: Course is not eligible for permanent deletion }
 */
coursesRouter.patch(
  "/:courseId",
  ...courseManagers,
  validateRequest(validateUpdateCourseInput),
  asyncHandler(updateCourseController)
);
coursesRouter.delete(
  "/:courseId",
  ...courseManagers,
  asyncHandler(deleteCourseController)
);

/**
 * @openapi
 * /courses/{courseId}/thumbnail:
 *   post:
 *     operationId: uploadCourseThumbnail
 *     summary: Upload a course thumbnail
 *     tags: [Courses]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: courseId, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [thumbnail]
 *             properties:
 *               thumbnail: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Thumbnail uploaded successfully
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ThumbnailResponse' }
 *       400: { description: Missing, invalid, or oversized image }
 *       403: { description: Course ownership required }
 *       404: { description: Course not found }
 */
coursesRouter.post(
  "/:courseId/thumbnail",
  ...courseManagers,
  asyncHandler(ensureCourseManagePermission),
  uploadCourseThumbnail,
  asyncHandler(uploadCourseThumbnailController)
);

/**
 * @openapi
 * /courses/{courseId}/publish:
 *   post:
 *     operationId: publishCourse
 *     summary: Publish a course
 *     tags: [Courses]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: courseId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Course published successfully
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CourseStatusResponse' }
 *       400: { description: Required publish information is missing }
 *       403: { description: Course ownership required }
 *       404: { description: Course not found }
 *       409: { description: Course is already published }
 * /courses/{courseId}/unpublish:
 *   post:
 *     operationId: unpublishCourse
 *     summary: Move a published course back to draft
 *     tags: [Courses]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: courseId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Course unpublished successfully
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CourseStatusResponse' }
 *       403: { description: Course ownership required }
 *       404: { description: Course not found }
 *       409: { description: Course is not published }
 */
coursesRouter.post(
  "/:courseId/publish",
  ...courseManagers,
  asyncHandler(publishCourseController)
);
coursesRouter.post(
  "/:courseId/unpublish",
  ...courseManagers,
  asyncHandler(unpublishCourseController)
);

/**
 * @openapi
 * /courses/{slug}:
 *   get:
 *     operationId: getPublicCourse
 *     summary: Get a published course by slug
 *     tags: [Courses]
 *     security: []
 *     parameters:
 *       - { in: path, name: slug, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Course retrieved successfully
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CourseResponse' }
 *       404: { description: Published course not found }
 */
coursesRouter.get("/:slug", asyncHandler(getPublicCourseController));

export default coursesRouter;
