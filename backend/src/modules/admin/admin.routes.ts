import { Router } from "express";
import { authenticate } from "../../common/middlewares/authenticate.js";
import { authorize } from "../../common/middlewares/authorize.js";
import { validateRequest } from "../../common/middlewares/validateRequest.js";
import { asyncHandler } from "../../common/utils/asyncHandler.js";
import { commentsController, coursesController, dashboardController, deleteCommentController, deleteReviewController, reviewsController, updateCourseController, updateUserController, usersController } from "./admin.controller.js";
import { validateAdminCourseUpdate, validateAdminUserUpdate } from "./admin.validation.js";

const router = Router();
router.use(authenticate, authorize("ADMIN"));
/**
 * @openapi
 * /admin/dashboard:
 *   get:
 *     summary: Get basic platform statistics and recent activity
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Dashboard statistics }, 403: { description: Admin only } }
 * /admin/users:
 *   get:
 *     summary: List and filter users
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: query, name: page, schema: { type: integer } }, { in: query, name: limit, schema: { type: integer } }, { in: query, name: search, schema: { type: string } }, { in: query, name: role, schema: { type: string, enum: [STUDENT, INSTRUCTOR, ADMIN] } }, { in: query, name: status, schema: { type: string, enum: [ACTIVE, BLOCKED] } }]
 *     responses: { 200: { description: Paginated users } }
 * /admin/users/{userId}:
 *   patch:
 *     summary: Change a user's role or status
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: userId, required: true, schema: { type: string, format: uuid } }]
 *     requestBody: { required: true, content: { application/json: { schema: { $ref: '#/components/schemas/AdminUserUpdateRequest' } } } }
 *     responses: { 200: { description: User updated }, 409: { description: Cannot remove own admin access } }
 * /admin/courses:
 *   get:
 *     summary: List every course for moderation
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: query, name: page, schema: { type: integer } }, { in: query, name: limit, schema: { type: integer } }, { in: query, name: search, schema: { type: string } }, { in: query, name: status, schema: { type: string, enum: [DRAFT, PUBLISHED, ARCHIVED] } }]
 *     responses: { 200: { description: Paginated courses } }
 * /admin/courses/{courseId}:
 *   patch:
 *     summary: Publish, unpublish, or archive a course
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: courseId, required: true, schema: { type: string, format: uuid } }]
 *     requestBody: { required: true, content: { application/json: { schema: { type: object, required: [status], properties: { status: { type: string, enum: [DRAFT, PUBLISHED, ARCHIVED] } } } } } }
 *     responses: { 200: { description: Course status updated } }
 * /admin/reviews:
 *   get:
 *     summary: List reviews for moderation
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Paginated reviews } }
 * /admin/reviews/{reviewId}:
 *   delete:
 *     summary: Delete a review
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: reviewId, required: true, schema: { type: string, format: uuid } }]
 *     responses: { 204: { description: Review deleted } }
 * /admin/comments:
 *   get:
 *     summary: List comments for moderation
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Paginated comments } }
 * /admin/comments/{commentId}:
 *   delete:
 *     summary: Soft-delete a comment
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: commentId, required: true, schema: { type: string, format: uuid } }]
 *     responses: { 204: { description: Comment moderated } }
 */
router.get("/dashboard", asyncHandler(dashboardController));
router.get("/users", asyncHandler(usersController)); router.patch("/users/:userId", validateRequest(validateAdminUserUpdate), asyncHandler(updateUserController));
router.get("/courses", asyncHandler(coursesController)); router.patch("/courses/:courseId", validateRequest(validateAdminCourseUpdate), asyncHandler(updateCourseController));
router.get("/reviews", asyncHandler(reviewsController)); router.delete("/reviews/:reviewId", asyncHandler(deleteReviewController));
router.get("/comments", asyncHandler(commentsController)); router.delete("/comments/:commentId", asyncHandler(deleteCommentController));
export default router;
