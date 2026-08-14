import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { io as connectSocket } from "socket.io-client";
import { prisma } from "../../dist/config/database.js";
import { runAssignmentDueReminders } from "../../dist/jobs/assignment-reminders.job.js";

const api = "http://localhost:3000/api/v1", stamp = Date.now().toString();
const names = ["owner", "other", "student", "muted", "outsider"];
const emails = names.map(name => `sprint8-${name}-${stamp}@example.com`);
const bearer = user => `Bearer ${jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_ACCESS_SECRET, { expiresIn: "15m" })}`;
const request = (url, method, authorization, body) => fetch(url, { method, headers: { authorization, ...(body === undefined ? {} : { "content-type": "application/json" }) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
let categoryId, courseId, freeCourseId, socket;

try {
  const users = await Promise.all(names.map((name, index) => prisma.user.create({ data: { fullName: `Sprint 8 ${name}`, email: emails[index], passwordHash: "x", role: index < 2 ? "INSTRUCTOR" : "STUDENT" } })));
  const [owner, other, student, muted, outsider] = users;
  const [ownerAuth, otherAuth, studentAuth, mutedAuth, outsiderAuth] = users.map(bearer);
  const category = await prisma.category.create({ data: { name: `Sprint 8 ${stamp}`, slug: `sprint-8-${stamp}` } }); categoryId = category.id;
  const course = await prisma.course.create({ data: { instructorId: owner.id, categoryId, title: "Sprint 8 Communication", slug: `sprint-8-communication-${stamp}`, description: "Notifications", level: "BEGINNER", isFree: true, status: "PUBLISHED", publishedAt: new Date() } }); courseId = course.id;
  await prisma.enrollment.createMany({ data: [{ studentId: student.id, courseId }, { studentId: muted.id, courseId }] });

  assert.equal((await fetch(`${api}/notifications`)).status, 401);
  const defaultPreferences = await (await fetch(`${api}/notification-preferences`, { headers: { authorization: mutedAuth } })).json();
  assert.equal(defaultPreferences.data.courseUpdates, true);
  assert.equal((await request(`${api}/notification-preferences`, "PATCH", mutedAuth, { userId: owner.id })).status, 400);
  assert.equal((await request(`${api}/notification-preferences`, "PATCH", mutedAuth, { courseUpdates: false, assignmentReminders: false })).status, 200);
  const mutedPreferences = await (await fetch(`${api}/notification-preferences`, { headers: { authorization: mutedAuth } })).json();
  assert.equal(mutedPreferences.data.courseUpdates, false); assert.equal(mutedPreferences.data.emailEnabled, true);

  assert.equal((await request(`${api}/courses/${courseId}/announcements`, "POST", studentAuth, { title: "No", content: "No" })).status, 403);
  assert.equal((await request(`${api}/courses/${courseId}/announcements`, "POST", otherAuth, { title: "No", content: "No" })).status, 403);
  const createdResponse = await request(`${api}/courses/${courseId}/announcements`, "POST", ownerAuth, { title: "Lịch học mới", content: "Bắt đầu lúc 08:00" });
  assert.equal(createdResponse.status, 201); const announcement = (await createdResponse.json()).data;
  assert.equal(announcement.status, "DRAFT");
  const beforePublish = await (await fetch(`${api}/courses/${courseId}/announcements`, { headers: { authorization: studentAuth } })).json();
  assert.equal(beforePublish.data.length, 0);
  assert.equal((await fetch(`${api}/courses/${courseId}/announcements`, { headers: { authorization: outsiderAuth } })).status, 403);

  const invalidSocket = connectSocket("http://localhost:3000", { auth: { token: "invalid" }, transports: ["websocket"], forceNew: true, reconnection: false });
  const invalidError = await new Promise(resolve => invalidSocket.once("connect_error", resolve));
  assert.match(invalidError.message, /Invalid|Authentication/); invalidSocket.close();
  socket = connectSocket("http://localhost:3000", { auth: { token: studentAuth.slice(7) }, transports: ["websocket"], forceNew: true, reconnection: false });
  await new Promise((resolve, reject) => { socket.once("connect", resolve); socket.once("connect_error", reject); });
  const realtime = new Promise((resolve, reject) => { const timer = setTimeout(() => reject(new Error("notification:new was not emitted")), 5000); socket.once("notification:new", payload => { clearTimeout(timer); resolve(payload); }); });
  const publishResponse = await request(`${api}/announcements/${announcement.id}/publish`, "POST", ownerAuth);
  assert.equal(publishResponse.status, 200); assert.equal((await publishResponse.json()).data.status, "PUBLISHED");
  const socketPayload = await realtime; assert.equal(socketPayload.type, "COURSE_ANNOUNCEMENT");
  assert.equal((await request(`${api}/announcements/${announcement.id}/publish`, "POST", ownerAuth)).status, 409);
  assert.equal(await prisma.notification.count({ where: { userId: student.id, type: "COURSE_ANNOUNCEMENT" } }), 1);
  assert.equal(await prisma.notification.count({ where: { userId: muted.id, type: "COURSE_ANNOUNCEMENT" } }), 0);

  const listResponse = await fetch(`${api}/notifications?page=1&limit=10&isRead=false`, { headers: { authorization: studentAuth } });
  assert.equal(listResponse.status, 200); const list = await listResponse.json();
  assert.equal(list.data.length, 1); assert.equal(list.meta.unreadCount, 1);
  const notificationId = list.data[0].id;
  const foreign = await prisma.notification.create({ data: { userId: outsider.id, type: "WELCOME", title: "Private", message: "Private" } });
  assert.equal((await request(`${api}/notifications/${foreign.id}/read`, "PATCH", studentAuth)).status, 404);
  assert.equal((await request(`${api}/notifications/${foreign.id}`, "DELETE", studentAuth)).status, 404);
  assert.equal((await request(`${api}/notifications/${notificationId}/read`, "PATCH", studentAuth)).status, 200);
  assert.equal((await request(`${api}/notifications/${notificationId}/read`, "PATCH", studentAuth)).status, 200);
  const count = await (await fetch(`${api}/notifications/unread-count`, { headers: { authorization: studentAuth } })).json(); assert.equal(count.data.unreadCount, 0);
  assert.equal((await request(`${api}/notifications/read-all`, "PATCH", studentAuth)).status, 200);
  assert.equal((await request(`${api}/notifications/${notificationId}`, "DELETE", studentAuth)).status, 204);

  assert.equal((await request(`${api}/announcements/${announcement.id}`, "PATCH", ownerAuth, { title: "Cannot edit" })).status, 409);
  assert.equal((await request(`${api}/announcements/${announcement.id}`, "DELETE", otherAuth)).status, 403);
  assert.equal((await request(`${api}/announcements/${announcement.id}`, "DELETE", ownerAuth)).status, 204);

  const dueAssignment = await prisma.assignment.create({ data: { courseId, title: "Sprint 8 due reminder", dueAt: new Date(Date.now() + 60 * 60 * 1000), isPublished: true } });
  await runAssignmentDueReminders(); await runAssignmentDueReminders();
  assert.equal(await prisma.notification.count({ where: { userId: student.id, type: "ASSIGNMENT_DUE", data: { path: ["assignmentId"], equals: dueAssignment.id } } }), 1);
  assert.equal(await prisma.emailLog.count({ where: { userId: student.id, template: `ASSIGNMENT_DUE:${dueAssignment.id}`.slice(0, 100) } }), 1);
  assert.equal(await prisma.notification.count({ where: { userId: muted.id, type: "ASSIGNMENT_DUE", data: { path: ["assignmentId"], equals: dueAssignment.id } } }), 0);

  const freeCourse = await prisma.course.create({ data: { instructorId: owner.id, categoryId, title: "Sprint 8 Enrollment", slug: `sprint-8-enrollment-${stamp}`, description: "Email", level: "BEGINNER", isFree: true, status: "PUBLISHED", publishedAt: new Date() } }); freeCourseId = freeCourse.id;
  assert.equal((await request(`${api}/courses/${freeCourse.id}/enroll`, "POST", outsiderAuth)).status, 201);
  assert.equal(await prisma.notification.count({ where: { userId: outsider.id, type: "COURSE_ENROLLED" } }), 1);
  const emailLog = await prisma.emailLog.findFirst({ where: { userId: outsider.id, template: `COURSE_ENROLLED:${freeCourse.id}`.slice(0, 100) } });
  assert.equal(emailLog?.status, "SENT");
  console.log("Sprint 8 notification, announcement, realtime and email integration tests passed");
} finally {
  socket?.close();
  await prisma.emailLog.deleteMany({ where: { toEmail: { in: emails } } });
  if (freeCourseId) await prisma.course.deleteMany({ where: { id: freeCourseId } });
  if (courseId) await prisma.course.deleteMany({ where: { id: courseId } });
  if (categoryId) await prisma.category.deleteMany({ where: { id: categoryId } });
  await prisma.user.deleteMany({ where: { email: { in: emails } } });
  await prisma.$disconnect();
}
