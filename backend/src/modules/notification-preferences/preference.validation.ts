import type { RequestValidationResult } from "../../common/middlewares/validateRequest.js";
import type { NotificationPreferenceInput } from "./preference.types.js";

const fields = ["inAppEnabled", "emailEnabled", "pushEnabled", "courseUpdates", "assignmentReminders", "quizResults", "certificateUpdates"] as const;
export function validatePreferenceInput(body: unknown): RequestValidationResult<NotificationPreferenceInput> {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { errors: { body: "Request body must be a JSON object" } };
  const input = body as Record<string, unknown>, data: NotificationPreferenceInput = {}, errors: Record<string, string> = {};
  for (const key of Object.keys(input)) if (!fields.includes(key as typeof fields[number])) errors[key] = `${key} cannot be set through this endpoint`;
  for (const field of fields) if (Object.hasOwn(input, field)) {
    if (typeof input[field] !== "boolean") errors[field] = `${field} must be a boolean`;
    else data[field] = input[field];
  }
  if (!Object.keys(data).length) errors.body = "At least one preference field is required";
  return Object.keys(errors).length ? { errors } : { data };
}
