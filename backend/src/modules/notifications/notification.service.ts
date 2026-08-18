import { AppError } from "../../common/errors/AppError.js";
import { prisma } from "../../config/database.js";
import { emitNewNotification, emitNotificationRead, emitNotificationReadAll } from "../../services/realtime/socket.service.js";
import type { NotificationType } from "../../prisma/enums.js";
import type { Prisma } from "../../prisma/client.js";
import type { CreateNotificationInput, NotificationListQuery } from "./notification.types.js";
import { UUID } from "../interactions/access.js";
import { deliverPushNotification } from "./push.service.js";

type Preference = { inAppEnabled: boolean; courseUpdates: boolean; assignmentReminders: boolean; quizResults: boolean; certificateUpdates: boolean } | null;
export function allowsInApp(type: NotificationType, preference: Preference) {
  if (preference?.inAppEnabled === false) return false;
  if (["COURSE_ENROLLED", "NEW_LESSON", "COURSE_ANNOUNCEMENT"].includes(type)) return preference?.courseUpdates !== false;
  if (type === "ASSIGNMENT_DUE") return preference?.assignmentReminders !== false;
  if (type === "QUIZ_RESULT") return preference?.quizResults !== false;
  if (type === "CERTIFICATE_ISSUED") return preference?.certificateUpdates !== false;
  return true;
}

const publicNotification = <T extends { userId: string }>(item: T) => {
  const { userId: _userId, updatedAt: _updatedAt, ...result } = item as T & { updatedAt?: Date };
  return result;
};

export async function createNotification(input: CreateNotificationInput) {
  const preference = await prisma.notificationPreference.findUnique({ where: { userId: input.userId } });
  const topicAllowed = allowsInApp(input.type, preference ? { ...preference, inAppEnabled: true } : null);
  if (!topicAllowed) return null;
  void deliverPushNotification(input);
  if (preference?.inAppEnabled === false) return null;
  const item = await prisma.notification.create({ data: { ...input, data: input.data as Prisma.InputJsonValue | undefined } });
  emitNewNotification(item);
  return publicNotification(item);
}

export async function createManyNotifications(inputs: CreateNotificationInput[]) {
  if (!inputs.length) return [];
  const userIds = [...new Set(inputs.map(item => item.userId))];
  const preferences = await prisma.notificationPreference.findMany({ where: { userId: { in: userIds } } });
  const map = new Map(preferences.map(item => [item.userId, item]));
  const topicAllowed = inputs.filter(input => { const preference = map.get(input.userId); return allowsInApp(input.type, preference ? { ...preference, inAppEnabled: true } : null); });
  for (const input of topicAllowed) void deliverPushNotification(input);
  const allowed = topicAllowed.filter(input => map.get(input.userId)?.inAppEnabled !== false);
  if (!allowed.length) return [];
  const created = await prisma.notification.createManyAndReturn({ data: allowed.map(input => ({ ...input, data: input.data as Prisma.InputJsonValue | undefined })) });
  for (const item of created) emitNewNotification(item);
  return created.map(publicNotification);
}

export async function listNotifications(userId: string, query: NotificationListQuery) {
  const where = { userId, ...(query.isRead === undefined ? {} : { isRead: query.isRead }) };
  const [items, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({ where, orderBy: { createdAt: "desc" }, skip: (query.page - 1) * query.limit, take: query.limit }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, isRead: false } })
  ]);
  return { data: items.map(publicNotification), meta: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit), unreadCount } };
}

export const getUnreadCount = (userId: string) => prisma.notification.count({ where: { userId, isRead: false } });

export async function markNotificationRead(userId: string, id: string) {
  if (!UUID.test(id)) throw new AppError(404, "Notification not found");
  const existing = await prisma.notification.findFirst({ where: { id, userId } });
  if (!existing) throw new AppError(404, "Notification not found");
  const item = existing.isRead ? existing : await prisma.notification.update({ where: { id }, data: { isRead: true, readAt: new Date() } });
  emitNotificationRead(userId, id);
  return publicNotification(item);
}

export async function markAllNotificationsRead(userId: string) {
  const readAt = new Date();
  const result = await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true, readAt } });
  emitNotificationReadAll(userId, readAt);
  return { updatedCount: result.count, readAt };
}

export async function deleteNotification(userId: string, id: string) {
  if (!UUID.test(id)) throw new AppError(404, "Notification not found");
  const result = await prisma.notification.deleteMany({ where: { id, userId } });
  if (!result.count) throw new AppError(404, "Notification not found");
}
