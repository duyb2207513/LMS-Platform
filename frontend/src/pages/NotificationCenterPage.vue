<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { CheckCheck, ChevronLeft, ChevronRight, Inbox, Settings } from '@lucide/vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import NotificationItem from '@/components/notifications/NotificationItem.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { useNotificationStore } from '@/stores/notification'

const notificationStore = useNotificationStore()
const currentTab = ref<'all' | 'unread'>('all')
const page = ref(1)
const limit = 15

async function loadNotifications(resetPage = false) {
  if (resetPage) page.value = 1
  await notificationStore.fetchNotifications({
    page: page.value,
    limit,
    isRead: currentTab.value === 'unread' ? false : undefined,
  })
}

async function setTab(tab: 'all' | 'unread') {
  if (currentTab.value === tab) return
  currentTab.value = tab
  await loadNotifications(true)
}

async function handleMarkAll() {
  await notificationStore.markAllAsRead()
  if (currentTab.value === 'unread') await loadNotifications(true)
}

async function changePage(newPage: number) {
  if (newPage < 1 || newPage > notificationStore.meta.totalPages) return
  page.value = newPage
  await loadNotifications()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(async () => {
  await loadNotifications(true)
  await notificationStore.fetchUnreadCount()
})

watch(
  () => notificationStore.unreadCount,
  () => {
    if (currentTab.value === 'unread' && notificationStore.unreadCount === 0 && notificationStore.items.length > 0) loadNotifications(true)
  },
)
</script>

<template>
  <DefaultLayout>
    <main class="w-full px-2 py-6 sm:px-3 lg:px-2">
      <header class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.16em] text-violet-600">Thông báo</p>
          <h1 class="mt-0.5 text-2xl font-extrabold text-slate-950 dark:text-white">Trung tâm thông báo</h1>
          <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Theo dõi những cập nhật quan trọng trong quá trình học.</p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button v-if="notificationStore.unreadCount > 0" type="button" class="inline-flex h-9 items-center gap-1.5 border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition hover:border-violet-300 hover:text-violet-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200" @click="handleMarkAll">
            <CheckCheck :size="16" :stroke-width="2" /> Đánh dấu đã đọc
          </button>
          <RouterLink to="/notifications/settings" class="inline-flex h-9 items-center gap-1.5 border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition hover:border-violet-300 hover:text-violet-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
            <Settings :size="16" :stroke-width="2" /> Cài đặt
          </RouterLink>
        </div>
      </header>

      <div class="mt-5 flex items-end justify-between border-b border-slate-200 dark:border-slate-800">
        <div class="flex gap-5">
          <button type="button" :class="['relative pb-2.5 text-xs font-bold transition-colors', currentTab === 'all' ? 'text-violet-700' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400']" @click="setTab('all')">
            Tất cả
            <span v-if="currentTab === 'all'" class="absolute inset-x-0 bottom-0 h-0.5 bg-violet-600" />
          </button>
          <button type="button" :class="['relative flex items-center gap-1.5 pb-2.5 text-xs font-bold transition-colors', currentTab === 'unread' ? 'text-violet-700' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400']" @click="setTab('unread')">
            Chưa đọc
            <span v-if="notificationStore.unreadCount > 0" class="bg-violet-100 px-1.5 py-0.5 text-[10px] font-black text-violet-700 dark:bg-violet-950 dark:text-violet-300">{{ notificationStore.unreadCount }}</span>
            <span v-if="currentTab === 'unread'" class="absolute inset-x-0 bottom-0 h-0.5 bg-violet-600" />
          </button>
        </div>
        <span class="pb-2.5 text-[11px] text-slate-400">{{ notificationStore.meta.total }} thông báo</span>
      </div>

      <div class="mt-3">
        <div v-if="notificationStore.loading && !notificationStore.items.length" class="py-12 text-center"><LoadingSpinner /></div>

        <div v-else-if="!notificationStore.items.length" class="border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
          <Inbox :size="30" :stroke-width="1.75" class="mx-auto text-violet-600" />
          <h3 class="mt-3 text-sm font-bold text-slate-800 dark:text-slate-200">{{ currentTab === 'unread' ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo nào' }}</h3>
          <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ currentTab === 'unread' ? 'Bạn đã xem tất cả thông báo.' : 'Các cập nhật mới sẽ xuất hiện tại đây.' }}</p>
        </div>

        <div v-else class="divide-y divide-slate-200 border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
          <NotificationItem v-for="item in notificationStore.items" :key="item.id" :notification="item" @read="notificationStore.markAsRead" @delete="notificationStore.deleteNotification" />
        </div>

        <div v-if="notificationStore.meta.totalPages > 1" class="mt-4 flex items-center justify-between border-t border-slate-200 pt-3 dark:border-slate-800">
          <button type="button" :disabled="page <= 1" class="inline-flex h-8 items-center gap-1 border border-slate-200 px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300" @click="changePage(page - 1)"><ChevronLeft :size="15" /> Trang trước</button>
          <span class="text-xs text-slate-500">Trang <b>{{ page }}</b> / {{ notificationStore.meta.totalPages }}</span>
          <button type="button" :disabled="page >= notificationStore.meta.totalPages" class="inline-flex h-8 items-center gap-1 border border-slate-200 px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300" @click="changePage(page + 1)">Trang sau <ChevronRight :size="15" /></button>
        </div>
      </div>
    </main>
  </DefaultLayout>
</template>
