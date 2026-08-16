<script setup lang="ts">
import type { InstructorEarning } from '@/types/commerce'
import { EarningStatus } from '@/types/commerce'
import { formatMoney, formatDate } from '@/utils/formatters'

defineProps<{
  items: InstructorEarning[]
  loading?: boolean
}>()

function statusBadgeClass(status: EarningStatus) {
  switch (status) {
    case EarningStatus.PENDING:
      return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
    case EarningStatus.AVAILABLE:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
    case EarningStatus.PAID:
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
    case EarningStatus.REVERSED:
      return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
    default:
      return 'bg-slate-100 text-slate-700'
  }
}

function statusLabel(status: EarningStatus) {
  switch (status) {
    case EarningStatus.PENDING:
      return 'Chờ xác nhận'
    case EarningStatus.AVAILABLE:
      return 'Khả dụng'
    case EarningStatus.PAID:
      return 'Đã thanh toán'
    case EarningStatus.REVERSED:
      return 'Đã hủy / Đảo ngược'
    default:
      return status
  }
}
</script>

<template>
  <div class="surface-card overflow-hidden">
    <header class="border-b border-slate-100 p-5 dark:border-slate-800">
      <h3 class="font-extrabold text-slate-900 dark:text-white">Lịch sử thu nhập (Earnings)</h3>
      <p class="mt-0.5 text-xs text-slate-500">Danh sách từng khoản thu nhập theo đơn hàng</p>
    </header>

    <div class="overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead class="bg-slate-50 text-xs uppercase font-bold tracking-wider text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
          <tr>
            <th class="px-5 py-3.5">Khóa học</th>
            <th class="px-5 py-3.5">Ngày tạo</th>
            <th class="px-5 py-3.5 text-center">Trạng thái</th>
            <th class="px-5 py-3.5 text-right">Tổng thực trả</th>
            <th class="px-5 py-3.5 text-right">Phí ({{ items[0]?.platformFeeRate || 20 }}%)</th>
            <th class="px-5 py-3.5 text-right">Thực nhận</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
          <tr v-if="loading">
            <td colspan="6" class="p-8 text-center text-slate-400">Đang tải lịch sử...</td>
          </tr>
          <tr v-else-if="!items.length">
            <td colspan="6" class="p-8 text-center text-slate-400">Chưa có lịch sử thu nhập</td>
          </tr>
          <tr
            v-for="item in items"
            :key="item.id"
            class="hover:bg-slate-50/50 dark:hover:bg-slate-900/30"
          >
            <td class="px-5 py-4 font-bold text-slate-900 dark:text-white max-w-xs truncate">
              {{ item.course?.title || item.courseId }}
            </td>
            <td class="px-5 py-4 text-xs font-mono text-slate-500">
              {{ formatDate(item.createdAt) }}
            </td>
            <td class="px-5 py-4 text-center">
              <span :class="['inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold', statusBadgeClass(item.status)]">
                {{ statusLabel(item.status) }}
              </span>
            </td>
            <td class="px-5 py-4 text-right font-medium">
              {{ formatMoney(item.grossAmount, item.currency) }}
            </td>
            <td class="px-5 py-4 text-right text-xs font-medium text-slate-400">
              -{{ formatMoney(item.platformFeeAmount, item.currency) }}
            </td>
            <td class="px-5 py-4 text-right font-extrabold text-purple-700 dark:text-purple-300">
              {{ formatMoney(item.netAmount, item.currency) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
