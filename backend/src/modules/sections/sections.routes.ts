import { Router } from "express";
import { authenticate } from "../../common/middlewares/authenticate.js";
import { authorize } from "../../common/middlewares/authorize.js";
import { validateRequest } from "../../common/middlewares/validateRequest.js";
import { asyncHandler } from "../../common/utils/asyncHandler.js";
import { createSectionController, deleteSectionController, listSectionsController, updateSectionController } from "./sections.controller.js";
import { validateCreateSectionInput, validateUpdateSectionInput } from "./sections.validation.js";

export const courseSectionsRouter = Router({ mergeParams: true });
const manage = [authenticate, authorize("INSTRUCTOR", "ADMIN")] as const;

/**
 * @openapi
 * /courses/{courseId}/sections:
 *   get:
 *     summary: List sections and lessons for course management
 *     tags: [Sections]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: courseId, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200: { description: Sections retrieved successfully }
 *       403: { description: Course ownership required }
 *   post:
 *     summary: Create a section
 *     tags: [Sections]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: courseId, required: true, schema: { type: string, format: uuid } }]
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { $ref: '#/components/schemas/CreateSectionRequest' } } }
 *     responses:
 *       201: { description: Section created successfully }
 *       403: { description: Instructor must own the course }
 */
courseSectionsRouter.get("/", ...manage, asyncHandler(listSectionsController));
courseSectionsRouter.post("/", ...manage, validateRequest(validateCreateSectionInput), asyncHandler(createSectionController));

export const sectionsRouter = Router();
/**
 * @openapi
 * /sections/{sectionId}:
 *   patch:
 *     summary: Update a section
 *     tags: [Sections]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: sectionId, required: true, schema: { type: string, format: uuid } }]
 *     requestBody: { required: true, content: { application/json: { schema: { $ref: '#/components/schemas/UpdateSectionRequest' } } } }
 *     responses: { 200: { description: Section updated successfully }, 403: { description: Ownership required }, 404: { description: Section not found } }
 *   delete:
 *     summary: Delete a section and its lessons
 *     tags: [Sections]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: sectionId, required: true, schema: { type: string, format: uuid } }]
 *     responses: { 204: { description: Section deleted successfully }, 403: { description: Ownership required }, 404: { description: Section not found } }
 */
sectionsRouter.patch("/:sectionId", ...manage, validateRequest(validateUpdateSectionInput), asyncHandler(updateSectionController));
sectionsRouter.delete("/:sectionId", ...manage, asyncHandler(deleteSectionController));
