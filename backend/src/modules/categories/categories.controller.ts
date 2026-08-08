import type { Request, Response } from "express";
import { sendSuccess } from "../../common/utils/response.js";
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory
} from "./categories.service.js";
import type { CreateCategoryInput, UpdateCategoryInput } from "./categories.types.js";

function getCategoryId(request: Request): string {
  const categoryId = request.params.categoryId;
  return Array.isArray(categoryId) ? (categoryId[0] ?? "") : categoryId;
}

export async function listCategoriesController(
  _request: Request,
  response: Response
): Promise<void> {
  const categories = await listCategories();
  sendSuccess(response, 200, "Categories retrieved successfully", categories);
}

export async function createCategoryController(
  request: Request,
  response: Response
): Promise<void> {
  const category = await createCategory(request.body as CreateCategoryInput);
  sendSuccess(response, 201, "Category created successfully", category);
}

export async function updateCategoryController(
  request: Request,
  response: Response
): Promise<void> {
  const category = await updateCategory(
    getCategoryId(request),
    request.body as UpdateCategoryInput
  );
  sendSuccess(response, 200, "Category updated successfully", category);
}

export async function deleteCategoryController(
  request: Request,
  response: Response
): Promise<void> {
  await deleteCategory(getCategoryId(request));
  response.status(204).send();
}
