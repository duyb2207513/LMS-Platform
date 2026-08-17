import { prisma } from "../../config/database.js";
import { logger } from "../../config/logger.js";
import type { CreateNotificationInput, RegisterPushDeviceInput } from "./notification.types.js";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export async function registerPushDevice(userId: string, input: RegisterPushDeviceInput) {
  const device = await prisma.pushDevice.upsert({
    where: { expoPushToken: input.expoPushToken },
    create: { userId, ...input },
    update: { userId, platform: input.platform, deviceName: input.deviceName ?? null, isActive: true, lastUsedAt: new Date() }
  });
  return { id: device.id, platform: device.platform, deviceName: device.deviceName, isActive: device.isActive, lastUsedAt: device.lastUsedAt };
}

export async function unregisterPushDevice(userId: string, deviceId: string) {
  await prisma.pushDevice.updateMany({ where: { id: deviceId, userId }, data: { isActive: false } });
}

type ExpoTicket = { details?: { error?: string } };

export async function deliverPushNotification(input: CreateNotificationInput) {
  try {
    const [preference, devices] = await Promise.all([
      prisma.notificationPreference.findUnique({ where: { userId: input.userId }, select: { pushEnabled: true } }),
      prisma.pushDevice.findMany({ where: { userId: input.userId, isActive: true }, select: { id: true, expoPushToken: true } })
    ]);
    if (preference?.pushEnabled === false || !devices.length) return;
    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", "Accept-Encoding": "gzip, deflate" },
      body: JSON.stringify(devices.map(device => ({
        to: device.expoPushToken,
        title: input.title,
        body: input.message,
        sound: "default",
        channelId: "lms-updates",
        data: { ...input.data, notificationType: input.type }
      })))
    });
    if (!response.ok) throw new Error(`Expo Push Service returned ${response.status}`);
    const payload = await response.json() as { data?: ExpoTicket[] };
    const invalidIds = devices.filter((_device, index) => payload.data?.[index]?.details?.error === "DeviceNotRegistered").map(device => device.id);
    if (invalidIds.length) await prisma.pushDevice.updateMany({ where: { id: { in: invalidIds } }, data: { isActive: false } });
  } catch (error) {
    logger.warn({ err: error, userId: input.userId }, "Push notification delivery failed");
  }
}
