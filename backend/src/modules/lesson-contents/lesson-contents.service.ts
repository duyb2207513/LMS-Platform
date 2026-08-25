import { AppError } from "../../common/errors/AppError.js";
import { prisma } from "../../config/database.js";
import type { AuthTokenPayload } from "../auth/auth.types.js";
import { getManagedLesson } from "../lessons/lessons.service.js";
import type { LessonContentInput, ReorderLessonContentsInput, UpdateLessonContentInput } from "./lesson-contents.types.js";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
async function managedContent(id: string, actor: AuthTokenPayload) {
  if (!UUID.test(id)) throw new AppError(404, "Lesson content not found");
  const item = await prisma.lessonContent.findUnique({ where: { id }, include: { lesson: { include: { section: { include: { course: { select: { instructorId: true } } } } } } } });
  if (!item) throw new AppError(404, "Lesson content not found");
  if (actor.role !== "ADMIN" && item.lesson.section.course.instructorId !== actor.userId) throw new AppError(403, "You do not have permission to manage this lesson content");
  return item;
}
export async function listLessonContents(lessonId: string, actor: AuthTokenPayload) { await getManagedLesson(lessonId, actor); return prisma.lessonContent.findMany({ where: { lessonId }, orderBy: [{ position: "asc" }, { createdAt: "asc" }] }); }
export async function createLessonContent(lessonId: string, actor: AuthTokenPayload, input: LessonContentInput) {
  await getManagedLesson(lessonId, actor);
  const max = (await prisma.lessonContent.aggregate({ where: { lessonId }, _max: { position: true } }))._max.position ?? 0;
  const position = input.position ?? max + 1;
  if (position <= max) await prisma.lessonContent.updateMany({ where: { lessonId, position: { gte: position } }, data: { position: { increment: 100000 } } }).then(async () => prisma.lessonContent.updateMany({ where: { lessonId, position: { gte: position + 100000 } }, data: { position: { decrement: 99999 } } }));
  return prisma.lessonContent.create({ data: { lessonId, contentType: input.contentType, textContent: input.contentType === "TEXT" ? input.textContent : null, position } });
}
export async function updateLessonContent(id: string, actor: AuthTokenPayload, input: UpdateLessonContentInput) { const item = await managedContent(id, actor); if (item.contentType !== "TEXT") throw new AppError(400, "Only TEXT content accepts textContent"); return prisma.lessonContent.update({ where: { id }, data: input }); }
export async function setLessonContentFile(id: string, actor: AuthTokenPayload, fileUrl: string, file: Express.Multer.File) { const item = await managedContent(id, actor); if (item.contentType === "TEXT") throw new AppError(400, "TEXT content does not accept a file"); const isVideo = file.mimetype.startsWith("video/"); if ((item.contentType === "VIDEO") !== isVideo) throw new AppError(400, item.contentType === "VIDEO" ? "VIDEO content requires MP4 or WebM" : "DOCUMENT content requires an image, PDF, Word, or PowerPoint"); const content = await prisma.lessonContent.update({ where: { id }, data: { fileUrl, originalName: file.originalname.slice(0, 255), mimeType: file.mimetype, sizeBytes: file.size } }); return { content, previousUrl: item.fileUrl }; }
export async function deleteLessonContent(id: string, actor: AuthTokenPayload) { const item = await managedContent(id, actor); await prisma.lessonContent.delete({ where: { id } }); return item.fileUrl; }
export async function reorderLessonContents(lessonId: string, actor: AuthTokenPayload, input: ReorderLessonContentsInput) { await getManagedLesson(lessonId, actor); const current = await prisma.lessonContent.findMany({ where: { lessonId }, select: { id: true } }); if (current.length !== input.contentIds.length || current.some(item => !input.contentIds.includes(item.id))) throw new AppError(400, "contentIds must contain every content block of this lesson exactly once"); await prisma.$transaction(async tx => { await Promise.all(input.contentIds.map((id, index) => tx.lessonContent.update({ where: { id }, data: { position: -(index + 1) } }))); await Promise.all(input.contentIds.map((id, index) => tx.lessonContent.update({ where: { id }, data: { position: index + 1 } }))); }); return listLessonContents(lessonId, actor); }
