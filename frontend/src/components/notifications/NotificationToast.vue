<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '@/stores/notification'
import type { Notification } from '@/types'

const notificationStore = useNotificationStore()
const router = useRouter()
const activeToast = ref<Notification | null>(null)
let timer: ReturnType<typeof setTimeout> | null = null

function show(n: Notification) {
  if (timer) clearTimeout(timer)
  activeToast.value = n
  timer = setTimeout(() => {
    activeToast.value = null
  }, 5000)
}

function handleClick() {
  if (!activeToast.value) return
  const item = activeToast.value
  activeToast.value = null
  if (!item.isRead) {
    notificationStore.markAsRead(item.id)
  }
  if (item.data?.url && typeof item.data.url === 'string') {
    if (item.data.url.startsWith('http')) {
      window.open(item.data.url, '_blank')
    } else {
      router.push(item.data.url)
    }
  }
}

watch(
  () => notificationStore.latestRealtimeNotification,
  (newVal) => {
    if (newVal) {
      show(newVal)
    }
  }
)
</script>

<template>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="opacity-0 translate-y-4 sm:translate-y-0 sm:translate-x-4 scale-95"
    enter-to-class="opacity-100 translate-y-0 sm:translate-x-0 scale-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="opacity-100 scale-100"
    leave-to-class="opacity-0 scale-95"
  >
    <aside
      v-if="activeToast"
      class="fixed bottom-4 right-4 z-50 max-w-sm w-full cursor-pointer rounded-2xl border border-purple-200/80 bg-white p-4 shadow-2xl shadow-purple-900/15 backdrop-blur-xl transition-transform hover:scale-[1.02] dark:border-purple-800/80 dark:bg-slate-900"
      role="status"
      aria-live="polite"
      aria-label="Thông báo mới"
      @click="handleClick"
    >
      <div class="flex items-start gap-3">
        <div class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-purple-100 text-lg dark:bg-purple-950/60">
          🔔
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex items-center justify-between gap-1">
            <span class="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              Thông báo mới
            </span>
            <button
              type="button"
              class="grid h-5 w-5 place-items-center rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="Đóng thông báo"
              @click.stop="activeToast = null"
            >
              <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <h4 class="mt-0.5 text-sm font-bold text-slate-900 line-clamp-1 dark:text-white">
            {{ activeToast.title }}
          </h4>
          <p class="mt-1 text-xs text-slate-600 line-clamp-2 dark:text-slate-400">
            {{ activeToast.message }}
          </p>
        </div>
      </div>
    </aside>
  </Transition>
</template>
