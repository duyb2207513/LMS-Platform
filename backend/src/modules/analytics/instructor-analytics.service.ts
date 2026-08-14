import { prisma } from "../../config/database.js";
import { bucketKey, buildBucketKeys, dateKey } from "./analytics.date.js";
import { instructorCourses } from "./analytics.repository.js";
import type { CoursePerformanceQuery, DropOffQuery, InstructorAnalyticsQuery } from "./analytics.types.js";

const round = (value: number, digits = 2) => Number(value.toFixed(digits));
const decimal = (value: unknown) => value === null || value === undefined ? 0 : Number(value);
const timeWhere = (query: InstructorAnalyticsQuery) => ({ gte: query.fromDate, lt: query.toExclusive });

export async function getInstructorOverview(instructorId: string, query: InstructorAnalyticsQuery) {
  const courses = await instructorCourses(instructorId, query.courseId);
  const courseIds = courses.map(course => course.id);
  if (!courseIds.length) return {
    data: { uniqueStudents: 0, newEnrollments: 0, completionRate: 0, averageQuizScore: null, averageRating: null, ratingCount: 0, revenue: { amount: 0, currency: "VND", available: true } },
    meta: { from: query.from, to: query.to, timezone: "Asia/Ho_Chi_Minh" }
  };
  const time = timeWhere(query);
  const enrollmentWhere = { courseId: { in: courseIds }, status: { not: "CANCELLED" as const }, enrolledAt: time };
  const [students, newEnrollments, completedEnrollments, quiz, ratings, revenue] = await Promise.all([
    prisma.enrollment.findMany({ where: enrollmentWhere, distinct: ["studentId"], select: { studentId: true } }),
    prisma.enrollment.count({ where: enrollmentWhere }),
    prisma.enrollment.count({ where: { ...enrollmentWhere, OR: [{ status: "COMPLETED" }, { completedAt: { not: null } }, { progressPercent: { gte: 100 } }] } }),
    prisma.quizAttempt.aggregate({ where: { status: "SUBMITTED", score: { not: null }, submittedAt: time, quiz: { lesson: { section: { courseId: { in: courseIds } } } } }, _avg: { score: true } }),
    prisma.review.aggregate({ where: { courseId: { in: courseIds }, createdAt: time }, _avg: { rating: true }, _count: { rating: true } }),
    prisma.orderItem.aggregate({ where: { courseId: { in: courseIds }, order: { status: "PAID", payments: { some: { status: "SUCCEEDED", paidAt: time } } } }, _sum: { priceSnapshot: true } })
  ]);
  return {
    data: {
      uniqueStudents: students.length,
      newEnrollments,
      completionRate: newEnrollments ? round(completedEnrollments / newEnrollments * 100) : 0,
      averageQuizScore: quiz._avg.score === null ? null : round(decimal(quiz._avg.score)),
      averageRating: ratings._avg.rating === null ? null : round(ratings._avg.rating),
      ratingCount: ratings._count.rating,
      revenue: { amount: decimal(revenue._sum.priceSnapshot), currency: "VND", available: true }
    },
    meta: { from: query.from, to: query.to, timezone: "Asia/Ho_Chi_Minh" }
  };
}

export async function getInstructorEnrollments(instructorId: string, query: InstructorAnalyticsQuery) {
  const courseIds = (await instructorCourses(instructorId, query.courseId)).map(course => course.id);
  const rows = courseIds.length ? await prisma.enrollment.findMany({
    where: { courseId: { in: courseIds }, status: { not: "CANCELLED" }, enrolledAt: timeWhere(query) },
    select: { enrolledAt: true }
  }) : [];
  const values = new Map(buildBucketKeys(query.from, query.to, query.groupBy).map(key => [key, { date: key, count: 0 }]));
  for (const row of rows) values.get(bucketKey(dateKey(row.enrolledAt), query.groupBy))!.count += 1;
  return { data: [...values.values()], meta: { from: query.from, to: query.to, groupBy: query.groupBy, timezone: "Asia/Ho_Chi_Minh" } };
}

