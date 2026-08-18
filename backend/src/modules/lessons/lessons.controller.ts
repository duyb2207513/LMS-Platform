import { unlink } from "node:fs/promises";
import path from "node:path";
import type { Request, Response } from "express";
import { AppError } from "../../common/errors/AppError.js";
import { sendSuccess } from "../../common/utils/response.js";
import { isValidStoredLessonFile, LESSON_FILE_DIRECTORY } from "../../config/upload.js";
import {
  deleteFromCloudinary,
  isCloudinaryConfigured,
  uploadFileToCloudinary
} from "../../config/cloudinary.js";
import type { CreateLessonInput, UpdateLessonInput } from "./lessons.types.js";
import { createLesson, deleteLesson, setLessonFile, updateLesson } from "./lessons.service.js";

const param = (request: Request, key: string) => String(request.params[key] ?? "");

const remove = async (url: string) => {
  if (!url) return;
  if (url.includes("cloudinary.com")) {
    await deleteFromCloudinary(url, "raw");
    await deleteFromCloudinary(url, "video");
    await deleteFromCloudinary(url, "image");
    return;
  }
  await unlink(path.join(LESSON_FILE_DIRECTORY, path.basename(url))).catch(() => undefined);
};

export async function createLessonController(request: Request, response: Response) {
  sendSuccess(
    response,
    201,
    "Lesson created successfully",
    await createLesson(param(request, "sectionId"), request.auth, request.body as CreateLessonInput)
  );
}

export async function updateLessonController(request: Request, response: Response) {
  const result = await updateLesson(param(request, "lessonId"), request.auth, request.body as UpdateLessonInput);
  await Promise.all(result.removedFileUrls.map(remove));
  sendSuccess(response, 200, "Lesson updated successfully", result.lesson);
}

export async function deleteLessonController(request: Request, response: Response) {
  const urls = await deleteLesson(param(request, "lessonId"), request.auth);
  await Promise.all(urls.map(remove));
  response.status(204).send();
}

export async function uploadLessonFileController(request: Request, response: Response) {
  if (!request.file) throw new AppError(400, "Lesson file is required");

  if (!(await isValidStoredLessonFile(request.file.path, request.file.mimetype))) {
    await unlink(request.file.path).catch(() => undefined);
    throw new AppError(400, "Lesson file content is invalid");
  }

  let fileUrl: string;
  if (isCloudinaryConfigured()) {
    try {
      const cloudinaryResult = await uploadFileToCloudinary(request.file.path, {
        folder: "lms/lessons",
        resourceType: "auto"
      });
      fileUrl = cloudinaryResult.secure_url;
    } finally {
      await unlink(request.file.path).catch(() => undefined);
    }
  } else {
    fileUrl = `${request.protocol}://${request.get("host")}/uploads/lesson-files/${request.file.filename}`;
  }

  try {
    const result = await setLessonFile(param(request, "lessonId"), request.auth, fileUrl, request.file.mimetype);
    if (result.previousUrl) await remove(result.previousUrl);
    sendSuccess(response, 200, "Lesson file uploaded successfully", result.lesson);
  } catch (error) {
    if (!isCloudinaryConfigured()) {
      await unlink(request.file.path).catch(() => undefined);
    }
    throw error;
  }
}
