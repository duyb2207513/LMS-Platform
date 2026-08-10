import type { Request, Response } from "express";
import { sendSuccess } from "../../common/utils/response.js";
import { dashboardStats, listAdminComments, listAdminCourses, listAdminReviews, listAdminUsers, parseAdminQuery, removeAdminComment, removeAdminReview, updateAdminCourse, updateAdminUser } from "./admin.service.js";
import type { UpdateAdminCourseInput, UpdateAdminUserInput } from "./admin.types.js";

const param = (request: Request, key: string) => String(request.params[key] ?? "");
export async function dashboardController(_request: Request, response: Response) { sendSuccess(response, 200, "Admin dashboard retrieved successfully", await dashboardStats()); }
export async function usersController(request: Request, response: Response) { sendSuccess(response, 200, "Users retrieved successfully", await listAdminUsers(parseAdminQuery(request.query))); }
export async function updateUserController(request: Request, response: Response) { sendSuccess(response, 200, "User updated successfully", await updateAdminUser(param(request, "userId"), request.auth.userId, request.body as UpdateAdminUserInput)); }
export async function coursesController(request: Request, response: Response) { sendSuccess(response, 200, "Courses retrieved successfully", await listAdminCourses(parseAdminQuery(request.query))); }
export async function updateCourseController(request: Request, response: Response) { sendSuccess(response, 200, "Course moderation status updated successfully", await updateAdminCourse(param(request, "courseId"), request.body as UpdateAdminCourseInput)); }
export async function reviewsController(request: Request, response: Response) { sendSuccess(response, 200, "Reviews retrieved successfully", await listAdminReviews(parseAdminQuery(request.query))); }
export async function deleteReviewController(request: Request, response: Response) { await removeAdminReview(param(request, "reviewId")); response.status(204).send(); }
export async function commentsController(request: Request, response: Response) { sendSuccess(response, 200, "Comments retrieved successfully", await listAdminComments(parseAdminQuery(request.query))); }
export async function deleteCommentController(request: Request, response: Response) { await removeAdminComment(param(request, "commentId")); response.status(204).send(); }