export async function getInstructorCoursePerformance(instructorId: string, query: CoursePerformanceQuery) {
  const courses = await instructorCourses(instructorId, query.courseId);
  const courseIds = courses.map(course => course.id);
  if (!courseIds.length) return [];
  const time = timeWhere(query);
  const [enrollments, learning, video, attempts, reviews, orderItems] = await Promise.all([
    prisma.enrollment.findMany({ where: { courseId: { in: courseIds }, status: { not: "CANCELLED" }, enrolledAt: time }, select: { courseId: true, studentId: true, status: true, completedAt: true, progressPercent: true } }),
    prisma.learningEvent.findMany({ where: { courseId: { in: courseIds }, occurredAt: time }, select: { courseId: true, userId: true } }),
    prisma.videoWatchEvent.findMany({ where: { courseId: { in: courseIds }, startedAt: time }, select: { courseId: true, userId: true } }),
    prisma.quizAttempt.findMany({ where: { status: "SUBMITTED", score: { not: null }, submittedAt: time, quiz: { lesson: { section: { courseId: { in: courseIds } } } } }, select: { score: true, quiz: { select: { lesson: { select: { section: { select: { courseId: true } } } } } } } }),
    prisma.review.findMany({ where: { courseId: { in: courseIds }, createdAt: time }, select: { courseId: true, rating: true } }),
    prisma.orderItem.findMany({ where: { courseId: { in: courseIds }, order: { status: "PAID", payments: { some: { status: "SUCCEEDED", paidAt: time } } } }, select: { courseId: true, priceSnapshot: true } })
  ]);

  const active = new Map(courseIds.map(id => [id, new Set<string>()]));
  for (const item of [...learning, ...video]) active.get(item.courseId)?.add(item.userId);
  const result = courses.map(course => {
    const courseEnrollments = enrollments.filter(item => item.courseId === course.id);
    const completed = courseEnrollments.filter(item => item.status === "COMPLETED" || item.completedAt !== null || decimal(item.progressPercent) >= 100).length;
    const scores = attempts.filter(item => item.quiz.lesson.section.courseId === course.id).map(item => decimal(item.score));
    const ratings = reviews.filter(item => item.courseId === course.id).map(item => item.rating);
    return {
      courseId: course.id,
      title: course.title,
      enrollments: courseEnrollments.length,
      activeStudents: active.get(course.id)?.size ?? 0,
      completionRate: courseEnrollments.length ? round(completed / courseEnrollments.length * 100) : 0,
      averageQuizScore: scores.length ? round(scores.reduce((sum, value) => sum + value, 0) / scores.length) : null,
      averageRating: ratings.length ? round(ratings.reduce((sum, value) => sum + value, 0) / ratings.length) : null,
      ratingCount: ratings.length,
      revenue: { amount: orderItems.filter(item => item.courseId === course.id).reduce((sum, item) => sum + decimal(item.priceSnapshot), 0), currency: "VND", available: true }
    };
  });
  const field = query.sortBy === "rating" ? "averageRating" : query.sortBy === "revenue" ? null : query.sortBy;
  result.sort((left, right) => {
    const leftValue = query.sortBy === "revenue" ? left.revenue.amount : Number(left[field as "enrollments" | "completionRate" | "averageRating"] ?? 0);
    const rightValue = query.sortBy === "revenue" ? right.revenue.amount : Number(right[field as "enrollments" | "completionRate" | "averageRating"] ?? 0);
    return rightValue - leftValue || left.title.localeCompare(right.title, "vi");
  });
  return result.slice(0, query.limit);
}

export async function getInstructorDropOffLessons(instructorId: string, query: DropOffQuery) {
  await instructorCourses(instructorId, query.courseId);
  const lessons = await prisma.lesson.findMany({
    where: { isPublished: true, section: { courseId: query.courseId } },
    select: { id: true, title: true }
  });
  const events = await prisma.learningEvent.findMany({
    where: { courseId: query.courseId, lessonId: { not: null }, eventType: { in: ["LESSON_STARTED", "LESSON_COMPLETED"] }, occurredAt: { gte: query.fromDate, lt: query.toExclusive } },
    select: { lessonId: true, userId: true, eventType: true }
  });
  return lessons.map(lesson => {
    const started = new Set(events.filter(event => event.lessonId === lesson.id && event.eventType === "LESSON_STARTED").map(event => event.userId));
    const completed = new Set(events.filter(event => event.lessonId === lesson.id && event.eventType === "LESSON_COMPLETED" && started.has(event.userId)).map(event => event.userId));
    const dropOffStudents = Math.max(0, started.size - completed.size);
    return { lessonId: lesson.id, title: lesson.title, startedStudents: started.size, completedStudents: completed.size, dropOffStudents, dropOffRate: started.size ? round(dropOffStudents / started.size * 100) : 0 };
  }).filter(item => item.startedStudents > 0).sort((left, right) => right.dropOffRate - left.dropOffRate || right.startedStudents - left.startedStudents).slice(0, query.limit);
}
