import { AppError } from "../../common/errors/AppError.js";
import { calculateDiscount, pricing, toVnd, vndNumber } from "../../common/utils/money.js";
import { prisma } from "../../config/database.js";
import { UUID } from "../interactions/access.js";
import type { CouponInput, CouponStatusInput, CouponUpdateInput, ValidateCouponInput } from "./coupon.types.js";

const detail = { courses: { include: { course: { select: { id: true, title: true, slug: true } } } }, _count: { select: { usages: true } } };
function fail(status: number, code: string, message: string): never { throw new AppError(status, message, { code }); }
function code(value: string) { return value.trim().toUpperCase(); }
function money(value: unknown) { return value === null || value === undefined ? null : Number(value); }
function serialize<T extends Record<string, any>>(coupon: T) { return { ...coupon, discountValue: money(coupon.discountValue), maxDiscountAmount: money(coupon.maxDiscountAmount), minOrderAmount: money(coupon.minOrderAmount) }; }

async function assertCourseIds(courseIds: string[]) { if (!courseIds.length) return; const count = await prisma.course.count({ where: { id: { in: courseIds } } }); if (count !== courseIds.length) throw new AppError(404, "One or more courses were not found"); }

export async function createCoupon(adminId: string, input: CouponInput) {
  const normalized = code(input.code); await assertCourseIds(input.courseIds);
  if (await prisma.coupon.findUnique({ where: { code: normalized }, select: { id: true } })) throw new AppError(409, "Coupon code already exists", { code: "COUPON_CODE_EXISTS" });
  try { return serialize(await prisma.coupon.create({ data: { code: normalized, name: input.name, description: input.description ?? null, discountType: input.discountType, discountValue: input.discountValue, maxDiscountAmount: input.maxDiscountAmount ?? null, minOrderAmount: input.minOrderAmount ?? null, startsAt: input.startsAt, expiresAt: input.expiresAt, maxRedemptions: input.maxRedemptions ?? null, appliesToAllCourses: input.appliesToAllCourses, isActive: input.isActive, createdById: adminId, courses: input.appliesToAllCourses ? undefined : { create: input.courseIds.map(courseId => ({ courseId })) } }, include: detail })); } catch (error) { if (error && typeof error === "object" && "code" in error && error.code === "P2002") throw new AppError(409, "Coupon code already exists", { code: "COUPON_CODE_EXISTS" }); throw error; }
}

