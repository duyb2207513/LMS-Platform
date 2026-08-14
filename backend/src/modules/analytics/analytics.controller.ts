import type { Request, Response } from "express";
import { sendSuccess } from "../../common/utils/response.js";
import { getInstructorCoursePerformance, getInstructorDropOffLessons, getInstructorEnrollments, getInstructorOverview } from "./instructor-analytics.service.js";
import { recordLearningEvent, recordVideoWatchEvent } from "./learning-event.service.js";
import { getStudentActivity, getStudentCourseProgress, getStudentOverview, getStudentStreak } from "./student-analytics.service.js";
import type { LearningEventInput, VideoWatchEventInput } from "./analytics.types.js";
import { parseActivityQuery, parseCoursePerformanceQuery, parseDropOffQuery, parseInstructorQuery } from "./analytics.validation.js";

export async function learningEventController(request: Request, response: Response) {
  await recordLearningEvent(request.auth.userId, request.body as LearningEventInput);
  response.status(204).send();
}

export async function videoWatchEventController(request: Request, response: Response) {
  await recordVideoWatchEvent(request.auth.userId, request.body as VideoWatchEventInput);
  response.status(204).send();
}

export async function studentOverviewController(request: Request, response: Response) { sendSuccess(response, 200, "Student analytics overview retrieved successfully", await getStudentOverview(request.auth.userId)); }
export async function studentCourseProgressController(request: Request, response: Response) { sendSuccess(response, 200, "Student course progress retrieved successfully", await getStudentCourseProgress(request.auth.userId)); }
export async function studentStreakController(request: Request, response: Response) { sendSuccess(response, 200, "Student learning streak retrieved successfully", await getStudentStreak(request.auth.userId)); }
export async function studentActivityController(request: Request, response: Response) {
  const result = await getStudentActivity(request.auth.userId, parseActivityQuery(request.query));
  response.status(200).json({ success: true, message: "Student learning activity retrieved successfully", data: result.data, meta: result.meta });
}

export async function instructorOverviewController(request: Request, response: Response) {
  const result = await getInstructorOverview(request.auth.userId, parseInstructorQuery(request.query));
  response.status(200).json({ success: true, message: "Instructor analytics overview retrieved successfully", data: result.data, meta: result.meta });
}
export async function instructorEnrollmentsController(request: Request, response: Response) {
  const result = await getInstructorEnrollments(request.auth.userId, parseInstructorQuery(request.query));
  response.status(200).json({ success: true, message: "Instructor enrollment analytics retrieved successfully", data: result.data, meta: result.meta });
}
export async function instructorCoursePerformanceController(request: Request, response: Response) { sendSuccess(response, 200, "Instructor course performance retrieved successfully", await getInstructorCoursePerformance(request.auth.userId, parseCoursePerformanceQuery(request.query))); }
export async function instructorDropOffLessonsController(request: Request, response: Response) { sendSuccess(response, 200, "Lesson drop-off analytics retrieved successfully", await getInstructorDropOffLessons(request.auth.userId, parseDropOffQuery(request.query))); }
