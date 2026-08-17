import type { RequestValidationResult } from "../../common/middlewares/validateRequest.js";
import type {
  CourseLevel,
  CourseStatus,
  CreateCourseInput,
  InstructorCourseQuery,
  PublicCourseQuery,
  UpdateCourseInput
} from "./courses.types.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LEVELS: CourseLevel[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];
const STATUSES: CourseStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];

function queryString(value: unknown): string | undefined {
  return typeof value === "string" ? value.trim() : undefined;
}

function positiveInteger(
  value: unknown,
  fallback: number,
  max: number,
  field: string,
  errors: Record<string, string>
): number {
  if (value === undefined) {
    return fallback;
  }

  const raw = queryString(value);
  const parsed = raw && /^\d+$/.test(raw) ? Number(raw) : Number.NaN;

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > max) {
    errors[field] = `${field} must be an integer between 1 and ${max}`;
    return fallback;
  }

  return parsed;
}

function nonNegativeQueryNumber(
  value: unknown,
  field: string,
  errors: Record<string, string>
): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  const raw = queryString(value);
  const parsed = raw === undefined || raw === "" ? Number.NaN : Number(raw);

  if (!Number.isFinite(parsed) || parsed < 0) {
    errors[field] = `${field} must be a non-negative number`;
    return undefined;
  }

  return parsed;
}

function nullableText(
  value: unknown,
  field: string,
  errors: Record<string, string>
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") {
    errors[field] = `${field} must be a string or null`;
    return undefined;
  }
  return value.trim() || null;
}

export function validatePublicCourseQuery(
  query: unknown
): RequestValidationResult<PublicCourseQuery> {
  if (!query || typeof query !== "object" || Array.isArray(query)) {
    return { errors: { query: "Query must be an object" } };
  }

  const input = query as Record<string, unknown>;
  const errors: Record<string, string> = {};
  const allowed = new Set([
    "page", "limit", "search", "categoryId", "level", "minPrice", "maxPrice",
    "sortBy", "sortOrder"
  ]);
  for (const key of Object.keys(input)) {
    if (!allowed.has(key)) errors[key] = `${key} is not a supported query parameter`;
  }

  const page = positiveInteger(input.page, 1, Number.MAX_SAFE_INTEGER, "page", errors);
  const limit = positiveInteger(input.limit, 12, 50, "limit", errors);
  const search = queryString(input.search);
  const categoryId = queryString(input.categoryId);
  const level = queryString(input.level);
  const minPrice = nonNegativeQueryNumber(input.minPrice, "minPrice", errors);
  const maxPrice = nonNegativeQueryNumber(input.maxPrice, "maxPrice", errors);
  const sortBy = queryString(input.sortBy) ?? "createdAt";
  const sortOrder = queryString(input.sortOrder) ?? "desc";

  if (input.search !== undefined && !search) errors.search = "search must be a non-empty string";
  if (categoryId && !UUID_PATTERN.test(categoryId)) errors.categoryId = "categoryId must be a valid UUID";
  if (input.categoryId !== undefined && !categoryId) errors.categoryId = "categoryId must be a valid UUID";
  if (level && !LEVELS.includes(level as CourseLevel)) errors.level = "level is invalid";
  if (input.level !== undefined && !level) errors.level = "level is invalid";
  if (!["createdAt", "title", "price", "publishedAt"].includes(sortBy)) errors.sortBy = "sortBy is invalid";
  if (!["asc", "desc"].includes(sortOrder)) errors.sortOrder = "sortOrder must be asc or desc";
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    errors.maxPrice = "maxPrice must be greater than or equal to minPrice";
  }

  if (Object.keys(errors).length > 0) return { errors };
  return {
    data: {
      page,
      limit,
      ...(search ? { search } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(level ? { level: level as CourseLevel } : {}),
      ...(minPrice === undefined ? {} : { minPrice }),
      ...(maxPrice === undefined ? {} : { maxPrice }),
      sortBy: sortBy as PublicCourseQuery["sortBy"],
      sortOrder: sortOrder as PublicCourseQuery["sortOrder"]
    }
  };
}

