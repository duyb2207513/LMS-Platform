import { AppError } from "../../common/errors/AppError.js";
import { prisma } from "../../config/database.js";
import type { UpdateLessonProgressInput } from "./progress.types.js";
import { recordSystemLearningEvent } from "../analytics/learning-event.service.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function requireEnrollment(studentId: string, courseId: string) {
  const enrollment = await prisma.enrollment.findUnique({ where: { studentId_courseId: { studentId, courseId } } });
  if (!enrollment || !["ACTIVE", "COMPLETED"].includes(enrollment.status)) throw new AppError(403, "Enroll in this course to track progress");
  return enrollment;
}

async function calculateAndStoreProgress(studentId: string, courseId: string) {
  const [totalLessons, completedLessons] = await Promise.all([
    prisma.lesson.count({ where: { isPublished: true, isRequired: true, section: { courseId } } }),
    prisma.lessonProgress.count({ where: { studentId, isCompleted: true, lesson: { isPublished: true, isRequired: true, section: { courseId } } } })
  ]);
  const progressPercent = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 10000) / 100;
  const completed = totalLessons > 0 && completedLessons === totalLessons;
  await prisma.enrollment.update({
    where: { studentId_courseId: { studentId, courseId } },
    data: { progressPercent, status: completed ? "COMPLETED" : "ACTIVE", completedAt: completed ? new Date() : null }
  });
  return { totalLessons, completedLessons, progressPercent };
}

export async function updateLessonProgress(lessonId: string, studentId: string, input: UpdateLessonProgressInput) {
  if (!UUID.test(lessonId)) throw new AppError(404, "Lesson not found");
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { id: true, lessonType: true, durationSeconds: true, isPublished: true, section: { select: { courseId: true, course: { select: { status: true } } } } }
  });
  if (!lesson || !lesson.isPublished || lesson.section.course.status !== "PUBLISHED") throw new AppError(404, "Published lesson not found");
  await requireEnrollment(studentId, lesson.section.courseId);
  if (input.lastWatchedSecond !== undefined && lesson.lessonType !== "VIDEO") throw new AppError(400, "Watch position can only be saved for video lessons");
  if (input.lastWatchedSecond !== undefined && lesson.durationSeconds !== null && input.lastWatchedSecond > lesson.durationSeconds) throw new AppError(400, "Watch position cannot exceed video duration");

  const previous = await prisma.lessonProgress.findUnique({ where: { studentId_lessonId: { studentId, lessonId } } });
  const isCompleted = input.isCompleted ?? previous?.isCompleted ?? false;
  const completedAt = isCompleted ? previous?.completedAt ?? new Date() : null;
  const progress = await prisma.lessonProgress.upsert({
    where: { studentId_lessonId: { studentId, lessonId } },
    create: { studentId, lessonId, isCompleted, lastWatchedSecond: input.lastWatchedSecond ?? 0, completedAt },
    update: { ...(input.lastWatchedSecond === undefined ? {} : { lastWatchedSecond: input.lastWatchedSecond }), ...(input.isCompleted === undefined ? {} : { isCompleted, completedAt }) },
    select: { id: true, lessonId: true, isCompleted: true, lastWatchedSecond: true, completedAt: true, updatedAt: true }
  });
  if (progress.isCompleted && progress.completedAt) await recordSystemLearningEvent({
    userId: studentId,
    courseId: lesson.section.courseId,
    lessonId,
    eventType: "LESSON_COMPLETED",
    sessionId: progress.id,
    occurredAt: progress.completedAt
  });
  const courseProgress = await calculateAndStoreProgress(studentId, lesson.section.courseId);
  const { id: _id, ...publicProgress } = progress;
  return { lessonProgress: publicProgress, courseProgress };
}

export async function getCourseProgress(courseId: string, studentId: string) {
  if (!UUID.test(courseId)) throw new AppError(404, "Course not found");
  await requireEnrollment(studentId, courseId);
  return calculateAndStoreProgress(studentId, courseId);
}
