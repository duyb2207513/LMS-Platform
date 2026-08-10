import { Router } from "express"; import { authenticate } from "../../common/middlewares/authenticate.js"; import { authorize } from "../../common/middlewares/authorize.js"; import { validateRequest } from "../../common/middlewares/validateRequest.js"; import { asyncHandler } from "../../common/utils/asyncHandler.js"; import { createReviewController, deleteReviewController, listReviewsController, updateReviewController } from "./reviews.controller.js"; import { validateCreateReviewInput, validateUpdateReviewInput } from "./reviews.validation.js";
export const courseReviewsRouter = Router({ mergeParams: true });
/**
 * @openapi
 * /courses/{courseId}/reviews:
 *   get:
 *     summary: List course reviews and rating summary
 *     tags: [Reviews]
 *     parameters: [{ in: path, name: courseId, required: true, schema: { type: string, format: uuid } }]
 *     responses: { 200: { description: Reviews retrieved successfully }, 404: { description: Published course not found } }
 *   post:
 *     summary: Review an enrolled course
 *     tags: [Reviews]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: courseId, required: true, schema: { type: string, format: uuid } }]
 *     requestBody: { required: true, content: { application/json: { schema: { $ref: '#/components/schemas/CreateReviewRequest' } } } }
 *     responses: { 201: { description: Review created successfully }, 403: { description: Enrollment required }, 409: { description: Course already reviewed } }
 */
courseReviewsRouter.get("/", asyncHandler(listReviewsController));
courseReviewsRouter.post("/", authenticate, authorize("STUDENT"), validateRequest(validateCreateReviewInput), asyncHandler(createReviewController));
export const reviewsRouter = Router();
/**
 * @openapi
 * /reviews/{reviewId}:
 *   patch:
 *     summary: Update own review
 *     tags: [Reviews]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: reviewId, required: true, schema: { type: string, format: uuid } }]
 *     requestBody: { required: true, content: { application/json: { schema: { $ref: '#/components/schemas/UpdateReviewRequest' } } } }
 *     responses: { 200: { description: Review updated successfully }, 403: { description: Review ownership required } }
 *   delete:
 *     summary: Delete own review (admin may moderate)
 *     tags: [Reviews]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: reviewId, required: true, schema: { type: string, format: uuid } }]
 *     responses: { 204: { description: Review deleted successfully } }
 */
reviewsRouter.patch("/:reviewId", authenticate, authorize("STUDENT"), validateRequest(validateUpdateReviewInput), asyncHandler(updateReviewController));
reviewsRouter.delete("/:reviewId", authenticate, asyncHandler(deleteReviewController));
