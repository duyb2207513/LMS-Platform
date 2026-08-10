import { AppError } from "../../common/errors/AppError.js";
import { prisma } from "../../config/database.js";
import type { AuthTokenPayload } from "../auth/auth.types.js";
import { assertCourseEnrollment, UUID } from "../interactions/access.js";
import type { ReviewInput, UpdateReviewInput } from "./reviews.types.js";
const select = { id: true, courseId: true, rating: true, content: true, createdAt: true, updatedAt: true, user: { select: { id: true, fullName: true, avatarUrl: true } } };
export async function listReviews(courseId: string) {
  if (!UUID.test(courseId)) throw new AppError(404, "Course not found");
  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { status: true } }); if (!course || course.status !== "PUBLISHED") throw new AppError(404, "Published course not found");
  const [items, aggregate] = await Promise.all([prisma.review.findMany({ where: { courseId }, orderBy: { createdAt: "desc" }, select }), prisma.review.aggregate({ where: { courseId }, _avg: { rating: true }, _count: true })]);
  return { items, summary: { averageRating: aggregate._avg.rating === null ? 0 : Math.round(aggregate._avg.rating * 100) / 100, totalReviews: aggregate._count } };
}
export async function createReview(courseId: string, userId: string, input: ReviewInput) {
  await assertCourseEnrollment(courseId, userId);
  if (await prisma.review.findUnique({ where: { courseId_userId: { courseId, userId } } })) throw new AppError(409, "You have already reviewed this course");
  return prisma.review.create({ data: { ...input, courseId, userId }, select });
}
export async function updateReview(reviewId: string, actor: AuthTokenPayload, input: UpdateReviewInput) {
  if (!UUID.test(reviewId)) throw new AppError(404, "Review not found"); const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) throw new AppError(404, "Review not found"); if (review.userId !== actor.userId) throw new AppError(403, "You can only update your own review");
  return prisma.review.update({ where: { id: reviewId }, data: input, select });
}
export async function deleteReview(reviewId: string, actor: AuthTokenPayload) {
  if (!UUID.test(reviewId)) throw new AppError(404, "Review not found"); const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) throw new AppError(404, "Review not found"); if (review.userId !== actor.userId && actor.role !== "ADMIN") throw new AppError(403, "You can only delete your own review");
  await prisma.review.delete({ where: { id: reviewId } });
}
