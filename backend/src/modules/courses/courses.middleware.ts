import type { NextFunction, Request, Response } from "express";
import { assertCourseManagePermission } from "./courses.service.js";
import { routeParameter } from "./courses.controller.js";

export async function ensureCourseManagePermission(
  request: Request,
  _response: Response,
  next: NextFunction
): Promise<void> {
  await assertCourseManagePermission(routeParameter(request, "courseId"), request.auth);
  next();
}
