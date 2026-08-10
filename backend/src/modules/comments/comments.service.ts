import { AppError } from "../../common/errors/AppError.js"; import { prisma } from "../../config/database.js"; import type { AuthTokenPayload } from "../auth/auth.types.js"; import { assertLessonAccess, canManageCourse, UUID } from "../interactions/access.js"; import type { CreateCommentInput, UpdateCommentInput } from "./comments.types.js";
const user = { select: { id: true, fullName: true, avatarUrl: true, role: true } };
function serialize<T extends { content: string; deletedAt: Date | null }>(comment: T) { return { ...comment, content: comment.deletedAt ? null : comment.content, isDeleted: Boolean(comment.deletedAt) }; }
export async function listComments(lessonId: string, actor: AuthTokenPayload) {
  await assertLessonAccess(lessonId, actor);
  const items = await prisma.comment.findMany({ where: { lessonId, parentId: null }, orderBy: { createdAt: "asc" }, include: { user, replies: { orderBy: { createdAt: "asc" }, include: { user } } } });
  return items.map(item => ({ ...serialize(item), replies: item.replies.map(serialize) }));
}
export async function createComment(lessonId: string, actor: AuthTokenPayload, input: CreateCommentInput) {
  await assertLessonAccess(lessonId, actor);
  if (input.parentId) {
    if (!UUID.test(input.parentId)) throw new AppError(404, "Parent comment not found");
    const parent = await prisma.comment.findUnique({ where: { id: input.parentId }, select: { lessonId: true, parentId: true, deletedAt: true } });
    if (!parent || parent.lessonId !== lessonId || parent.deletedAt) throw new AppError(404, "Parent comment not found");
    if (parent.parentId) throw new AppError(400, "Replies can only be added to top-level comments");
  }
  return prisma.comment.create({ data: { lessonId, userId: actor.userId, content: input.content, parentId: input.parentId ?? null }, include: { user } });
}
export async function updateComment(commentId: string, actor: AuthTokenPayload, input: UpdateCommentInput) {
  if (!UUID.test(commentId)) throw new AppError(404, "Comment not found"); const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment || comment.deletedAt) throw new AppError(404, "Comment not found"); if (comment.userId !== actor.userId) throw new AppError(403, "You can only update your own comment");
  return prisma.comment.update({ where: { id: commentId }, data: input, include: { user } });
}
export async function deleteComment(commentId: string, actor: AuthTokenPayload) {
  if (!UUID.test(commentId)) throw new AppError(404, "Comment not found");
  const comment = await prisma.comment.findUnique({ where: { id: commentId }, include: { lesson: { include: { section: { include: { course: { select: { instructorId: true } } } } } } } });
  if (!comment || comment.deletedAt) throw new AppError(404, "Comment not found");
  const moderator = canManageCourse(comment.lesson.section.course.instructorId, actor); if (comment.userId !== actor.userId && !moderator) throw new AppError(403, "You cannot delete this comment");
  await prisma.comment.update({ where: { id: commentId }, data: { content: "[deleted]", deletedAt: new Date() } });
}
