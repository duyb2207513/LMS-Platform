<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useNotificationStore } from '@/stores/notification'
import NotificationBadge from './NotificationBadge.vue'
import NotificationDropdown from './NotificationDropdown.vue'

const notificationStore = useNotificationStore()
const isOpen = ref(false)
const bellRef = ref<HTMLElement | null>(null)

function toggle() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    notificationStore.fetchNotifications({ page: 1, limit: 10 })
  }
}

function handleClickOutside(event: MouseEvent) {
  if (bellRef.value && !bellRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div ref="bellRef" class="relative">
    <button
      type="button"
      class="relative grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-purple-200 hover:bg-purple-50 hover:text-purple-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-purple-800 dark:hover:bg-purple-950/30"
      :aria-expanded="isOpen"
      aria-haspopup="true"
      aria-label="Thông báo"
      @click="toggle"
    >
      <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>

      <!-- Unread Badge -->
      <span class="absolute -top-1 -right-1">
        <NotificationBadge :count="notificationStore.unreadCount" />
      </span>
    </button>

    <!-- Dropdown menu -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-1 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-1 scale-95"
    >
      <div v-if="isOpen" class="absolute right-0 mt-2 z-50">
        <NotificationDropdown @close="isOpen = false" />
      </div>
    </Transition>
  </div>
</template>
