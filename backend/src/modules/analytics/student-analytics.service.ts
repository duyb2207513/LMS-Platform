import { prisma } from "../../config/database.js";
import { bucketKey, buildBucketKeys, calculateStreak, dateKey } from "./analytics.date.js";
import type { AnalyticsDateRange } from "./analytics.types.js";

const round = (value: number, digits = 2) => Number(value.toFixed(digits));
const decimal = (value: unknown) => value === null || value === undefined ? 0 : Number(value);

async function streakFor(studentId: string) {
  const [learning, video] = await Promise.all([
    prisma.learningEvent.findMany({ where: { userId: studentId }, select: { occurredAt: true } }),
    prisma.videoWatchEvent.findMany({ where: { userId: studentId }, select: { startedAt: true } })
  ]);
  return calculateStreak([...learning.map(item => dateKey(item.occurredAt)), ...video.map(item => dateKey(item.startedAt))]);
}

async function averageBestQuizScore(studentId: string): Promise<number | null> {
  const attempts = await prisma.quizAttempt.groupBy({
    by: ["quizId"],
    where: { studentId, status: "SUBMITTED", score: { not: null } },
    _max: { score: true }
  });
  if (!attempts.length) return null;
  return round(attempts.reduce((sum, item) => sum + decimal(item._max.score), 0) / attempts.length);
}

export async function getStudentOverview(studentId: string) {
  const [enrollments, learningTime, videoTime, averageQuizScore, streak] = await Promise.all([
    prisma.enrollment.findMany({
      where: { studentId, status: { in: ["ACTIVE", "COMPLETED"] } },
      select: {
        status: true,
        progressPercent: true,
        course: { select: { learningEvents: { where: { userId: studentId }, take: 1, select: { id: true } }, videoWatchEvents: { where: { userId: studentId }, take: 1, select: { id: true } } } }
      }
    }),
    prisma.learningEvent.aggregate({ where: { userId: studentId }, _sum: { durationSeconds: true } }),
    prisma.videoWatchEvent.aggregate({ where: { userId: studentId }, _sum: { watchedSeconds: true } }),
    averageBestQuizScore(studentId),
    streakFor(studentId)
  ]);
  const completedCourses = enrollments.filter(item => item.status === "COMPLETED" || decimal(item.progressPercent) >= 100).length;
  const inProgressCourses = enrollments.filter(item => item.status !== "COMPLETED" && decimal(item.progressPercent) < 100 && (decimal(item.progressPercent) > 0 || item.course.learningEvents.length > 0 || item.course.videoWatchEvents.length > 0)).length;
  return {
    enrolledCourses: enrollments.length,
    inProgressCourses,
    completedCourses,
    notStartedCourses: Math.max(0, enrollments.length - completedCourses - inProgressCourses),
    totalLearningSeconds: (learningTime._sum.durationSeconds ?? 0) + (videoTime._sum.watchedSeconds ?? 0),
    averageQuizScore,
    ...streak
  };
}

export async function getStudentCourseProgress(studentId: string) {
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId, status: { in: ["ACTIVE", "COMPLETED"] } },
    orderBy: { enrolledAt: "desc" },
    include: {
      course: {
        select: {
          id: true, title: true, thumbnailUrl: true,
          learningEvents: { where: { userId: studentId }, orderBy: { occurredAt: "desc" }, take: 1, select: { occurredAt: true } },
          videoWatchEvents: { where: { userId: studentId }, orderBy: { startedAt: "desc" }, take: 1, select: { startedAt: true } },
          sections: {
            orderBy: { position: "asc" },
            select: { lessons: { where: { isPublished: true }, orderBy: { position: "asc" }, select: { id: true, progress: { where: { studentId }, select: { isCompleted: true, updatedAt: true } } } } }
          }
        }
      }
    }
  });

  return enrollments.map(enrollment => {
    const lessons = enrollment.course.sections.flatMap(section => section.lessons);
    const completedLessons = lessons.filter(lesson => lesson.progress[0]?.isCompleted).length;
    const nextLesson = lessons.find(lesson => !lesson.progress[0]?.isCompleted);
    const activityTimes = [
      enrollment.course.learningEvents[0]?.occurredAt,
      enrollment.course.videoWatchEvents[0]?.startedAt,
      ...lessons.map(lesson => lesson.progress[0]?.updatedAt)
    ].filter((value): value is Date => value instanceof Date);
    const lastLearningAt = activityTimes.length ? new Date(Math.max(...activityTimes.map(value => value.getTime()))) : null;
    return {
      courseId: enrollment.course.id,
      title: enrollment.course.title,
      thumbnailUrl: enrollment.course.thumbnailUrl,
      completedLessons,
      totalLessons: lessons.length,
      progressPercent: lessons.length ? round(Math.min(100, completedLessons / lessons.length * 100)) : 0,
      lastLearningAt,
      continueUrl: nextLesson ? `/courses/${enrollment.course.id}/learn/${nextLesson.id}` : null
    };
  });
}

export async function getStudentActivity(studentId: string, range: AnalyticsDateRange) {
  const time = { gte: range.fromDate, lt: range.toExclusive };
  const [learning, video, completedLessons, quizAttempts] = await Promise.all([
    prisma.learningEvent.findMany({ where: { userId: studentId, occurredAt: time }, select: { occurredAt: true, durationSeconds: true } }),
    prisma.videoWatchEvent.findMany({ where: { userId: studentId, startedAt: time }, select: { startedAt: true, watchedSeconds: true } }),
    prisma.lessonProgress.findMany({ where: { studentId, isCompleted: true, completedAt: time }, select: { completedAt: true } }),
    prisma.quizAttempt.findMany({ where: { studentId, status: "SUBMITTED", submittedAt: time }, select: { submittedAt: true } })
  ]);
  const values = new Map(buildBucketKeys(range.from, range.to, range.groupBy).map(key => [key, { date: key, learningSeconds: 0, completedLessons: 0, quizAttempts: 0 }]));
  const get = (date: Date) => values.get(bucketKey(dateKey(date), range.groupBy))!;
  for (const item of learning) get(item.occurredAt).learningSeconds += item.durationSeconds ?? 0;
  for (const item of video) get(item.startedAt).learningSeconds += item.watchedSeconds;
  for (const item of completedLessons) if (item.completedAt) get(item.completedAt).completedLessons += 1;
  for (const item of quizAttempts) if (item.submittedAt) get(item.submittedAt).quizAttempts += 1;
  return { data: [...values.values()], meta: { from: range.from, to: range.to, groupBy: range.groupBy, timezone: "Asia/Ho_Chi_Minh" } };
}

export async function getStudentStreak(studentId: string) { return streakFor(studentId); }
