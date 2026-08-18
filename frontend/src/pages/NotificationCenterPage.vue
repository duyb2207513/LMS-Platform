<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import NotificationItem from '@/components/notifications/NotificationItem.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useNotificationStore } from '@/stores/notification'

const notificationStore = useNotificationStore()

// Tab: 'all' | 'unread'
const currentTab = ref<'all' | 'unread'>('all')
const page = ref(1)
const limit = 15

async function loadNotifications(resetPage = false) {
  if (resetPage) {
    page.value = 1
  }
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
  if (currentTab.value === 'unread') {
    await loadNotifications(true)
  }
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
    if (currentTab.value === 'unread' && notificationStore.unreadCount === 0 && notificationStore.items.length > 0) {
      // Refresh list if tab is unread
      loadNotifications(true)
    }
  }
)
</script>

<template>
  <DefaultLayout>
    <main class="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-3xl font-extrabold text-slate-950 dark:text-white">Trung tâm thông báo</h1>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Xem và quản lý tất cả thông báo hoạt động của bạn
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <RouterLink
            to="/notifications/settings"
            class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-purple-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Cài đặt
          </RouterLink>

          <BaseButton
            v-if="notificationStore.unreadCount > 0"
            variant="outline"
            size="sm"
            @click="handleMarkAll"
          >
            Đánh dấu tất cả đã đọc
          </BaseButton>
        </div>
      </div>

      <!-- Filters & Tabs -->
      <div class="mt-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
        <div class="flex gap-4">
          <button
            type="button"
            :class="[
              'relative pb-3 text-sm font-bold transition-colors',
              currentTab === 'all'
                ? 'text-purple-600 dark:text-purple-400'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white',
            ]"
            @click="setTab('all')"
          >
            Tất cả thông báo
            <span
              v-if="currentTab === 'all'"
              class="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 dark:bg-purple-400"
            />
          </button>

          <button
            type="button"
            :class="[
              'relative pb-3 text-sm font-bold transition-colors flex items-center gap-1.5',
              currentTab === 'unread'
                ? 'text-purple-600 dark:text-purple-400'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white',
            ]"
            @click="setTab('unread')"
          >
            Chưa đọc
            <span
              v-if="notificationStore.unreadCount > 0"
              class="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-700 dark:bg-purple-950/60 dark:text-purple-300"
            >
              {{ notificationStore.unreadCount }}
            </span>
            <span
              v-if="currentTab === 'unread'"
              class="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 dark:bg-purple-400"
            />
          </button>
        </div>

        <span class="text-xs text-slate-400">
          Tổng cộng {{ notificationStore.meta.total }} thông báo
        </span>
      </div>

      <!-- Content -->
      <div class="mt-6">
        <div v-if="notificationStore.loading && !notificationStore.items.length" class="py-16 text-center">
          <LoadingSpinner />
        </div>

        <div
          v-else-if="!notificationStore.items.length"
          class="rounded-3xl border border-dashed border-slate-200 bg-white/50 p-12 text-center dark:border-slate-800 dark:bg-slate-900/50"
        >
          <div class="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-purple-50 text-3xl dark:bg-purple-950/40">
            📬
          </div>
          <h3 class="mt-4 text-lg font-bold text-slate-800 dark:text-slate-200">
            {{ currentTab === 'unread' ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo nào' }}
          </h3>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {{ currentTab === 'unread' ? 'Tất cả thông báo đã được bạn xem qua.' : 'Khi có bài học, bài tập mới hoặc thông báo khóa học, chúng sẽ hiển thị ở đây.' }}
          </p>
        </div>

        <div v-else class="space-y-2 rounded-3xl border border-slate-200/80 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <NotificationItem
            v-for="item in notificationStore.items"
            :key="item.id"
            :notification="item"
            @read="notificationStore.markAsRead"
            @delete="notificationStore.deleteNotification"
          />
        </div>

        <!-- Pagination -->
        <div
          v-if="notificationStore.meta.totalPages > 1"
          class="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800"
        >
          <button
            type="button"
            :disabled="page <= 1"
            class="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            @click="changePage(page - 1)"
          >
            ← Trang trước
          </button>

          <span class="text-sm text-slate-500 dark:text-slate-400">
            Trang <b>{{ page }}</b> / {{ notificationStore.meta.totalPages }}
          </span>

          <button
            type="button"
            :disabled="page >= notificationStore.meta.totalPages"
            class="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            @click="changePage(page + 1)"
          >
            Trang sau →
          </button>
        </div>
      </div>
    </main>
  </DefaultLayout>
</template>
