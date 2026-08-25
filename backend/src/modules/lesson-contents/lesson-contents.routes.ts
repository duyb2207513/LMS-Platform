import { Router } from "express"; import { authenticate } from "../../common/middlewares/authenticate.js"; import { authorize } from "../../common/middlewares/authorize.js"; import { validateRequest } from "../../common/middlewares/validateRequest.js"; import { asyncHandler } from "../../common/utils/asyncHandler.js"; import { uploadLessonContentFile } from "../../config/upload.js";
import { createController,deleteController,listController,reorderController,updateController,uploadController } from "./lesson-contents.controller.js"; import { validateCreateLessonContent,validateReorderLessonContents,validateUpdateLessonContent } from "./lesson-contents.validation.js";
const manage=[authenticate,authorize("INSTRUCTOR","ADMIN")] as const;
export const lessonContentsByLessonRouter=Router({mergeParams:true});
/** @openapi
 * /lessons/{lessonId}/contents:
 *   get: { summary: List ordered lesson content blocks, tags: [Lesson contents], security: [{ bearerAuth: [] }], parameters: [{ in: path, name: lessonId, required: true, schema: { type: string, format: uuid } }], responses: { 200: { description: Content blocks retrieved } } }
 *   post: { summary: Add a text, video, or document block, tags: [Lesson contents], security: [{ bearerAuth: [] }], parameters: [{ in: path, name: lessonId, required: true, schema: { type: string, format: uuid } }], requestBody: { required: true, content: { application/json: { schema: { $ref: '#/components/schemas/LessonContentRequest' } } } }, responses: { 201: { description: Content block created } } }
 * /lessons/{lessonId}/contents/reorder:
 *   patch: { summary: Reorder all content blocks, tags: [Lesson contents], security: [{ bearerAuth: [] }], parameters: [{ in: path, name: lessonId, required: true, schema: { type: string, format: uuid } }], requestBody: { required: true, content: { application/json: { schema: { type: object, required: [contentIds], properties: { contentIds: { type: array, items: { type: string, format: uuid } } } } } } }, responses: { 200: { description: Content blocks reordered } } }
 */
lessonContentsByLessonRouter.get("/",...manage,asyncHandler(listController)); lessonContentsByLessonRouter.post("/",...manage,validateRequest(validateCreateLessonContent),asyncHandler(createController)); lessonContentsByLessonRouter.patch("/reorder",...manage,validateRequest(validateReorderLessonContents),asyncHandler(reorderController));
export const lessonContentsRouter=Router();
/** @openapi
 * /lesson-contents/{contentId}:
 *   patch: { summary: Update a text content block, tags: [Lesson contents], security: [{ bearerAuth: [] }], parameters: [{ in: path, name: contentId, required: true, schema: { type: string, format: uuid } }], responses: { 200: { description: Content block updated } } }
 *   delete: { summary: Delete a content block, tags: [Lesson contents], security: [{ bearerAuth: [] }], parameters: [{ in: path, name: contentId, required: true, schema: { type: string, format: uuid } }], responses: { 204: { description: Content block deleted } } }
 * /lesson-contents/{contentId}/file:
 *   post: { summary: Upload the image, video, or document of a content block, tags: [Lesson contents], security: [{ bearerAuth: [] }], parameters: [{ in: path, name: contentId, required: true, schema: { type: string, format: uuid } }], requestBody: { required: true, content: { multipart/form-data: { schema: { type: object, required: [file], properties: { file: { type: string, format: binary } } } } } }, responses: { 200: { description: File uploaded } } }
 */
lessonContentsRouter.patch("/:contentId",...manage,validateRequest(validateUpdateLessonContent),asyncHandler(updateController)); lessonContentsRouter.delete("/:contentId",...manage,asyncHandler(deleteController)); lessonContentsRouter.post("/:contentId/file",...manage,uploadLessonContentFile,asyncHandler(uploadController));
