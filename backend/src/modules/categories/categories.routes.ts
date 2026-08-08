import { Router } from "express";
import { authenticate } from "../../common/middlewares/authenticate.js";
import { authorize } from "../../common/middlewares/authorize.js";
import { validateRequest } from "../../common/middlewares/validateRequest.js";
import { asyncHandler } from "../../common/utils/asyncHandler.js";
import {
  createCategoryController,
  deleteCategoryController,
  listCategoriesController,
  updateCategoryController
} from "./categories.controller.js";
import {
  validateCreateCategoryInput,
  validateUpdateCategoryInput
} from "./categories.validation.js";

const categoriesRouter = Router();

/**
 * @openapi
 * /categories:
 *   get:
 *     operationId: listCategories
 *     summary: List categories
 *     description: Public endpoint returning categories sorted by name.
 *     tags: [Categories]
 *     security: []
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CategoryListResponse' }
 *       500:
 *         description: Unexpected server error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *   post:
 *     operationId: createCategory
 *     summary: Create a category
 *     description: Admin-only endpoint. The slug is generated automatically from the category name.
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateCategoryRequest' }
 *           example:
 *             name: Lập trình Web
 *             description: Các khóa học phát triển website
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CategoryResponse' }
 *       400:
 *         description: Category data is invalid
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       403:
 *         description: Admin role required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       409:
 *         description: Category name or slug already exists
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
categoriesRouter.get("/", asyncHandler(listCategoriesController));
categoriesRouter.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  validateRequest(validateCreateCategoryInput),
  asyncHandler(createCategoryController)
);

/**
 * @openapi
 * /categories/{categoryId}:
 *   patch:
 *     operationId: updateCategory
 *     summary: Update a category
 *     description: Admin-only endpoint. Changing the name also regenerates the slug.
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateCategoryRequest' }
 *     responses:
 *       200:
 *         description: Category updated successfully
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CategoryResponse' }
 *       400:
 *         description: Category data is invalid
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       403:
 *         description: Admin role required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       404:
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       409:
 *         description: Category name or slug already exists
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *   delete:
 *     operationId: deleteCategory
 *     summary: Delete a category
 *     description: Admin-only endpoint. A category used by a course cannot be deleted.
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204:
 *         description: Category deleted successfully
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       403:
 *         description: Admin role required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       404:
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       409:
 *         description: Category is currently used by one or more courses
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
categoriesRouter.patch(
  "/:categoryId",
  authenticate,
  authorize("ADMIN"),
  validateRequest(validateUpdateCategoryInput),
  asyncHandler(updateCategoryController)
);
categoriesRouter.delete(
  "/:categoryId",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(deleteCategoryController)
);

export default categoriesRouter;
