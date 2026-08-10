import type { RequestValidationResult } from "../../common/middlewares/validateRequest.js";
import type { CreateLessonInput, LessonType, UpdateLessonInput } from "./lessons.types.js";

const FIELDS = new Set(["title", "lessonType", "content", "durationSeconds", "position", "isPreview", "isRequired", "isPublished"]);
const TYPES = ["VIDEO", "TEXT", "DOCUMENT"];

function validate(body: unknown, partial: boolean): RequestValidationResult<CreateLessonInput | UpdateLessonInput> {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { errors: { body: "Request body must be a JSON object" } };
  const input = body as Record<string, unknown>;
  const errors: Record<string, string> = {};
  const data: UpdateLessonInput = {};
  for (const key of Object.keys(input)) if (!FIELDS.has(key)) errors[key] = `${key} cannot be set through this endpoint`;

  if (!partial || Object.hasOwn(input, "title")) {
    const title = typeof input.title === "string" ? input.title.trim() : "";
    if (!title) errors.title = "Title is required";
    else if (title.length > 255) errors.title = "Title must not exceed 255 characters";
    else data.title = title;
  }
  if (!partial || Object.hasOwn(input, "lessonType")) {
    if (!TYPES.includes(String(input.lessonType))) errors.lessonType = "lessonType must be VIDEO, TEXT, or DOCUMENT";
    else data.lessonType = input.lessonType as LessonType;
  }
  if (Object.hasOwn(input, "content")) {
    if (input.content !== null && typeof input.content !== "string") errors.content = "Content must be a string or null";
    else data.content = typeof input.content === "string" ? input.content.trim() || null : null;
  }
  if (Object.hasOwn(input, "durationSeconds")) {
    if (input.durationSeconds !== null && (!Number.isInteger(input.durationSeconds) || Number(input.durationSeconds) < 0)) errors.durationSeconds = "durationSeconds must be a non-negative integer or null";
    else data.durationSeconds = input.durationSeconds === null ? null : Number(input.durationSeconds);
  }
  if (Object.hasOwn(input, "position")) {
    if (!Number.isInteger(input.position) || Number(input.position) < 1) errors.position = "Position must be a positive integer";
    else data.position = Number(input.position);
  }
  for (const field of ["isPreview", "isRequired", "isPublished"] as const) {
    if (Object.hasOwn(input, field)) {
      if (typeof input[field] !== "boolean") errors[field] = `${field} must be a boolean`;
      else data[field] = input[field];
    }
  }
  if (partial && Object.keys(input).length === 0) errors.body = "At least one lesson field is required";
  if (Object.keys(errors).length) return { errors };
  return { data: data as CreateLessonInput | UpdateLessonInput };
}

export const validateCreateLessonInput = (body: unknown) => validate(body, false) as RequestValidationResult<CreateLessonInput>;
export const validateUpdateLessonInput = (body: unknown) => validate(body, true) as RequestValidationResult<UpdateLessonInput>;
