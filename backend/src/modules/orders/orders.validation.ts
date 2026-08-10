import type { RequestValidationResult } from "../../common/middlewares/validateRequest.js"; import type { CreateOrderInput } from "./orders.types.js";
export function validateCreateOrderInput(body: unknown): RequestValidationResult<CreateOrderInput> {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { errors: { body: "Request body must be a JSON object" } };
  const input = body as Record<string, unknown>, errors: Record<string, string> = {}; for (const key of Object.keys(input)) if (key !== "courseIds") errors[key] = `${key} cannot be set through this endpoint`;
  if (!Array.isArray(input.courseIds) || input.courseIds.length < 1 || input.courseIds.length > 20 || input.courseIds.some(id => typeof id !== "string")) errors.courseIds = "courseIds must contain 1 to 20 course IDs";
  else if (new Set(input.courseIds).size !== input.courseIds.length) errors.courseIds = "courseIds must not contain duplicates";
  return Object.keys(errors).length ? { errors } : { data: { courseIds: input.courseIds as string[] } };
}
