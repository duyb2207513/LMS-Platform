import { AppError } from "../../common/errors/AppError.js";
import { createSlug } from "../../common/utils/slug.js";
import { prisma } from "../../config/database.js";
import type { AuthTokenPayload } from "../auth/auth.types.js";
import type {
  CreateCourseInput,
  InstructorCourseQuery,
  PublicCourseQuery,
  UpdateCourseInput
} from "./courses.types.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function ensureValidCourseId(courseId: string): void {
  if (!UUID_PATTERN.test(courseId)) throw new AppError(404, "Course not found");
}

function isPrismaError(error: unknown, code: string): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === code;
}

function serializeCourse<T extends { price: unknown }>(course: T) {
  return { ...course, price: Number(String(course.price)) };
}

async function ensureCategoryExists(categoryId: string): Promise<void> {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true }
  });
  if (!category) throw new AppError(400, "Category does not exist");
}

async function generateUniqueSlug(title: string, excludedCourseId?: string): Promise<string> {
  const baseSlug = createSlug(title);
  if (!baseSlug) throw new AppError(400, "Title must contain characters that can form a slug");

  let slug = baseSlug;
  let suffix = 2;
  while (
    await prisma.course.findFirst({
      where: {
        slug,
        ...(excludedCourseId ? { id: { not: excludedCourseId } } : {})
      },
      select: { id: true }
    })
  ) {
    slug = `${baseSlug}-${suffix++}`;
  }
  return slug;
}

function assertCanManageCourse(
  course: { instructorId: string },
  actor: AuthTokenPayload
): void {
  if (actor.role !== "ADMIN" && course.instructorId !== actor.userId) {
    throw new AppError(403, "You do not have permission to manage this course");
  }
}

export async function assertCourseManagePermission(
  courseId: string,
  actor: AuthTokenPayload
): Promise<void> {
  ensureValidCourseId(courseId);
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { instructorId: true }
  });
  if (!course) throw new AppError(404, "Course not found");
  assertCanManageCourse(course, actor);
}

export async function listPublicCourses(query: PublicCourseQuery) {
  const where = {
    status: "PUBLISHED" as const,
    ...(query.search
      ? { title: { contains: query.search, mode: "insensitive" as const } }
      : {}),
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    ...(query.level ? { level: query.level } : {}),
    ...(query.minPrice !== undefined || query.maxPrice !== undefined
      ? {
          price: {
            ...(query.minPrice === undefined ? {} : { gte: query.minPrice }),
            ...(query.maxPrice === undefined ? {} : { lte: query.maxPrice })
          }
        }
      : {})
  };

  const [courses, totalItems] = await Promise.all([
    prisma.course.findMany({
      where,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      orderBy: { [query.sortBy]: query.sortOrder },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        thumbnailUrl: true,
        level: true,
        price: true,
        isFree: true,
        status: true,
        instructor: { select: { id: true, fullName: true, avatarUrl: true } },
        category: { select: { id: true, name: true, slug: true } },
        publishedAt: true
      }
    }),
    prisma.course.count({ where })
  ]);

  return {
    data: courses.map(serializeCourse),
    meta: {
      page: query.page,
      limit: query.limit,
      totalItems,
      totalPages: Math.ceil(totalItems / query.limit)
    }
  };
}

export async function getPublicCourse(slug: string) {
  const course = await prisma.course.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      thumbnailUrl: true,
      level: true,
      price: true,
      isFree: true,
      language: true,
      requirements: true,
      learningOutcomes: true,
      status: true,
      publishedAt: true,
      createdAt: true,
      updatedAt: true,
      instructor: { select: { id: true, fullName: true, avatarUrl: true } },
      category: { select: { id: true, name: true, slug: true } }
    }
  });
  if (!course) throw new AppError(404, "Course not found");
  return serializeCourse(course);
}

export async function listInstructorCourses(
  actor: AuthTokenPayload,
  query: InstructorCourseQuery
) {
  const where = {
    ...(actor.role === "ADMIN" ? {} : { instructorId: actor.userId }),
    ...(query.status ? { status: query.status } : {}),
    ...(query.search
      ? { title: { contains: query.search, mode: "insensitive" as const } }
      : {})
  };
  const [courses, totalItems] = await Promise.all([
    prisma.course.findMany({
      where,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        thumbnailUrl: true,
        level: true,
        price: true,
        isFree: true,
        status: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        category: { select: { id: true, name: true, slug: true } },
        instructor: { select: { id: true, fullName: true, avatarUrl: true } }
      }
    }),
    prisma.course.count({ where })
  ]);
  return {
    data: courses.map(serializeCourse),
    meta: {
      page: query.page,
      limit: query.limit,
      totalItems,
      totalPages: Math.ceil(totalItems / query.limit)
    }
  };
}

