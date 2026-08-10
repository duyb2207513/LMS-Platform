import { Router } from "express"; import { authenticate } from "../../common/middlewares/authenticate.js"; import { validateRequest } from "../../common/middlewares/validateRequest.js"; import { asyncHandler } from "../../common/utils/asyncHandler.js"; import { createCommentController, deleteCommentController, listCommentsController, updateCommentController } from "./comments.controller.js"; import { validateCreateCommentInput, validateUpdateCommentInput } from "./comments.validation.js";
export const lessonCommentsRouter = Router({ mergeParams: true });
/**
 * @openapi
 * /lessons/{lessonId}/comments:
 *   get:
 *     summary: List lesson comments with replies
 *     tags: [Comments]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: lessonId, required: true, schema: { type: string, format: uuid } }]
 *     responses: { 200: { description: Comments retrieved successfully }, 403: { description: Lesson access required } }
 *   post:
 *     summary: Comment on a lesson or reply using parentId
 *     tags: [Comments]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: lessonId, required: true, schema: { type: string, format: uuid } }]
 *     requestBody: { required: true, content: { application/json: { schema: { $ref: '#/components/schemas/CreateCommentRequest' } } } }
 *     responses: { 201: { description: Comment created successfully }, 400: { description: Invalid nested reply }, 403: { description: Lesson access required } }
 */
lessonCommentsRouter.get("/", authenticate, asyncHandler(listCommentsController));
lessonCommentsRouter.post("/", authenticate, validateRequest(validateCreateCommentInput), asyncHandler(createCommentController));
export const commentsRouter = Router();
/**
 * @openapi
 * /comments/{commentId}:
 *   patch:
 *     summary: Update own comment
 *     tags: [Comments]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: commentId, required: true, schema: { type: string, format: uuid } }]
 *     requestBody: { required: true, content: { application/json: { schema: { $ref: '#/components/schemas/UpdateCommentRequest' } } } }
 *     responses: { 200: { description: Comment updated successfully }, 403: { description: Comment ownership required } }
 *   delete:
 *     summary: Soft-delete own comment (course owner/admin may moderate)
 *     tags: [Comments]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: commentId, required: true, schema: { type: string, format: uuid } }]
 *     responses: { 204: { description: Comment deleted successfully } }
 */
commentsRouter.patch("/:commentId", authenticate, validateRequest(validateUpdateCommentInput), asyncHandler(updateCommentController));
commentsRouter.delete("/:commentId", authenticate, asyncHandler(deleteCommentController));
