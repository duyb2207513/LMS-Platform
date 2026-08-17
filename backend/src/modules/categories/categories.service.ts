import { AppError } from "../../common/errors/AppError.js";
import { createSlug } from "../../common/utils/slug.js";
import { prisma } from "../../config/database.js";
import type { CreateCategoryInput, UpdateCategoryInput } from "./categories.types.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function ensureValidCategoryId(categoryId: string): void {
  if (!UUID_PATTERN.test(categoryId)) {
    throw new AppError(404, "Category not found");
  }
}

function isPrismaErrorWithCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === code
  );
}

async function ensureCategoryIsUnique(
  name: string,
  slug: string,
  excludedCategoryId?: string
): Promise<void> {
  const duplicate = await prisma.category.findFirst({
    where: {
      ...(excludedCategoryId ? { id: { not: excludedCategoryId } } : {}),
      OR: [
        { name: { equals: name, mode: "insensitive" } },
        { slug }
      ]
    },
    select: { id: true }
  });

  if (duplicate) {
    throw new AppError(409, "Category name or slug already exists");
  }
}

export async function listCategories() {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { courses: true } }
    }
  });
}

export async function createCategory(input: CreateCategoryInput) {
  const slug = createSlug(input.name);

  if (!slug) {
    throw new AppError(400, "Name must contain characters that can form a slug");
  }

  await ensureCategoryIsUnique(input.name, slug);

  try {
    return await prisma.category.create({
      data: {
        name: input.name,
        slug,
        description: input.description
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { courses: true } }
      }
    });
  } catch (error) {
    if (isPrismaErrorWithCode(error, "P2002")) {
      throw new AppError(409, "Category name or slug already exists");
    }

    throw error;
  }
}

export async function updateCategory(categoryId: string, input: UpdateCategoryInput) {
  ensureValidCategoryId(categoryId);

  const existingCategory = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true, name: true, slug: true }
  });

  if (!existingCategory) {
    throw new AppError(404, "Category not found");
  }

  const name = input.name ?? existingCategory.name;
  const slug = input.name ? createSlug(input.name) : existingCategory.slug;

  if (!slug) {
    throw new AppError(400, "Name must contain characters that can form a slug");
  }

  if (input.name) {
    await ensureCategoryIsUnique(name, slug, categoryId);
  }

  try {
    return await prisma.category.update({
      where: { id: categoryId },
      data: {
        ...(input.name === undefined ? {} : { name, slug }),
        ...(input.description === undefined ? {} : { description: input.description })
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { courses: true } }
      }
    });
  } catch (error) {
    if (isPrismaErrorWithCode(error, "P2002")) {
      throw new AppError(409, "Category name or slug already exists");
    }
    if (isPrismaErrorWithCode(error, "P2025")) {
      throw new AppError(404, "Category not found");
    }

    throw error;
  }
}

export async function deleteCategory(categoryId: string): Promise<void> {
  ensureValidCategoryId(categoryId);

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: {
      id: true,
      _count: { select: { courses: true } }
    }
  });

  if (!category) {
    throw new AppError(404, "Category not found");
  }

  if (category._count.courses > 0) {
    throw new AppError(409, "Category is being used by one or more courses");
  }

  try {
    await prisma.category.delete({ where: { id: categoryId } });
  } catch (error) {
    if (isPrismaErrorWithCode(error, "P2003")) {
      throw new AppError(409, "Category is being used by one or more courses");
    }
    if (isPrismaErrorWithCode(error, "P2025")) {
      throw new AppError(404, "Category not found");
    }

    throw error;
  }
}
