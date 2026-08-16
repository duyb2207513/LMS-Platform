import { AppError } from "../../common/errors/AppError.js";
import { prisma } from "../../config/database.js";
import { UUID } from "../interactions/access.js";
import type { AdminCourseStatus, AdminListQuery, AdminUserRole, AdminUserStatus, UpdateAdminCourseInput, UpdateAdminUserInput } from "./admin.types.js";

export function parseAdminQuery(raw: Record<string, unknown>): AdminListQuery {
  const page = Math.max(1, Number(raw.page) || 1), limit = Math.min(100, Math.max(1, Number(raw.limit) || 20));
  const search = typeof raw.search === "string" ? raw.search.trim() : "";
  const role = ["STUDENT", "INSTRUCTOR", "ADMIN"].includes(String(raw.role)) ? raw.role as AdminUserRole : undefined;
  const userStatus = ["ACTIVE", "BLOCKED"].includes(String(raw.status)) ? raw.status as AdminUserStatus : undefined;
  const courseStatus = ["DRAFT", "PUBLISHED", "ARCHIVED"].includes(String(raw.status)) ? raw.status as AdminCourseStatus : undefined;
  return { page, limit, ...(search ? { search } : {}), ...(role ? { role } : {}), ...(userStatus ? { userStatus } : {}), ...(courseStatus ? { courseStatus } : {}) };
}
const meta = (query: AdminListQuery, totalItems: number) => ({ page: query.page, limit: query.limit, totalItems, totalPages: Math.ceil(totalItems / query.limit) });

export async function dashboardStats() {
  const since = new Date(); since.setUTCDate(since.getUTCDate() - 30);
  const [users, usersByRole, courses, coursesByStatus, enrollments, reviews, comments, paidOrders, revenue, certificates, recentUsers, recentOrders] = await Promise.all([
    prisma.user.count(), prisma.user.groupBy({ by: ["role"], _count: true }), prisma.course.count(), prisma.course.groupBy({ by: ["status"], _count: true }),
    prisma.enrollment.count(), prisma.review.count(), prisma.comment.count({ where: { deletedAt: null } }), prisma.order.count({ where: { status: "PAID" } }),
    prisma.order.aggregate({ where: { status: "PAID" }, _sum: { total: true } }), prisma.certificate.count({ where: { revokedAt: null } }),
    prisma.user.findMany({ take: 5, orderBy: { createdAt: "desc" }, select: { id: true, fullName: true, email: true, role: true, status: true, createdAt: true } }),
    prisma.order.findMany({ take: 5, orderBy: { createdAt: "desc" }, select: { id: true, orderNumber: true, status: true, total: true, currency: true, createdAt: true, user: { select: { fullName: true, email: true } } } })
  ]);
  return {
    users: { total: users, byRole: Object.fromEntries(usersByRole.map(item => [item.role, item._count])) },
    courses: { total: courses, byStatus: Object.fromEntries(coursesByStatus.map(item => [item.status, item._count])) },
    learning: { enrollments, reviews, comments }, commerce: { paidOrders, revenue: Number(revenue._sum.total ?? 0), currency: "VND" }, certificates,
    period: { last30DaysFrom: since.toISOString() }, recent: { users: recentUsers, orders: recentOrders.map(order => ({ ...order, total: Number(order.total) })) }
  };
}

export async function listAdminUsers(query: AdminListQuery) {
  const where = { ...(query.search ? { OR: [{ fullName: { contains: query.search, mode: "insensitive" as const } }, { email: { contains: query.search, mode: "insensitive" as const } }] } : {}), ...(query.role ? { role: query.role } : {}), ...(query.userStatus ? { status: query.userStatus } : {}) };
  const [items, total] = await Promise.all([prisma.user.findMany({ where, skip: (query.page - 1) * query.limit, take: query.limit, orderBy: { createdAt: "desc" }, select: { id: true, fullName: true, email: true, avatarUrl: true, role: true, status: true, googleId: true, githubId: true, lastLoginAt: true, createdAt: true, updatedAt: true, _count: { select: { courses: true, enrollments: true, reviews: true } } } }), prisma.user.count({ where })]);
  return { items, meta: meta(query, total) };
}
export async function updateAdminUser(userId: string, actorId: string, input: UpdateAdminUserInput) {
  if (!UUID.test(userId)) throw new AppError(404, "User not found");
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true, status: true } }); if (!user) throw new AppError(404, "User not found");
  if (userId === actorId && ((input.role && input.role !== "ADMIN") || input.status === "BLOCKED")) throw new AppError(409, "You cannot remove your own admin access");
  return prisma.user.update({ where: { id: userId }, data: input, select: { id: true, fullName: true, email: true, avatarUrl: true, role: true, status: true, createdAt: true, updatedAt: true } });
}

