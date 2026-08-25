import { AppError } from "../../common/errors/AppError.js";
import { prisma } from "../../config/database.js";
import type { AuthTokenPayload } from "../auth/auth.types.js";
import { getManagedSection } from "../sections/sections.service.js";
import type { CreateLessonInput, UpdateLessonInput } from "./lessons.types.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const canManage = (instructorId: string, actor: AuthTokenPayload) => actor.role === "ADMIN" || instructorId === actor.userId;

export async function getManagedLesson(lessonId: string, actor: AuthTokenPayload) {
  if (!UUID.test(lessonId)) throw new AppError(404, "Lesson not found");
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      contents: {
        select: { contentType: true, textContent: true, fileUrl: true }
      },
      section: { include: { course: { select: { instructorId: true } } } }
    }
  });
  if (!lesson) throw new AppError(404, "Lesson not found");
  if (!canManage(lesson.section.course.instructorId, actor)) throw new AppError(403, "You do not have permission to manage this lesson");
  return lesson;
}

type PublishableLesson = {
  lessonType: string;
  content: string | null;
  videoUrl: string | null;
  documentUrl: string | null;
  isPublished: boolean;
  contents?: Array<{ contentType: string; textContent: string | null; fileUrl: string | null }>;
};

const hasText = (value: string | null) => Boolean(value?.trim());
const isCompleteBlock = (block: NonNullable<PublishableLesson["contents"]>[number]) =>
  block.contentType === "TEXT" ? hasText(block.textContent) : Boolean(block.fileUrl);

function assertPublishable(lesson: PublishableLesson) {
  if (!lesson.isPublished) return;

  // The current course builder stores one or more mixed content blocks in
  // lesson_contents. Keep supporting the legacy Lesson fields for older data.
  if (lesson.contents?.length) {
    if (lesson.contents.some(block => !isCompleteBlock(block))) {
      throw new AppError(400, "Complete every lesson content block before publishing this lesson");
    }
    return;
  }

  if (lesson.lessonType === "TEXT" && !hasText(lesson.content)) throw new AppError(400, "A published text lesson must have content");
  if (lesson.lessonType === "VIDEO" && !lesson.videoUrl) throw new AppError(400, "Upload a video before publishing this lesson");
  if (lesson.lessonType === "DOCUMENT" && !lesson.documentUrl) throw new AppError(400, "Upload a document before publishing this lesson");
}

export async function createLesson(sectionId: string, actor: AuthTokenPayload, input: CreateLessonInput) {
  await getManagedSection(sectionId, actor);
  const position = input.position ?? ((await prisma.lesson.aggregate({ where: { sectionId }, _max: { position: true } }))._max.position ?? 0) + 1;
  const candidate = { lessonType: input.lessonType, content: input.content ?? null, videoUrl: null, documentUrl: null, isPublished: input.isPublished ?? false, contents: [] };
  assertPublishable(candidate);
  return prisma.lesson.create({ data: { ...input, sectionId, position } });
}

export async function updateLesson(lessonId: string, actor: AuthTokenPayload, input: UpdateLessonInput) {
  const existing = await getManagedLesson(lessonId, actor);
  const nextType = input.lessonType ?? existing.lessonType;
  const candidate = {
    lessonType: nextType,
    content: input.content === undefined ? existing.content : input.content,
    videoUrl: nextType === "VIDEO" ? existing.videoUrl : null,
    documentUrl: nextType === "DOCUMENT" ? existing.documentUrl : null,
    isPublished: input.isPublished ?? existing.isPublished,
    contents: existing.contents
  };
  assertPublishable(candidate);
  const removedFileUrls = input.lessonType !== undefined && input.lessonType !== existing.lessonType
    ? [existing.videoUrl, existing.documentUrl].filter((url): url is string => Boolean(url))
    : [];
  const lesson = await prisma.lesson.update({
    where: { id: lessonId },
    data: {
      ...input,
      ...(input.lessonType === undefined ? {} : {
        videoUrl: nextType === "VIDEO" ? existing.videoUrl : null,
        documentUrl: nextType === "DOCUMENT" ? existing.documentUrl : null
      })
    }
  });
  return { lesson, removedFileUrls };
}

export async function setLessonFile(lessonId: string, actor: AuthTokenPayload, fileUrl: string, mimeType: string) {
  const lesson = await getManagedLesson(lessonId, actor);
  const isVideo = mimeType.startsWith("video/");
  if (lesson.lessonType === "TEXT") throw new AppError(409, "Text lessons do not accept file uploads");
  if (lesson.lessonType === "VIDEO" && !isVideo) throw new AppError(400, "A video lesson requires an MP4 or WebM file");
  if (lesson.lessonType === "DOCUMENT" && isVideo) throw new AppError(400, "A document lesson requires a PDF, Word, or PowerPoint file");
  const previousUrl = lesson.lessonType === "VIDEO" ? lesson.videoUrl : lesson.documentUrl;
  const updated = await prisma.lesson.update({
    where: { id: lessonId },
    data: lesson.lessonType === "VIDEO" ? { videoUrl: fileUrl } : { documentUrl: fileUrl },
    select: { id: true, lessonType: true, videoUrl: true, documentUrl: true }
  });
  return { lesson: updated, previousUrl };
}

export async function deleteLesson(lessonId: string, actor: AuthTokenPayload) {
  const lesson = await getManagedLesson(lessonId, actor);
  await prisma.lesson.delete({ where: { id: lessonId } });
  return [lesson.videoUrl, lesson.documentUrl].filter((url): url is string => Boolean(url));
}

