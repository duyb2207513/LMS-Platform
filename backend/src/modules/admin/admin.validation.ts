import type { RequestValidationResult } from "../../common/middlewares/validateRequest.js";
import type { UpdateAdminCourseInput, UpdateAdminUserInput } from "./admin.types.js";

const roles = ["STUDENT", "INSTRUCTOR", "ADMIN"];
const userStatuses = ["ACTIVE", "BLOCKED"];
const courseStatuses = ["DRAFT", "PUBLISHED", "ARCHIVED"];
const object = (value: unknown) => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;

export function validateAdminUserUpdate(body: unknown): RequestValidationResult<UpdateAdminUserInput> {
  const input = object(body); if (!input) return { errors: { body: "Request body must be a JSON object" } };
  const errors: Record<string, string> = {}, data: UpdateAdminUserInput = {};
  for (const key of Object.keys(input)) if (!["role", "status"].includes(key)) errors[key] = `${key} cannot be changed by this endpoint`;
  if (input.role !== undefined) { if (!roles.includes(String(input.role))) errors.role = "role is invalid"; else data.role = input.role as UpdateAdminUserInput["role"]; }
  if (input.status !== undefined) { if (!userStatuses.includes(String(input.status))) errors.status = "status is invalid"; else data.status = input.status as UpdateAdminUserInput["status"]; }
  if (data.role === undefined && data.status === undefined) errors.body = "role or status is required";
  return Object.keys(errors).length ? { errors } : { data };
}

export function validateAdminCourseUpdate(body: unknown): RequestValidationResult<UpdateAdminCourseInput> {
  const input = object(body); if (!input) return { errors: { body: "Request body must be a JSON object" } };
  const errors: Record<string, string> = {};
  for (const key of Object.keys(input)) if (key !== "status") errors[key] = `${key} cannot be changed by this endpoint`;
  if (!courseStatuses.includes(String(input.status))) errors.status = "status is invalid";
  return Object.keys(errors).length ? { errors } : { data: { status: input.status as UpdateAdminCourseInput["status"] } };
}
