import assert from "node:assert/strict";
import { unlink } from "node:fs/promises";
import path from "node:path";
import jwt from "jsonwebtoken";
import { prisma } from "../../dist/config/database.js";

const api = "http://localhost:3000/api/v1";
const stamp = Date.now().toString();
const emails = ["owner", "other", "student", "outsider"].map(name => `sprint7-${name}-${stamp}@example.com`);
const token = user => `Bearer ${jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_ACCESS_SECRET, { expiresIn: "15m" })}`;
const json = (url, method, authorization, body) => fetch(url, { method, headers: { authorization, "content-type": "application/json" }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
let courseId, categoryId;
const storedFiles = [];

try {
  const [owner, other, student, outsider] = await Promise.all([
    prisma.user.create({ data: { fullName: "Sprint 7 Owner", email: emails[0], passwordHash: "x", role: "INSTRUCTOR" } }),
    prisma.user.create({ data: { fullName: "Other Instructor", email: emails[1], passwordHash: "x", role: "INSTRUCTOR" } }),
    prisma.user.create({ data: { fullName: "Sprint 7 Student", email: emails[2], passwordHash: "x", role: "STUDENT" } }),
    prisma.user.create({ data: { fullName: "Outsider", email: emails[3], passwordHash: "x", role: "STUDENT" } })
  ]);
  const [ownerAuth, otherAuth, studentAuth, outsiderAuth] = [owner, other, student, outsider].map(token);
  const category = await prisma.category.create({ data: { name: `Sprint 7 ${stamp}`, slug: `sprint-7-${stamp}` } }); categoryId = category.id;
  const course = await prisma.course.create({ data: { instructorId: owner.id, categoryId, title: "Sprint 7 course", slug: `sprint-7-course-${stamp}`, description: "Assignments", level: "INTERMEDIATE", isFree: true, status: "PUBLISHED", publishedAt: new Date() } }); courseId = course.id;
  await prisma.enrollment.create({ data: { courseId, studentId: student.id } });

  const input = { title: "Build an LMS endpoint", description: "Submit implementation", instructions: "Include tests", dueAt: new Date(Date.now() + 86400000).toISOString(), maxScore: 100, allowResubmission: true, maxSubmissions: 2, isPublished: true };
  assert.equal((await json(`${api}/courses/${courseId}/assignments`, "POST", studentAuth, input)).status, 403);
  assert.equal((await json(`${api}/courses/${courseId}/assignments`, "POST", otherAuth, input)).status, 403);
  const createResponse = await json(`${api}/courses/${courseId}/assignments`, "POST", ownerAuth, input);
  assert.equal(createResponse.status, 201); const assignment = (await createResponse.json()).data;
  assert.equal(assignment.maxScore, 100);
  assert.equal((await fetch(`${api}/courses/${courseId}/assignments`, { headers: { authorization: outsiderAuth } })).status, 403);
  const studentList = await (await fetch(`${api}/courses/${courseId}/assignments`, { headers: { authorization: studentAuth } })).json();
  assert.equal(studentList.data.length, 1); assert.equal(studentList.data[0].remainingSubmissions, 2);

  const empty = new FormData();
  assert.equal((await fetch(`${api}/assignments/${assignment.id}/submissions`, { method: "POST", headers: { authorization: studentAuth }, body: empty })).status, 400);
  const invalid = new FormData(); invalid.append("files", new Blob(["not a pdf"], { type: "application/pdf" }), "fake.pdf");
  assert.equal((await fetch(`${api}/assignments/${assignment.id}/submissions`, { method: "POST", headers: { authorization: studentAuth }, body: invalid })).status, 400);

  const firstForm = new FormData(); firstForm.append("textContent", "First implementation"); firstForm.append("files", new Blob(["%PDF-1.4\nSprint 7"], { type: "application/pdf" }), "answer.pdf");
  const firstResponse = await fetch(`${api}/assignments/${assignment.id}/submissions`, { method: "POST", headers: { authorization: studentAuth }, body: firstForm });
  assert.equal(firstResponse.status, 201); const first = (await firstResponse.json()).data; assert.equal(first.attemptNumber, 1); assert.equal(first.files.length, 1);
  const firstFile = await prisma.submissionFile.findUniqueOrThrow({ where: { id: first.files[0].id } }); storedFiles.push(firstFile.storedName);
  assert.equal((await fetch(`http://localhost:3000/uploads/submissions/${firstFile.storedName}`)).status, 404);
  assert.equal((await fetch(first.files[0].fileUrl, { headers: { authorization: outsiderAuth } })).status, 403);
  assert.equal((await fetch(first.files[0].fileUrl, { headers: { authorization: studentAuth } })).status, 200);

  const secondForm = new FormData(); secondForm.append("textContent", "Improved implementation");
  const secondResponse = await fetch(`${api}/assignments/${assignment.id}/submissions`, { method: "POST", headers: { authorization: studentAuth }, body: secondForm });
  assert.equal(secondResponse.status, 201); const second = (await secondResponse.json()).data; assert.equal(second.attemptNumber, 2);
  const thirdForm = new FormData(); thirdForm.append("textContent", "Third attempt");
  assert.equal((await fetch(`${api}/assignments/${assignment.id}/submissions`, { method: "POST", headers: { authorization: studentAuth }, body: thirdForm })).status, 409);

  const submissionsResponse = await fetch(`${api}/assignments/${assignment.id}/submissions`, { headers: { authorization: ownerAuth } });
  assert.equal(submissionsResponse.status, 200); assert.equal((await submissionsResponse.json()).data.length, 2);
  assert.equal((await fetch(`${api}/assignments/${assignment.id}/submissions`, { headers: { authorization: studentAuth } })).status, 403);
  const gradeResponse = await json(`${api}/submissions/${second.id}/grade`, "PATCH", ownerAuth, { score: 85, comment: "Good work" });
  assert.equal(gradeResponse.status, 200); assert.equal((await gradeResponse.json()).data.score, 85);
  assert.equal((await json(`${api}/submissions/${second.id}/grade`, "PATCH", otherAuth, { score: 90 })).status, 403);
  assert.equal((await json(`${api}/submissions/${second.id}/grade`, "PATCH", ownerAuth, { score: 101 })).status, 400);
  const mine = await (await fetch(`${api}/assignments/${assignment.id}/submissions/me`, { headers: { authorization: studentAuth } })).json();
  assert.equal(mine.data[0].feedback.score, 85); assert.equal(mine.data[0].feedback.comment, "Good work");

  assert.equal((await json(`${api}/courses/${courseId}/grades/rule`, "PUT", ownerAuth, { assignmentWeight: 70, quizWeight: 40, passingScore: 70 })).status, 400);
  assert.equal((await json(`${api}/courses/${courseId}/grades/rule`, "PUT", ownerAuth, { assignmentWeight: 100, quizWeight: 0, passingScore: 70 })).status, 200);
  const grade = await (await fetch(`${api}/courses/${courseId}/grades/me`, { headers: { authorization: studentAuth } })).json();
  assert.equal(grade.data.finalScore, 85); assert.equal(grade.data.passed, true); assert.equal(grade.data.assignment.graded, 1);
  const gradebook = await (await fetch(`${api}/courses/${courseId}/grades`, { headers: { authorization: ownerAuth } })).json();
  assert.equal(gradebook.data.length, 1); assert.equal(gradebook.data[0].student.email, emails[2]);
  assert.equal((await fetch(`${api}/assignments/${assignment.id}`, { method: "DELETE", headers: { authorization: ownerAuth } })).status, 409);
  console.log("Sprint 7 assignment and grading integration tests passed");
} finally {
  if (courseId) await prisma.course.deleteMany({ where: { id: courseId } });
  if (categoryId) await prisma.category.deleteMany({ where: { id: categoryId } });
  await prisma.user.deleteMany({ where: { email: { in: emails } } });
  await prisma.$disconnect();
  await Promise.allSettled(storedFiles.map(name => unlink(path.resolve("uploads", "submissions", name))));
}
