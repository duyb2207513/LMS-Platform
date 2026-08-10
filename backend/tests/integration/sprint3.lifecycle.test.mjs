import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { prisma } from "../../dist/config/database.js";

const api = "http://localhost:3000/api/v1", stamp = Date.now().toString();
const emails = ["owner", "student", "outsider", "admin"].map(name => `sprint3-${name}-${stamp}@example.com`);
const token = user => `Bearer ${jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_ACCESS_SECRET, { expiresIn: "15m" })}`;
const json = (url, method, authorization, body) => fetch(url, { method, headers: { ...(authorization ? { authorization } : {}), "content-type": "application/json" }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
let categoryId, courseId;
try {
  const [owner, student, outsider, admin] = await Promise.all([
    prisma.user.create({ data: { fullName: "Owner", email: emails[0], passwordHash: "x", role: "INSTRUCTOR" } }),
    prisma.user.create({ data: { fullName: "Student", email: emails[1], passwordHash: "x", role: "STUDENT" } }),
    prisma.user.create({ data: { fullName: "Outsider", email: emails[2], passwordHash: "x", role: "STUDENT" } }),
    prisma.user.create({ data: { fullName: "Admin", email: emails[3], passwordHash: "x", role: "ADMIN" } })
  ]);
  const [ownerAuth, studentAuth, outsiderAuth, adminAuth] = [owner, student, outsider, admin].map(token);
  const category = await prisma.category.create({ data: { name: `Sprint3 ${stamp}`, slug: `sprint3-${stamp}` } }); categoryId = category.id;
  const course = await prisma.course.create({ data: { instructorId: owner.id, categoryId, title: "Sprint 3", slug: `sprint-3-${stamp}`, description: "Quiz", level: "BEGINNER", isFree: true, status: "PUBLISHED", publishedAt: new Date() } }); courseId = course.id;
  const section = await prisma.section.create({ data: { courseId, title: "Section", position: 1 } });
  const lesson = await prisma.lesson.create({ data: { sectionId: section.id, title: "Lesson", lessonType: "TEXT", content: "Content", position: 1, isPublished: true } });
  await prisma.enrollment.create({ data: { courseId, studentId: student.id } });

  assert.equal((await json(`${api}/lessons/${lesson.id}/quizzes`, "POST", studentAuth, { title: "Denied" })).status, 403);
  const quizResponse = await json(`${api}/lessons/${lesson.id}/quizzes`, "POST", ownerAuth, { title: "Knowledge check", passingScore: 70, maxAttempts: 1 }); assert.equal(quizResponse.status, 201); const quiz = (await quizResponse.json()).data;
  const questionResponse = await json(`${api}/quizzes/${quiz.id}/questions`, "POST", ownerAuth, { text: "2 + 2 = ?", points: 2 }); assert.equal(questionResponse.status, 201); const question = (await questionResponse.json()).data;
  const wrong = (await (await json(`${api}/questions/${question.id}/options`, "POST", ownerAuth, { text: "3" })).json()).data;
  const correct = (await (await json(`${api}/questions/${question.id}/options`, "POST", ownerAuth, { text: "4", isCorrect: true })).json()).data;
  assert.equal((await json(`${api}/quizzes/${quiz.id}`, "PATCH", ownerAuth, { isPublished: true })).status, 200);
  const learnerQuiz = await (await fetch(`${api}/quizzes/${quiz.id}`, { headers: { authorization: studentAuth } })).json();
  assert.equal(Object.hasOwn(learnerQuiz.data.questions[0].options[0], "isCorrect"), false);
  assert.equal((await fetch(`${api}/quizzes/${quiz.id}`, { headers: { authorization: outsiderAuth } })).status, 403);
  const attemptResponse = await fetch(`${api}/quizzes/${quiz.id}/attempts`, { method: "POST", headers: { authorization: studentAuth } }); assert.equal(attemptResponse.status, 201); const attempt = (await attemptResponse.json()).data;
  const submittedResponse = await json(`${api}/quiz-attempts/${attempt.id}/submit`, "POST", studentAuth, { answers: [{ questionId: question.id, optionId: correct.id }] }); assert.equal(submittedResponse.status, 200); const submitted = (await submittedResponse.json()).data;
  assert.equal(submitted.score, 100); assert.equal(submitted.passed, true); assert.equal(submitted.answers[0].correctOptionId, correct.id);
  assert.equal((await json(`${api}/quiz-attempts/${attempt.id}/submit`, "POST", studentAuth, { answers: [{ questionId: question.id, optionId: wrong.id }] })).status, 409);
  assert.equal((await fetch(`${api}/quizzes/${quiz.id}/attempts`, { method: "POST", headers: { authorization: studentAuth } })).status, 409);
  assert.equal((await json(`${api}/questions/${question.id}`, "PATCH", ownerAuth, { text: "Changed" })).status, 409);

  assert.equal((await json(`${api}/courses/${course.id}/reviews`, "POST", outsiderAuth, { rating: 5 })).status, 403);
  const reviewResponse = await json(`${api}/courses/${course.id}/reviews`, "POST", studentAuth, { rating: 5, content: "Great" }); assert.equal(reviewResponse.status, 201); const review = (await reviewResponse.json()).data;
  assert.equal((await json(`${api}/courses/${course.id}/reviews`, "POST", studentAuth, { rating: 4 })).status, 409);
  assert.equal((await json(`${api}/reviews/${review.id}`, "PATCH", studentAuth, { rating: 4 })).status, 200);
  const reviews = await (await fetch(`${api}/courses/${course.id}/reviews`)).json(); assert.equal(reviews.data.summary.averageRating, 4);

  assert.equal((await fetch(`${api}/lessons/${lesson.id}/comments`, { headers: { authorization: outsiderAuth } })).status, 403);
  const rootResponse = await json(`${api}/lessons/${lesson.id}/comments`, "POST", studentAuth, { content: "Question" }); assert.equal(rootResponse.status, 201); const root = (await rootResponse.json()).data;
  const replyResponse = await json(`${api}/lessons/${lesson.id}/comments`, "POST", ownerAuth, { content: "Answer", parentId: root.id }); assert.equal(replyResponse.status, 201); const reply = (await replyResponse.json()).data;
  assert.equal((await json(`${api}/lessons/${lesson.id}/comments`, "POST", studentAuth, { content: "Nested", parentId: reply.id })).status, 400);
  assert.equal((await json(`${api}/comments/${root.id}`, "PATCH", studentAuth, { content: "Updated question" })).status, 200);
  assert.equal((await fetch(`${api}/comments/${root.id}`, { method: "DELETE", headers: { authorization: adminAuth } })).status, 204);
  const comments = await (await fetch(`${api}/lessons/${lesson.id}/comments`, { headers: { authorization: studentAuth } })).json(); assert.equal(comments.data[0].isDeleted, true); assert.equal(comments.data[0].content, null); assert.equal(comments.data[0].replies.length, 1);
  console.log("Sprint 3 lifecycle integration tests passed");
} finally {
  if (courseId) await prisma.course.deleteMany({ where: { id: courseId } }); if (categoryId) await prisma.category.deleteMany({ where: { id: categoryId } }); await prisma.user.deleteMany({ where: { email: { in: emails } } }); await prisma.$disconnect();
}
