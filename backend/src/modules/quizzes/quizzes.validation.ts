import type { RequestValidationResult } from "../../common/middlewares/validateRequest.js";
import type { OptionInput, QuestionInput, QuizInput, SubmitAttemptInput, UpdateOptionInput, UpdateQuestionInput, UpdateQuizInput } from "./quizzes.types.js";

function object(body: unknown) { return body && typeof body === "object" && !Array.isArray(body) ? body as Record<string, unknown> : null; }
function unknownFields(input: Record<string, unknown>, allowed: string[], errors: Record<string, string>) { for (const key of Object.keys(input)) if (!allowed.includes(key)) errors[key] = `${key} cannot be set through this endpoint`; }
function textField(input: Record<string, unknown>, key: string, required: boolean, max: number, data: Record<string, unknown>, errors: Record<string, string>) {
  if (!required && !Object.hasOwn(input, key)) return;
  const value = typeof input[key] === "string" ? input[key].trim() : "";
  if (!value) errors[key] = `${key} is required`; else if (value.length > max) errors[key] = `${key} must not exceed ${max} characters`; else data[key] = value;
}
function nullableText(input: Record<string, unknown>, key: string, data: Record<string, unknown>, errors: Record<string, string>) {
  if (!Object.hasOwn(input, key)) return;
  if (input[key] !== null && typeof input[key] !== "string") errors[key] = `${key} must be a string or null`; else data[key] = typeof input[key] === "string" ? input[key].trim() || null : null;
}
function integer(input: Record<string, unknown>, key: string, min: number, max: number, data: Record<string, unknown>, errors: Record<string, string>, nullable = false) {
  if (!Object.hasOwn(input, key)) return;
  if (nullable && input[key] === null) { data[key] = null; return; }
  if (!Number.isInteger(input[key]) || Number(input[key]) < min || Number(input[key]) > max) errors[key] = `${key} must be an integer from ${min} to ${max}`; else data[key] = Number(input[key]);
}

function quiz(body: unknown, partial: boolean): RequestValidationResult<QuizInput | UpdateQuizInput> {
  const input = object(body); if (!input) return { errors: { body: "Request body must be a JSON object" } };
  const errors: Record<string, string> = {}, data: Record<string, unknown> = {}; unknownFields(input, ["title", "description", "passingScore", "maxAttempts", "timeLimitMinutes", "isPublished"], errors);
  textField(input, "title", !partial, 255, data, errors); nullableText(input, "description", data, errors); integer(input, "passingScore", 0, 100, data, errors); integer(input, "maxAttempts", 1, 20, data, errors); integer(input, "timeLimitMinutes", 1, 300, data, errors, true);
  if (Object.hasOwn(input, "isPublished")) { if (typeof input.isPublished !== "boolean") errors.isPublished = "isPublished must be a boolean"; else data.isPublished = input.isPublished; }
  if (partial && Object.keys(input).length === 0) errors.body = "At least one quiz field is required";
  return Object.keys(errors).length ? { errors } : { data: data as unknown as QuizInput | UpdateQuizInput };
}
function question(body: unknown, partial: boolean): RequestValidationResult<QuestionInput | UpdateQuestionInput> {
  const input = object(body); if (!input) return { errors: { body: "Request body must be a JSON object" } };
  const errors: Record<string, string> = {}, data: Record<string, unknown> = {}; unknownFields(input, ["text", "explanation", "points", "position"], errors);
  textField(input, "text", !partial, 5000, data, errors); nullableText(input, "explanation", data, errors); integer(input, "points", 1, 100, data, errors); integer(input, "position", 1, 10000, data, errors);
  if (partial && Object.keys(input).length === 0) errors.body = "At least one question field is required";
  return Object.keys(errors).length ? { errors } : { data: data as unknown as QuestionInput | UpdateQuestionInput };
}
function option(body: unknown, partial: boolean): RequestValidationResult<OptionInput | UpdateOptionInput> {
  const input = object(body); if (!input) return { errors: { body: "Request body must be a JSON object" } };
  const errors: Record<string, string> = {}, data: Record<string, unknown> = {}; unknownFields(input, ["text", "isCorrect", "position"], errors);
  textField(input, "text", !partial, 2000, data, errors); integer(input, "position", 1, 10000, data, errors);
  if (Object.hasOwn(input, "isCorrect")) { if (typeof input.isCorrect !== "boolean") errors.isCorrect = "isCorrect must be a boolean"; else data.isCorrect = input.isCorrect; }
  if (partial && Object.keys(input).length === 0) errors.body = "At least one option field is required";
  return Object.keys(errors).length ? { errors } : { data: data as unknown as OptionInput | UpdateOptionInput };
}
export const validateCreateQuizInput = (body: unknown) => quiz(body, false) as RequestValidationResult<QuizInput>;
export const validateUpdateQuizInput = (body: unknown) => quiz(body, true) as RequestValidationResult<UpdateQuizInput>;
export const validateCreateQuestionInput = (body: unknown) => question(body, false) as RequestValidationResult<QuestionInput>;
export const validateUpdateQuestionInput = (body: unknown) => question(body, true) as RequestValidationResult<UpdateQuestionInput>;
export const validateCreateOptionInput = (body: unknown) => option(body, false) as RequestValidationResult<OptionInput>;
export const validateUpdateOptionInput = (body: unknown) => option(body, true) as RequestValidationResult<UpdateOptionInput>;
export function validateSubmitAttemptInput(body: unknown): RequestValidationResult<SubmitAttemptInput> {
  const input = object(body); if (!input) return { errors: { body: "Request body must be a JSON object" } };
  const errors: Record<string, string> = {}; unknownFields(input, ["answers"], errors);
  if (!Array.isArray(input.answers)) errors.answers = "answers must be an array";
  else {
    const seen = new Set<string>();
    input.answers.forEach((answer, index) => { const item = object(answer); if (!item || typeof item.questionId !== "string" || typeof item.optionId !== "string") errors[`answers.${index}`] = "Each answer requires questionId and optionId"; else if (seen.has(item.questionId)) errors[`answers.${index}.questionId`] = "A question can only be answered once"; else seen.add(item.questionId); });
  }
  return Object.keys(errors).length ? { errors } : { data: { answers: input.answers as SubmitAttemptInput["answers"] } };
}