export async function listAdminCourses(query: AdminListQuery) {
  const where = { ...(query.search ? { OR: [{ title: { contains: query.search, mode: "insensitive" as const } }, { slug: { contains: query.search, mode: "insensitive" as const } }] } : {}), ...(query.courseStatus ? { status: query.courseStatus } : {}) };
  const [items, total] = await Promise.all([prisma.course.findMany({ where, skip: (query.page - 1) * query.limit, take: query.limit, orderBy: { createdAt: "desc" }, include: { instructor: { select: { id: true, fullName: true, email: true } }, category: { select: { id: true, name: true, slug: true } }, _count: { select: { enrollments: true, reviews: true, sections: true } } } }), prisma.course.count({ where })]);
  return { items: items.map(item => ({ ...item, price: Number(item.price) })), meta: meta(query, total) };
}
export async function updateAdminCourse(courseId: string, input: UpdateAdminCourseInput) { if (!UUID.test(courseId)) throw new AppError(404, "Course not found"); try { return await prisma.course.update({ where: { id: courseId }, data: { status: input.status, publishedAt: input.status === "PUBLISHED" ? new Date() : undefined } }); } catch { throw new AppError(404, "Course not found"); } }

export async function listAdminReviews(query: AdminListQuery) {
  const where = query.search ? { OR: [{ content: { contains: query.search, mode: "insensitive" as const } }, { user: { fullName: { contains: query.search, mode: "insensitive" as const } } }, { course: { title: { contains: query.search, mode: "insensitive" as const } } }] } : {};
  const [items, total] = await Promise.all([prisma.review.findMany({ where, skip: (query.page - 1) * query.limit, take: query.limit, orderBy: { createdAt: "desc" }, include: { user: { select: { id: true, fullName: true, email: true } }, course: { select: { id: true, title: true, slug: true } } } }), prisma.review.count({ where })]);
  return { items, meta: meta(query, total) };
}
export async function removeAdminReview(reviewId: string) { if (!UUID.test(reviewId)) throw new AppError(404, "Review not found"); const result = await prisma.review.deleteMany({ where: { id: reviewId } }); if (!result.count) throw new AppError(404, "Review not found"); }

export async function listAdminComments(query: AdminListQuery) {
  const where = { ...(query.search ? { OR: [{ content: { contains: query.search, mode: "insensitive" as const } }, { user: { fullName: { contains: query.search, mode: "insensitive" as const } } }, { lesson: { title: { contains: query.search, mode: "insensitive" as const } } }] } : {}) };
  const [items, total] = await Promise.all([prisma.comment.findMany({ where, skip: (query.page - 1) * query.limit, take: query.limit, orderBy: { createdAt: "desc" }, include: { user: { select: { id: true, fullName: true, email: true, role: true } }, lesson: { select: { id: true, title: true, section: { select: { course: { select: { id: true, title: true } } } } } } } }), prisma.comment.count({ where })]);
  return { items: items.map(item => ({ ...item, content: item.deletedAt ? null : item.content, isDeleted: Boolean(item.deletedAt) })), meta: meta(query, total) };
}
export async function removeAdminComment(commentId: string) { if (!UUID.test(commentId)) throw new AppError(404, "Comment not found"); const result = await prisma.comment.updateMany({ where: { id: commentId, deletedAt: null }, data: { content: "[deleted]", deletedAt: new Date() } }); if (!result.count) throw new AppError(404, "Comment not found"); }
