import type { RequestValidationResult } from "../../common/middlewares/validateRequest.js";
import type { LoginInput, RegisterInput } from "./auth.types.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegisterInput(body: unknown): RequestValidationResult<RegisterInput> {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { errors: { body: "Request body must be a JSON object" } };
  }

  const input = body as Record<string, unknown>;
  const errors: Record<string, string> = {};

  if (Object.prototype.hasOwnProperty.call(input, "role")) {
    errors.role = "Role cannot be set during registration";
  }

  const fullName = typeof input.fullName === "string" ? input.fullName.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const password = typeof input.password === "string" ? input.password : "";
  const confirmPassword =
    typeof input.confirmPassword === "string" ? input.confirmPassword : "";

  if (fullName.length < 2 || fullName.length > 100) {
    errors.fullName = "Full name must be between 2 and 100 characters";
  }

  if (!EMAIL_PATTERN.test(email) || email.length > 255) {
    errors.email = "Email must be a valid email address";
  }

  if (password.length < 8) {
    errors.password = "Password must be at least 8 characters";
  } else if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
    errors.password = "Password must contain an uppercase letter, a lowercase letter, and a number";
  }

  if (confirmPassword !== password) {
    errors.confirmPassword = "Confirm password must match password";
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  return { data: { fullName, email, password, confirmPassword } };
}

export function validateLoginInput(body: unknown): RequestValidationResult<LoginInput> {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { errors: { body: "Request body must be a JSON object" } };
  }

  const input = body as Record<string, unknown>;
  const errors: Record<string, string> = {};
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const password = typeof input.password === "string" ? input.password : "";

  if (!email) {
    errors.email = "Email is required";
  } else if (!EMAIL_PATTERN.test(email) || email.length > 255) {
    errors.email = "Email must be a valid email address";
  }

  if (!password) {
    errors.password = "Password is required";
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  return { data: { email, password } };
}