export async function createCourse(actor: AuthTokenPayload, input: CreateCourseInput) {
  await ensureCategoryExists(input.categoryId);
  const slug = await generateUniqueSlug(input.title);
  try {
    const course = await prisma.course.create({
      data: {
        instructorId: actor.userId,
        categoryId: input.categoryId,
        title: input.title,
        slug,
        description: input.description,
        level: input.level,
        price: input.isFree ? 0 : input.price,
        isFree: input.isFree,
        language: input.language,
        requirements: input.requirements,
        learningOutcomes: input.learningOutcomes
      },
      select: {
        id: true,
        instructorId: true,
        categoryId: true,
        title: true,
        slug: true,
        description: true,
        thumbnailUrl: true,
        level: true,
        price: true,
        isFree: true,
        language: true,
        requirements: true,
        learningOutcomes: true,
        status: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true
      }
    });
    return serializeCourse(course);
  } catch (error) {
    if (isPrismaError(error, "P2002")) {
      throw new AppError(409, "A course with the generated slug already exists");
    }
    throw error;
  }
}

export async function updateCourse(
  courseId: string,
  actor: AuthTokenPayload,
  input: UpdateCourseInput
) {
  ensureValidCourseId(courseId);
  const existing = await prisma.course.findUnique({ where: { id: courseId } });
  if (!existing) throw new AppError(404, "Course not found");
  assertCanManageCourse(existing, actor);
  if (input.categoryId) await ensureCategoryExists(input.categoryId);

  const isFree = input.isFree ?? existing.isFree;
  let price = input.price ?? Number(existing.price);
  if (input.isFree === true) price = 0;
  else if (isFree && input.price !== undefined && input.price !== 0) {
    throw new AppError(400, "A free course must have a price of 0");
  }
  const slug = input.title
    ? await generateUniqueSlug(input.title, courseId)
    : existing.slug;

  try {
    const course = await prisma.course.update({
      where: { id: courseId },
      data: {
        ...input,
        ...(input.title === undefined ? {} : { slug }),
        price,
        isFree
      },
      select: {
        id: true,
        instructorId: true,
        categoryId: true,
        title: true,
        slug: true,
        description: true,
        thumbnailUrl: true,
        level: true,
        price: true,
        isFree: true,
        language: true,
        requirements: true,
        learningOutcomes: true,
        status: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true
      }
    });
    return serializeCourse(course);
  } catch (error) {
    if (isPrismaError(error, "P2002")) throw new AppError(409, "Course slug already exists");
    if (isPrismaError(error, "P2025")) throw new AppError(404, "Course not found");
    throw error;
  }
}

export async function setCourseThumbnail(
  courseId: string,
  actor: AuthTokenPayload,
  thumbnailUrl: string
) {
  ensureValidCourseId(courseId);
  const existing = await prisma.course.findUnique({
    where: { id: courseId },
    select: { instructorId: true, thumbnailUrl: true }
  });
  if (!existing) throw new AppError(404, "Course not found");
  assertCanManageCourse(existing, actor);
  await prisma.course.update({ where: { id: courseId }, data: { thumbnailUrl } });
  return { thumbnailUrl, previousThumbnailUrl: existing.thumbnailUrl };
}

export async function publishCourse(courseId: string, actor: AuthTokenPayload) {
  ensureValidCourseId(courseId);
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new AppError(404, "Course not found");
  assertCanManageCourse(course, actor);
  if (course.status === "PUBLISHED") throw new AppError(409, "Course is already published");
  if (!course.title || !course.description || !course.categoryId || !course.level || !course.thumbnailUrl) {
    throw new AppError(400, "Course must have title, description, category, level, and thumbnail before publishing");
  }
  return prisma.course.update({
    where: { id: courseId },
    data: { status: "PUBLISHED", publishedAt: new Date() },
    select: { id: true, status: true, publishedAt: true }
  });
}

export async function unpublishCourse(courseId: string, actor: AuthTokenPayload) {
  ensureValidCourseId(courseId);
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new AppError(404, "Course not found");
  assertCanManageCourse(course, actor);
  if (course.status !== "PUBLISHED") throw new AppError(409, "Only a published course can be unpublished");
  return prisma.course.update({
    where: { id: courseId },
    data: { status: "DRAFT", publishedAt: null },
    select: { id: true, status: true, publishedAt: true }
  });
}

export async function deleteOrArchiveCourse(
  courseId: string,
  actor: AuthTokenPayload
): Promise<void> {
  ensureValidCourseId(courseId);
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new AppError(404, "Course not found");
  assertCanManageCourse(course, actor);

  if (course.status === "PUBLISHED") {
    await prisma.course.update({ where: { id: courseId }, data: { status: "ARCHIVED" } });
    return;
  }
  if (course.status !== "DRAFT") {
    throw new AppError(409, "Only a draft course can be permanently deleted");
  }
  try {
    await prisma.course.delete({ where: { id: courseId } });
  } catch (error) {
    if (isPrismaError(error, "P2003")) {
      throw new AppError(409, "Course has related data and cannot be deleted");
    }
    throw error;
  }
}