export async function listCoupons(query: Record<string, unknown>) {
  const page = Number(query.page ?? 1), limit = Number(query.limit ?? 20); if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) throw new AppError(400, "Invalid pagination");
  const search = typeof query.search === "string" ? query.search.trim() : "";
  const active = query.isActive === undefined ? undefined : query.isActive === "true" ? true : query.isActive === "false" ? false : fail(400, "INVALID_FILTER", "isActive must be true or false");
  const where = { ...(search ? { OR: [{ code: { contains: search.toUpperCase() } }, { name: { contains: search, mode: "insensitive" as const } }] } : {}), ...(active === undefined ? {} : { isActive: active }) };
  const [rows, total] = await Promise.all([prisma.coupon.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit, include: detail }), prisma.coupon.count({ where })]);
  return { data: rows.map(serialize), meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getCoupon(id: string) { if (!UUID.test(id)) throw new AppError(404, "Coupon not found"); const value = await prisma.coupon.findUnique({ where: { id }, include: detail }); if (!value) throw new AppError(404, "Coupon not found"); return serialize(value); }

export async function updateCoupon(id: string, input: CouponUpdateInput) {
  const existing = await getCoupon(id); const next = { ...existing, ...input };
  if (new Date(next.startsAt) >= new Date(next.expiresAt)) throw new AppError(400, "expiresAt must be after startsAt");
  if (next.discountType === "PERCENTAGE" && Number(next.discountValue) > 100) throw new AppError(400, "Percentage discount must not exceed 100");
  if (input.courseIds) await assertCourseIds(input.courseIds);
  const normalized = input.code ? code(input.code) : undefined;
  if (normalized && await prisma.coupon.findFirst({ where: { code: normalized, id: { not: id } }, select: { id: true } })) throw new AppError(409, "Coupon code already exists", { code: "COUPON_CODE_EXISTS" });
  return serialize(await prisma.$transaction(async transaction => {
    if (input.courseIds || input.appliesToAllCourses === true) await transaction.couponCourse.deleteMany({ where: { couponId: id } });
    return transaction.coupon.update({ where: { id }, data: { ...(normalized ? { code: normalized } : {}), ...(input.name !== undefined ? { name: input.name } : {}), ...(input.description !== undefined ? { description: input.description } : {}), ...(input.discountType !== undefined ? { discountType: input.discountType } : {}), ...(input.discountValue !== undefined ? { discountValue: input.discountValue } : {}), ...(input.maxDiscountAmount !== undefined ? { maxDiscountAmount: input.maxDiscountAmount } : {}), ...(input.minOrderAmount !== undefined ? { minOrderAmount: input.minOrderAmount } : {}), ...(input.startsAt !== undefined ? { startsAt: input.startsAt } : {}), ...(input.expiresAt !== undefined ? { expiresAt: input.expiresAt } : {}), ...(input.maxRedemptions !== undefined ? { maxRedemptions: input.maxRedemptions } : {}), ...(input.appliesToAllCourses !== undefined ? { appliesToAllCourses: input.appliesToAllCourses } : {}), ...(input.isActive !== undefined ? { isActive: input.isActive } : {}), ...(!next.appliesToAllCourses && input.courseIds ? { courses: { create: input.courseIds.map(courseId => ({ courseId })) } } : {}) }, include: detail });
  }));
}

export async function setCouponStatus(id: string, input: CouponStatusInput) { await getCoupon(id); return serialize(await prisma.coupon.update({ where: { id }, data: input, include: detail })); }

export async function listCouponUsages(id: string) { await getCoupon(id); return (await prisma.couponUsage.findMany({ where: { couponId: id }, orderBy: { createdAt: "desc" }, include: { user: { select: { id: true, fullName: true, email: true } }, order: { select: { id: true, orderNumber: true } } } })).map(value => ({ ...value, discountAmount: Number(value.discountAmount) })); }

export async function validateCouponForCourses(userId: string, couponCode: string, courses: Array<{ id: string; price: unknown }>) {
  const coupon = await prisma.coupon.findUnique({ where: { code: code(couponCode) }, include: { courses: { select: { courseId: true } } } });
  if (!coupon) fail(404, "COUPON_NOT_FOUND", "Coupon not found");
  const now = new Date(); if (!coupon.isActive) fail(409, "COUPON_INACTIVE", "Coupon is inactive"); if (now < coupon.startsAt) fail(409, "COUPON_NOT_STARTED", "Coupon has not started"); if (now > coupon.expiresAt) fail(409, "COUPON_EXPIRED", "Coupon has expired");
  if (coupon.maxRedemptions !== null && coupon.redeemedCount >= coupon.maxRedemptions) fail(409, "COUPON_USAGE_LIMIT_REACHED", "Coupon usage limit reached");
  if (await prisma.couponUsage.findFirst({ where: { couponId: coupon.id, userId, status: "REDEEMED" }, select: { id: true } })) fail(409, "COUPON_ALREADY_USED", "Coupon has already been used by this account");
  const applicable = new Set(coupon.courses.map(item => item.courseId)); if (!coupon.appliesToAllCourses && courses.some(course => !applicable.has(course.id))) fail(409, "COUPON_NOT_APPLICABLE", "Coupon does not apply to one or more selected courses");
  const original = courses.reduce((sum, course) => sum + toVnd(course.price, "course price"), 0n); if (coupon.minOrderAmount !== null && original < toVnd(coupon.minOrderAmount, "minimum order amount")) fail(409, "MIN_ORDER_AMOUNT_NOT_MET", "Minimum order amount not met");
  const discount = calculateDiscount(original, coupon.discountType, toVnd(coupon.discountValue, "discount value"), coupon.maxDiscountAmount === null ? null : toVnd(coupon.maxDiscountAmount, "maximum discount"));
  return { coupon, original, discount, pricing: pricing(original, discount) };
}

export async function validateCoupon(userId: string, input: ValidateCouponInput) { const course = await prisma.course.findFirst({ where: { id: input.courseId, status: "PUBLISHED", isFree: false }, select: { id: true, price: true } }); if (!course) throw new AppError(404, "Published paid course not found"); const result = await validateCouponForCourses(userId, input.code, [course]); return { valid: true, coupon: { code: result.coupon.code, discountType: result.coupon.discountType, discountValue: vndNumber(toVnd(result.coupon.discountValue)) }, pricing: result.pricing }; }
