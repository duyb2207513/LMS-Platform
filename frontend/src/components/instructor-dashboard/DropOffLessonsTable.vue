<script setup lang="ts">
import type { DropOffLessonItem } from '@/types/analytics'
import { useAnalyticsFormatter } from '@/composables/useAnalyticsFormatter'

defineProps<{
  items: DropOffLessonItem[]
}>()

const { formatPercent } = useAnalyticsFormatter()
</script>

<template>
  <div class="surface-card overflow-hidden">
    <div class="border-b border-slate-100 p-5 sm:p-6 dark:border-slate-800">
      <h3 class="text-lg font-black text-slate-900 dark:text-white">
        Bài học có tỷ lệ bỏ dở cao
      </h3>
      <p class="text-xs text-slate-500 dark:text-slate-400">
        Các bài học mà học viên bắt đầu nhưng chưa hoàn thành nhiều nhất
      </p>
    </div>

    <div v-if="items.length" class="divide-y divide-slate-100 dark:divide-slate-800/60">
      <div
        v-for="item in items"
        :key="item.lessonId"
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:px-6 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
      >
        <div class="min-w-0 flex-1">
          <h4 class="truncate font-bold text-slate-900 dark:text-white">
            {{ item.title }}
          </h4>
          <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {{ item.startedStudents }} bắt đầu · {{ item.completedStudents }} hoàn thành · {{ item.dropOffStudents }} bỏ dở
          </p>
        </div>

        <div class="flex items-center gap-3 shrink-0">
          <div class="w-32 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 hidden sm:block">
            <div
              class="h-full rounded-full bg-rose-500"
              :style="{ width: `${item.dropOffRate}%` }"
            />
          </div>
          <span class="rounded-xl bg-rose-50 px-3 py-1 text-xs font-black text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            Bỏ dở {{ formatPercent(item.dropOffRate) }}
          </span>
        </div>
      </div>
    </div>

    <div v-else class="py-10 text-center text-sm text-slate-400">
      Không có bài học nào bị bỏ dở bất thường.
    </div>
  </div>
</template>
