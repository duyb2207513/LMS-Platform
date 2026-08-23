<script setup lang="ts">
import { computed } from 'vue'
import type { StudentActivityItem } from '@/types/analytics'
import { useAnalyticsFormatter } from '@/composables/useAnalyticsFormatter'

const props = defineProps<{
  items: StudentActivityItem[]
}>()

const { formatSeconds, formatDate } = useAnalyticsFormatter()

const maxSeconds = computed(() => {
  if (!props.items.length) return 3600
  const max = Math.max(...props.items.map((i) => i.learningSeconds))
  return max > 0 ? max : 3600
})
</script>

<template>
  <div class="surface-card p-5 sm:p-6">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-black text-slate-900 dark:text-white">
          Hoạt động học tập
        </h3>
        <p class="text-xs text-slate-500 dark:text-slate-400">
          Thời gian học thực tế theo từng ngày
        </p>
      </div>
      <span class="bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700 dark:bg-purple-950/50 dark:text-purple-300">
        Phút học / ngày
      </span>
    </div>

    <div v-if="items.length" class="mt-6">
      <div class="flex h-80 min-h-[20rem] items-end gap-2 overflow-x-auto pb-2 pt-8 sm:gap-3">
        <div
          v-for="item in items"
          :key="item.date"
          class="group relative flex flex-1 min-w-[28px] flex-col items-center h-full justify-end"
        >
          <!-- Tooltip -->
          <div class="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-20">
            <div class="bg-slate-900 px-3 py-1.5 text-center text-xs font-bold text-white shadow-xl whitespace-nowrap dark:bg-slate-800">
              <p>{{ formatDate(item.date) }}</p>
              <p class="text-purple-300">{{ formatSeconds(item.learningSeconds) }}</p>
              <p v-if="item.completedLessons > 0" class="text-[10px] font-normal text-slate-300">
                {{ item.completedLessons }} bài học xong
              </p>
            </div>
            <div class="h-1.5 w-1.5 rotate-45 bg-slate-900 dark:bg-slate-800" />
          </div>

          <!-- Bar -->
          <div
            class="w-full max-w-[48px] bg-gradient-to-t from-violet-600 to-purple-500 transition-all duration-300 group-hover:from-violet-500 group-hover:to-purple-400"
            :style="{ height: `${Math.max(8, (item.learningSeconds / maxSeconds) * 100)}%` }"
          />

          <!-- X Label -->
          <span class="mt-2 text-[10px] font-semibold text-slate-400 truncate w-full text-center">
            {{ formatDate(item.date) }}
          </span>
        </div>
      </div>
    </div>

    <div v-else class="py-12 text-center text-sm text-slate-400">
      Chưa có dữ liệu hoạt động trong khoảng thời gian này.
    </div>
  </div>
</template>
