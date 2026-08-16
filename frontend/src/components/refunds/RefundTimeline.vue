<script setup lang="ts">
import { computed } from 'vue'
import { RefundRequestStatus, type RefundRequest } from '@/types/commerce'
import { formatDate } from '@/utils/formatters'

const props = defineProps<{
  refund: RefundRequest
}>()

const steps = computed(() => {
  const isRejected = props.refund.status === RefundRequestStatus.REJECTED
  const isCancelled = props.refund.status === RefundRequestStatus.CANCELLED
  const isFailed = props.refund.status === RefundRequestStatus.FAILED

  return [
    {
      title: 'Gửi yêu cầu',
      desc: 'Student tạo yêu cầu hoàn tiền',
      date: formatDate(props.refund.createdAt),
      status: 'completed',
    },
    {
      title: isRejected ? 'Từ chối' : isCancelled ? 'Hủy bỏ' : 'Duyệt yêu cầu',
      desc: isRejected
        ? (props.refund.adminNote || 'Admin đã từ chối yêu cầu hoàn tiền')
        : isCancelled
        ? 'Student đã hủy yêu cầu này'
        : 'Admin xét duyệt yêu cầu',
      date: props.refund.reviewedAt ? formatDate(props.refund.reviewedAt) : undefined,
      status: isRejected || isCancelled
        ? 'failed'
        : props.refund.status !== RefundRequestStatus.PENDING
        ? 'completed'
        : 'current',
    },
    {
      title: isFailed ? 'Hoàn tiền thất bại' : 'Hoàn tiền thành công',
      desc: isFailed
        ? 'Lỗi xử lý cổng thanh toán sandbox'
        : 'Tiền đã được hoàn lại tài khoản & thu hồi quyền khóa học',
      date: props.refund.status === RefundRequestStatus.REFUNDED ? formatDate(props.refund.updatedAt) : undefined,
      status: props.refund.status === RefundRequestStatus.REFUNDED
        ? 'completed'
        : isFailed
        ? 'failed'
        : props.refund.status === RefundRequestStatus.PROCESSING
        ? 'current'
        : 'pending',
    },
  ]
})
</script>

<template>
  <div class="refund-timeline space-y-6 py-2">
    <div
      v-for="(step, idx) in steps"
      :key="idx"
      class="relative flex gap-4 last:after:hidden after:absolute after:left-[15px] after:top-8 after:h-[calc(100%-8px)] after:w-0.5 after:bg-slate-200 dark:after:bg-slate-700"
    >
      <div
        :class="[
          'grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold text-white z-10 transition-colors',
          step.status === 'completed' ? 'bg-emerald-600' :
          step.status === 'failed' ? 'bg-rose-600' :
          step.status === 'current' ? 'bg-purple-600 ring-4 ring-purple-100 dark:ring-purple-900/50' : 'bg-slate-300 dark:bg-slate-700'
        ]"
      >
        <span v-if="step.status === 'completed'">✓</span>
        <span v-else-if="step.status === 'failed'">✕</span>
        <span v-else>{{ idx + 1 }}</span>
      </div>

      <div class="min-w-0 flex-1 pt-0.5">
        <div class="flex items-center justify-between gap-2">
          <h4 class="text-sm font-bold text-slate-900 dark:text-white">{{ step.title }}</h4>
          <span v-if="step.date" class="text-xs text-slate-400 font-mono">{{ step.date }}</span>
        </div>
        <p class="mt-0.5 text-xs text-slate-600 dark:text-slate-400">{{ step.desc }}</p>
      </div>
    </div>
  </div>
</template>
