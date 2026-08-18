<script setup lang="ts">
import type { CoursePerformanceItem } from '@/types/analytics'
import { useAnalyticsFormatter } from '@/composables/useAnalyticsFormatter'

defineProps<{
  items: CoursePerformanceItem[]
}>()

const { formatPercent, formatMoney } = useAnalyticsFormatter()
</script>

<template>
  <div class="surface-card overflow-hidden">
    <div class="border-b border-slate-100 p-5 sm:p-6 dark:border-slate-800">
      <h3 class="text-lg font-black text-slate-900 dark:text-white">
        Hiệu quả từng khóa học
      </h3>
      <p class="text-xs text-slate-500 dark:text-slate-400">
        So sánh kết quả giữa các khóa học bạn đang giảng dạy
      </p>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead class="bg-slate-50/70 text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:bg-slate-800/40">
          <tr>
            <th class="p-4 pl-6">Khóa học</th>
            <th class="p-4 text-right">Đăng ký</th>
            <th class="p-4 text-right">Đang học</th>
            <th class="p-4 text-right">Tỷ lệ xong</th>
            <th class="p-4 text-right">Quiz TB</th>
            <th class="p-4 text-right">Đánh giá</th>
            <th class="p-4 pr-6 text-right">Doanh thu</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
          <tr
            v-for="course in items"
            :key="course.courseId"
            class="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
          >
            <td class="p-4 pl-6">
              <span class="font-bold text-slate-900 dark:text-white line-clamp-1">
                {{ course.title }}
              </span>
            </td>
            <td class="p-4 text-right font-semibold text-slate-700 dark:text-slate-300">
              {{ course.enrollments }}
            </td>
            <td class="p-4 text-right text-slate-500">
              {{ course.activeStudents }}
            </td>
            <td class="p-4 text-right">
              <span class="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                {{ formatPercent(course.completionRate) }}
              </span>
            </td>
            <td class="p-4 text-right text-slate-700 dark:text-slate-300">
              {{ course.averageQuizScore ? formatPercent(course.averageQuizScore) : '-' }}
            </td>
            <td class="p-4 text-right">
              <span class="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                ⭐ {{ course.averageRating ? course.averageRating.toFixed(1) : '-' }}
              </span>
            </td>
            <td class="p-4 pr-6 text-right font-black text-purple-700 dark:text-purple-300">
              {{ course.revenue?.available ? formatMoney(course.revenue.amount, course.revenue.currency) : 'Chưa có' }}
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="!items.length" class="py-10 text-center text-sm text-slate-400">
        Không có dữ liệu khóa học.
      </div>
    </div>
  </div>
</template>
