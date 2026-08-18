<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { NotificationType, type Notification } from '@/types'

const props = defineProps<{
  notification: Notification
}>()

const emit = defineEmits<{
  read: [id: string]
  delete: [id: string]
  click: [notification: Notification]
}>()

const router = useRouter()

// Relative time formatter
const relativeTime = computed(() => {
  if (!props.notification.createdAt) return ''
  const now = new Date().getTime()
  const created = new Date(props.notification.createdAt).getTime()
  const diffMinutes = Math.floor((now - created) / (1000 * 60))

  if (diffMinutes < 1) return 'Vừa xong'
  if (diffMinutes < 60) return `${diffMinutes} phút trước`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} giờ trước`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 30) return `${diffDays} ngày trước`
  return new Date(props.notification.createdAt).toLocaleDateString('vi-VN')
})

// Icon & Color based on NotificationType
const visual = computed(() => {
  switch (props.notification.type) {
    case NotificationType.WELCOME:
      return {
        bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        icon: '🎉',
      }
    case NotificationType.COURSE_ENROLLED:
      return {
        bg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
        icon: '🎓',
      }
    case NotificationType.COURSE_ANNOUNCEMENT:
      return {
        bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
        icon: '📢',
      }
    case NotificationType.ASSIGNMENT_DUE:
      return {
        bg: 'bg-red-500/10 text-red-600 dark:text-red-400',
        icon: '⏰',
      }
    case NotificationType.QUIZ_RESULT:
      return {
        bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
        icon: '📝',
      }
    case NotificationType.CERTIFICATE_ISSUED:
      return {
        bg: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
        icon: '🏆',
      }
    case NotificationType.NEW_LESSON:
    default:
      return {
        bg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
        icon: '🔔',
      }
  }
})

function handleClick() {
  emit('click', props.notification)
  if (!props.notification.isRead) {
    emit('read', props.notification.id)
  }

  // Safe navigation based on data.url
  const targetUrl = props.notification.data?.url
  if (targetUrl && typeof targetUrl === 'string') {
    if (targetUrl.startsWith('http')) {
      window.open(targetUrl, '_blank')
    } else {
      router.push(targetUrl)
    }
  }
}
</script>

<template>
  <div
    :class="[
      'group relative flex items-start gap-3.5 rounded-2xl p-3.5 transition-all duration-200 cursor-pointer',
      notification.isRead
        ? 'bg-transparent hover:bg-slate-50 dark:hover:bg-slate-850/50'
        : 'bg-purple-50/60 hover:bg-purple-50 dark:bg-purple-950/20 dark:hover:bg-purple-950/30 font-medium',
    ]"
    role="button"
    tabindex="0"
    @click="handleClick"
    @keydown.enter="handleClick"
  >
    <!-- Icon / Visual badge -->
    <div
      :class="[
        'grid h-10 w-10 shrink-0 place-items-center rounded-xl text-lg shadow-sm transition-transform duration-200 group-hover:scale-105',
        visual.bg,
      ]"
    >
      {{ visual.icon }}
    </div>

    <!-- Content -->
    <div class="min-w-0 flex-1">
      <div class="flex items-start justify-between gap-2">
        <h4
          :class="[
            'text-sm leading-snug line-clamp-1',
            notification.isRead
              ? 'text-slate-800 dark:text-slate-200 font-semibold'
              : 'text-slate-950 dark:text-white font-bold',
          ]"
        >
          {{ notification.title }}
        </h4>
        <span class="shrink-0 text-[11px] font-medium text-slate-400 dark:text-slate-500">
          {{ relativeTime }}
        </span>
      </div>

      <p class="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400 line-clamp-2">
        {{ notification.message }}
      </p>
    </div>

    <!-- Unread dot & Action buttons -->
    <div class="flex shrink-0 items-center gap-1 self-center" @click.stop>
      <span
        v-if="!notification.isRead"
        class="h-2 w-2 rounded-full bg-purple-600 ring-4 ring-purple-200 dark:ring-purple-900/50"
        title="Chưa đọc"
      />
      <button
        type="button"
        class="opacity-0 group-hover:opacity-100 transition-opacity duration-150 grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-200/60 hover:text-red-600 dark:hover:bg-slate-700/60 dark:hover:text-red-400"
        title="Xóa thông báo"
        @click.stop="$emit('delete', notification.id)"
      >
        <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>
</template>
