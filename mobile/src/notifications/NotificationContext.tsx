import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import * as Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { io, type Socket } from 'socket.io-client';
import { useAuth } from '../auth/AuthContext';
import { ACCESS_TOKEN_KEY, API_URL } from '../api/client';
import { notificationsApi } from '../api/services';
import type { AppNotification, NotificationType } from '../types';
import { savePushDevice } from './pushDevice';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldPlaySound: true, shouldSetBadge: true, shouldShowBanner: true, shouldShowList: true }),
});

type OpenRequest = { id: number; type: NotificationType | string; data: Record<string, unknown> };
interface NotificationContextValue {
  unreadCount: number;
  openRequest: OpenRequest | null;
  refreshUnread(): Promise<void>;
  consumeOpenRequest(): void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);
const socketOrigin = (() => { try { return new URL(API_URL).origin; } catch { return API_URL.replace(/\/api\/v1\/?$/, ''); } })();

function requestFromNotification(notification: Notifications.Notification): OpenRequest {
  const data = notification.request.content.data as Record<string, unknown>;
  return { id: Date.now(), type: typeof data.notificationType === 'string' ? data.notificationType : 'WELCOME', data };
}

async function registerNativeDevice() {
  if (!Device.isDevice) return;
  if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('lms-updates', { name: 'LMS updates', importance: Notifications.AndroidImportance.HIGH, vibrationPattern: [0, 200, 150, 200], lightColor: '#6D28D9' });
  const existing = await Notifications.getPermissionsAsync();
  const permission = existing.status === 'granted' ? existing : await Notifications.requestPermissionsAsync();
  if (permission.status !== 'granted') return;
  const projectId = Constants.default.expoConfig?.extra?.eas?.projectId ?? Constants.default.easConfig?.projectId ?? process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
  if (!projectId) return;
  const expoPushToken = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  const response = await notificationsApi.registerDevice({ expoPushToken, platform: Platform.OS as 'ios' | 'android', deviceName: Device.deviceName ?? undefined });
  await savePushDevice(response.data.data.id, expoPushToken);
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [openRequest, setOpenRequest] = useState<OpenRequest | null>(null);
  const refreshUnread = useCallback(async () => {
    if (!user) { setUnreadCount(0); return; }
    try { setUnreadCount((await notificationsApi.unreadCount()).data.data.unreadCount); } catch { /* Keep the last badge while offline. */ }
  }, [user]);

  useEffect(() => { void refreshUnread(); if (user) void registerNativeDevice().catch(() => undefined); }, [refreshUnread, user]);
  useEffect(() => { void Notifications.setBadgeCountAsync(unreadCount).catch(() => undefined); }, [unreadCount]);
  useEffect(() => {
    if (!user) return;
    let socket: Socket | undefined, disposed = false;
    void SecureStore.getItemAsync(ACCESS_TOKEN_KEY).then(token => {
      if (!token || disposed) return;
      socket = io(socketOrigin, { auth: { token: `Bearer ${token}` }, transports: ['websocket', 'polling'], reconnection: true });
      socket.on('notification:new', (_notification: AppNotification) => setUnreadCount(value => value + 1));
      socket.on('notification:read', () => void refreshUnread());
      socket.on('notification:read-all', () => setUnreadCount(0));
    });
    return () => { disposed = true; socket?.disconnect(); };
  }, [refreshUnread, user]);
  useEffect(() => {
    void Notifications.getLastNotificationResponseAsync().then(response => { if (response?.notification) setOpenRequest(requestFromNotification(response.notification)); });
    const received = Notifications.addNotificationReceivedListener(() => { void notificationsApi.unreadCount().then(result => setUnreadCount(result.data.data.unreadCount)).catch(() => undefined); });
    const tapped = Notifications.addNotificationResponseReceivedListener(response => setOpenRequest(requestFromNotification(response.notification)));
    return () => { received.remove(); tapped.remove(); };
  }, []);

  const consumeOpenRequest = useCallback(() => setOpenRequest(null), []);
  const value = useMemo(() => ({ unreadCount, openRequest, refreshUnread, consumeOpenRequest }), [consumeOpenRequest, openRequest, refreshUnread, unreadCount]);
  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const value = useContext(NotificationContext);
  if (!value) throw new Error('useNotifications must be used inside NotificationProvider');
  return value;
}
