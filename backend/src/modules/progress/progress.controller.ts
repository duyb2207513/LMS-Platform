import type { Request, Response } from "express";
import { sendSuccess } from "../../common/utils/response.js";
import type { UpdateLessonProgressInput } from "./progress.types.js";
import { getCourseProgress, updateLessonProgress } from "./progress.service.js";

export async function updateLessonProgressController(request: Request, response: Response) { sendSuccess(response, 200, "Lesson progress updated successfully", await updateLessonProgress(String(request.params.lessonId ?? ""), request.auth.userId, request.body as UpdateLessonProgressInput)); }
export async function getCourseProgressController(request: Request, response: Response) { sendSuccess(response, 200, "Course progress retrieved successfully", await getCourseProgress(String(request.params.courseId ?? ""), request.auth.userId)); }
