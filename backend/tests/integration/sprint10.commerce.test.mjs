import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { prisma } from "../../dist/config/database.js";

const api = "http://localhost:3000/api/v1";
const stamp = Date.now().toString();
const emails = ["owner", "student", "admin"].map(name => `sprint10-${name}-${stamp}@example.com`);
const bearer = user => `Bearer ${jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_ACCESS_SECRET, { expiresIn: "15m" })}`;
const json = (url, method, authorization, body, headers = {}) => fetch(url, { method, headers: { ...(authorization ? { authorization } : {}), ...(body === undefined ? {} : { "content-type": "application/json" }), ...headers }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
let categoryId, courseId, couponId, orderId;

try {
  const [owner, student, admin] = await Promise.all([
    prisma.user.create({ data: { fullName: "Sprint 10 Instructor", email: emails[0], passwordHash: "x", role: "INSTRUCTOR" } }),
    prisma.user.create({ data: { fullName: "Sprint 10 Student", email: emails[1], passwordHash: "x", role: "STUDENT" } }),
    prisma.user.create({ data: { fullName: "Sprint 10 Admin", email: emails[2], passwordHash: "x", role: "ADMIN" } })
  ]);
  const ownerAuth = bearer(owner), studentAuth = bearer(student), adminAuth = bearer(admin);
  const category = await prisma.category.create({ data: { name: `Commerce ${stamp}`, slug: `commerce-${stamp}` } }); categoryId = category.id;
  const course = await prisma.course.create({ data: { instructorId: owner.id, categoryId, title: "Commerce course", slug: `commerce-course-${stamp}`, description: "Sprint 10", level: "BEGINNER", price: 1_000_000, isFree: false, status: "PUBLISHED", publishedAt: new Date() } }); courseId = course.id;
  const section = await prisma.section.create({ data: { courseId, title: "Commerce lesson", position: 1 } });
  await prisma.lesson.create({ data: { sectionId: section.id, title: "Paid lesson", lessonType: "TEXT", content: "Paid content", position: 1, isPublished: true } });

  const couponBody = { code: `WELCOME${stamp.slice(-6)}`, name: "Welcome 20", discountType: "PERCENTAGE", discountValue: 20, startsAt: new Date(Date.now() - 60_000).toISOString(), expiresAt: new Date(Date.now() + 86_400_000).toISOString(), maxRedemptions: 1, appliesToAllCourses: false, courseIds: [courseId], isActive: true };
  assert.equal((await json(`${api}/admin/coupons`, "POST", studentAuth, couponBody)).status, 403);
  const couponResponse = await json(`${api}/admin/coupons`, "POST", adminAuth, couponBody); assert.equal(couponResponse.status, 201); const coupon = (await couponResponse.json()).data; couponId = coupon.id;
  const validation = await json(`${api}/coupons/validate`, "POST", studentAuth, { code: coupon.code, courseId }); assert.equal(validation.status, 200); assert.deepEqual((await validation.json()).data.pricing, { originalAmount: 1_000_000, discountAmount: 200_000, finalAmount: 800_000, currency: "VND" });

  const orderResponse = await json(`${api}/orders`, "POST", studentAuth, { courseIds: [courseId], couponCode: coupon.code }); assert.equal(orderResponse.status, 201); const order = (await orderResponse.json()).data; orderId = order.id; assert.equal(order.subtotalAmount, 1_000_000); assert.equal(order.discountAmount, 200_000); assert.equal(order.totalAmount, 800_000);
  const checkout = (await (await fetch(`${api}/orders/${order.id}/payments/mock`, { method: "POST", headers: { authorization: studentAuth } })).json()).data;
  const token = new URL(checkout.mockPaymentUrl).searchParams.get("token");
  const paid = await json(`${api}/payments/mock/${checkout.payment.id}/callback`, "POST", null, { token, status: "SUCCEEDED" }); assert.equal(paid.status, 200);
  const duplicate = await json(`${api}/payments/mock/${checkout.payment.id}/callback`, "POST", null, { token, status: "SUCCEEDED" }); assert.equal((await duplicate.json()).data.duplicate, true);
  assert.equal(await prisma.couponUsage.count({ where: { couponId, userId: student.id } }), 1); assert.equal((await prisma.coupon.findUniqueOrThrow({ where: { id: couponId } })).redeemedCount, 1);
  const earning = await prisma.instructorEarning.findUniqueOrThrow({ where: { orderItemId: order.items[0].id } }); assert.equal(Number(earning.grossAmount), 800_000); assert.equal(Number(earning.platformFeeAmount), 160_000); assert.equal(Number(earning.netAmount), 640_000);
  const revenue = await fetch(`${api}/instructor/revenue/overview`, { headers: { authorization: ownerAuth } }); assert.equal(revenue.status, 200); assert.equal((await revenue.json()).data.netRevenue, 640_000);

  const refundResponse = await json(`${api}/refund-requests`, "POST", studentAuth, { orderId: order.id, reason: "The course does not fit my learning goals." }); assert.equal(refundResponse.status, 201); const refund = (await refundResponse.json()).data;
  assert.equal((await json(`${api}/refund-requests`, "POST", studentAuth, { orderId: order.id, reason: "I am submitting the same request again." })).status, 409);
  const approve = await json(`${api}/admin/refund-requests/${refund.id}/approve`, "POST", adminAuth, { adminNote: "Eligible within the refund window." }, { "idempotency-key": `refund-${refund.id}` }); assert.equal(approve.status, 200); assert.equal((await approve.json()).data.status, "REFUNDED");
  const repeatedApprove = await json(`${api}/admin/refund-requests/${refund.id}/approve`, "POST", adminAuth, { adminNote: "Eligible within the refund window." }, { "idempotency-key": `refund-${refund.id}` }); assert.equal(repeatedApprove.status, 200);
  assert.equal((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status, "REFUNDED"); assert.equal((await prisma.payment.findUniqueOrThrow({ where: { id: checkout.payment.id } })).status, "REFUNDED"); assert.equal((await prisma.enrollment.findUniqueOrThrow({ where: { studentId_courseId: { studentId: student.id, courseId } } })).status, "REFUNDED"); assert.equal((await prisma.instructorEarning.findUniqueOrThrow({ where: { id: earning.id } })).status, "REVERSED");
  assert.equal((await fetch(`${api}/courses/${courseId}/content`, { headers: { authorization: studentAuth } })).status, 403);

  const secondOrder = (await (await json(`${api}/orders`, "POST", studentAuth, { courseIds: [courseId] })).json()).data;
  const secondCheckout = (await (await fetch(`${api}/orders/${secondOrder.id}/payments/mock`, { method: "POST", headers: { authorization: studentAuth } })).json()).data;
  const secondToken = new URL(secondCheckout.mockPaymentUrl).searchParams.get("token");
  assert.equal((await json(`${api}/payments/mock/${secondCheckout.payment.id}/callback`, "POST", null, { token: secondToken, status: "SUCCEEDED" })).status, 200);
  assert.equal((await prisma.enrollment.findUniqueOrThrow({ where: { studentId_courseId: { studentId: student.id, courseId } } })).status, "ACTIVE");
  const payable = await prisma.instructorEarning.findFirstOrThrow({ where: { orderId: secondOrder.id } });
  await prisma.instructorEarning.update({ where: { id: payable.id }, data: { status: "AVAILABLE", availableAt: new Date(Date.now() - 1000) } });
  const payoutResponse = await json(`${api}/admin/payouts`, "POST", adminAuth, { instructorId: owner.id, earningIds: [payable.id] }, { "idempotency-key": `payout-${secondOrder.id}` }); assert.equal(payoutResponse.status, 201); const payout = (await payoutResponse.json()).data; assert.equal(payout.amount, 800_000);
  const repeatedPayout = await json(`${api}/admin/payouts`, "POST", adminAuth, { instructorId: owner.id, earningIds: [payable.id] }, { "idempotency-key": `payout-${secondOrder.id}` }); assert.equal((await repeatedPayout.json()).data.id, payout.id);
  const failedPayout = await json(`${api}/admin/payouts/${payout.id}/process`, "POST", adminAuth, { succeed: false }); assert.equal(failedPayout.status, 200); assert.equal((await failedPayout.json()).data.status, "FAILED"); assert.equal((await prisma.instructorEarning.findUniqueOrThrow({ where: { id: payable.id } })).status, "AVAILABLE");
  const processedPayout = await json(`${api}/admin/payouts/${payout.id}/process`, "POST", adminAuth, { succeed: true }); assert.equal(processedPayout.status, 200); assert.equal((await processedPayout.json()).data.status, "PAID"); assert.equal((await prisma.instructorEarning.findUniqueOrThrow({ where: { id: payable.id } })).status, "PAID");
  console.log("Sprint 10 coupon, payment, earning and refund lifecycle tests passed");
} finally {
  await prisma.paymentRefund.deleteMany({ where: { refundRequest: { user: { email: { in: emails } } } } });
  await prisma.refundRequest.deleteMany({ where: { user: { email: { in: emails } } } });
  await prisma.instructorEarning.deleteMany({ where: { instructor: { email: { in: emails } } } });
  await prisma.payout.deleteMany({ where: { instructor: { email: { in: emails } } } });
  await prisma.couponUsage.deleteMany({ where: { user: { email: { in: emails } } } });
  await prisma.order.deleteMany({ where: { user: { email: { in: emails } } } });
  if (couponId) await prisma.coupon.deleteMany({ where: { id: couponId } });
  if (courseId) await prisma.course.deleteMany({ where: { id: courseId } });
  if (categoryId) await prisma.category.deleteMany({ where: { id: categoryId } });
  await prisma.user.deleteMany({ where: { email: { in: emails } } });
  await prisma.$disconnect();
}
