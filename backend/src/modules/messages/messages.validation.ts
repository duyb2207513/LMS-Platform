import type { RequestValidationResult } from "../../common/middlewares/validateRequest.js";
import type { SendMessageInput } from "./messages.types.js";

export function validateSendMessageInput(body: unknown): RequestValidationResult<SendMessageInput> {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { errors: { body: "Request body must be a JSON object" } };
  const input = body as Record<string, unknown>;
  const errors: Record<string, string> = {};
  for (const key of Object.keys(input)) if (key !== "content") errors[key] = `${key} cannot be set through this endpoint`;
  const content = typeof input.content === "string" ? input.content.trim() : "";
  if (!content) errors.content = "content is required";
  else if (content.length > 750 * 1024 * 1024) errors.content = "content must not exceed 750MB";
  return Object.keys(errors).length ? { errors } : { data: { content } };
}
