import type { RequestValidationResult } from "../../common/middlewares/validateRequest.js"; import type { CreateCommentInput, UpdateCommentInput } from "./comments.types.js";
function validate(body: unknown, update: boolean): RequestValidationResult<CreateCommentInput | UpdateCommentInput> {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { errors: { body: "Request body must be a JSON object" } };
  const input = body as Record<string, unknown>, errors: Record<string, string> = {};
  for (const key of Object.keys(input)) if (!(update ? ["content"] : ["content", "parentId"]).includes(key)) errors[key] = `${key} cannot be set through this endpoint`;
  const content = typeof input.content === "string" ? input.content.trim() : ""; if (!content) errors.content = "content is required"; else if (content.length > 5000) errors.content = "content must not exceed 5000 characters";
  let parentId: string | null | undefined; if (!update && Object.hasOwn(input, "parentId")) { if (input.parentId !== null && typeof input.parentId !== "string") errors.parentId = "parentId must be a UUID or null"; else parentId = input.parentId as string | null; }
  return Object.keys(errors).length ? { errors } : { data: update ? { content } : { content, ...(parentId === undefined ? {} : { parentId }) } };
}
export const validateCreateCommentInput = (body: unknown) => validate(body, false) as RequestValidationResult<CreateCommentInput>;
export const validateUpdateCommentInput = (body: unknown) => validate(body, true) as RequestValidationResult<UpdateCommentInput>;
