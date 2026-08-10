import { randomUUID } from "node:crypto"; import { AppError } from "../../common/errors/AppError.js"; import { prisma } from "../../config/database.js"; import { UUID } from "../interactions/access.js"; import type { MockCallbackInput, MockWebhookInput } from "./payments.types.js";
function paymentData<T extends { amount: unknown }>(payment: T) { return { ...payment, amount: Number(payment.amount) }; }
export async function initiateMockPayment(orderId: string, userId: string, origin: string) {
  if (!UUID.test(orderId)) throw new AppError(404, "Order not found"); const order = await prisma.order.findUnique({ where: { id: orderId }, include: { payments: { where: { provider: "MOCK", status: "PENDING" }, orderBy: { createdAt: "desc" }, take: 1 } } });
  if (!order || order.userId !== userId) throw new AppError(404, "Order not found"); if (order.status !== "PENDING") throw new AppError(409, "Only a pending order can be paid");
  const payment = order.payments[0] ?? await prisma.payment.create({ data: { orderId, provider: "MOCK", amount: order.total, currency: order.currency, idempotencyKey: randomUUID() } });
  return { payment: paymentData(payment), mockPaymentUrl: `${origin}/api/v1/payments/mock/${payment.id}?token=${encodeURIComponent(payment.idempotencyKey)}` };
}
export async function getMockPayment(paymentId: string, token: string) { if (!UUID.test(paymentId)) throw new AppError(404, "Payment not found"); const payment = await prisma.payment.findUnique({ where: { id: paymentId }, include: { order: { select: { orderNumber: true, status: true } } } }); if (!payment || payment.provider !== "MOCK" || payment.idempotencyKey !== token) throw new AppError(404, "Payment not found"); return paymentData(payment); }
export async function processMockWebhook(input: MockWebhookInput) {
  if (!UUID.test(input.paymentId)) throw new AppError(404, "Payment not found");
  const payment = await prisma.payment.findUnique({ where: { id: input.paymentId }, include: { order: { include: { items: true } } } }); if (!payment || payment.provider !== "MOCK") throw new AppError(404, "Payment not found");
  if (Number(payment.amount) !== input.amount || payment.currency !== input.currency) throw new AppError(400, "Webhook amount or currency does not match the payment");
  const duplicateTransaction = await prisma.payment.findFirst({ where: { providerTransactionId: input.providerTransactionId, id: { not: payment.id } }, select: { id: true } }); if (duplicateTransaction) throw new AppError(409, "Provider transaction has already been used");
  return prisma.$transaction(async transaction => {
    const existing = await transaction.paymentWebhookEvent.findUnique({ where: { provider_eventId: { provider: "MOCK", eventId: input.eventId } } });
    if (existing) { const current = await transaction.payment.findUniqueOrThrow({ where: { id: payment.id } }); return { duplicate: true, payment: paymentData(current) }; }
    await transaction.paymentWebhookEvent.create({ data: { paymentId: payment.id, provider: "MOCK", eventId: input.eventId, payload: { eventId: input.eventId, paymentId: input.paymentId, status: input.status, providerTransactionId: input.providerTransactionId, amount: input.amount, currency: input.currency } } });
    if (payment.status !== "PENDING") { const current = await transaction.payment.findUniqueOrThrow({ where: { id: payment.id } }); return { duplicate: false, payment: paymentData(current) }; }
    if (input.status === "FAILED" || payment.order.status === "CANCELLED") {
      const failed = await transaction.payment.update({ where: { id: payment.id }, data: { status: "FAILED", providerTransactionId: input.providerTransactionId, failureReason: payment.order.status === "CANCELLED" ? "Order was cancelled" : "Mock payment failed" } });
      return { duplicate: false, payment: paymentData(failed) };
    }
    const paidAt = new Date();
    const succeeded = await transaction.payment.update({ where: { id: payment.id }, data: { status: "SUCCEEDED", providerTransactionId: input.providerTransactionId, paidAt, failureReason: null } });
    await transaction.order.update({ where: { id: payment.orderId }, data: { status: "PAID", paidAt } });
    await transaction.enrollment.createMany({ data: payment.order.items.map(item => ({ studentId: payment.order.userId, courseId: item.courseId })), skipDuplicates: true });
    return { duplicate: false, payment: paymentData(succeeded) };
  });
}
export async function completeMockPayment(paymentId: string, input: MockCallbackInput) { const payment = await getMockPayment(paymentId, input.token); return processMockWebhook({ eventId: `mock-callback:${paymentId}:${input.status}`, paymentId, status: input.status, providerTransactionId: `MOCK-${paymentId}`, amount: Number(payment.amount), currency: payment.currency }); }
