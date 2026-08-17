import { AppError } from "../../common/errors/AppError.js";
import { prisma } from "../../config/database.js";
import { safelyRunCommunication } from "../../services/communication/communication.service.js";
import { UUID } from "../interactions/access.js";
import { createNotification } from "../notifications/notification.service.js";
import type { SendMessageInput } from "./messages.types.js";

const userSelect = { id: true, fullName: true, avatarUrl: true, role: true, status: true } as const;
const messageInclude = { sender: { select: userSelect }, recipient: { select: userSelect } } as const;

export async function searchContacts(userId: string, rawSearch: unknown) {
  const search = typeof rawSearch === "string" ? rawSearch.trim() : "";
  if (search.length > 100) throw new AppError(400, "search must not exceed 100 characters");
  return prisma.user.findMany({
    where: {
      id: { not: userId }, status: "ACTIVE",
      ...(search ? { OR: [{ fullName: { contains: search, mode: "insensitive" } }, { email: { contains: search, mode: "insensitive" } }] } : {})
    },
    orderBy: { fullName: "asc" }, take: 30,
    select: { ...userSelect, email: true }
  });
}

export async function listConversations(userId: string) {
  const messages = await prisma.directMessage.findMany({
    where: { OR: [{ senderId: userId }, { recipientId: userId }] },
    orderBy: { createdAt: "desc" }, take: 300,
    include: messageInclude
  });
  const result = new Map<string, Record<string, unknown>>();
  for (const message of messages) {
    const contact = message.senderId === userId ? message.recipient : message.sender;
    const existing = result.get(contact.id);
    const unread = message.recipientId === userId && !message.readAt ? 1 : 0;
    if (!existing) result.set(contact.id, { contact, lastMessage: message, unreadCount: unread });
    else existing.unreadCount = Number(existing.unreadCount) + unread;
  }
  return [...result.values()];
}

export async function listMessages(userId: string, otherUserId: string) {
  if (!UUID.test(otherUserId)) throw new AppError(404, "User not found");
  const contact = await prisma.user.findFirst({ where: { id: otherUserId, status: "ACTIVE" }, select: { ...userSelect, email: true } });
  if (!contact || otherUserId === userId) throw new AppError(404, "User not found");
  await prisma.directMessage.updateMany({ where: { senderId: otherUserId, recipientId: userId, readAt: null }, data: { readAt: new Date() } });
  const rows = await prisma.directMessage.findMany({
    where: { OR: [{ senderId: userId, recipientId: otherUserId }, { senderId: otherUserId, recipientId: userId }] },
    orderBy: { createdAt: "desc" }, take: 100,
    include: messageInclude
  });
  return { contact, messages: rows.reverse() };
}

export async function sendMessage(senderId: string, recipientId: string, input: SendMessageInput) {
  if (!UUID.test(recipientId) || recipientId === senderId) throw new AppError(404, "User not found");
  const [sender, recipient] = await Promise.all([
    prisma.user.findUnique({ where: { id: senderId }, select: { fullName: true } }),
    prisma.user.findFirst({ where: { id: recipientId, status: "ACTIVE" }, select: { id: true } })
  ]);
  if (!sender || !recipient) throw new AppError(404, "User not found");
  const message = await prisma.directMessage.create({ data: { senderId, recipientId, content: input.content }, include: messageInclude });
  await safelyRunCommunication(() => createNotification({
    userId: recipientId,
    type: "DIRECT_MESSAGE",
    title: `Tin nhắn mới từ ${sender.fullName}`,
    message: input.content.length > 120 ? `${input.content.slice(0, 117)}...` : input.content,
    data: { url: `/messages?userId=${senderId}`, senderId, messageId: message.id }
  }));
  return message;
}
