<script setup lang="ts">
import type { CourseRevenue } from '@/types/commerce'
import { formatMoney } from '@/utils/formatters'

defineProps<{
  items: CourseRevenue[]
  loading?: boolean
}>()
</script>

<template>
  <div class="surface-card overflow-hidden">
    <header class="border-b border-slate-100 p-5 dark:border-slate-800">
      <h3 class="font-extrabold text-slate-900 dark:text-white">Doanh thu theo khóa học</h3>
      <p class="mt-0.5 text-xs text-slate-500">Thống kê chi tiết doanh thu gộp, phí và thực nhận từng khóa học</p>
    </header>

    <div class="overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead class="bg-slate-50 text-xs uppercase font-bold tracking-wider text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
          <tr>
            <th class="px-5 py-3.5">Khóa học</th>
            <th class="px-5 py-3.5 text-center">Đơn thành công</th>
            <th class="px-5 py-3.5 text-center">Đơn hoàn tiền</th>
            <th class="px-5 py-3.5 text-right">Doanh thu gộp</th>
            <th class="px-5 py-3.5 text-right">Phí nền tảng</th>
            <th class="px-5 py-3.5 text-right">Thực nhận</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
          <tr v-if="loading">
            <td colspan="6" class="p-8 text-center text-slate-400">Đang tải dữ liệu...</td>
          </tr>
          <tr v-else-if="!items.length">
            <td colspan="6" class="p-8 text-center text-slate-400">Chưa có dữ liệu doanh thu theo khóa học</td>
          </tr>
          <tr
            v-for="item in items"
            :key="item.courseId"
            class="hover:bg-slate-50/50 dark:hover:bg-slate-900/30"
          >
            <td class="px-5 py-4 font-bold text-slate-900 dark:text-white max-w-xs truncate">
              {{ item.title }}
            </td>
            <td class="px-5 py-4 text-center font-semibold text-slate-700 dark:text-slate-300">
              {{ item.successfulOrders }}
            </td>
            <td class="px-5 py-4 text-center font-semibold text-rose-600 dark:text-rose-400">
              {{ item.refundCount }}
            </td>
            <td class="px-5 py-4 text-right font-medium">
              {{ formatMoney(item.grossRevenue, item.currency) }}
            </td>
            <td class="px-5 py-4 text-right font-medium text-slate-500">
              {{ formatMoney(item.platformFees, item.currency) }}
            </td>
            <td class="px-5 py-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
              {{ formatMoney(item.netRevenue, item.currency) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
