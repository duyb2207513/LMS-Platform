import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { open } from "node:fs/promises";
import path from "node:path";
import multer from "multer";
import { AppError } from "../common/errors/AppError.js";

export const COURSE_THUMBNAIL_DIRECTORY = path.resolve("uploads", "course-thumbnails");
export const COURSE_THUMBNAIL_MAX_SIZE = 5 * 1024 * 1024;
export const AVATAR_DIRECTORY = path.resolve("uploads", "avatars");
export const AVATAR_MAX_SIZE = 5 * 1024 * 1024;
export const LESSON_FILE_DIRECTORY = path.resolve("uploads", "lesson-files");
export const LESSON_FILE_MAX_SIZE = 100 * 1024 * 1024;

mkdirSync(COURSE_THUMBNAIL_DIRECTORY, { recursive: true });
mkdirSync(AVATAR_DIRECTORY, { recursive: true });
mkdirSync(LESSON_FILE_DIRECTORY, { recursive: true });

const allowedMimeTypes = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"]
]);

const allowedLessonMimeTypes = new Map([
  ["video/mp4", ".mp4"],
  ["video/webm", ".webm"],
  ["application/pdf", ".pdf"],
  ["application/msword", ".doc"],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", ".docx"],
  ["application/vnd.ms-powerpoint", ".ppt"],
  ["application/vnd.openxmlformats-officedocument.presentationml.presentation", ".pptx"]
]);

const storage = multer.diskStorage({
  destination: COURSE_THUMBNAIL_DIRECTORY,
  filename: (_request, file, callback) => {
    callback(null, `${randomUUID()}${allowedMimeTypes.get(file.mimetype) ?? ""}`);
  }
});

const multerUpload = multer({
  storage,
  limits: { fileSize: COURSE_THUMBNAIL_MAX_SIZE, files: 1 },
  fileFilter: (_request, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(new AppError(400, "Thumbnail must be a JPG, PNG, or WebP image"));
      return;
    }

    callback(null, true);
  }
}).single("thumbnail");

export const uploadCourseThumbnail: import("express").RequestHandler = (
  request,
  response,
  next
) => {
  multerUpload(request, response, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof AppError) {
      next(error);
      return;
    }

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      next(new AppError(400, "Thumbnail must not exceed 5 MB"));
      return;
    }

    next(new AppError(400, "Invalid thumbnail upload"));
  });
};

const avatarStorage = multer.diskStorage({
  destination: AVATAR_DIRECTORY,
  filename: (_request, file, callback) => {
    callback(null, `${randomUUID()}${allowedMimeTypes.get(file.mimetype) ?? ""}`);
  }
});

const multerAvatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: AVATAR_MAX_SIZE, files: 1 },
  fileFilter: (_request, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(new AppError(400, "Avatar must be a JPG, PNG, or WebP image"));
      return;
    }
    callback(null, true);
  }
}).single("avatar");

export const uploadAvatar: import("express").RequestHandler = (request, response, next) => {
  multerAvatarUpload(request, response, (error) => {
    if (!error) return next();
    if (error instanceof AppError) return next(error);
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return next(new AppError(400, "Avatar must not exceed 5 MB"));
    }
    next(new AppError(400, "Invalid avatar upload"));
  });
};

export async function isValidStoredImage(
  filePath: string,
  mimeType: string
): Promise<boolean> {
  const handle = await open(filePath, "r");
  try {
    const header = Buffer.alloc(12);
    const { bytesRead } = await handle.read(header, 0, header.length, 0);
    if (mimeType === "image/jpeg") {
      return bytesRead >= 3 && header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
    }
    if (mimeType === "image/png") {
      return bytesRead >= 8 && header.subarray(0, 8).equals(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
      );
    }
    if (mimeType === "image/webp") {
      return bytesRead >= 12 &&
        header.subarray(0, 4).toString("ascii") === "RIFF" &&
        header.subarray(8, 12).toString("ascii") === "WEBP";
    }
    return false;
  } finally {
    await handle.close();
  }
}

const lessonStorage = multer.diskStorage({
  destination: LESSON_FILE_DIRECTORY,
  filename: (_request, file, callback) => {
    callback(null, `${randomUUID()}${allowedLessonMimeTypes.get(file.mimetype) ?? ""}`);
  }
});

const lessonFileUpload = multer({
  storage: lessonStorage,
  limits: { fileSize: LESSON_FILE_MAX_SIZE, files: 1 },
  fileFilter: (_request, file, callback) => {
    if (!allowedLessonMimeTypes.has(file.mimetype)) {
      callback(new AppError(400, "Lesson file must be MP4, WebM, PDF, Word, or PowerPoint"));
      return;
    }
    callback(null, true);
  }
}).single("file");

export const uploadLessonFile: import("express").RequestHandler = (request, response, next) => {
  lessonFileUpload(request, response, error => {
    if (!error) return next();
    if (error instanceof AppError) return next(error);
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return next(new AppError(400, "Lesson file must not exceed 100 MB"));
    }
    next(new AppError(400, "Invalid lesson file upload"));
  });
};

export async function isValidStoredLessonFile(filePath: string, mimeType: string): Promise<boolean> {
  const handle = await open(filePath, "r");
  try {
    const header = Buffer.alloc(16);
    const { bytesRead } = await handle.read(header, 0, header.length, 0);
    if (mimeType === "application/pdf") return bytesRead >= 4 && header.subarray(0, 4).toString() === "%PDF";
    if (mimeType === "video/mp4") return bytesRead >= 8 && header.subarray(4, 8).toString("ascii") === "ftyp";
    if (mimeType === "video/webm") return bytesRead >= 4 && header.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
    if (mimeType.includes("openxmlformats")) return bytesRead >= 2 && header[0] === 0x50 && header[1] === 0x4b;
    if (mimeType === "application/msword" || mimeType === "application/vnd.ms-powerpoint") {
      return bytesRead >= 8 && header.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]));
    }
    return false;
  } finally {
    await handle.close();
  }
}
