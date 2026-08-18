<script setup lang="ts">
import { computed } from 'vue'
import type { EnrollmentTrendItem } from '@/types/analytics'
import { useAnalyticsFormatter } from '@/composables/useAnalyticsFormatter'

const props = defineProps<{
  items: EnrollmentTrendItem[]
}>()

const { formatDate } = useAnalyticsFormatter()

const maxCount = computed(() => {
  if (!props.items.length) return 10
  const max = Math.max(...props.items.map((i) => i.count))
  return max > 0 ? max : 10
})
</script>

<template>
  <div class="surface-card p-5 sm:p-6">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-black text-slate-900 dark:text-white">
          Lượt đăng ký học viên
        </h3>
        <p class="text-xs text-slate-500 dark:text-slate-400">
          Số lượng học viên ghi danh mới theo thời gian
        </p>
      </div>
      <span class="rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700 dark:bg-sky-950/50 dark:text-sky-300">
        Học viên mới / ngày
      </span>
    </div>

    <div v-if="items.length" class="mt-6">
      <div class="flex h-48 items-end gap-2 sm:gap-3 overflow-x-auto pb-2 pt-6">
        <div
          v-for="item in items"
          :key="item.date"
          class="group relative flex flex-1 min-w-[28px] flex-col items-center h-full justify-end"
        >
          <!-- Tooltip -->
          <div class="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-20">
            <div class="rounded-xl bg-slate-900 px-3 py-1.5 text-center text-xs font-bold text-white shadow-xl whitespace-nowrap dark:bg-slate-800">
              <p>{{ formatDate(item.date) }}</p>
              <p class="text-sky-300">{{ item.count }} ghi danh mới</p>
            </div>
            <div class="h-1.5 w-1.5 rotate-45 bg-slate-900 dark:bg-slate-800" />
          </div>

          <!-- Bar -->
          <div
            class="w-full max-w-[36px] rounded-t-xl bg-gradient-to-t from-sky-600 to-indigo-500 transition-all duration-300 group-hover:from-sky-500 group-hover:to-indigo-400"
            :style="{ height: `${Math.max(8, (item.count / maxCount) * 100)}%` }"
          />

          <!-- X Label -->
          <span class="mt-2 text-[10px] font-semibold text-slate-400 truncate w-full text-center">
            {{ formatDate(item.date) }}
          </span>
        </div>
      </div>
    </div>

    <div v-else class="py-12 text-center text-sm text-slate-400">
      Chưa có lượt đăng ký nào trong khoảng thời gian này.
    </div>
  </div>
</template>
