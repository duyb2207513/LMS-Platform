import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { open } from "node:fs/promises";
import path from "node:path";
import multer from "multer";
import { AppError } from "../common/errors/AppError.js";

export const COURSE_THUMBNAIL_DIRECTORY = path.resolve("uploads", "course-thumbnails");
export const COURSE_THUMBNAIL_MAX_SIZE = 5 * 1024 * 1024;

mkdirSync(COURSE_THUMBNAIL_DIRECTORY, { recursive: true });

const allowedMimeTypes = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"]
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
