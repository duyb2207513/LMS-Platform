import { AppError } from "../../common/errors/AppError.js";
import { prisma } from "../../config/database.js";
import type { LearningEventType } from "../../prisma/enums.js";
import type { LearningEventInput, VideoWatchEventInput } from "./analytics.types.js";

async function enrollmentFor(studentId: string, courseId: string) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId, courseId } },
    select: { enrolledAt: true, status: true, course: { select: { status: true } } }
  });
  if (!enrollment || !["ACTIVE", "COMPLETED"].includes(enrollment.status) || enrollment.course.status !== "PUBLISHED") throw new AppError(403, "Enroll in this course to record learning activity");
  return enrollment;
}

async function lessonFor(courseId: string, lessonId: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { id: true, lessonType: true, durationSeconds: true, isPublished: true, section: { select: { courseId: true } } }
  });
  if (!lesson || !lesson.isPublished || lesson.section.courseId !== courseId) throw new AppError(404, "Published lesson not found in this course");
  return lesson;
}

export async function recordLearningEvent(studentId: string, input: LearningEventInput): Promise<void> {
  const enrollment = await enrollmentFor(studentId, input.courseId);
  if (input.occurredAt < enrollment.enrolledAt) throw new AppError(400, "occurredAt must not be before enrollment");
  if (input.lessonId) await lessonFor(input.courseId, input.lessonId);

  await prisma.learningEvent.upsert({
    where: {
      userId_sessionId_eventType_occurredAt: {
        userId: studentId,
        sessionId: input.sessionId,
        eventType: input.eventType,
        occurredAt: input.occurredAt
      }
    },
    update: {},
    create: {
      userId: studentId,
      courseId: input.courseId,
      lessonId: input.lessonId,
      eventType: input.eventType,
      sessionId: input.sessionId,
      durationSeconds: input.durationSeconds,
      metadata: input.metadata,
      occurredAt: input.occurredAt
    }
  });
}

export async function recordVideoWatchEvent(studentId: string, input: VideoWatchEventInput): Promise<void> {
  const enrollment = await enrollmentFor(studentId, input.courseId);
  if (input.startedAt < enrollment.enrolledAt) throw new AppError(400, "startedAt must not be before enrollment");
  const lesson = await lessonFor(input.courseId, input.lessonId);
  if (lesson.lessonType !== "VIDEO") throw new AppError(400, "Video watch events can only target video lessons");

  const effectiveEnd = input.endedAt ?? new Date();
  const elapsedSeconds = Math.max(0, Math.ceil((effectiveEnd.getTime() - input.startedAt.getTime()) / 1000));
  if (input.watchedSeconds > elapsedSeconds + 5) throw new AppError(400, "watchedSeconds cannot exceed elapsed session time");
  if (lesson.durationSeconds !== null) {
    if (input.startPositionSeconds > lesson.durationSeconds || (input.endPositionSeconds ?? 0) > lesson.durationSeconds) throw new AppError(400, "Video position cannot exceed lesson duration");
  }
  const completed = Boolean(input.completed && (lesson.durationSeconds === null || (input.endPositionSeconds ?? 0) >= lesson.durationSeconds * 0.9));

  await prisma.videoWatchEvent.upsert({
    where: { userId_sessionId_startedAt: { userId: studentId, sessionId: input.sessionId, startedAt: input.startedAt } },
    update: {},
    create: { ...input, userId: studentId, completed }
  });
}

export async function recordSystemLearningEvent(input: {
  userId: string;
  courseId: string;
  lessonId?: string;
  eventType: Extract<LearningEventType, "LESSON_COMPLETED" | "QUIZ_SUBMITTED">;
  sessionId: string;
  occurredAt: Date;
  metadata?: Record<string, string | number | boolean | null>;
}): Promise<void> {
  await prisma.learningEvent.upsert({
    where: { userId_sessionId_eventType_occurredAt: { userId: input.userId, sessionId: input.sessionId, eventType: input.eventType, occurredAt: input.occurredAt } },
    update: {},
    create: input
  });
}
