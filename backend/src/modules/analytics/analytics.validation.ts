import { AppError } from "../../common/errors/AppError.js";
import type { RequestValidationResult } from "../../common/middlewares/validateRequest.js";
import { UUID } from "../interactions/access.js";
import { parseDateRange } from "./analytics.date.js";
import { CLIENT_LEARNING_EVENT_TYPES, type CoursePerformanceQuery, type DropOffQuery, type EventMetadataValue, type InstructorAnalyticsQuery, type LearningEventInput, type VideoWatchEventInput } from "./analytics.types.js";

const MAX_EVENT_AGE_MS = 366 * 86_400_000;
const MAX_FUTURE_SKEW_MS = 5 * 60_000;

function object(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function unknownFields(input: Record<string, unknown>, allowed: string[], errors: Record<string, string>) {
  for (const key of Object.keys(input)) if (!allowed.includes(key)) errors[key] = `${key} cannot be set through this endpoint`;
}

function uuid(input: Record<string, unknown>, key: string, required: boolean, data: Record<string, unknown>, errors: Record<string, string>) {
  if (!Object.hasOwn(input, key)) { if (required) errors[key] = `${key} is required`; return; }
  if (typeof input[key] !== "string" || !UUID.test(input[key])) errors[key] = `${key} must be a valid UUID`; else data[key] = input[key];
}

function integer(input: Record<string, unknown>, key: string, min: number, max: number, required: boolean, data: Record<string, unknown>, errors: Record<string, string>) {
  if (!Object.hasOwn(input, key)) { if (required) errors[key] = `${key} is required`; return; }
  const value = input[key];
  if (!Number.isInteger(value) || (value as number) < min || (value as number) > max) errors[key] = `${key} must be an integer from ${min} to ${max}`; else data[key] = value;
}

function timestamp(input: Record<string, unknown>, key: string, required: boolean, data: Record<string, unknown>, errors: Record<string, string>) {
  if (!Object.hasOwn(input, key)) { if (required) errors[key] = `${key} is required`; return; }
  if (typeof input[key] !== "string") { errors[key] = `${key} must be an ISO date-time`; return; }
  const parsed = new Date(input[key]);
  if (Number.isNaN(parsed.getTime())) { errors[key] = `${key} must be an ISO date-time`; return; }
  const now = Date.now();
  if (parsed.getTime() > now + MAX_FUTURE_SKEW_MS) errors[key] = `${key} must not be more than 5 minutes in the future`;
  else if (parsed.getTime() < now - MAX_EVENT_AGE_MS) errors[key] = `${key} is too old`;
  else data[key] = parsed;
}

function metadata(value: unknown, errors: Record<string, string>): Record<string, EventMetadataValue> | undefined {
  if (value === undefined) return undefined;
  const input = object(value);
  if (!input) { errors.metadata = "metadata must be a flat JSON object"; return undefined; }
  if (Object.keys(input).length > 20 || JSON.stringify(input).length > 4000) { errors.metadata = "metadata is too large"; return undefined; }
  for (const [key, item] of Object.entries(input)) {
    if (key.length > 100 || (item !== null && typeof item !== "string" && typeof item !== "number" && typeof item !== "boolean") || (typeof item === "string" && item.length > 500) || (typeof item === "number" && !Number.isFinite(item))) {
      errors.metadata = "metadata only accepts small scalar values";
      return undefined;
    }
  }
  return input as Record<string, EventMetadataValue>;
}

export function validateLearningEventInput(body: unknown): RequestValidationResult<LearningEventInput> {
  const input = object(body); if (!input) return { errors: { body: "Request body must be a JSON object" } };
  const errors: Record<string, string> = {}, data: Record<string, unknown> = {};
  unknownFields(input, ["courseId", "lessonId", "eventType", "durationSeconds", "occurredAt", "sessionId", "metadata"], errors);
  uuid(input, "courseId", true, data, errors); uuid(input, "lessonId", false, data, errors); uuid(input, "sessionId", true, data, errors);
  timestamp(input, "occurredAt", true, data, errors);
  if (!CLIENT_LEARNING_EVENT_TYPES.includes(input.eventType as never)) errors.eventType = `eventType must be one of ${CLIENT_LEARNING_EVENT_TYPES.join(", ")}`; else data.eventType = input.eventType;
  const studySession = input.eventType === "STUDY_SESSION";
  if (!studySession && Object.hasOwn(input, "durationSeconds")) errors.durationSeconds = "durationSeconds is only accepted for STUDY_SESSION";
  else integer(input, "durationSeconds", 1, 300, studySession, data, errors);
  if ((input.eventType === "LESSON_STARTED" || studySession) && !Object.hasOwn(data, "lessonId")) errors.lessonId ??= "lessonId is required for lesson events";
  const safeMetadata = metadata(input.metadata, errors); if (safeMetadata) data.metadata = safeMetadata;
  return Object.keys(errors).length ? { errors } : { data: data as LearningEventInput };
}

export function validateVideoWatchEventInput(body: unknown): RequestValidationResult<VideoWatchEventInput> {
  const input = object(body); if (!input) return { errors: { body: "Request body must be a JSON object" } };
  const errors: Record<string, string> = {}, data: Record<string, unknown> = {};
  unknownFields(input, ["courseId", "lessonId", "sessionId", "startedAt", "endedAt", "startPositionSeconds", "endPositionSeconds", "watchedSeconds", "completed"], errors);
  uuid(input, "courseId", true, data, errors); uuid(input, "lessonId", true, data, errors); uuid(input, "sessionId", true, data, errors);
  timestamp(input, "startedAt", true, data, errors); timestamp(input, "endedAt", false, data, errors);
  integer(input, "startPositionSeconds", 0, 86_400, true, data, errors);
  integer(input, "endPositionSeconds", 0, 86_400, false, data, errors);
  integer(input, "watchedSeconds", 1, 300, true, data, errors);
  if (typeof input.completed !== "boolean") errors.completed = "completed must be a boolean"; else data.completed = input.completed;
  if (data.endedAt instanceof Date && data.startedAt instanceof Date && data.endedAt < data.startedAt) errors.endedAt = "endedAt must not be before startedAt";
  if (typeof data.endPositionSeconds === "number" && typeof data.startPositionSeconds === "number" && data.endPositionSeconds < data.startPositionSeconds) errors.endPositionSeconds = "endPositionSeconds must not be before startPositionSeconds";
  return Object.keys(errors).length ? { errors } : { data: data as VideoWatchEventInput };
}

function courseId(query: Record<string, unknown>): string | undefined {
  if (query.courseId === undefined) return undefined;
  if (typeof query.courseId !== "string" || !UUID.test(query.courseId)) throw new AppError(400, "courseId must be a valid UUID");
  return query.courseId;
}

export function parseActivityQuery(query: Record<string, unknown>) { return parseDateRange(query); }

export function parseInstructorQuery(query: Record<string, unknown>): InstructorAnalyticsQuery {
  const range = parseDateRange(query);
  const selectedCourse = courseId(query);
  return { ...range, ...(selectedCourse ? { courseId: selectedCourse } : {}) };
}

export function parseCoursePerformanceQuery(query: Record<string, unknown>): CoursePerformanceQuery {
  const base = parseInstructorQuery(query);
  const sortBy = query.sortBy ?? "enrollments";
  if (sortBy !== "enrollments" && sortBy !== "completionRate" && sortBy !== "rating" && sortBy !== "revenue") throw new AppError(400, "sortBy must be enrollments, completionRate, rating, or revenue");
  const limit = Number(query.limit ?? 10);
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) throw new AppError(400, "limit must be an integer from 1 to 50");
  return { ...base, sortBy, limit };
}

export function parseDropOffQuery(query: Record<string, unknown>): DropOffQuery {
  const range = parseDateRange(query);
  const selectedCourse = courseId(query);
  if (!selectedCourse) throw new AppError(400, "courseId is required");
  const limit = Number(query.limit ?? 5);
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) throw new AppError(400, "limit must be an integer from 1 to 50");
  return { ...range, courseId: selectedCourse, limit };
}
