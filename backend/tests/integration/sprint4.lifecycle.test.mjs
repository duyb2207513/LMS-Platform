import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import jwt from "jsonwebtoken";
import { prisma } from "../../dist/config/database.js";

const api = "http://localhost:3000/api/v1";
const stamp = Date.now().toString();
const emails = ["owner", "student", "admin"].map(name => `sprint4-${name}-${stamp}@example.com`);
const authFor = user => `Bearer ${jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_ACCESS_SECRET, { expiresIn: "15m" })}`;
const json = (url, method, authorization, body) => fetch(url, {
  method,
  headers: { ...(authorization ? { authorization } : {}), "content-type": "application/json" },
  ...(body === undefined ? {} : { body: JSON.stringify(body) })
});

let categoryId;
let courseId;
try {
  const [owner, student, admin] = await Promise.all([
    prisma.user.create({ data: { fullName: "Sprint 4 Instructor", email: emails[0], passwordHash: "x", role: "INSTRUCTOR" } }),
    prisma.user.create({ data: { fullName: "Sprint 4 Student", email: emails[1], passwordHash: "x", role: "STUDENT" } }),
    prisma.user.create({ data: { fullName: "Sprint 4 Admin", email: emails[2], passwordHash: "x", role: "ADMIN" } })
  ]);
  const studentAuth = authFor(student);
  const adminAuth = authFor(admin);

  const category = await prisma.category.create({ data: { name: `Payment ${stamp}`, slug: `payment-${stamp}` } });
  categoryId = category.id;
  const course = await prisma.course.create({ data: {
    instructorId: owner.id,
    categoryId,
    title: "Paid course",
    slug: `paid-course-${stamp}`,
    description: "Sprint 4 payment test",
    level: "BEGINNER",
    price: 299000,
    isFree: false,
    status: "PUBLISHED",
    publishedAt: new Date()
  } });
  courseId = course.id;
  const section = await prisma.section.create({ data: { courseId, title: "Chapter 1", position: 1 } });
  const lesson = await prisma.lesson.create({ data: { sectionId: section.id, title: "Lesson 1", lessonType: "TEXT", content: "Content", position: 1, isPublished: true } });
  const quiz = await prisma.quiz.create({ data: { lessonId: lesson.id, title: "Final quiz", passingScore: 70, maxAttempts: 2, isPublished: true } });

  const orderResponse = await json(`${api}/orders`, "POST", studentAuth, { courseIds: [courseId] });
  assert.equal(orderResponse.status, 201);
  const order = (await orderResponse.json()).data;
  assert.equal(order.status, "PENDING");
  assert.equal(order.items[0].priceSnapshot, 299000);

  await prisma.course.update({ where: { id: courseId }, data: { price: 499000 } });
  const storedOrder = await (await fetch(`${api}/orders/${order.id}`, { headers: { authorization: studentAuth } })).json();
  assert.equal(storedOrder.data.items[0].priceSnapshot, 299000);
  assert.equal(storedOrder.data.total, 299000);

  const paymentResponse = await fetch(`${api}/orders/${order.id}/payments/mock`, { method: "POST", headers: { authorization: studentAuth } });
  assert.equal(paymentResponse.status, 201);
  const checkout = (await paymentResponse.json()).data;
  const repeatedPayment = (await (await fetch(`${api}/orders/${order.id}/payments/mock`, { method: "POST", headers: { authorization: studentAuth } })).json()).data;
  assert.equal(repeatedPayment.payment.id, checkout.payment.id);

  const checkoutUrl = new URL(checkout.mockPaymentUrl);
  const token = checkoutUrl.searchParams.get("token");
  assert.ok(token);
  const hostedCheckout = await fetch(`${checkout.mockPaymentUrl}&method=MOMO`);
  assert.equal(hostedCheckout.status, 200);
  const checkoutCsp = hostedCheckout.headers.get("content-security-policy") || "";
  const hostedCheckoutHtml = await hostedCheckout.text();
  assert.match(checkoutCsp, /img-src 'self' data: https:\/\/img\.vietqr\.io/);
  assert.match(checkoutCsp, /script-src 'nonce-[^']+'/);
  assert.match(hostedCheckoutHtml, /<script nonce="[^"]+">/);
  assert.match(hostedCheckoutHtml, /<style nonce="[^"]+">/);
  const failedToken = await json(`${api}/payments/mock/${checkout.payment.id}/callback`, "POST", null, { token: "wrong-token", status: "SUCCEEDED" });
  assert.equal(failedToken.status, 404);

  const callback = await json(`${api}/payments/mock/${checkout.payment.id}/callback`, "POST", null, { token, status: "SUCCEEDED" });
  assert.equal(callback.status, 200);
  assert.equal((await callback.json()).data.payment.status, "SUCCEEDED");
  const duplicateCallback = await json(`${api}/payments/mock/${checkout.payment.id}/callback`, "POST", null, { token, status: "SUCCEEDED" });
  assert.equal(duplicateCallback.status, 200);
  assert.equal((await duplicateCallback.json()).data.duplicate, true);

  assert.equal(await prisma.enrollment.count({ where: { studentId: student.id, courseId } }), 1);
  assert.equal(await prisma.paymentWebhookEvent.count({ where: { paymentId: checkout.payment.id } }), 1);
  assert.equal((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status, "PAID");

  const webhookPayload = { eventId: `webhook-${stamp}`, paymentId: checkout.payment.id, status: "SUCCEEDED", providerTransactionId: `MOCK-${checkout.payment.id}`, amount: 299000, currency: "VND" };
  const invalidWebhook = await json(`${api}/payments/webhooks/mock`, "POST", null, webhookPayload);
  assert.equal(invalidWebhook.status, 401);
  const signature = createHmac("sha256", process.env.MOCK_PAYMENT_WEBHOOK_SECRET ?? "local-mock-payment-webhook-secret").update(JSON.stringify(webhookPayload)).digest("hex");
  const signedWebhook = () => fetch(`${api}/payments/webhooks/mock`, { method: "POST", headers: { "content-type": "application/json", "x-mock-signature": signature }, body: JSON.stringify(webhookPayload) });
  assert.equal((await signedWebhook()).status, 200);
  const duplicateWebhook = await signedWebhook();
  assert.equal(duplicateWebhook.status, 200);
  assert.equal((await duplicateWebhook.json()).data.duplicate, true);
  assert.equal(await prisma.paymentWebhookEvent.count({ where: { paymentId: checkout.payment.id } }), 2);

  const tooEarly = await fetch(`${api}/courses/${courseId}/certificates`, { method: "POST", headers: { authorization: studentAuth } });
  assert.equal(tooEarly.status, 409);
  const enrollment = await prisma.enrollment.update({
    where: { studentId_courseId: { studentId: student.id, courseId } },
    data: { status: "COMPLETED", progressPercent: 100, completedAt: new Date() }
  });
  const quizMissing = await fetch(`${api}/courses/${courseId}/certificates`, { method: "POST", headers: { authorization: studentAuth } });
  assert.equal(quizMissing.status, 409);
  await prisma.quizAttempt.create({ data: {
    quizId: quiz.id,
    studentId: student.id,
    attemptNumber: 1,
    status: "SUBMITTED",
    score: 100,
    earnedPoints: 1,
    totalPoints: 1,
    passed: true,
    submittedAt: new Date()
  } });

  const certificateResponse = await fetch(`${api}/courses/${courseId}/certificates`, { method: "POST", headers: { authorization: studentAuth } });
  assert.equal(certificateResponse.status, 201);
  const certificate = (await certificateResponse.json()).data;
  assert.equal(certificate.enrollmentId, enrollment.id);
  const repeatedCertificate = (await (await fetch(`${api}/courses/${courseId}/certificates`, { method: "POST", headers: { authorization: studentAuth } })).json()).data;
  assert.equal(repeatedCertificate.id, certificate.id);

  const verification = await (await fetch(`${api}/certificates/verify/${certificate.certificateNumber}`)).json();
  assert.equal(verification.data.valid, true);
  assert.equal(verification.data.certificate.courseTitleSnapshot, "Paid course");
  assert.equal((await fetch(`${api}/certificates/${certificate.id}`, { method: "DELETE", headers: { authorization: studentAuth } })).status, 403);
  assert.equal((await fetch(`${api}/certificates/${certificate.id}`, { method: "DELETE", headers: { authorization: adminAuth } })).status, 200);
  const revoked = await (await fetch(`${api}/certificates/verify/${certificate.verificationCode}`)).json();
  assert.equal(revoked.data.valid, false);

  console.log("Sprint 4 payment and certificate lifecycle integration tests passed");
} finally {
  await prisma.certificate.deleteMany({ where: { courseId: courseId ?? undefined } });
  await prisma.instructorEarning.deleteMany({ where: { order: { user: { email: { in: emails } } } } });
  await prisma.order.deleteMany({ where: { user: { email: { in: emails } } } });
  if (courseId) await prisma.course.deleteMany({ where: { id: courseId } });
  if (categoryId) await prisma.category.deleteMany({ where: { id: categoryId } });
  await prisma.user.deleteMany({ where: { email: { in: emails } } });
  await prisma.$disconnect();
}
