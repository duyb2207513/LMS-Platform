<script setup lang="ts">
import { onMounted, ref } from 'vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import RefundStatusBadge from '@/components/refunds/RefundStatusBadge.vue'
import RefundTimeline from '@/components/refunds/RefundTimeline.vue'
import { useRefundApi } from '@/api/refund.api'
import type { RefundRequest } from '@/types/commerce'
import { RefundRequestStatus } from '@/types/commerce'
import { formatMoney, formatDate } from '@/utils/formatters'

const refundApi = useRefundApi()
const requests = ref<RefundRequest[]>([])
const selectedRefund = ref<RefundRequest | null>(null)
const cancellingId = ref<string | null>(null)
const error = ref('')

async function loadRequests() {
  try {
    const res = await refundApi.getMyRefundRequests()
    requests.value = res.data || []
  } catch (err: unknown) {
    error.value = (err instanceof Error ? err.message : null) || 'Không tải được danh sách hoàn tiền'
  }
}

async function cancelRequest(id: string) {
  cancellingId.value = id
  try {
    await refundApi.cancelRefundRequest(id)
    await loadRequests()
    if (selectedRefund.value?.id === id) {
      selectedRefund.value = null
    }
  } catch (err: unknown) {
    error.value = (err instanceof Error ? err.message : null) || 'Hủy yêu cầu hoàn tiền thất bại'
  } finally {
    cancellingId.value = null
  }
}

onMounted(loadRequests)
</script>

<template>
  <DefaultLayout>
    <main class="app-page navbar-page">
      <header class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="text-sm font-bold uppercase tracking-wider text-purple-600">Hoàn tiền</p>
          <h1 class="app-page-title mt-2">Yêu cầu hoàn tiền của tôi</h1>
          <p class="app-page-description">Theo dõi trạng thái và tiến độ xử lý hoàn tiền khóa học.</p>
        </div>
        <RouterLink to="/orders">
          <BaseButton variant="secondary">Lịch sử đơn hàng</BaseButton>
        </RouterLink>
      </header>

      <LoadingSpinner v-if="refundApi.loading.value && !requests.length" class="py-20" />
      <p v-else-if="error" class="mt-4 border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{{ error }}</p>

      <section v-else-if="requests.length" class="mt-4 space-y-2">
        <article
          v-for="item in requests"
          :key="item.id"
          class="surface-card overflow-hidden transition-all hover:border-purple-200 dark:hover:border-purple-900"
        >
          <header class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-3 py-3 dark:border-slate-800 dark:bg-slate-950/20">
            <div>
              <div class="flex items-center gap-3">
                <span class="font-mono text-xs font-bold text-slate-500">Mã đơn: {{ item.order?.orderNumber || item.orderId }}</span>
                <RefundStatusBadge :status="item.status" />
              </div>
              <p class="mt-1 text-xs text-slate-400">Tạo ngày {{ formatDate(item.createdAt) }}</p>
            </div>
            <b class="text-lg text-purple-700 dark:text-purple-300">
              {{ formatMoney(item.requestedAmount) }}
            </b>
          </header>

          <div class="p-3">
            <div class="mb-4 text-sm text-slate-700 dark:text-slate-300">
              <span class="font-bold text-slate-900 dark:text-white">Lý do: </span>
              <span>{{ item.reason }}</span>
            </div>

            <div v-if="item.adminNote" class="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
              <p class="font-bold">Ghi chú từ Admin:</p>
              <p class="mt-0.5">{{ item.adminNote }}</p>
            </div>

            <div class="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
              <BaseButton
                v-if="item.status === RefundRequestStatus.PENDING"
                size="sm"
                variant="ghost"
                :loading="cancellingId === item.id"
                @click="cancelRequest(item.id)"
              >
                Hủy yêu cầu
              </BaseButton>
              <BaseButton size="sm" variant="secondary" @click="selectedRefund = item">
                Xem tiến độ
              </BaseButton>
            </div>
          </div>
        </article>
      </section>

      <section v-else class="surface-card mt-8 grid min-h-72 place-items-center p-8 text-center">
        <div>
          <span class="text-4xl">↩</span>
          <h2 class="mt-4 text-xl font-extrabold">Chưa có yêu cầu hoàn tiền</h2>
          <p class="mt-2 text-sm text-slate-500">Bạn chưa gửi yêu cầu hoàn tiền nào.</p>
        </div>
      </section>
    </main>

    <!-- Detail Timeline Modal -->
    <BaseModal
      :show="Boolean(selectedRefund)"
      title="Chi tiết tiến độ hoàn tiền"
      size="md"
      @close="selectedRefund = null"
    >
      <div v-if="selectedRefund">
        <RefundTimeline :refund="selectedRefund" />
        <div class="mt-6 flex justify-end">
          <BaseButton variant="secondary" @click="selectedRefund = null">Đóng</BaseButton>
        </div>
      </div>
    </BaseModal>
  </DefaultLayout>
</template>
