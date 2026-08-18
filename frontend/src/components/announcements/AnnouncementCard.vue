<script setup lang="ts">
import { computed } from 'vue'
import { AnnouncementStatus, type CourseAnnouncement } from '@/types'
import BaseButton from '@/components/ui/BaseButton.vue'

const props = defineProps<{
  announcement: CourseAnnouncement
  canManage?: boolean
}>()

defineEmits<{
  edit: [announcement: CourseAnnouncement]
  publish: [announcement: CourseAnnouncement]
  delete: [announcement: CourseAnnouncement]
}>()

const formattedDate = computed(() => {
  const dateStr = props.announcement.publishedAt || props.announcement.createdAt
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
})

const isDraft = computed(() => props.announcement.status === AnnouncementStatus.DRAFT)
</script>

<template>
  <article
    :class="[
      'rounded-3xl border p-5 sm:p-6 transition-all duration-200',
      isDraft
        ? 'border-amber-200 bg-amber-50/40 dark:border-amber-900/50 dark:bg-amber-950/20'
        : 'border-slate-200/80 bg-white shadow-sm hover:shadow-md dark:border-slate-800 dark:bg-slate-900',
    ]"
  >
    <!-- Top info -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <div class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-purple-100 text-sm font-extrabold text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
          {{ announcement.author?.fullName ? announcement.author.fullName.charAt(0).toUpperCase() : 'G' }}
        </div>
        <div>
          <p class="text-sm font-bold text-slate-900 dark:text-white">
            {{ announcement.author?.fullName || 'Giảng viên' }}
          </p>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            {{ isDraft ? 'Bản nháp (chưa đăng)' : `Đã đăng lúc ${formattedDate}` }}
          </p>
        </div>
      </div>

      <!-- Badge status for instructors -->
      <div class="flex items-center gap-2">
        <span
          v-if="isDraft"
          class="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
        >
          Bản nháp
        </span>
        <span
          v-else
          class="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
        >
          Đã phát hành
        </span>
      </div>
    </div>

    <!-- Title & Content -->
    <div class="mt-4">
      <h3 class="text-lg font-bold text-slate-900 dark:text-white">
        {{ announcement.title }}
      </h3>
      <p class="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-line">
        {{ announcement.content }}
      </p>
    </div>

    <!-- Instructor actions -->
    <div
      v-if="canManage"
      class="mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800"
    >
      <BaseButton
        v-if="isDraft"
        size="sm"
        variant="primary"
        @click="$emit('publish', announcement)"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
        Đăng ngay
      </BaseButton>

      <BaseButton
        v-if="isDraft"
        size="sm"
        variant="outline"
        @click="$emit('edit', announcement)"
      >
        Chỉnh sửa
      </BaseButton>

      <BaseButton
        size="sm"
        variant="ghost"
        class="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/30"
        @click="$emit('delete', announcement)"
      >
        Xóa
      </BaseButton>
    </div>
  </article>
</template>
