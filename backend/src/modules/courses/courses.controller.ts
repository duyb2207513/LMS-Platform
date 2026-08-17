import { unlink } from "node:fs/promises";
import path from "node:path";
import type { Request, Response } from "express";
import { AppError } from "../../common/errors/AppError.js";
import { sendSuccess } from "../../common/utils/response.js";
import {
  COURSE_THUMBNAIL_DIRECTORY,
  isValidStoredImage
} from "../../config/upload.js";
import {
  archiveCourse,
  createCourse,
  deleteOrArchiveCourse,
  getPublicCourse,
  listInstructorCourses,
  listPublicCourses,
  publishCourse,
  setCourseThumbnail,
  unpublishCourse,
  updateCourse
} from "./courses.service.js";
import type {
  CreateCourseInput,
  InstructorCourseQuery,
  PublicCourseQuery,
  UpdateCourseInput
} from "./courses.types.js";

export function routeParameter(request: Request, name: string): string {
  const value = request.params[name];
  return Array.isArray(value) ? (value[0] ?? "") : value;
}

export async function listPublicCoursesController(
  _request: Request,
  response: Response
): Promise<void> {
  const result = await listPublicCourses(
    response.locals.validatedQuery as PublicCourseQuery
  );
  response.status(200).json({
    success: true,
    message: "Courses retrieved successfully",
    data: result.data,
    meta: result.meta
  });
}

export async function getPublicCourseController(
  request: Request,
  response: Response
): Promise<void> {
  const course = await getPublicCourse(routeParameter(request, "slug"));
  sendSuccess(response, 200, "Course retrieved successfully", course);
}

export async function listInstructorCoursesController(
  request: Request,
  response: Response
): Promise<void> {
  const result = await listInstructorCourses(
    request.auth,
    response.locals.validatedQuery as InstructorCourseQuery
  );
  response.status(200).json({
    success: true,
    message: "Instructor courses retrieved successfully",
    data: result.data,
    meta: result.meta
  });
}

export async function createCourseController(
  request: Request,
  response: Response
): Promise<void> {
  const course = await createCourse(request.auth, request.body as CreateCourseInput);
  sendSuccess(response, 201, "Course created successfully", course);
}

export async function updateCourseController(
  request: Request,
  response: Response
): Promise<void> {
  const course = await updateCourse(
    routeParameter(request, "courseId"),
    request.auth,
    request.body as UpdateCourseInput
  );
  sendSuccess(response, 200, "Course updated successfully", course);
}

async function removeUploadedFile(filenameOrUrl: string): Promise<void> {
  await unlink(path.join(COURSE_THUMBNAIL_DIRECTORY, path.basename(filenameOrUrl))).catch(() => undefined);
}

export async function uploadCourseThumbnailController(
  request: Request,
  response: Response
): Promise<void> {
  if (!request.file) throw new AppError(400, "Thumbnail file is required");

  if (!(await isValidStoredImage(request.file.path, request.file.mimetype))) {
    await removeUploadedFile(request.file.filename);
    throw new AppError(400, "Thumbnail file content is invalid");
  }

  const thumbnailUrl = `${request.protocol}://${request.get("host")}/uploads/course-thumbnails/${request.file.filename}`;
  try {
    const result = await setCourseThumbnail(
      routeParameter(request, "courseId"),
      request.auth,
      thumbnailUrl
    );
    if (result.previousThumbnailUrl?.includes("/uploads/course-thumbnails/")) {
      await removeUploadedFile(result.previousThumbnailUrl);
    }
    sendSuccess(response, 200, "Thumbnail uploaded successfully", {
      thumbnailUrl: result.thumbnailUrl
    });
  } catch (error) {
    await removeUploadedFile(request.file.filename);
    throw error;
  }
}

export async function publishCourseController(
  request: Request,
  response: Response
): Promise<void> {
  const course = await publishCourse(routeParameter(request, "courseId"), request.auth);
  sendSuccess(response, 200, "Course published successfully", course);
}

export async function unpublishCourseController(
  request: Request,
  response: Response
): Promise<void> {
  const course = await unpublishCourse(routeParameter(request, "courseId"), request.auth);
  sendSuccess(response, 200, "Course unpublished successfully", course);
}

export async function archiveCourseController(
  request: Request,
  response: Response
): Promise<void> {
  const course = await archiveCourse(routeParameter(request, "courseId"), request.auth);
  sendSuccess(response, 200, "Course archived successfully", course);
}

export async function deleteCourseController(
  request: Request,
  response: Response
): Promise<void> {
  await deleteOrArchiveCourse(routeParameter(request, "courseId"), request.auth);
  response.status(204).send();
}
