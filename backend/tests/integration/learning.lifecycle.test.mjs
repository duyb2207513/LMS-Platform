import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { prisma } from "../../dist/config/database.js";

const api = "http://localhost:3000/api/v1";
const stamp = Date.now().toString();
const emails = ["owner", "other", "student", "outsider", "admin"].map(name => `learning-${name}-${stamp}@example.com`);
let categoryId;
const courseIds = [];

const token = user => `Bearer ${jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_ACCESS_SECRET, { expiresIn: "15m" })}`;
const json = (url, method, authorization, body) => fetch(url, { method, headers: { authorization, "content-type": "application/json" }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });

try {
  const [owner, other, student, outsider, admin] = await Promise.all([
    prisma.user.create({ data: { fullName: "Owner", email: emails[0], passwordHash: "x", role: "INSTRUCTOR" } }),
    prisma.user.create({ data: { fullName: "Other", email: emails[1], passwordHash: "x", role: "INSTRUCTOR" } }),
    prisma.user.create({ data: { fullName: "Student", email: emails[2], passwordHash: "x", role: "STUDENT" } }),
    prisma.user.create({ data: { fullName: "Outsider", email: emails[3], passwordHash: "x", role: "STUDENT" } }),
    prisma.user.create({ data: { fullName: "Admin", email: emails[4], passwordHash: "x", role: "ADMIN" } })
  ]);
  const [ownerAuth, otherAuth, studentAuth, outsiderAuth, adminAuth] = [owner, other, student, outsider, admin].map(token);
  const category = await prisma.category.create({ data: { name: `Learning ${stamp}`, slug: `learning-${stamp}` } });
  categoryId = category.id;
  const [freeCourse, paidCourse] = await Promise.all([
    prisma.course.create({ data: { instructorId: owner.id, categoryId, title: `Free ${stamp}`, slug: `free-${stamp}`, description: "Free", thumbnailUrl: "https://example.com/free.jpg", level: "BEGINNER", isFree: true, price: 0, status: "PUBLISHED", publishedAt: new Date() } }),
    prisma.course.create({ data: { instructorId: owner.id, categoryId, title: `Paid ${stamp}`, slug: `paid-${stamp}`, description: "Paid", thumbnailUrl: "https://example.com/paid.jpg", level: "BEGINNER", isFree: false, price: 100, status: "PUBLISHED", publishedAt: new Date() } })
  ]);
  courseIds.push(freeCourse.id, paidCourse.id);

  assert.equal((await json(`${api}/courses/${freeCourse.id}/sections`, "POST", studentAuth, { title: "Denied" })).status, 403);
  assert.equal((await json(`${api}/courses/${freeCourse.id}/sections`, "POST", otherAuth, { title: "Denied" })).status, 403);
  const sectionResponse = await json(`${api}/courses/${freeCourse.id}/sections`, "POST", ownerAuth, { title: "Main section" });
  assert.equal(sectionResponse.status, 201);
  const section = (await sectionResponse.json()).data;
  assert.equal(section.position, 1);
  assert.equal((await json(`${api}/sections/${section.id}`, "PATCH", adminAuth, { title: "Updated section" })).status, 200);

  const textResponse = await json(`${api}/sections/${section.id}/lessons`, "POST", ownerAuth, { title: "Text lesson", lessonType: "TEXT", content: "Content", isPublished: true });
  const textLesson = (await textResponse.json()).data;
  assert.equal(textResponse.status, 201);
  const videoResponse = await json(`${api}/sections/${section.id}/lessons`, "POST", ownerAuth, { title: "Video lesson", lessonType: "VIDEO", durationSeconds: 300 });
  const videoLesson = (await videoResponse.json()).data;
  assert.equal(videoResponse.status, 201);
  assert.equal((await json(`${api}/lessons/${videoLesson.id}`, "PATCH", ownerAuth, { isPublished: true })).status, 400);

  const form = new FormData();
  form.append("file", new Blob([new Uint8Array([0, 0, 0, 0, 0x66, 0x74, 0x79, 0x70, 0, 0, 0, 0])], { type: "video/mp4" }), "lesson.mp4");
  const uploadResponse = await fetch(`${api}/lessons/${videoLesson.id}/file`, { method: "POST", headers: { authorization: ownerAuth }, body: form });
  assert.equal(uploadResponse.status, 200);
  assert.equal((await json(`${api}/lessons/${videoLesson.id}`, "PATCH", ownerAuth, { isPublished: true })).status, 200);

  assert.equal((await fetch(`${api}/courses/${freeCourse.id}/content`, { headers: { authorization: studentAuth } })).status, 403);
  assert.equal((await fetch(`${api}/courses/${paidCourse.id}/enroll`, { method: "POST", headers: { authorization: studentAuth } })).status, 409);
  const enrollmentResponse = await fetch(`${api}/courses/${freeCourse.id}/enroll`, { method: "POST", headers: { authorization: studentAuth } });
  assert.equal(enrollmentResponse.status, 201);
  assert.equal((await fetch(`${api}/courses/${freeCourse.id}/enroll`, { method: "POST", headers: { authorization: studentAuth } })).status, 409);
  assert.equal((await fetch(`${api}/courses/${freeCourse.id}/enroll`, { method: "POST", headers: { authorization: ownerAuth } })).status, 403);
  assert.equal((await fetch(`${api}/courses/${freeCourse.id}/content`, { headers: { authorization: outsiderAuth } })).status, 403);
  const contentResponse = await fetch(`${api}/courses/${freeCourse.id}/content`, { headers: { authorization: studentAuth } });
  const content = await contentResponse.json();
  assert.equal(contentResponse.status, 200);
  assert.equal(content.data.sections[0].lessons.length, 2);

  assert.equal((await json(`${api}/lessons/${textLesson.id}/progress`, "PATCH", studentAuth, { lastWatchedSecond: 5 })).status, 400);
  assert.equal((await json(`${api}/lessons/${videoLesson.id}/progress`, "PATCH", outsiderAuth, { lastWatchedSecond: 5 })).status, 403);
  assert.equal((await json(`${api}/lessons/${videoLesson.id}/progress`, "PATCH", studentAuth, { lastWatchedSecond: 301 })).status, 400);
  const watched = await json(`${api}/lessons/${videoLesson.id}/progress`, "PATCH", studentAuth, { lastWatchedSecond: 120 });
  assert.equal(watched.status, 200);
  assert.equal((await watched.json()).data.lessonProgress.lastWatchedSecond, 120);
  const half = await json(`${api}/lessons/${textLesson.id}/progress`, "PATCH", studentAuth, { isCompleted: true });
  assert.equal((await half.json()).data.courseProgress.progressPercent, 50);
  const complete = await json(`${api}/lessons/${videoLesson.id}/progress`, "PATCH", studentAuth, { isCompleted: true });
  assert.equal((await complete.json()).data.courseProgress.progressPercent, 100);
  const summary = await (await fetch(`${api}/courses/${freeCourse.id}/progress`, { headers: { authorization: studentAuth } })).json();
  assert.equal(summary.data.completedLessons, 2);
  assert.equal((await prisma.enrollment.findUniqueOrThrow({ where: { studentId_courseId: { studentId: student.id, courseId: freeCourse.id } } })).status, "COMPLETED");
  const mine = await (await fetch(`${api}/enrollments/me`, { headers: { authorization: studentAuth } })).json();
  assert.equal(mine.data.some(item => item.course.id === freeCourse.id), true);

  assert.equal((await fetch(`${api}/courses/${freeCourse.id}/sections`, { headers: { authorization: ownerAuth } })).status, 200);
  assert.equal((await fetch(`${api}/sections/${section.id}`, { method: "DELETE", headers: { authorization: ownerAuth } })).status, 204);
  assert.equal(await prisma.lesson.count({ where: { sectionId: section.id } }), 0);
  console.log("Learning lifecycle integration tests passed");
} finally {
  await prisma.course.deleteMany({ where: { id: { in: courseIds } } });
  if (categoryId) await prisma.category.deleteMany({ where: { id: categoryId } });
  await prisma.user.deleteMany({ where: { email: { in: emails } } });
  await prisma.$disconnect();
}
