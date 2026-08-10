import type { RequestValidationResult } from "../../common/middlewares/validateRequest.js";
import type { UpdateLessonProgressInput } from "./progress.types.js";

export function validateUpdateLessonProgressInput(body: unknown): RequestValidationResult<UpdateLessonProgressInput> {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { errors: { body: "Request body must be a JSON object" } };
  const input = body as Record<string, unknown>;
  const errors: Record<string, string> = {};
  const data: UpdateLessonProgressInput = {};
  for (const key of Object.keys(input)) if (!new Set(["lastWatchedSecond", "isCompleted"]).has(key)) errors[key] = `${key} cannot be set through this endpoint`;
  if (Object.hasOwn(input, "lastWatchedSecond")) {
    if (!Number.isInteger(input.lastWatchedSecond) || Number(input.lastWatchedSecond) < 0) errors.lastWatchedSecond = "lastWatchedSecond must be a non-negative integer";
    else data.lastWatchedSecond = Number(input.lastWatchedSecond);
  }
  if (Object.hasOwn(input, "isCompleted")) {
    if (typeof input.isCompleted !== "boolean") errors.isCompleted = "isCompleted must be a boolean";
    else data.isCompleted = input.isCompleted;
  }
  if (!Object.keys(input).length) errors.body = "lastWatchedSecond or isCompleted is required";
  if (Object.keys(errors).length) return { errors };
  return { data };
}
