import type { NextFunction, Request, Response } from "express";
import { getManagedLesson } from "./lessons.service.js";

export async function ensureLessonManagePermission(request: Request, _response: Response, next: NextFunction) {
  await getManagedLesson(String(request.params.lessonId ?? ""), request.auth);
  next();
}
