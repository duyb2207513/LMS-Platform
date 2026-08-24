import type { RequestValidationResult } from "../../common/middlewares/validateRequest.js";
import type { LessonContentInput, ReorderLessonContentsInput, UpdateLessonContentInput } from "./lesson-contents.types.js";
const object = (body: unknown) => body && typeof body === "object" && !Array.isArray(body) ? body as Record<string, unknown> : null;
export function validateCreateLessonContent(body: unknown): RequestValidationResult<LessonContentInput> {
  const input = object(body); if (!input) return { errors: { body: "Request body must be a JSON object" } };
  const errors: Record<string, string> = {}; for (const key of Object.keys(input)) if (!["contentType", "textContent", "position"].includes(key)) errors[key] = `${key} cannot be set through this endpoint`;
  if (!["TEXT", "VIDEO", "DOCUMENT"].includes(String(input.contentType))) errors.contentType = "contentType must be TEXT, VIDEO, or DOCUMENT";
  const textContent = typeof input.textContent === "string" ? input.textContent.trim() : input.textContent;
  if (input.contentType === "TEXT" && !textContent) errors.textContent = "textContent is required for TEXT content";
  if (typeof textContent === "string" && textContent.length > 100000) errors.textContent = "textContent must not exceed 100000 characters";
  if (input.position !== undefined && (!Number.isInteger(input.position) || Number(input.position) < 1)) errors.position = "position must be a positive integer";
  return Object.keys(errors).length ? { errors } : { data: { contentType: input.contentType as LessonContentInput["contentType"], textContent: typeof textContent === "string" ? textContent : null, ...(input.position === undefined ? {} : { position: Number(input.position) }) } };
}
export function validateUpdateLessonContent(body: unknown): RequestValidationResult<UpdateLessonContentInput> {
  const input = object(body); if (!input) return { errors: { body: "Request body must be a JSON object" } };
  const errors: Record<string, string> = {}; for (const key of Object.keys(input)) if (key !== "textContent") errors[key] = `${key} cannot be set through this endpoint`;
  if (!Object.hasOwn(input, "textContent")) errors.body = "textContent is required";
  const value = typeof input.textContent === "string" ? input.textContent.trim() : input.textContent;
  if (value !== null && typeof value !== "string") errors.textContent = "textContent must be a string or null";
  if (typeof value === "string" && value.length > 100000) errors.textContent = "textContent must not exceed 100000 characters";
  return Object.keys(errors).length ? { errors } : { data: { textContent: value as string | null } };
}
export function validateReorderLessonContents(body: unknown): RequestValidationResult<ReorderLessonContentsInput> {
  const input = object(body); if (!input) return { errors: { body: "Request body must be a JSON object" } };
  const ids = input.contentIds;
  if (!Array.isArray(ids) || ids.length === 0 || ids.some(id => typeof id !== "string") || new Set(ids).size !== ids.length) return { errors: { contentIds: "contentIds must be a non-empty array of unique IDs" } };
  return { data: { contentIds: ids as string[] } };
}