export function validateInstructorCourseQuery(
  query: unknown
): RequestValidationResult<InstructorCourseQuery> {
  if (!query || typeof query !== "object" || Array.isArray(query)) {
    return { errors: { query: "Query must be an object" } };
  }

  const input = query as Record<string, unknown>;
  const errors: Record<string, string> = {};
  const allowed = new Set(["page", "limit", "search", "status"]);
  for (const key of Object.keys(input)) {
    if (!allowed.has(key)) errors[key] = `${key} is not a supported query parameter`;
  }
  const page = positiveInteger(input.page, 1, Number.MAX_SAFE_INTEGER, "page", errors);
  const limit = positiveInteger(input.limit, 10, 50, "limit", errors);
  const search = queryString(input.search);
  const status = queryString(input.status);
  if (input.search !== undefined && !search) errors.search = "search must be a non-empty string";
  if (status && !STATUSES.includes(status as CourseStatus)) errors.status = "status is invalid";
  if (input.status !== undefined && !status) errors.status = "status is invalid";
  if (Object.keys(errors).length > 0) return { errors };
  return {
    data: {
      page,
      limit,
      ...(search ? { search } : {}),
      ...(status ? { status: status as CourseStatus } : {})
    }
  };
}

const COURSE_FIELDS = new Set([
  "title", "description", "categoryId", "level", "price", "isFree", "language",
  "requirements", "learningOutcomes"
]);

function validateCourseFields(
  input: Record<string, unknown>,
  partial: boolean
): RequestValidationResult<CreateCourseInput | UpdateCourseInput> {
  const errors: Record<string, string> = {};
  const data: UpdateCourseInput = {};
  for (const key of Object.keys(input)) {
    if (!COURSE_FIELDS.has(key)) errors[key] = `${key} cannot be set through this endpoint`;
  }

  const required = (field: string) => !partial || Object.prototype.hasOwnProperty.call(input, field);
  if (required("title")) {
    const title = typeof input.title === "string" ? input.title.trim() : "";
    if (!title) errors.title = "Title is required";
    else if (title.length > 255) errors.title = "Title must not exceed 255 characters";
    else data.title = title;
  }
  if (required("description")) {
    const description = typeof input.description === "string" ? input.description.trim() : "";
    if (!description) errors.description = "Description is required";
    else data.description = description;
  }
  if (required("categoryId")) {
    const categoryId = typeof input.categoryId === "string" ? input.categoryId.trim() : "";
    if (!UUID_PATTERN.test(categoryId)) errors.categoryId = "categoryId must be a valid UUID";
    else data.categoryId = categoryId;
  }
  if (required("level")) {
    const level = typeof input.level === "string" ? input.level : "";
    if (!LEVELS.includes(level as CourseLevel)) errors.level = "level is invalid";
    else data.level = level as CourseLevel;
  }
  if (Object.prototype.hasOwnProperty.call(input, "price")) {
    const rawPrice = input.price;
    const priceNum = typeof rawPrice === "number" ? rawPrice : typeof rawPrice === "string" && rawPrice.trim() !== "" ? Number(rawPrice) : NaN;
    if (isNaN(priceNum) || !Number.isFinite(priceNum) || priceNum < 0) {
      errors.price = "Price must be a non-negative number";
    } else data.price = priceNum;
  }
  if (Object.prototype.hasOwnProperty.call(input, "isFree")) {
    if (typeof input.isFree !== "boolean") errors.isFree = "isFree must be a boolean";
    else data.isFree = input.isFree;
  }
  if (Object.prototype.hasOwnProperty.call(input, "language")) {
    const language = typeof input.language === "string" ? input.language.trim() : "";
    if (!language || language.length > 50) errors.language = "Language must be between 1 and 50 characters";
    else data.language = language;
  }
  for (const field of ["requirements", "learningOutcomes"] as const) {
    if (Object.prototype.hasOwnProperty.call(input, field)) {
      const value = nullableText(input[field], field, errors);
      if (value !== undefined) data[field] = value;
    }
  }

  if (partial && Object.keys(input).length === 0) errors.body = "At least one course field is required";
  if (Object.keys(errors).length > 0) return { errors };

  if (!partial) {
    return {
      data: {
        title: data.title!,
        description: data.description!,
        categoryId: data.categoryId!,
        level: data.level!,
        price: data.isFree ? 0 : (data.price ?? 0),
        isFree: data.isFree ?? false,
        language: data.language ?? "Vietnamese",
        ...(data.requirements === undefined ? {} : { requirements: data.requirements }),
        ...(data.learningOutcomes === undefined ? {} : { learningOutcomes: data.learningOutcomes })
      }
    };
  }
  if (data.isFree === true) data.price = 0;
  return { data };
}

export function validateCreateCourseInput(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { errors: { body: "Request body must be a JSON object" } };
  }
  return validateCourseFields(body as Record<string, unknown>, false) as RequestValidationResult<CreateCourseInput>;
}

export function validateUpdateCourseInput(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { errors: { body: "Request body must be a JSON object" } };
  }
  return validateCourseFields(body as Record<string, unknown>, true) as RequestValidationResult<UpdateCourseInput>;
}
