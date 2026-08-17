import type { RequestValidationResult } from "../../common/middlewares/validateRequest.js";
import type { ChangePasswordInput, UpdateProfileInput } from "./users.types.js";

const ALLOWED_FIELDS = new Set(["fullName", "firstName", "lastName", "phoneNumber", "avatarUrl"]);

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

  for (const field of ["firstName", "lastName"] as const) {
    if (!Object.prototype.hasOwnProperty.call(input, field)) continue;
    const value = typeof input[field] === "string" ? input[field].trim() : "";
    if (value.length > 50) errors[field] = `${field} must not exceed 50 characters`;
    else data[field] = value || null;
  }

  if (Object.prototype.hasOwnProperty.call(input, "phoneNumber")) {
    const phoneNumber = typeof input.phoneNumber === "string" ? input.phoneNumber.replace(/[\s.-]/g, "") : "";
    if (!phoneNumber) data.phoneNumber = null;
    else if (!/^\+?[0-9]{9,15}$/.test(phoneNumber)) errors.phoneNumber = "Phone number must contain 9 to 15 digits and may start with +";
    else data.phoneNumber = phoneNumber;
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

  const namePartsWereProvided = Object.hasOwn(input, "firstName") || Object.hasOwn(input, "lastName");
  if (namePartsWereProvided && !data.fullName && !data.firstName && !data.lastName) errors.fullName = "At least one name field is required";

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  return { data };
}

export function validateChangePasswordInput(
  body: unknown
): RequestValidationResult<ChangePasswordInput> {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { errors: { body: "Request body must be a JSON object" } };
  }

  const input = body as Record<string, unknown>;
  const allowedFields = new Set(["currentPassword", "newPassword", "confirmNewPassword"]);
  const errors: Record<string, string> = {};
  const currentPassword =
    typeof input.currentPassword === "string" ? input.currentPassword : "";
  const newPassword = typeof input.newPassword === "string" ? input.newPassword : "";
  const confirmNewPassword =
    typeof input.confirmNewPassword === "string" ? input.confirmNewPassword : "";

  for (const field of Object.keys(input)) {
    if (!allowedFields.has(field)) {
      errors[field] = `${field} is not allowed`;
    }
  }

  if (!currentPassword) {
    errors.currentPassword = "Current password is required";
  }

  if (newPassword.length < 8) {
    errors.newPassword = "New password must be at least 8 characters";
  } else if (
    !/[A-Z]/.test(newPassword) ||
    !/[a-z]/.test(newPassword) ||
    !/\d/.test(newPassword)
  ) {
    errors.newPassword =
      "New password must contain an uppercase letter, a lowercase letter, and a number";
  } else if (newPassword === currentPassword) {
    errors.newPassword = "New password must be different from current password";
  }

  if (confirmNewPassword !== newPassword) {
    errors.confirmNewPassword = "Confirm new password must match new password";
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  return { data: { currentPassword, newPassword, confirmNewPassword } };
}
