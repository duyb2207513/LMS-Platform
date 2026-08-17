import { defineStore } from "pinia";
import { ref } from "vue";
import { useApi } from "@/composables/useApi";
import { socketService } from "@/services/socket.service";
import type {
  ApiResponse,
  Notification,
  NotificationPreference,
  NotificationPreferenceInput,
  NotificationPaginationMeta,
} from "@/types";

export const useNotificationStore = defineStore("notification", () => {
  const items = ref<Notification[]>([]);
  const unreadCount = ref<number>(0);
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);
  const preferences = ref<NotificationPreference | null>(null);
  const latestRealtimeNotification = ref<Notification | null>(null);
  const isSocketConnected = ref<boolean>(false);

  const meta = ref<NotificationPaginationMeta>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    unreadCount: 0,
  });

  // ==================== Actions ====================

  /**
   * Lấy danh sách thông báo
   */
  async function fetchNotifications(options?: {
    page?: number;
    limit?: number;
    isRead?: boolean;
    append?: boolean;
  }) {
    loading.value = true;
    error.value = null;
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const isRead = options?.isRead;
    const append = options?.append ?? false;

    try {
      const api = useApi();
      const params: Record<string, string | number | boolean | undefined> = {
        page,
        limit,
      };
      if (isRead !== undefined) {
        params.isRead = isRead;
      }

      const response = await api.get<{
        data: Notification[];
        meta: NotificationPaginationMeta;
      }>("/notifications", params);
      const data = response.data || [];
      const responseMeta = response.meta || {
        page,
        limit,
        total: data.length,
        totalPages: 1,
        unreadCount: 0,
      };

      if (append) {
        // Tránh duplicate theo ID khi append
        const existingIds = new Set(items.value.map((n) => n.id));
        const newItems = data.filter((n) => !existingIds.has(n.id));
        items.value = [...items.value, ...newItems];
      } else {
        items.value = data;
      }

      meta.value = responseMeta;
      if (typeof responseMeta.unreadCount === "number") {
        unreadCount.value = responseMeta.unreadCount;
      }

      return { data, meta: responseMeta };
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Không thể tải thông báo";
      return { data: [], meta: meta.value };
    } finally {
      loading.value = false;
    }
  }

  /**
   * Đếm số lượng thông báo chưa đọc
   */
  async function fetchUnreadCount() {
    try {
      const api = useApi();
      const response = await api.get<ApiResponse<{ unreadCount: number }>>(
        "/notifications/unread-count",
      );
      if (response.data) {
        unreadCount.value = response.data.unreadCount;
      }
      return unreadCount.value;
    } catch {
      return unreadCount.value;
    }
  }

  /**
   * Đánh dấu một thông báo là đã đọc
   */
  async function markAsRead(id: string) {
    const target = items.value.find((n) => n.id === id);
    if (target && !target.isRead) {
      target.isRead = true;
      target.readAt = new Date().toISOString();
      unreadCount.value = Math.max(0, unreadCount.value - 1);
    }

    try {
      const api = useApi();
      await api.patch(`/notifications/${id}/read`);
    } catch (e) {
      // rollback nếu lỗi
      if (target && target.isRead) {
        target.isRead = false;
        target.readAt = null;
        unreadCount.value += 1;
      }
      error.value =
        e instanceof Error ? e.message : "Không thể đánh dấu đã đọc";
    }
  }

  /**
   * Đánh dấu tất cả thông báo là đã đọc
   */
  async function markAllAsRead() {
    const previousUnread = unreadCount.value;
    const previousItems = items.value.map((item) => ({ ...item }));

    items.value.forEach((n) => {
      n.isRead = true;
      n.readAt = new Date().toISOString();
    });
    unreadCount.value = 0;

    try {
      const api = useApi();
      await api.patch("/notifications/read-all");
    } catch (e) {
      items.value = previousItems;
      unreadCount.value = previousUnread;
      error.value =
        e instanceof Error ? e.message : "Không thể đánh dấu tất cả đã đọc";
    }
  }

  /**
   * Xóa một thông báo
   */
  async function deleteNotification(id: string) {
    const index = items.value.findIndex((n) => n.id === id);
    if (index === -1) return;

    const removedItem = items.value[index];
    items.value.splice(index, 1);
    meta.value.total = Math.max(0, meta.value.total - 1);
    if (!removedItem.isRead) {
      unreadCount.value = Math.max(0, unreadCount.value - 1);
    }

    try {
      const api = useApi();
      await api.del(`/notifications/${id}`);
    } catch (e) {
      items.value.splice(index, 0, removedItem);
      meta.value.total += 1;
      if (!removedItem.isRead) {
        unreadCount.value += 1;
      }
      error.value = e instanceof Error ? e.message : "Không thể xóa thông báo";
    }
  }

  /**
   * Tải tùy chọn thông báo (Notification Preferences)
   */
  async function fetchPreferences() {
    try {
      const api = useApi();
      const response = await api.get<ApiResponse<NotificationPreference>>(
        "/notification-preferences",
      );
      if (response.data) {
        preferences.value = response.data;
      }
      return preferences.value;
    } catch (e) {
      error.value =
        e instanceof Error ? e.message : "Không thể tải cài đặt thông báo";
      return null;
    }
  }

  /**
   * Cập nhật tùy chọn thông báo
   */
  async function updatePreferences(data: NotificationPreferenceInput) {
    const previous = preferences.value ? { ...preferences.value } : null;
    if (preferences.value) {
      preferences.value = { ...preferences.value, ...data };
    }

    try {
      const api = useApi();
      const response = await api.patch<ApiResponse<NotificationPreference>>(
        "/notification-preferences",
        data,
      );
      if (response.data) {
        preferences.value = response.data;
      }
      return response.data;
    } catch (e) {
      if (previous) preferences.value = previous;
      error.value =
        e instanceof Error ? e.message : "Không thể cập nhật cài đặt thông báo";
      throw e;
    }
  }

  // ==================== Realtime Handlers ====================

  function handleRealtimeNotification(notification: Notification) {
    // Tránh duplicate theo ID
    const exists = items.value.some((n) => n.id === notification.id);
    if (!exists) {
      items.value = [notification, ...items.value];
      meta.value.total += 1;
      if (!notification.isRead) {
        unreadCount.value += 1;
      }
      latestRealtimeNotification.value = notification;
    }
  }

  function handleRealtimeRead(payload: { id: string }) {
    const item = items.value.find((n) => n.id === payload.id);
    if (item && !item.isRead) {
      item.isRead = true;
      item.readAt = new Date().toISOString();
      unreadCount.value = Math.max(0, unreadCount.value - 1);
    }
  }

  function handleRealtimeReadAll(payload: { readAt: string }) {
    items.value.forEach((item) => {
      item.isRead = true;
      item.readAt = payload.readAt || new Date().toISOString();
    });
    unreadCount.value = 0;
  }

  /**
   * Khởi tạo realtime listeners
   */
  function initSocket(accessToken?: string) {
    const socket = socketService.connect(accessToken);
    if (!socket) {
      isSocketConnected.value = false;
      return;
    }

    socket.removeAllListeners("connect");
    socket.removeAllListeners("disconnect");
    socket.removeAllListeners("connect_error");
    socket.on("connect", () => {
      isSocketConnected.value = true;
    });
    socket.on("disconnect", () => {
      isSocketConnected.value = false;
    });
    socket.on("connect_error", () => {
      isSocketConnected.value = false;
    });
    isSocketConnected.value = socket.connected;

    socketService.onNewNotification((notification) => {
      handleRealtimeNotification(notification);
    });

    socketService.onNotificationRead((payload) => {
      handleRealtimeRead(payload);
    });

    socketService.onNotificationReadAll((payload) => {
      handleRealtimeReadAll(payload);
    });
  }

  function disconnectSocket() {
    socketService.disconnect();
    isSocketConnected.value = false;
  }

  function clear() {
    items.value = [];
    unreadCount.value = 0;
    preferences.value = null;
    latestRealtimeNotification.value = null;
    disconnectSocket();
  }

  return {
    items,
    unreadCount,
    loading,
    error,
    meta,
    preferences,
    latestRealtimeNotification,
    isSocketConnected,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchPreferences,
    updatePreferences,
    handleRealtimeNotification,
    handleRealtimeRead,
    handleRealtimeReadAll,
    initSocket,
    disconnectSocket,
    clear,
  };
});
