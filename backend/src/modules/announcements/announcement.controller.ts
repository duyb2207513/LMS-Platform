import type { Request, Response } from "express";
import { sendSuccess } from "../../common/utils/response.js";
import { createAnnouncement, deleteAnnouncement, listCourseAnnouncements, publishAnnouncement, updateAnnouncement } from "./announcement.service.js";
import type { AnnouncementInput, UpdateAnnouncementInput } from "./announcement.types.js";
const parameter = (request: Request, name: string) => String(request.params[name] ?? "");
export async function listAnnouncementsController(request: Request, response: Response) { sendSuccess(response, 200, "Course announcements retrieved successfully", await listCourseAnnouncements(parameter(request, "courseId"), request.auth)); }
export async function createAnnouncementController(request: Request, response: Response) { sendSuccess(response, 201, "Announcement draft created successfully", await createAnnouncement(parameter(request, "courseId"), request.auth, request.body as AnnouncementInput)); }
export async function updateAnnouncementController(request: Request, response: Response) { sendSuccess(response, 200, "Announcement updated successfully", await updateAnnouncement(parameter(request, "id"), request.auth, request.body as UpdateAnnouncementInput)); }
export async function publishAnnouncementController(request: Request, response: Response) { sendSuccess(response, 200, "Announcement published successfully", await publishAnnouncement(parameter(request, "id"), request.auth)); }
export async function deleteAnnouncementController(request: Request, response: Response) { await deleteAnnouncement(parameter(request, "id"), request.auth); response.status(204).send(); }
