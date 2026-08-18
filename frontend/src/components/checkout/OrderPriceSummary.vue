<script setup lang="ts">
import { formatMoney } from '@/utils/formatters'

defineProps<{
  subtotal: number
  discountAmount?: number
  total: number
  currency?: string
  couponCode?: string
}>()
</script>

<template>
  <div class="space-y-3 text-sm">
    <div class="flex justify-between gap-4">
      <span class="text-slate-500 dark:text-slate-400">Tạm tính</span>
      <span class="font-semibold">{{ formatMoney(subtotal, currency) }}</span>
    </div>

    <div v-if="discountAmount && discountAmount > 0" class="flex justify-between gap-4 text-emerald-600 dark:text-emerald-400">
      <span class="flex items-center gap-1.5 font-medium">
        Giảm giá
        <span v-if="couponCode" class="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
          {{ couponCode }}
        </span>
      </span>
      <span class="font-bold">-{{ formatMoney(discountAmount, currency) }}</span>
    </div>

    <div class="my-4 border-t border-dashed border-slate-200 dark:border-slate-700" />

    <div class="flex items-end justify-between gap-4">
      <span class="font-bold text-slate-900 dark:text-white">Tổng cộng</span>
      <span class="text-3xl font-black text-purple-700 dark:text-purple-300">
        {{ formatMoney(total, currency) }}
      </span>
    </div>
  </div>
</template>
