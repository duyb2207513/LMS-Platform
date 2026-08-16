<script setup lang="ts">
import type { Payout } from '@/types/commerce'
import { PayoutStatus } from '@/types/commerce'
import { formatMoney, formatDate } from '@/utils/formatters'

defineProps<{
  items: Payout[]
  loading?: boolean
}>()

function statusBadgeClass(status: PayoutStatus) {
  switch (status) {
    case PayoutStatus.PENDING:
      return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
    case PayoutStatus.PROCESSING:
      return 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300'
    case PayoutStatus.PAID:
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
    case PayoutStatus.FAILED:
      return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
    case PayoutStatus.CANCELLED:
      return 'bg-slate-100 text-slate-700'
    default:
      return 'bg-slate-100 text-slate-700'
  }
}
</script>

<template>
  <div class="surface-card overflow-hidden">
    <header class="border-b border-slate-100 p-5 dark:border-slate-800">
      <h3 class="font-extrabold text-slate-900 dark:text-white">Lịch sử payout</h3>
      <p class="mt-0.5 text-xs text-slate-500">Các đợt rút/giải ngân tiền về tài khoản</p>
    </header>

    <div class="overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead class="bg-slate-50 text-xs uppercase font-bold tracking-wider text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
          <tr>
            <th class="px-5 py-3.5">Mã Payout</th>
            <th class="px-5 py-3.5">Mã tham chiếu (Sandbox)</th>
            <th class="px-5 py-3.5">Thời gian tạo</th>
            <th class="px-5 py-3.5 text-center">Trạng thái</th>
            <th class="px-5 py-3.5 text-right">Số tiền</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
          <tr v-if="loading">
            <td colspan="5" class="p-8 text-center text-slate-400">Đang tải lịch sử payout...</td>
          </tr>
          <tr v-else-if="!items.length">
            <td colspan="5" class="p-8 text-center text-slate-400">Chưa có đợt payout nào</td>
          </tr>
          <tr
            v-for="item in items"
            :key="item.id"
            class="hover:bg-slate-50/50 dark:hover:bg-slate-900/30"
          >
            <td class="px-5 py-4 font-mono font-bold text-slate-900 dark:text-white text-xs">
              {{ item.id.substring(0, 8) }}...
            </td>
            <td class="px-5 py-4 text-xs font-mono text-slate-500">
              {{ item.providerReference || '-' }}
            </td>
            <td class="px-5 py-4 text-xs font-mono text-slate-500">
              {{ formatDate(item.createdAt) }}
            </td>
            <td class="px-5 py-4 text-center">
              <span :class="['inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold', statusBadgeClass(item.status)]">
                {{ item.status }}
              </span>
            </td>
            <td class="px-5 py-4 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
              {{ formatMoney(item.amount, item.currency) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
