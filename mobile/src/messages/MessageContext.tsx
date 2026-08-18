import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { io, type Socket } from 'socket.io-client';
import { useAuth } from '../auth/AuthContext';
import { ACCESS_TOKEN_KEY, API_URL } from '../api/client';
import { messagesApi } from '../api/services';
import type { AppNotification, MessageConversation } from '../types';

interface MessageContextValue {
  conversations: MessageConversation[];
  unreadCount: number;
  realtimeVersion: number;
  refreshConversations(): Promise<void>;
}

const MessageContext = createContext<MessageContextValue | null>(null);
const socketOrigin = (() => { try { return new URL(API_URL).origin; } catch { return API_URL.replace(/\/api\/v1\/?$/, ''); } })();

export function MessageProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<MessageConversation[]>([]);
  const [realtimeVersion, setRealtimeVersion] = useState(0);
  const refreshConversations = useCallback(async () => {
    if (!user) { setConversations([]); return; }
    try { setConversations((await messagesApi.conversations()).data.data); } catch { /* Keep the latest usable list while offline. */ }
  }, [user]);

  useEffect(() => { void refreshConversations(); }, [refreshConversations]);
  useEffect(() => {
    if (!user) return;
    let socket: Socket | undefined;
    let disposed = false;
    void SecureStore.getItemAsync(ACCESS_TOKEN_KEY).then(token => {
      if (!token || disposed) return;
      socket = io(socketOrigin, { auth: { token: `Bearer ${token}` }, transports: ['websocket', 'polling'], reconnection: true });
      socket.on('notification:new', (notification: AppNotification) => {
        if (notification.type !== 'DIRECT_MESSAGE') return;
        setRealtimeVersion(value => value + 1);
        void refreshConversations();
      });
    });
    return () => { disposed = true; socket?.disconnect(); };
  }, [refreshConversations, user]);

  const unreadCount = useMemo(() => conversations.reduce((total, item) => total + item.unreadCount, 0), [conversations]);
  const value = useMemo(() => ({ conversations, unreadCount, realtimeVersion, refreshConversations }), [conversations, unreadCount, realtimeVersion, refreshConversations]);
  return <MessageContext.Provider value={value}>{children}</MessageContext.Provider>;
}

export function useMessages() {
  const value = useContext(MessageContext);
  if (!value) throw new Error('useMessages must be used inside MessageProvider');
  return value;
}
