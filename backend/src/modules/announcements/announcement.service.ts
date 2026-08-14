import { AppError } from "../../common/errors/AppError.js";
import { prisma } from "../../config/database.js";
import { emitAnnouncementPublished, emitNewNotification } from "../../services/realtime/socket.service.js";
import type { AuthTokenPayload } from "../auth/auth.types.js";
import { canManageCourse, UUID } from "../interactions/access.js";
import { allowsInApp } from "../notifications/notification.service.js";
import type { AnnouncementInput, UpdateAnnouncementInput } from "./announcement.types.js";

async function courseContext(courseId: string) {
  if (!UUID.test(courseId)) throw new AppError(404, "Course not found");
  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { id: true, title: true, status: true, instructorId: true } });
  if (!course) throw new AppError(404, "Course not found");
  return course;
}
async function announcementContext(id: string) {
  if (!UUID.test(id)) throw new AppError(404, "Announcement not found");
  const item = await prisma.courseAnnouncement.findUnique({ where: { id }, include: { course: { select: { id: true, title: true, instructorId: true } }, author: { select: { id: true, fullName: true } } } });
  if (!item) throw new AppError(404, "Announcement not found");
  return item;
}
function assertAuthor(item: { authorId: string }, actor: AuthTokenPayload) {
  if (actor.role !== "ADMIN" && item.authorId !== actor.userId) throw new AppError(403, "You do not have permission to manage this announcement");
}

export async function listCourseAnnouncements(courseId: string, actor: AuthTokenPayload) {
  const course = await courseContext(courseId);
  const manager = canManageCourse(course.instructorId, actor);
  if (!manager) {
    if (actor.role !== "STUDENT" || course.status !== "PUBLISHED") throw new AppError(403, "You do not have permission to view course announcements");
    const enrollment = await prisma.enrollment.findUnique({ where: { studentId_courseId: { studentId: actor.userId, courseId } }, select: { status: true } });
    if (!enrollment || enrollment.status === "CANCELLED") throw new AppError(403, "Course enrollment is required");
  }
  return prisma.courseAnnouncement.findMany({
    where: { courseId, ...(manager ? {} : { status: "PUBLISHED" as const }) },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    include: { author: { select: { id: true, fullName: true, avatarUrl: true } } }
  });
}

export async function createAnnouncement(courseId: string, actor: AuthTokenPayload, input: AnnouncementInput) {
  const course = await courseContext(courseId);
  if (!canManageCourse(course.instructorId, actor)) throw new AppError(403, "You do not have permission to create announcements for this course");
  return prisma.courseAnnouncement.create({ data: { courseId, authorId: actor.userId, ...input }, include: { author: { select: { id: true, fullName: true } } } });
}

export async function updateAnnouncement(id: string, actor: AuthTokenPayload, input: UpdateAnnouncementInput) {
  const item = await announcementContext(id); assertAuthor(item, actor);
  if (item.status === "PUBLISHED") throw new AppError(409, "A published announcement cannot be edited");
  return prisma.courseAnnouncement.update({ where: { id }, data: input, include: { author: { select: { id: true, fullName: true } } } });
}

export async function publishAnnouncement(id: string, actor: AuthTokenPayload) {
  const item = await announcementContext(id); assertAuthor(item, actor);
  if (item.status === "PUBLISHED") throw new AppError(409, "Announcement is already published");
  const result = await prisma.$transaction(async transaction => {
    const claimed = await transaction.courseAnnouncement.updateMany({ where: { id, status: "DRAFT" }, data: { status: "PUBLISHED", publishedAt: new Date() } });
    if (!claimed.count) throw new AppError(409, "Announcement is already published");
    const enrollments = await transaction.enrollment.findMany({ where: { courseId: item.courseId, status: { not: "CANCELLED" } }, select: { studentId: true } });
    const userIds = enrollments.map(enrollment => enrollment.studentId);
    const preferences = await transaction.notificationPreference.findMany({ where: { userId: { in: userIds } } });
    const map = new Map(preferences.map(preference => [preference.userId, preference]));
    const recipients = userIds.filter(userId => allowsInApp("COURSE_ANNOUNCEMENT", map.get(userId) ?? null));
    const notifications = recipients.length ? await transaction.notification.createManyAndReturn({ data: recipients.map(userId => ({
      userId, type: "COURSE_ANNOUNCEMENT" as const, title: `Thông báo mới từ ${item.course.title}`,
      message: item.title, data: { url: `/courses/${item.courseId}/announcements/${item.id}`, courseId: item.courseId, announcementId: item.id }
    })) }) : [];
    const announcement = await transaction.courseAnnouncement.findUniqueOrThrow({ where: { id }, include: { author: { select: { id: true, fullName: true } } } });
    return { announcement, notifications, recipients };
  });
  for (const notification of result.notifications) emitNewNotification(notification);
  emitAnnouncementPublished(result.recipients, { id: result.announcement.id, courseId: result.announcement.courseId, title: result.announcement.title, publishedAt: result.announcement.publishedAt });
  return result.announcement;
}

export async function deleteAnnouncement(id: string, actor: AuthTokenPayload) {
  const item = await announcementContext(id); assertAuthor(item, actor);
  await prisma.courseAnnouncement.delete({ where: { id } });
}
