import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useNotificationStore } from '@/stores/notification'
import { NotificationType } from '@/types'

describe('Notification Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('initializes with empty state', () => {
    const store = useNotificationStore()
    expect(store.items).toEqual([])
    expect(store.unreadCount).toBe(0)
    expect(store.loading).toBe(false)
  })

  it('handles realtime new notification and prevents duplicates', () => {
    const store = useNotificationStore()
    const mockNotification = {
      id: 'notif-1',
      type: NotificationType.COURSE_ANNOUNCEMENT,
      title: 'Thông báo kiểm tra',
      message: 'Nội dung thông báo kiểm tra',
      isRead: false,
      createdAt: new Date().toISOString(),
    }

    store.handleRealtimeNotification(mockNotification)
    expect(store.items.length).toBe(1)
    expect(store.unreadCount).toBe(1)
    expect(store.items[0].id).toBe('notif-1')

    // Thêm lại ID trùng lặp -> không tăng count
    store.handleRealtimeNotification(mockNotification)
    expect(store.items.length).toBe(1)
    expect(store.unreadCount).toBe(1)
  })

  it('handles realtime read item', () => {
    const store = useNotificationStore()
    store.items = [
      {
        id: 'notif-1',
        type: NotificationType.WELCOME,
        title: 'Chào mừng',
        message: 'Xin chào',
        isRead: false,
        createdAt: new Date().toISOString(),
      },
    ]
    store.unreadCount = 1

    store.handleRealtimeRead({ id: 'notif-1' })
    expect(store.items[0].isRead).toBe(true)
    expect(store.unreadCount).toBe(0)
  })

  it('handles realtime read all items', () => {
    const store = useNotificationStore()
    store.items = [
      {
        id: 'notif-1',
        type: NotificationType.WELCOME,
        title: 'Chào mừng 1',
        message: '1',
        isRead: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'notif-2',
        type: NotificationType.NEW_LESSON,
        title: 'Bài mới',
        message: '2',
        isRead: false,
        createdAt: new Date().toISOString(),
      },
    ]
    store.unreadCount = 2

    store.handleRealtimeReadAll({ readAt: new Date().toISOString() })
    expect(store.items.every((n) => n.isRead)).toBe(true)
    expect(store.unreadCount).toBe(0)
  })
})
