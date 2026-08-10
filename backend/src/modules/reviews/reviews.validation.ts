import type { RequestValidationResult } from "../../common/middlewares/validateRequest.js";
import type { ReviewInput, UpdateReviewInput } from "./reviews.types.js";
function validate(body: unknown, partial: boolean): RequestValidationResult<ReviewInput | UpdateReviewInput> {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { errors: { body: "Request body must be a JSON object" } };
  const input = body as Record<string, unknown>, errors: Record<string, string> = {}, data: UpdateReviewInput = {};
  for (const key of Object.keys(input)) if (!["rating", "content"].includes(key)) errors[key] = `${key} cannot be set through this endpoint`;
  if (!partial || Object.hasOwn(input, "rating")) { if (!Number.isInteger(input.rating) || Number(input.rating) < 1 || Number(input.rating) > 5) errors.rating = "rating must be an integer from 1 to 5"; else data.rating = Number(input.rating); }
  if (Object.hasOwn(input, "content")) { if (input.content !== null && typeof input.content !== "string") errors.content = "content must be a string or null"; else if (typeof input.content === "string" && input.content.trim().length > 2000) errors.content = "content must not exceed 2000 characters"; else data.content = typeof input.content === "string" ? input.content.trim() || null : null; }
  if (partial && Object.keys(input).length === 0) errors.body = "At least one review field is required";
  return Object.keys(errors).length ? { errors } : { data: data as ReviewInput | UpdateReviewInput };
}
export const validateCreateReviewInput = (body: unknown) => validate(body, false) as RequestValidationResult<ReviewInput>;
export const validateUpdateReviewInput = (body: unknown) => validate(body, true) as RequestValidationResult<UpdateReviewInput>;
