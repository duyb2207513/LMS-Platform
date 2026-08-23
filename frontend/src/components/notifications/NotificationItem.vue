<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  AlarmClock,
  Bell,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  GraduationCap,
  Megaphone,
  MessageCircle,
  PartyPopper,
  Trophy,
  X,
} from '@lucide/vue'
import { NotificationType, type Notification } from '@/types'

const props = defineProps<{ notification: Notification }>()
const emit = defineEmits<{
  read: [id: string]
  delete: [id: string]
  click: [notification: Notification]
}>()
const router = useRouter()

const relativeTime = computed(() => {
  if (!props.notification.createdAt) return ''
  const diffMinutes = Math.floor((Date.now() - new Date(props.notification.createdAt).getTime()) / 60000)
  if (diffMinutes < 1) return 'Vừa xong'
  if (diffMinutes < 60) return `${diffMinutes} phút trước`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} giờ trước`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 30) return `${diffDays} ngày trước`
  return new Date(props.notification.createdAt).toLocaleDateString('vi-VN')
})

const visual = computed(() => {
  switch (props.notification.type) {
    case NotificationType.WELCOME:
      return { tone: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300', icon: PartyPopper }
    case NotificationType.COURSE_ENROLLED:
      return { tone: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300', icon: GraduationCap }
    case NotificationType.COURSE_ANNOUNCEMENT:
      return { tone: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300', icon: Megaphone }
    case NotificationType.ASSIGNMENT_DUE:
      return { tone: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300', icon: AlarmClock }
    case NotificationType.ASSIGNMENT_GRADED:
      return { tone: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300', icon: ClipboardCheck }
    case NotificationType.QUIZ_RESULT:
      return { tone: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300', icon: CheckCircle2 }
    case NotificationType.CERTIFICATE_ISSUED:
      return { tone: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300', icon: Trophy }
    case NotificationType.PAYMENT_SUCCEEDED:
      return { tone: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300', icon: CreditCard }
    case NotificationType.DIRECT_MESSAGE:
      return { tone: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300', icon: MessageCircle }
    case NotificationType.NEW_LESSON:
      return { tone: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300', icon: BookOpen }
    default:
      return { tone: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', icon: Bell }
  }
})

function handleClick() {
  emit('click', props.notification)
  if (!props.notification.isRead) emit('read', props.notification.id)

  const targetUrl = props.notification.data?.url
  if (targetUrl && typeof targetUrl === 'string') {
    if (targetUrl.startsWith('http')) window.open(targetUrl, '_blank', 'noopener,noreferrer')
    else router.push(targetUrl)
  }
}
</script>

<template>
  <div
    :class="[
      'group relative flex min-h-14 cursor-pointer items-center gap-2.5 border-l-2 px-2.5 py-2 transition-colors',
      notification.isRead
        ? 'border-transparent bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/70'
        : 'border-violet-600 bg-violet-50/60 hover:bg-violet-50 dark:bg-violet-950/20',
    ]"
    role="button"
    tabindex="0"
    @click="handleClick"
    @keydown.enter="handleClick"
  >
    <span class="grid h-8 w-8 shrink-0 place-items-center" :class="visual.tone">
      <component :is="visual.icon" :size="17" :stroke-width="2" />
    </span>

    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-2">
        <h4 :class="['min-w-0 flex-1 truncate text-[13px] leading-5 text-slate-900 dark:text-white', notification.isRead ? 'font-semibold' : 'font-bold']">{{ notification.title }}</h4>
        <time class="shrink-0 text-[10px] font-medium text-slate-400">{{ relativeTime }}</time>
      </div>
      <p class="truncate text-[11px] leading-4 text-slate-500 dark:text-slate-400">{{ notification.message }}</p>
    </div>

    <span v-if="!notification.isRead" class="h-1.5 w-1.5 shrink-0 bg-violet-600" title="Chưa đọc" />
    <button type="button" class="grid h-7 w-7 shrink-0 place-items-center text-slate-400 opacity-0 transition group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40" title="Xóa thông báo" aria-label="Xóa thông báo" @click.stop="$emit('delete', notification.id)">
      <X :size="15" :stroke-width="2" />
    </button>
  </div>
</template>
