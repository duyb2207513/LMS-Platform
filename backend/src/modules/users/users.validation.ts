import type { RequestValidationResult } from "../../common/middlewares/validateRequest.js";
import type { UpdateProfileInput } from "./users.types.js";

const ALLOWED_FIELDS = new Set(["fullName", "avatarUrl"]);

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateUpdateProfileInput(
  body: unknown
): RequestValidationResult<UpdateProfileInput> {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { errors: { body: "Request body must be a JSON object" } };
  }

  const input = body as Record<string, unknown>;
  const errors: Record<string, string> = {};
  const data: UpdateProfileInput = {};

  for (const field of Object.keys(input)) {
    if (!ALLOWED_FIELDS.has(field)) {
      errors[field] = `${field} cannot be updated through this endpoint`;
    }
  }

  if (Object.prototype.hasOwnProperty.call(input, "fullName")) {
    const fullName = typeof input.fullName === "string" ? input.fullName.trim() : "";

    if (fullName.length < 2 || fullName.length > 100) {
      errors.fullName = "Full name must be between 2 and 100 characters";
    } else {
      data.fullName = fullName;
    }
  }

  if (Object.prototype.hasOwnProperty.call(input, "avatarUrl")) {
    if (input.avatarUrl === null) {
      data.avatarUrl = null;
    } else {
      const avatarUrl = typeof input.avatarUrl === "string" ? input.avatarUrl.trim() : "";

      if (!avatarUrl || !isHttpUrl(avatarUrl)) {
        errors.avatarUrl = "Avatar URL must be a valid HTTP or HTTPS URL";
      } else {
        data.avatarUrl = avatarUrl;
      }
    }
  }

  if (Object.keys(input).length === 0) {
    errors.body = "At least one profile field is required";
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  return { data };
}
