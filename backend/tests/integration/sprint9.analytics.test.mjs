import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { prisma } from "../../dist/config/database.js";

const api = "http://localhost:3000/api/v1";
const stamp = Date.now().toString();
const emails = ["owner", "other", "student", "outsider"].map(name => `sprint9-${name}-${stamp}@example.com`);
const bearer = user => `Bearer ${jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_ACCESS_SECRET, { expiresIn: "15m" })}`;
const json = (url, method, authorization, body) => fetch(url, { method, headers: { authorization, ...(body === undefined ? {} : { "content-type": "application/json" }) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
const localDate = date => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
const now = new Date(), today = localDate(now), yesterday = localDate(new Date(now.getTime() - 86_400_000));
let categoryId, courseId, foreignCourseId, orderId;

try {
  const [owner, other, student, outsider] = await Promise.all([
    prisma.user.create({ data: { fullName: "Sprint 9 Owner", email: emails[0], passwordHash: "x", role: "INSTRUCTOR" } }),
    prisma.user.create({ data: { fullName: "Sprint 9 Other", email: emails[1], passwordHash: "x", role: "INSTRUCTOR" } }),
    prisma.user.create({ data: { fullName: "Sprint 9 Student", email: emails[2], passwordHash: "x", role: "STUDENT" } }),
    prisma.user.create({ data: { fullName: "Sprint 9 Outsider", email: emails[3], passwordHash: "x", role: "STUDENT" } })
  ]);
  const [ownerAuth, otherAuth, studentAuth, outsiderAuth] = [owner, other, student, outsider].map(bearer);
  const category = await prisma.category.create({ data: { name: `Sprint 9 ${stamp}`, slug: `sprint-9-${stamp}` } }); categoryId = category.id;
  const course = await prisma.course.create({ data: { instructorId: owner.id, categoryId, title: "Sprint 9 Analytics", slug: `sprint-9-analytics-${stamp}`, description: "Analytics", level: "BEGINNER", price: 100000, status: "PUBLISHED", publishedAt: new Date() } }); courseId = course.id;
  const foreignCourse = await prisma.course.create({ data: { instructorId: other.id, categoryId, title: "Foreign Analytics", slug: `foreign-analytics-${stamp}`, description: "Private", level: "BEGINNER", isFree: true, status: "PUBLISHED", publishedAt: new Date() } }); foreignCourseId = foreignCourse.id;
  const section = await prisma.section.create({ data: { courseId, title: "Analytics lessons", position: 1 } });
  const [textLesson, videoLesson] = await Promise.all([
    prisma.lesson.create({ data: { sectionId: section.id, title: "Tracked text", lessonType: "TEXT", position: 1, isPublished: true } }),
    prisma.lesson.create({ data: { sectionId: section.id, title: "Tracked video", lessonType: "VIDEO", videoUrl: "https://example.com/video.mp4", durationSeconds: 600, position: 2, isPublished: true } })
  ]);
  await prisma.enrollment.create({ data: { studentId: student.id, courseId, enrolledAt: new Date(now.getTime() - 3_600_000), progressPercent: 50 } });
  await prisma.lessonProgress.create({ data: { studentId: student.id, lessonId: textLesson.id, isCompleted: true, completedAt: new Date(now.getTime() - 10_000) } });

  assert.equal((await fetch(`${api}/analytics/student/overview`)).status, 401);
  assert.equal((await json(`${api}/analytics/events`, "POST", ownerAuth, {})).status, 403);
  const sessionId = crypto.randomUUID();
  const event = { courseId, lessonId: textLesson.id, eventType: "STUDY_SESSION", durationSeconds: 60, occurredAt: new Date(now.getTime() - 30_000).toISOString(), sessionId };
  assert.equal((await json(`${api}/analytics/events`, "POST", outsiderAuth, event)).status, 403);
  assert.equal((await json(`${api}/analytics/events`, "POST", studentAuth, { ...event, durationSeconds: 301 })).status, 400);
  assert.equal((await json(`${api}/analytics/events`, "POST", studentAuth, event)).status, 204);
  assert.equal((await json(`${api}/analytics/events`, "POST", studentAuth, event)).status, 204);
  assert.equal(await prisma.learningEvent.count({ where: { userId: student.id, sessionId } }), 1);
  await json(`${api}/analytics/events`, "POST", studentAuth, { courseId, lessonId: videoLesson.id, eventType: "LESSON_STARTED", occurredAt: new Date(now.getTime() - 29_000).toISOString(), sessionId: crypto.randomUUID() });
  await prisma.learningEvent.create({ data: { userId: student.id, courseId, lessonId: textLesson.id, eventType: "LESSON_COMPLETED", sessionId: crypto.randomUUID(), occurredAt: new Date(now.getTime() - 20_000) } });

  const watch = { courseId, lessonId: videoLesson.id, sessionId: crypto.randomUUID(), startedAt: new Date(now.getTime() - 35_000).toISOString(), endedAt: new Date(now.getTime() - 5_000).toISOString(), startPositionSeconds: 0, endPositionSeconds: 30, watchedSeconds: 30, completed: false };
  assert.equal((await json(`${api}/analytics/video-watch-events`, "POST", studentAuth, { ...watch, watchedSeconds: 100 })).status, 400);
  assert.equal((await json(`${api}/analytics/video-watch-events`, "POST", studentAuth, watch)).status, 204);
  assert.equal((await json(`${api}/analytics/video-watch-events`, "POST", studentAuth, watch)).status, 204);

  const quiz = await prisma.quiz.create({ data: { lessonId: textLesson.id, title: "Analytics quiz", isPublished: true } });
  await prisma.quizAttempt.createMany({ data: [
    { quizId: quiz.id, studentId: student.id, attemptNumber: 1, status: "SUBMITTED", score: 50, submittedAt: new Date(now.getTime() - 15_000) },
    { quizId: quiz.id, studentId: student.id, attemptNumber: 2, status: "SUBMITTED", score: 80, submittedAt: new Date(now.getTime() - 5_000) }
  ] });
  await prisma.review.create({ data: { courseId, userId: student.id, rating: 4, content: "Useful" } });
  const order = await prisma.order.create({ data: { orderNumber: `S9-${stamp}`, userId: student.id, status: "PAID", subtotal: 100000, total: 100000, paidAt: now } }); orderId = order.id;
  await prisma.orderItem.create({ data: { orderId, courseId, courseTitleSnapshot: course.title, priceSnapshot: 100000 } });
  await prisma.payment.create({ data: { orderId, provider: "MOCK", status: "SUCCEEDED", amount: 100000, idempotencyKey: `sprint9-${stamp}`, paidAt: now } });

  const overviewResponse = await fetch(`${api}/analytics/student/overview`, { headers: { authorization: studentAuth } });
  assert.equal(overviewResponse.status, 200); const overview = (await overviewResponse.json()).data;
  assert.equal(overview.enrolledCourses, 1); assert.equal(overview.inProgressCourses, 1); assert.equal(overview.totalLearningSeconds, 90); assert.equal(overview.averageQuizScore, 80);
  const progress = await (await fetch(`${api}/analytics/student/course-progress`, { headers: { authorization: studentAuth } })).json();
  assert.equal(progress.data[0].progressPercent, 50); assert.equal(progress.data[0].continueUrl.endsWith(videoLesson.id), true);
  const activity = await (await fetch(`${api}/analytics/student/activity?from=${today}&to=${today}`, { headers: { authorization: studentAuth } })).json();
  assert.equal(activity.data[0].learningSeconds, 90); assert.equal(activity.data[0].completedLessons, 1); assert.equal(activity.data[0].quizAttempts, 2);
  const streak = await (await fetch(`${api}/analytics/student/streak`, { headers: { authorization: studentAuth } })).json(); assert.equal(streak.data.currentStreakDays, 1);

  assert.equal((await fetch(`${api}/analytics/instructor/overview`, { headers: { authorization: studentAuth } })).status, 403);
  assert.equal((await fetch(`${api}/analytics/instructor/overview?courseId=${foreignCourse.id}`, { headers: { authorization: ownerAuth } })).status, 403);
  const instructorOverview = await (await fetch(`${api}/analytics/instructor/overview?from=${today}&to=${today}&courseId=${courseId}`, { headers: { authorization: ownerAuth } })).json();
  assert.equal(instructorOverview.data.uniqueStudents, 1); assert.equal(instructorOverview.data.averageQuizScore, 65); assert.equal(instructorOverview.data.averageRating, 4); assert.equal(instructorOverview.data.revenue.amount, 100000);
  const trend = await (await fetch(`${api}/analytics/instructor/enrollments?from=${yesterday}&to=${today}&courseId=${courseId}`, { headers: { authorization: ownerAuth } })).json();
  assert.equal(trend.data.length, 2); assert.equal(trend.data.reduce((sum, item) => sum + item.count, 0), 1);
  const performance = await (await fetch(`${api}/analytics/instructor/course-performance?from=${today}&to=${today}&courseId=${courseId}&sortBy=revenue`, { headers: { authorization: ownerAuth } })).json();
  assert.equal(performance.data[0].activeStudents, 1); assert.equal(performance.data[0].revenue.amount, 100000);
  const dropOff = await (await fetch(`${api}/analytics/instructor/drop-off-lessons?from=${today}&to=${today}&courseId=${courseId}`, { headers: { authorization: ownerAuth } })).json();
  assert.equal(dropOff.data[0].lessonId, videoLesson.id); assert.equal(dropOff.data[0].dropOffRate, 100);
  assert.equal((await fetch(`${api}/analytics/instructor/drop-off-lessons?courseId=${courseId}`, { headers: { authorization: otherAuth } })).status, 403);
  console.log("Sprint 9 analytics tracking, metrics and authorization tests passed");
} finally {
  if (orderId) await prisma.order.deleteMany({ where: { id: orderId } });
  if (courseId || foreignCourseId) await prisma.course.deleteMany({ where: { id: { in: [courseId, foreignCourseId].filter(Boolean) } } });
  if (categoryId) await prisma.category.deleteMany({ where: { id: categoryId } });
  await prisma.user.deleteMany({ where: { email: { in: emails } } });
  await prisma.$disconnect();
}
