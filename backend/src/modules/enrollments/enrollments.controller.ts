import type { Request, Response } from "express";
import { sendSuccess } from "../../common/utils/response.js";
import { enrollFreeCourse, listMyEnrollments } from "./enrollments.service.js";

const param = (request: Request, key: string) => String(request.params[key] ?? "");
export async function enrollFreeCourseController(request: Request, response: Response) { sendSuccess(response, 201, "Course enrolled successfully", await enrollFreeCourse(param(request, "courseId"), request.auth.userId)); }
export async function listMyEnrollmentsController(request: Request, response: Response) { sendSuccess(response, 200, "Enrollments retrieved successfully", await listMyEnrollments(request.auth.userId)); }
