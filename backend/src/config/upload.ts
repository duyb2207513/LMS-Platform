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
export const LESSON_IMAGE_MAX_SIZE = 5 * 1024 * 1024;
export const SUBMISSION_FILE_DIRECTORY = path.resolve("uploads", "submissions");
export const SUBMISSION_FILE_MAX_SIZE = 20 * 1024 * 1024;
export const SUBMISSION_TOTAL_MAX_SIZE = 50 * 1024 * 1024;
export const QUIZ_IMAGE_DIRECTORY = path.resolve("uploads", "quiz-images");
export const ASSIGNMENT_ATTACHMENT_DIRECTORY = path.resolve("uploads", "assignment-attachments");

mkdirSync(COURSE_THUMBNAIL_DIRECTORY, { recursive: true });
mkdirSync(AVATAR_DIRECTORY, { recursive: true });
mkdirSync(LESSON_FILE_DIRECTORY, { recursive: true });
mkdirSync(SUBMISSION_FILE_DIRECTORY, { recursive: true });
mkdirSync(QUIZ_IMAGE_DIRECTORY, { recursive: true });
mkdirSync(ASSIGNMENT_ATTACHMENT_DIRECTORY, { recursive: true });

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

const allowedLessonContentMimeTypes = new Map([
  ...allowedLessonMimeTypes,
  ...allowedMimeTypes
]);

const allowedSubmissionMimeTypes = new Map([
  ...allowedMimeTypes,
  ["application/pdf", ".pdf"],
  ["text/plain", ".txt"],
  ["application/msword", ".doc"],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", ".docx"],
  ["application/vnd.ms-excel", ".xls"],
  ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", ".xlsx"],
  ["application/zip", ".zip"]
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

const lessonContentFileUpload = multer({
  storage: multer.diskStorage({
    destination: LESSON_FILE_DIRECTORY,
    filename: (_request, file, callback) => {
      callback(null, `${randomUUID()}${allowedLessonContentMimeTypes.get(file.mimetype) ?? ""}`);
    }
  }),
  limits: { fileSize: LESSON_FILE_MAX_SIZE, files: 1 },
  fileFilter: (_request, file, callback) => {
    if (!allowedLessonContentMimeTypes.has(file.mimetype)) {
      callback(new AppError(400, "Lesson content must be an image, video, PDF, Word, or PowerPoint file"));
      return;
    }
    callback(null, true);
  }
}).single("file");

export const uploadLessonContentFile: import("express").RequestHandler = (request, response, next) => {
  lessonContentFileUpload(request, response, error => {
    if (!error) return next();
    if (error instanceof AppError) return next(error);
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return next(new AppError(400, "Lesson content file must not exceed 100 MB"));
    }
    next(new AppError(400, "Invalid lesson content upload"));
  });
};

export async function isValidStoredLessonFile(filePath: string, mimeType: string): Promise<boolean> {
  if (allowedMimeTypes.has(mimeType)) return isValidStoredImage(filePath, mimeType);
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

const submissionStorage = multer.diskStorage({
  destination: SUBMISSION_FILE_DIRECTORY,
  filename: (_request, file, callback) => callback(null, `${randomUUID()}${allowedSubmissionMimeTypes.get(file.mimetype) ?? ""}`)
});

const multerSubmissionUpload = multer({
  storage: submissionStorage,
  limits: { fileSize: SUBMISSION_FILE_MAX_SIZE, files: 5 },
  fileFilter: (_request, file, callback) => {
    if (!allowedSubmissionMimeTypes.has(file.mimetype)) {
      callback(new AppError(400, "Submission files must be JPG, PNG, WebP, PDF, TXT, Word, Excel, or ZIP"));
      return;
    }
    callback(null, true);
  }
}).array("files", 5);

export const uploadSubmissionFiles: import("express").RequestHandler = (request, response, next) => {
  multerSubmissionUpload(request, response, error => {
    if (!error) return next();
    if (error instanceof AppError) return next(error);
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return next(new AppError(400, "Each submission file must not exceed 20 MB"));
    }
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_COUNT") {
      return next(new AppError(400, "A submission accepts at most 5 files"));
    }
    next(new AppError(400, "Invalid submission file upload"));
  });
};

export async function isValidStoredSubmissionFile(filePath: string, mimeType: string): Promise<boolean> {
  if (allowedMimeTypes.has(mimeType)) return isValidStoredImage(filePath, mimeType);
  const handle = await open(filePath, "r");
  try {
    const header = Buffer.alloc(512);
    const { bytesRead } = await handle.read(header, 0, header.length, 0);
    if (mimeType === "application/pdf") return bytesRead >= 4 && header.subarray(0, 4).toString() === "%PDF";
    if (mimeType === "text/plain") return bytesRead === 0 || !header.subarray(0, bytesRead).includes(0);
    if (mimeType === "application/zip" || mimeType.includes("openxmlformats")) {
      return bytesRead >= 4 && header[0] === 0x50 && header[1] === 0x4b && [0x03, 0x05, 0x07].includes(header[2] ?? -1);
    }
    if (mimeType === "application/msword" || mimeType === "application/vnd.ms-excel") {
      return bytesRead >= 8 && header.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]));
    }
    return false;
  } finally {
    await handle.close();
  }
}

function imageUpload(directory: string, field: string) {
  return multer({
    storage: multer.diskStorage({ destination: directory, filename: (_request, file, callback) => callback(null, `${randomUUID()}${allowedMimeTypes.get(file.mimetype) ?? ""}`) }),
    limits: { fileSize: COURSE_THUMBNAIL_MAX_SIZE, files: 1 },
    fileFilter: (_request, file, callback) => allowedMimeTypes.has(file.mimetype) ? callback(null, true) : callback(new AppError(400, "Image must be JPG, PNG, or WebP"))
  }).single(field);
}

const quizImageUpload = imageUpload(QUIZ_IMAGE_DIRECTORY, "image");
export const uploadQuizQuestionImage: import("express").RequestHandler = (request, response, next) => {
  quizImageUpload(request, response, error => {
    if (!error) return next();
    if (error instanceof AppError) return next(error);
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") return next(new AppError(400, "Question image must not exceed 5 MB"));
    next(new AppError(400, "Invalid question image upload"));
  });
};

const assignmentAttachmentUpload = multer({
  storage: multer.diskStorage({ destination: ASSIGNMENT_ATTACHMENT_DIRECTORY, filename: (_request, file, callback) => callback(null, `${randomUUID()}${allowedSubmissionMimeTypes.get(file.mimetype) ?? ""}`) }),
  limits: { fileSize: SUBMISSION_FILE_MAX_SIZE, files: 5 },
  fileFilter: (_request, file, callback) => allowedSubmissionMimeTypes.has(file.mimetype) ? callback(null, true) : callback(new AppError(400, "Assignment attachments must be images, PDF, TXT, Word, Excel, or ZIP"))
}).array("files", 5);

export const uploadAssignmentAttachments: import("express").RequestHandler = (request, response, next) => {
  assignmentAttachmentUpload(request, response, error => {
    if (!error) return next();
    if (error instanceof AppError) return next(error);
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") return next(new AppError(400, "Each assignment attachment must not exceed 20 MB"));
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_COUNT") return next(new AppError(400, "An assignment accepts at most 5 attachments per upload"));
    next(new AppError(400, "Invalid assignment attachment upload"));
  });
};
