import { prisma } from "../../config/database.js";
import type { NotificationPreferenceInput } from "./preference.types.js";

export const getPreferences = (userId: string) => prisma.notificationPreference.upsert({ where: { userId }, create: { userId }, update: {} });
export const updatePreferences = (userId: string, input: NotificationPreferenceInput) => prisma.notificationPreference.upsert({ where: { userId }, create: { userId, ...input }, update: input });
