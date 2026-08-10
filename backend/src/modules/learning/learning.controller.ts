import type { Request, Response } from "express";
import { sendSuccess } from "../../common/utils/response.js";
import { getCourseContent } from "./learning.service.js";

export async function getCourseContentController(request: Request, response: Response) {
  sendSuccess(response, 200, "Course content retrieved successfully", await getCourseContent(String(request.params.courseId ?? ""), request.auth));
}
