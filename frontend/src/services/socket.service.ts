import { io, Socket } from 'socket.io-client'
import { API_BASE_URL } from '@/composables/useApi'
import type { Notification, CourseAnnouncement } from '@/types'

class SocketService {
  private socket: Socket | null = null
  private baseUrl: string

  constructor() {
    // API_BASE_URL: http://localhost:3000/api/v1 -> http://localhost:3000
    this.baseUrl = API_BASE_URL.replace(/\/api\/v1\/?$/, '')
  }

  connect(accessToken?: string): Socket | null {
    const token = accessToken || localStorage.getItem('accessToken')
    if (!token) {
      this.disconnect()
      return null
    }

    if (this.socket && this.socket.connected) {
      return this.socket
    }

    if (this.socket) {
      this.socket.disconnect()
    }

    this.socket = io(this.baseUrl, {
      auth: {
        token: `Bearer ${token}`,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    })

    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners()
      this.socket.disconnect()
      this.socket = null
    }
  }

  onNewNotification(callback: (notification: Notification) => void) {
    if (!this.socket) return () => {}
    this.socket.on('notification:new', callback)
    return () => {
      this.socket?.off('notification:new', callback)
    }
  }

  onNotificationRead(callback: (payload: { id: string }) => void) {
    if (!this.socket) return () => {}
    this.socket.on('notification:read', callback)
    return () => {
      this.socket?.off('notification:read', callback)
    }
  }

  onNotificationReadAll(callback: (payload: { readAt: string }) => void) {
    if (!this.socket) return () => {}
    this.socket.on('notification:read-all', callback)
    return () => {
      this.socket?.off('notification:read-all', callback)
    }
  }

  onAnnouncementPublished(callback: (announcement: Partial<CourseAnnouncement>) => void) {
    if (!this.socket) return () => {}
    this.socket.on('announcement:published', callback)
    return () => {
      this.socket?.off('announcement:published', callback)
    }
  }

  getSocket() {
    return this.socket
  }
}

export const socketService = new SocketService()
