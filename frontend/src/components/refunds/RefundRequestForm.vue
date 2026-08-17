<script setup lang="ts">
import { computed, ref } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import { useRefundApi } from '@/api/refund.api'
import type { Order } from '@/types'
import { formatMoney } from '@/utils/formatters'

const props = defineProps<{
  show: boolean
  order: Order | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submitted'): void
}>()

const refundApi = useRefundApi()
const reason = ref('')
const error = ref('')

const isOverOneDay = computed(() => {
  if (!props.order) return false
  const purchaseTime = new Date(props.order.createdAt).getTime()
  return Date.now() > purchaseTime + 24 * 60 * 60 * 1000
})

async function handleSubmit() {
  if (!props.order) return
  if (!reason.value.trim()) {
    error.value = 'Vui lòng cung cấp lý do hoàn tiền'
    return
  }

  error.value = ''
  try {
    await refundApi.createRefundRequest(props.order.id, reason.value.trim())
    reason.value = ''
    emit('submitted')
    emit('close')
  } catch (err: unknown) {
    error.value = (err instanceof Error ? err.message : null) || 'Gửi yêu cầu hoàn tiền thất bại'
  }
}
</script>

<template>
  <BaseModal
    :show="show"
    title="Yêu cầu hoàn tiền"
    description="Vui lòng cung cấp lý do chi tiết để chúng tôi xem xét và hỗ trợ hoàn tiền."
    size="md"
    @close="emit('close')"
  >
    <div v-if="order" class="space-y-4">
      <div class="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
        <div class="flex items-center justify-between text-xs font-bold text-slate-500">
          <span>Đơn hàng: {{ order.orderNumber }}</span>
          <span class="font-mono text-purple-600 dark:text-purple-400">{{ formatMoney(order.total) }}</span>
        </div>
        <div class="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
          <p v-for="item in order.items" :key="item.id" class="truncate">
            • {{ item.courseTitleSnapshot }}
          </p>
        </div>
      </div>

      <div class="rounded-xl border border-purple-100 bg-purple-50/70 p-3.5 text-xs text-purple-800 dark:border-purple-900/50 dark:bg-purple-950/30 dark:text-purple-300">
        <p class="font-bold">ℹ️ Chính sách hoàn tiền:</p>
        <p class="mt-1">Yêu cầu hoàn tiền chỉ hợp lệ trong vòng <b>1 ngày (24 giờ)</b> kể từ thời điểm thanh toán mua khóa học.</p>
      </div>

      <div v-if="isOverOneDay" class="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
        <p class="font-bold">⚠️ Thông báo từ chối:</p>
        <p class="mt-1">Đơn hàng này đã được mua hơn 1 ngày (24 giờ). Khi bạn gửi yêu cầu, hệ thống sẽ <b>từ chối ngay lập tức</b> theo điều khoản hoàn tiền.</p>
      </div>

      <div>
        <label class="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
          Lý do hoàn tiền <span class="text-red-500">*</span>
        </label>
        <textarea
          v-model="reason"
          rows="4"
          placeholder="Nội dung khóa học không phù hợp với mục tiêu học tập của tôi..."
          class="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm focus:border-purple-600 focus:outline-none focus:ring-1 focus:ring-purple-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        ></textarea>
      </div>

      <p v-if="error" class="rounded-lg bg-red-50 p-3 text-xs font-medium text-red-600 dark:bg-red-950/30 dark:text-red-300">
        {{ error }}
      </p>

      <div class="flex justify-end gap-3 pt-2">
        <BaseButton variant="secondary" :disabled="refundApi.loading.value" @click="emit('close')">
          Hủy bỏ
        </BaseButton>
        <BaseButton :loading="refundApi.loading.value" @click="handleSubmit">
          Gửi yêu cầu
        </BaseButton>
      </div>
    </div>
  </BaseModal>
</template>
