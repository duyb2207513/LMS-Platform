import { randomBytes } from "node:crypto";
import { AppError } from "../../common/errors/AppError.js";
import { toVnd, vndNumber } from "../../common/utils/money.js";
import { prisma } from "../../config/database.js";
import { releasePendingEarnings } from "../earnings/earning.service.js";
import { UUID } from "../interactions/access.js";
import type { CreatePayoutInput, ProcessPayoutInput } from "./payout.types.js";

const include = {
  instructor: { select: { id: true, fullName: true, email: true } },
  createdBy: { select: { id: true, fullName: true } },
  earnings: { select: { id: true, courseId: true, netAmount: true, status: true } }
};
const statuses = ["PENDING", "PROCESSING", "PAID", "FAILED", "CANCELLED"] as const;
const serialize = (value: Record<string, any>) => ({ ...value, amount: Number(value.amount), earnings: value.earnings?.map((earning: Record<string, any>) => ({ ...earning, netAmount: Number(earning.netAmount) })) });
const uniqueViolation = (error: unknown) => Boolean(error && typeof error === "object" && "code" in error && error.code === "P2002");

export async function balances() {
  await releasePendingEarnings();
  const rows = await prisma.instructorEarning.groupBy({ by: ["instructorId", "currency"], where: { status: "AVAILABLE", payoutId: null }, _sum: { netAmount: true }, _count: { id: true } });
  const users = await prisma.user.findMany({ where: { id: { in: rows.map(row => row.instructorId) } }, select: { id: true, fullName: true, email: true } });
  const byId = new Map(users.map(user => [user.id, user]));
  return rows.map(row => ({ instructor: byId.get(row.instructorId), availableAmount: Number(row._sum.netAmount ?? 0), earningCount: row._count.id, currency: row.currency }));
}

export async function listPayouts(query: Record<string, unknown>) {
  const page = Number(query.page ?? 1), limit = Number(query.limit ?? 20);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) throw new AppError(400, "Invalid pagination");
  const status = query.status === undefined ? undefined : String(query.status);
  if (status && !statuses.includes(status as typeof statuses[number])) throw new AppError(400, "Invalid payout status");
  const where = status ? { status: status as typeof statuses[number] } : {};
  const [rows, total] = await Promise.all([prisma.payout.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit, include }), prisma.payout.count({ where })]);
  return { data: rows.map(serialize), meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function createPayout(adminId: string, input: CreatePayoutInput, idempotencyKey: string) {
  if (!idempotencyKey || idempotencyKey.length > 255) throw new AppError(400, "A valid Idempotency-Key header is required");
  const existing = await prisma.payout.findUnique({ where: { idempotencyKey }, include }); if (existing) return serialize(existing);
  await releasePendingEarnings();
  const earnings = await prisma.instructorEarning.findMany({ where: { instructorId: input.instructorId, status: "AVAILABLE", payoutId: null, ...(input.earningIds ? { id: { in: input.earningIds } } : {}) }, select: { id: true, netAmount: true, currency: true } });
  if (!earnings.length || (input.earningIds && earnings.length !== input.earningIds.length)) throw new AppError(409, "No requested available earnings can be paid", { code: "PAYOUT_NO_AVAILABLE_EARNINGS" });
  const currencies = new Set(earnings.map(item => item.currency)); if (currencies.size !== 1) throw new AppError(409, "A payout can only contain one currency");
  const amount = vndNumber(earnings.reduce((sum, item) => sum + toVnd(item.netAmount, "net earning"), 0n));
  try {
    return await prisma.$transaction(async transaction => {
      const payout = await transaction.payout.create({ data: { instructorId: input.instructorId, amount, currency: earnings[0]!.currency, createdById: adminId, idempotencyKey }, include });
      const claimed = await transaction.instructorEarning.updateMany({ where: { id: { in: earnings.map(item => item.id) }, status: "AVAILABLE", payoutId: null }, data: { payoutId: payout.id } });
      if (claimed.count !== earnings.length) throw new AppError(409, "One or more earnings were claimed by another payout");
      await transaction.auditLog.create({ data: { actorUserId: adminId, action: "PAYOUT_CREATED", entityType: "Payout", entityId: payout.id, metadata: { earningCount: earnings.length, amount, currency: earnings[0]!.currency } } });
      return serialize(await transaction.payout.findUniqueOrThrow({ where: { id: payout.id }, include }));
    });
  } catch (error) {
    if (uniqueViolation(error)) { const duplicate = await prisma.payout.findUnique({ where: { idempotencyKey }, include }); if (duplicate) return serialize(duplicate); }
    throw error;
  }
}

export async function processPayout(id: string, adminId: string, input: ProcessPayoutInput) {
  if (!UUID.test(id)) throw new AppError(404, "Payout not found");
  const payout = await prisma.payout.findUnique({ where: { id }, include }); if (!payout) throw new AppError(404, "Payout not found"); if (payout.status === "PAID") return serialize(payout);
  if (!payout.earnings.length) throw new AppError(409, "Payout has no reserved earnings");
  const claim = await prisma.payout.updateMany({ where: { id, status: { in: ["PENDING", "FAILED"] } }, data: { status: "PROCESSING" } });
  if (!claim.count) { const current = await prisma.payout.findUniqueOrThrow({ where: { id }, include }); if (current.status === "PAID") return serialize(current); throw new AppError(409, "Payout is already being processed"); }
  const now = new Date();
  return prisma.$transaction(async transaction => {
    if (input.succeed) {
      await transaction.instructorEarning.updateMany({ where: { payoutId: id, status: "AVAILABLE" }, data: { status: "PAID" } });
      await transaction.payout.update({ where: { id }, data: { status: "PAID", providerReference: `MOCK-PAYOUT-${randomBytes(8).toString("hex").toUpperCase()}`, failureReason: null, processedAt: now } });
    } else await transaction.payout.update({ where: { id }, data: { status: "FAILED", failureReason: "Sandbox payout failure", processedAt: now } });
    await transaction.auditLog.create({ data: { actorUserId: adminId, action: input.succeed ? "PAYOUT_PAID" : "PAYOUT_FAILED", entityType: "Payout", entityId: id } });
    return serialize(await transaction.payout.findUniqueOrThrow({ where: { id }, include }));
  });
}
