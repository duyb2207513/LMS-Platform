<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '@/stores/notification'
import NotificationItem from './NotificationItem.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'

const emit = defineEmits<{
  close: []
}>()

const router = useRouter()
const notificationStore = useNotificationStore()

// Lấy tối đa 5 thông báo gần nhất cho dropdown
const recentItems = computed(() => notificationStore.items.slice(0, 5))

function navigateToCenter() {
  emit('close')
  router.push('/notifications')
}

function navigateToSettings() {
  emit('close')
  router.push('/notifications/settings')
}

function handleMarkAll() {
  notificationStore.markAllAsRead()
}
</script>

<template>
  <div
    class="w-80 sm:w-96 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-900/15 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-150"
    role="dialog"
    aria-label="Danh sách thông báo"
  >
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
      <div class="flex items-center gap-2">
        <h3 class="font-bold text-slate-900 dark:text-white">Thông báo</h3>
        <span
          v-if="notificationStore.unreadCount > 0"
          class="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-700 dark:bg-purple-950/60 dark:text-purple-300"
        >
          {{ notificationStore.unreadCount }} mới
        </span>
      </div>

      <div class="flex items-center gap-1">
        <button
          v-if="notificationStore.unreadCount > 0"
          type="button"
          class="text-xs font-semibold text-purple-600 hover:text-purple-700 hover:underline dark:text-purple-400 p-1"
          @click="handleMarkAll"
        >
          Đọc tất cả
        </button>
        <button
          type="button"
          class="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          title="Cài đặt thông báo"
          @click="navigateToSettings"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Body -->
    <div class="max-h-96 overflow-y-auto p-2">
      <div v-if="notificationStore.loading && !notificationStore.items.length" class="py-10 text-center">
        <LoadingSpinner />
      </div>

      <div
        v-else-if="!recentItems.length"
        class="py-12 text-center text-slate-500 dark:text-slate-400"
      >
        <div class="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-purple-50 text-2xl dark:bg-purple-950/40">
          ✨
        </div>
        <p class="mt-3 text-sm font-bold text-slate-800 dark:text-slate-200">Không có thông báo</p>
        <p class="mt-1 text-xs">Bạn đã xem hết tất cả thông báo mới.</p>
      </div>

      <div v-else class="space-y-1">
        <NotificationItem
          v-for="item in recentItems"
          :key="item.id"
          :notification="item"
          @read="notificationStore.markAsRead"
          @delete="notificationStore.deleteNotification"
          @click="emit('close')"
        />
      </div>
    </div>

    <!-- Footer -->
    <div class="border-t border-slate-100 bg-slate-50/70 p-2 text-center dark:border-slate-800 dark:bg-slate-850/50">
      <button
        type="button"
        class="w-full rounded-xl py-2 text-xs font-bold text-purple-600 transition-colors hover:bg-purple-50 hover:text-purple-700 dark:text-purple-400 dark:hover:bg-purple-950/30"
        @click="navigateToCenter"
      >
        Xem tất cả thông báo →
      </button>
    </div>
  </div>
</template>
