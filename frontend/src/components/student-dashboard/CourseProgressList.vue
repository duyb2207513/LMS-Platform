<script setup lang="ts">
import type { StudentCourseProgress } from '@/types/analytics'

defineProps<{
  items: StudentCourseProgress[]
}>()
</script>

<template>
  <div class="surface-card p-5 sm:p-6">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-black text-slate-900 dark:text-white">
          Tiến độ khóa học
        </h3>
        <p class="text-xs text-slate-500 dark:text-slate-400">
          Các khóa học đang diễn ra của bạn
        </p>
      </div>
      <RouterLink to="/my-courses" class="text-xs font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400">
        Tất cả khóa học →
      </RouterLink>
    </div>

    <div v-if="items.length" class="mt-5 divide-y divide-slate-100 dark:divide-slate-800/60">
      <div
        v-for="item in items"
        :key="item.courseId"
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
      >
        <div class="flex items-center gap-3.5 min-w-0 flex-1">
          <img
            v-if="item.thumbnailUrl"
            :src="item.thumbnailUrl"
            :alt="item.title"
            class="h-12 w-16 shrink-0 rounded-xl object-cover"
          />
          <div v-else class="grid h-12 w-16 shrink-0 place-items-center rounded-xl bg-purple-100 font-bold text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
            📚
          </div>

          <div class="min-w-0 flex-1">
            <h4 class="truncate text-sm font-bold text-slate-900 dark:text-white">
              {{ item.title }}
            </h4>
            <div class="mt-1 flex items-center gap-3">
              <div class="h-2 flex-1 max-w-[140px] overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  class="h-full rounded-full bg-gradient-to-r from-violet-600 to-purple-500"
                  :style="{ width: `${item.progressPercent}%` }"
                />
              </div>
              <span class="text-xs font-semibold text-purple-700 dark:text-purple-300">
                {{ item.progressPercent.toFixed(0) }}%
              </span>
            </div>
          </div>
        </div>

        <RouterLink
          :to="item.continueUrl || `/courses/${item.courseId}`"
          class="inline-flex shrink-0 items-center justify-center rounded-xl bg-purple-50 px-3.5 py-2 text-xs font-bold text-purple-700 transition hover:bg-purple-100 dark:bg-purple-950/40 dark:text-purple-300 dark:hover:bg-purple-900/50"
        >
          ▶ Tiếp tục học
        </RouterLink>
      </div>
    </div>

    <div v-else class="py-10 text-center text-sm text-slate-400">
      Bạn chưa đăng ký khóa học nào.
    </div>
  </div>
</template>
