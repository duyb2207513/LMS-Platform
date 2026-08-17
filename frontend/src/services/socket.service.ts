import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "@/composables/useApi";
import type { Notification, CourseAnnouncement } from "@/types";

class SocketService {
  private socket: Socket | null = null;
  private baseUrl: string;

  constructor() {
    // API_BASE_URL: http://localhost:3000/api/v1 -> http://localhost:3000
    this.baseUrl = API_BASE_URL.replace(/\/api\/v1\/?$/, "");
  }

  connect(accessToken?: string): Socket | null {
    const token = accessToken || localStorage.getItem("accessToken");
    if (!token) {
      this.disconnect();
      return null;
    }

    if (this.socket) {
      this.socket.auth = { token: `Bearer ${token}` };
      if (!this.socket.active) this.socket.connect();
      return this.socket;
    }

    this.socket = io(this.baseUrl, {
      auth: {
        token: `Bearer ${token}`,
      },
      // Start with polling so a backend container that is still warming up can
      // recover cleanly, then upgrade to WebSocket automatically.
      transports: ["polling", "websocket"],
      upgrade: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      randomizationFactor: 0.5,
      timeout: 10000,
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }

  onNewNotification(callback: (notification: Notification) => void) {
    if (!this.socket) return () => {};
    this.socket.removeAllListeners("notification:new");
    this.socket.on("notification:new", callback);
    return () => {
      this.socket?.off("notification:new", callback);
    };
  }

  onNotificationRead(callback: (payload: { id: string }) => void) {
    if (!this.socket) return () => {};
    this.socket.removeAllListeners("notification:read");
    this.socket.on("notification:read", callback);
    return () => {
      this.socket?.off("notification:read", callback);
    };
  }

  onNotificationReadAll(callback: (payload: { readAt: string }) => void) {
    if (!this.socket) return () => {};
    this.socket.removeAllListeners("notification:read-all");
    this.socket.on("notification:read-all", callback);
    return () => {
      this.socket?.off("notification:read-all", callback);
    };
  }

  onAnnouncementPublished(
    callback: (announcement: Partial<CourseAnnouncement>) => void,
  ) {
    if (!this.socket) return () => {};
    this.socket.removeAllListeners("announcement:published");
    this.socket.on("announcement:published", callback);
    return () => {
      this.socket?.off("announcement:published", callback);
    };
  }

  getSocket() {
    return this.socket;
  }
}

export const socketService = new SocketService();
