import type { RequestValidationResult } from "../../common/middlewares/validateRequest.js";
import type { AnnouncementInput, UpdateAnnouncementInput } from "./announcement.types.js";

function validate(body: unknown, partial: boolean): RequestValidationResult<AnnouncementInput | UpdateAnnouncementInput> {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { errors: { body: "Request body must be a JSON object" } };
  const input = body as Record<string, unknown>, data: UpdateAnnouncementInput = {}, errors: Record<string, string> = {};
  for (const key of Object.keys(input)) if (!["title", "content"].includes(key)) errors[key] = `${key} cannot be set through this endpoint`;
  for (const [field, max] of [["title", 255], ["content", 50000]] as const) {
    if (!partial || Object.hasOwn(input, field)) {
      const value = typeof input[field] === "string" ? input[field].trim() : "";
      if (!value) errors[field] = `${field} is required`;
      else if (value.length > max) errors[field] = `${field} must not exceed ${max} characters`;
      else data[field] = value;
    }
  }
  if (partial && !Object.keys(input).length) errors.body = "At least one announcement field is required";
  return Object.keys(errors).length ? { errors } : { data };
}
export const validateCreateAnnouncement = (body: unknown) => validate(body, false) as RequestValidationResult<AnnouncementInput>;
export const validateUpdateAnnouncement = (body: unknown) => validate(body, true) as RequestValidationResult<UpdateAnnouncementInput>;
