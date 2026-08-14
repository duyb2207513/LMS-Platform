import type { NotificationType } from "../../prisma/enums.js";

export type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
};

export type NotificationListQuery = { page: number; limit: number; isRead?: boolean };
