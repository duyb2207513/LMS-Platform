import type { RequestValidationResult } from "../../common/middlewares/validateRequest.js";
import type { ChangeEmailInput, ForgotPasswordInput, GoogleLoginInput, LoginInput, RegisterInput, ResetPasswordInput, TokenInput } from "./auth.types.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const object = (body: unknown) => body && typeof body === "object" && !Array.isArray(body) ? body as Record<string, unknown> : null;
const validPassword = (password: string) => password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password);

export function validateRegisterInput(body: unknown): RequestValidationResult<RegisterInput> {
  const input = object(body); if (!input) return { errors: { body: "Request body must be a JSON object" } };
  const errors: Record<string, string> = {};
  if (Object.hasOwn(input, "role")) errors.role = "Role cannot be set during registration";
  const fullName = typeof input.fullName === "string" ? input.fullName.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const password = typeof input.password === "string" ? input.password : "";
  const confirmPassword = typeof input.confirmPassword === "string" ? input.confirmPassword : "";
  if (fullName.length < 2 || fullName.length > 100) errors.fullName = "Full name must be between 2 and 100 characters";
  if (!email) errors.email = "Email is required";
  else if (!EMAIL_PATTERN.test(email) || email.length > 255) errors.email = "Email must be a valid email address";
  if (!validPassword(password)) errors.password = "Password must be at least 8 characters and contain uppercase, lowercase, and number";
  if (confirmPassword !== password) errors.confirmPassword = "Confirm password must match password";
  return Object.keys(errors).length ? { errors } : { data: { fullName, email, password, confirmPassword } };
}

export function validateLoginInput(body: unknown): RequestValidationResult<LoginInput> {
  const input = object(body); if (!input) return { errors: { body: "Request body must be a JSON object" } };
  const errors: Record<string, string> = {};
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const password = typeof input.password === "string" ? input.password : "";
  if (!email) errors.email = "Email is required";
  else if (!EMAIL_PATTERN.test(email) || email.length > 255) errors.email = "Email must be a valid email address";
  if (!password) errors.password = "Password is required";
  return Object.keys(errors).length ? { errors } : { data: { email, password } };
}

export function validateEmailInput(body: unknown): RequestValidationResult<ForgotPasswordInput> {
  const input = object(body); if (!input) return { errors: { body: "Request body must be a JSON object" } };
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  return EMAIL_PATTERN.test(email) && email.length <= 255 ? { data: { email } } : { errors: { email: "Email must be a valid email address" } };
}

export function validateTokenInput(body: unknown): RequestValidationResult<TokenInput> {
  const input = object(body); const token = typeof input?.token === "string" ? input.token.trim() : "";
  return token.length >= 32 ? { data: { token } } : { errors: { token: "Token is required" } };
}

export function validateResetPasswordInput(body: unknown): RequestValidationResult<ResetPasswordInput> {
  const input = object(body); if (!input) return { errors: { body: "Request body must be a JSON object" } };
  const token = typeof input.token === "string" ? input.token.trim() : "";
  const newPassword = typeof input.newPassword === "string" ? input.newPassword : "";
  const confirmNewPassword = typeof input.confirmNewPassword === "string" ? input.confirmNewPassword : "";
  const errors: Record<string, string> = {};
  if (token.length < 32) errors.token = "Token is required";
  if (!validPassword(newPassword)) errors.newPassword = "Password must be at least 8 characters and contain uppercase, lowercase, and number";
  if (confirmNewPassword !== newPassword) errors.confirmNewPassword = "Passwords must match";
  return Object.keys(errors).length ? { errors } : { data: { token, newPassword, confirmNewPassword } };
}

export function validateGoogleLoginInput(body: unknown): RequestValidationResult<GoogleLoginInput> {
  const input = object(body); const idToken = typeof input?.idToken === "string" ? input.idToken.trim() : "";
  return idToken ? { data: { idToken } } : { errors: { idToken: "Google ID token is required" } };
}

export function validateChangeEmailInput(body: unknown): RequestValidationResult<ChangeEmailInput> {
  const input = object(body); if (!input) return { errors: { body: "Request body must be a JSON object" } };
  const newEmail = typeof input.newEmail === "string" ? input.newEmail.trim().toLowerCase() : "";
  const currentPassword = typeof input.currentPassword === "string" ? input.currentPassword : undefined;
  const errors: Record<string, string> = {};
  if (!EMAIL_PATTERN.test(newEmail) || newEmail.length > 255) errors.newEmail = "Email must be a valid email address";
  if (input.currentPassword !== undefined && !currentPassword) errors.currentPassword = "Current password is invalid";
  return Object.keys(errors).length ? { errors } : { data: { newEmail, currentPassword } };
}
