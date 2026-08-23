import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
import { verifyAccessToken } from "../../modules/auth/auth.tokens.js";

let io: Server | undefined;

export function initializeSocket(server: HttpServer) {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || origin.includes("localhost") || origin.endsWith(".vercel.app") || origin === env.frontendUrl) {
          return callback(null, true);
        }
        return callback(null, true);
      },
      credentials: true
    },
    transports: ["websocket", "polling"]
  });
  io.use((socket, next) => {
    const provided = socket.handshake.auth?.token;
    const token = typeof provided === "string" ? provided.replace(/^Bearer\s+/i, "").trim() : "";
    if (!token) return next(new Error("Authentication required"));
    try {
      const auth = verifyAccessToken(token);
      socket.data.userId = auth.userId;
      socket.data.role = auth.role;
      next();
    } catch {
      next(new Error("Invalid or expired access token"));
    }
  });
  io.on("connection", socket => {
    const userId = String(socket.data.userId);
    void socket.join(`user:${userId}`);
    logger.debug({ socketId: socket.id, userId }, "Notification socket connected");
  });
  return io;
}

export const emitNewNotification = (notification: { userId: string } & Record<string, unknown>) => {
  if (!io) return;
  const { userId, updatedAt: _updatedAt, ...payload } = notification;
  io.to(`user:${userId}`).emit("notification:new", payload);
};
export const emitNotificationRead = (userId: string, id: string) => io?.to(`user:${userId}`).emit("notification:read", { id });
export const emitNotificationReadAll = (userId: string, readAt: Date) => io?.to(`user:${userId}`).emit("notification:read-all", { readAt });
export const emitAnnouncementPublished = (userIds: string[], announcement: Record<string, unknown>) => {
  if (!io) return;
  for (const userId of userIds) io.to(`user:${userId}`).emit("announcement:published", announcement);
};
export const closeSocket = () => new Promise<void>(resolve => io ? io.close(() => resolve()) : resolve());
