import type { RequestValidationResult } from "../../common/middlewares/validateRequest.js";
import type { AssignmentInput, CourseGradeRuleInput, GradeSubmissionInput, UpdateAssignmentInput } from "./assignments.types.js";

function object(body: unknown) { return body && typeof body === "object" && !Array.isArray(body) ? body as Record<string, unknown> : null; }
function unknownFields(input: Record<string, unknown>, allowed: string[], errors: Record<string, string>) { for (const key of Object.keys(input)) if (!allowed.includes(key)) errors[key] = `${key} cannot be set through this endpoint`; }
function nullableText(input: Record<string, unknown>, key: string, max: number, data: Record<string, unknown>, errors: Record<string, string>) {
  if (!Object.hasOwn(input, key)) return;
  if (input[key] !== null && typeof input[key] !== "string") errors[key] = `${key} must be a string or null`;
  else { const value = typeof input[key] === "string" ? input[key].trim() : ""; if (value.length > max) errors[key] = `${key} must not exceed ${max} characters`; else data[key] = value || null; }
}
function number(input: Record<string, unknown>, key: string, min: number, max: number, data: Record<string, unknown>, errors: Record<string, string>, integer = false) {
  if (!Object.hasOwn(input, key)) return;
  const value = input[key];
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value))) errors[key] = `${key} must be ${integer ? "an integer" : "a number"} from ${min} to ${max}`;
  else data[key] = value;
}
function boolean(input: Record<string, unknown>, key: string, data: Record<string, unknown>, errors: Record<string, string>) {
  if (!Object.hasOwn(input, key)) return;
  if (typeof input[key] !== "boolean") errors[key] = `${key} must be a boolean`; else data[key] = input[key];
}

function assignment(body: unknown, partial: boolean): RequestValidationResult<AssignmentInput | UpdateAssignmentInput> {
  const input = object(body); if (!input) return { errors: { body: "Request body must be a JSON object" } };
  const errors: Record<string, string> = {}, data: Record<string, unknown> = {};
  unknownFields(input, ["title", "description", "instructions", "dueAt", "maxScore", "allowResubmission", "maxSubmissions", "allowLateSubmissions", "isPublished"], errors);
  if (!partial || Object.hasOwn(input, "title")) { const title = typeof input.title === "string" ? input.title.trim() : ""; if (!title) errors.title = "title is required"; else if (title.length > 255) errors.title = "title must not exceed 255 characters"; else data.title = title; }
  nullableText(input, "description", 10000, data, errors); nullableText(input, "instructions", 30000, data, errors);
  if (!partial || Object.hasOwn(input, "dueAt")) { const dueAt = typeof input.dueAt === "string" ? new Date(input.dueAt) : null; if (!dueAt || Number.isNaN(dueAt.getTime())) errors.dueAt = "dueAt must be a valid ISO date-time"; else data.dueAt = dueAt; }
  number(input, "maxScore", 0.01, 100000, data, errors); number(input, "maxSubmissions", 1, 20, data, errors, true);
  boolean(input, "allowResubmission", data, errors); boolean(input, "allowLateSubmissions", data, errors); boolean(input, "isPublished", data, errors);
  if (data.allowResubmission === false && typeof data.maxSubmissions === "number" && data.maxSubmissions !== 1) errors.maxSubmissions = "maxSubmissions must be 1 when resubmission is disabled";
  if (data.allowResubmission === true && typeof data.maxSubmissions === "number" && data.maxSubmissions < 2) errors.maxSubmissions = "maxSubmissions must be at least 2 when resubmission is enabled";
  if (partial && Object.keys(input).length === 0) errors.body = "At least one assignment field is required";
  return Object.keys(errors).length ? { errors } : { data: data as unknown as AssignmentInput | UpdateAssignmentInput };
}

export const validateCreateAssignmentInput = (body: unknown) => assignment(body, false) as RequestValidationResult<AssignmentInput>;
export const validateUpdateAssignmentInput = (body: unknown) => assignment(body, true) as RequestValidationResult<UpdateAssignmentInput>;

export function validateGradeSubmissionInput(body: unknown): RequestValidationResult<GradeSubmissionInput> {
  const input = object(body); if (!input) return { errors: { body: "Request body must be a JSON object" } };
  const errors: Record<string, string> = {}, data: Record<string, unknown> = {}; unknownFields(input, ["score", "comment"], errors);
  number(input, "score", 0, 100000, data, errors); if (!Object.hasOwn(data, "score")) errors.score ??= "score is required"; nullableText(input, "comment", 10000, data, errors);
  return Object.keys(errors).length ? { errors } : { data: data as unknown as GradeSubmissionInput };
}

export function validateCourseGradeRuleInput(body: unknown): RequestValidationResult<CourseGradeRuleInput> {
  const input = object(body); if (!input) return { errors: { body: "Request body must be a JSON object" } };
  const errors: Record<string, string> = {}, data: Record<string, unknown> = {}; unknownFields(input, ["assignmentWeight", "quizWeight", "passingScore"], errors);
  for (const key of ["assignmentWeight", "quizWeight", "passingScore"]) { number(input, key, 0, 100, data, errors); if (!Object.hasOwn(data, key)) errors[key] ??= `${key} is required`; }
  if (typeof data.assignmentWeight === "number" && typeof data.quizWeight === "number" && Math.abs(data.assignmentWeight + data.quizWeight - 100) > 0.001) errors.weights = "assignmentWeight and quizWeight must total 100";
  return Object.keys(errors).length ? { errors } : { data: data as unknown as CourseGradeRuleInput };
}
