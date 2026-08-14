import type { RequestValidationResult } from "../../common/middlewares/validateRequest.js";
import { UUID } from "../interactions/access.js";
import type { CouponInput, CouponStatusInput, CouponUpdateInput, ValidateCouponInput } from "./coupon.types.js";

function object(body: unknown): Record<string, unknown> | null { return body && typeof body === "object" && !Array.isArray(body) ? body as Record<string, unknown> : null; }
function unknown(input: Record<string, unknown>, allowed: string[], errors: Record<string, string>) { for (const key of Object.keys(input)) if (!allowed.includes(key)) errors[key] = `${key} cannot be set through this endpoint`; }
const fields = ["code", "name", "description", "discountType", "discountValue", "maxDiscountAmount", "minOrderAmount", "startsAt", "expiresAt", "maxRedemptions", "appliesToAllCourses", "courseIds", "isActive"];

function parse(body: unknown, partial: boolean): RequestValidationResult<CouponInput | CouponUpdateInput> {
  const input = object(body); if (!input) return { errors: { body: "Request body must be a JSON object" } };
  const errors: Record<string, string> = {}, data: Record<string, unknown> = {}; unknown(input, fields, errors);
  const string = (key: string, min: number, max: number, nullable = false) => {
    if (!Object.hasOwn(input, key)) { if (!partial && !nullable) errors[key] = `${key} is required`; return; }
    if (nullable && input[key] === null) { data[key] = null; return; }
    if (typeof input[key] !== "string" || (input[key] as string).trim().length < min || (input[key] as string).trim().length > max) errors[key] = `${key} must contain ${min} to ${max} characters`; else data[key] = (input[key] as string).trim();
  };
  string("code", 2, 50); string("name", 2, 255); string("description", 0, 2000, true);
  if (Object.hasOwn(input, "discountType")) { if (input.discountType !== "PERCENTAGE" && input.discountType !== "FIXED_AMOUNT") errors.discountType = "discountType must be PERCENTAGE or FIXED_AMOUNT"; else data.discountType = input.discountType; } else if (!partial) errors.discountType = "discountType is required";
  for (const key of ["discountValue", "maxDiscountAmount", "minOrderAmount"] as const) {
    if (!Object.hasOwn(input, key)) { if (!partial && key === "discountValue") errors[key] = `${key} is required`; continue; }
    if (input[key] === null && key !== "discountValue") { data[key] = null; continue; }
    if (!Number.isSafeInteger(input[key]) || (input[key] as number) <= 0) errors[key] = `${key} must be a positive whole VND amount`; else data[key] = input[key];
  }
  if ((data.discountType ?? input.discountType) === "PERCENTAGE" && typeof data.discountValue === "number" && data.discountValue > 100) errors.discountValue = "Percentage discount must not exceed 100";
  for (const key of ["startsAt", "expiresAt"] as const) {
    if (!Object.hasOwn(input, key)) { if (!partial) errors[key] = `${key} is required`; continue; }
    if (typeof input[key] !== "string" || Number.isNaN(Date.parse(input[key] as string))) errors[key] = `${key} must be a valid ISO date-time`; else data[key] = new Date(input[key] as string);
  }
  if (data.startsAt instanceof Date && data.expiresAt instanceof Date && data.startsAt >= data.expiresAt) errors.expiresAt = "expiresAt must be after startsAt";
  if (Object.hasOwn(input, "maxRedemptions")) { if (input.maxRedemptions === null) data.maxRedemptions = null; else if (!Number.isInteger(input.maxRedemptions) || (input.maxRedemptions as number) < 1) errors.maxRedemptions = "maxRedemptions must be a positive integer or null"; else data.maxRedemptions = input.maxRedemptions; }
  for (const key of ["appliesToAllCourses", "isActive"] as const) { if (!Object.hasOwn(input, key)) { if (!partial) errors[key] = `${key} is required`; } else if (typeof input[key] !== "boolean") errors[key] = `${key} must be a boolean`; else data[key] = input[key]; }
  if (Object.hasOwn(input, "courseIds")) { if (!Array.isArray(input.courseIds) || input.courseIds.some(id => typeof id !== "string" || !UUID.test(id)) || new Set(input.courseIds).size !== input.courseIds.length) errors.courseIds = "courseIds must contain unique UUIDs"; else data.courseIds = input.courseIds; } else if (!partial) data.courseIds = [];
  const allCourses = data.appliesToAllCourses ?? input.appliesToAllCourses;
  const courseIds = data.courseIds ?? input.courseIds;
  if (allCourses === false && Array.isArray(courseIds) && courseIds.length === 0) errors.courseIds = "At least one course is required when appliesToAllCourses is false";
  return Object.keys(errors).length ? { errors } : { data: data as unknown as CouponInput | CouponUpdateInput };
}

export const validateCreateCouponInput = (body: unknown) => parse(body, false) as RequestValidationResult<CouponInput>;
export const validateUpdateCouponInput = (body: unknown) => parse(body, true) as RequestValidationResult<CouponUpdateInput>;
export function validateCouponInput(body: unknown): RequestValidationResult<ValidateCouponInput> { const input = object(body); if (!input) return { errors: { body: "Request body must be a JSON object" } }; const errors: Record<string, string> = {}; unknown(input, ["code", "courseId"], errors); if (typeof input.code !== "string" || input.code.trim().length < 2) errors.code = "code is required"; if (typeof input.courseId !== "string" || !UUID.test(input.courseId)) errors.courseId = "courseId must be a valid UUID"; return Object.keys(errors).length ? { errors } : { data: { code: (input.code as string).trim().toUpperCase(), courseId: input.courseId as string } }; }
export function validateCouponStatusInput(body: unknown): RequestValidationResult<CouponStatusInput> { const input = object(body); if (!input || typeof input.isActive !== "boolean" || Object.keys(input).some(key => key !== "isActive")) return { errors: { isActive: "isActive must be the only field and must be a boolean" } }; return { data: { isActive: input.isActive } }; }
