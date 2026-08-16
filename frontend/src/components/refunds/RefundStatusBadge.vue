<script setup lang="ts">
import { computed } from 'vue'
import { RefundRequestStatus } from '@/types/commerce'

const props = defineProps<{
  status: RefundRequestStatus | string
}>()

const badgeConfig = computed(() => {
  switch (props.status) {
    case RefundRequestStatus.PENDING:
      return { label: 'Chờ duyệt', classes: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300' }
    case RefundRequestStatus.APPROVED:
      return { label: 'Đã duyệt', classes: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300' }
    case RefundRequestStatus.PROCESSING:
      return { label: 'Đang xử lý hoàn tiền', classes: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border-sky-300' }
    case RefundRequestStatus.REFUNDED:
      return { label: 'Đã hoàn tiền', classes: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300' }
    case RefundRequestStatus.REJECTED:
      return { label: 'Đã từ chối', classes: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300' }
    case RefundRequestStatus.FAILED:
      return { label: 'Xử lý thất bại', classes: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border-red-300' }
    case RefundRequestStatus.CANCELLED:
      return { label: 'Đã hủy yêu cầu', classes: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300' }
    default:
      return { label: props.status, classes: 'bg-slate-100 text-slate-800 border-slate-300' }
  }
})
</script>

<template>
  <span
    :class="[
      'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold tracking-wide transition-colors',
      badgeConfig.classes
    ]"
  >
    {{ badgeConfig.label }}
  </span>
</template>
