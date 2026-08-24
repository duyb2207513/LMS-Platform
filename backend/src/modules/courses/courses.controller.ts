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
  deleteFromCloudinary,
  isCloudinaryConfigured,
  uploadFileToCloudinary
} from "../../config/cloudinary.js";
import {
  archiveCourse,
  createCourse,
  deleteOrArchiveCourse,
  getInstructorCourse,
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
  UpdateCourseInput
} from "./courses.types.js";

export function routeParameter(request: Request, name: string): string {
  const value = request.params[name];

  if (!value || typeof value !== "string") {
    throw new AppError(400, `Missing required parameter ${name}`);
  }

  return value;
}

export async function createCourseController(
  request: Request,
  response: Response
): Promise<void> {
  const course = await createCourse(request.auth, request.body as CreateCourseInput);
  sendSuccess(response, 201, "Course created successfully", course);
}

export async function listPublicCoursesController(
  request: Request,
  response: Response
): Promise<void> {
  const result = await listPublicCourses((response.locals.validatedQuery ?? request.query) as any);
  sendSuccess(response, 200, "Courses retrieved successfully", result.data, result.meta);
}

export async function getPublicCourseController(
  request: Request,
  response: Response
): Promise<void> {
  const param = String(request.params.slug || request.params.courseId || "");
  if (!param) throw new AppError(400, "Missing course identifier");
  const course = await getPublicCourse(param);
  sendSuccess(response, 200, "Course retrieved successfully", course);
}

export async function listInstructorCoursesController(
  request: Request,
  response: Response
): Promise<void> {
  const query: InstructorCourseQuery = {
    page: Number(request.query.page ?? 1),
    limit: Number(request.query.limit ?? 10),
    status: typeof request.query.status === "string" ? (request.query.status as any) : undefined,
    search: typeof request.query.search === "string" ? request.query.search : undefined
  };
  const result = await listInstructorCourses(request.auth, query);
  sendSuccess(response, 200, "Instructor courses retrieved successfully", result);
}

export async function getInstructorCourseController(
  request: Request,
  response: Response
): Promise<void> {
  const course = await getInstructorCourse(
    routeParameter(request, "courseId"),
    request.auth
  );
  sendSuccess(response, 200, "Instructor course retrieved successfully", course);
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
  if (!filenameOrUrl) return;
  if (filenameOrUrl.includes("cloudinary.com")) {
    await deleteFromCloudinary(filenameOrUrl, "image");
    return;
  }
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

  let thumbnailUrl: string;
  if (isCloudinaryConfigured()) {
    try {
      const cloudinaryResult = await uploadFileToCloudinary(request.file.path, {
        folder: "lms/thumbnails",
        resourceType: "image"
      });
      thumbnailUrl = cloudinaryResult.secure_url;
    } finally {
      await unlink(request.file.path).catch(() => undefined);
    }
  } else {
    thumbnailUrl = `${request.protocol}://${request.get("host")}/uploads/course-thumbnails/${request.file.filename}`;
  }

  try {
    const result = await setCourseThumbnail(
      routeParameter(request, "courseId"),
      request.auth,
      thumbnailUrl
    );
    if (result.previousThumbnailUrl) {
      await removeUploadedFile(result.previousThumbnailUrl);
    }
    sendSuccess(response, 200, "Thumbnail uploaded successfully", {
      thumbnailUrl: result.thumbnailUrl
    });
  } catch (error) {
    if (!isCloudinaryConfigured()) {
      await removeUploadedFile(request.file.filename);
    }
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
