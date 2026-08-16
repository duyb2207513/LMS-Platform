<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AdminLayout from '@/layouts/AdminLayout.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import RefundStatusBadge from '@/components/refunds/RefundStatusBadge.vue'
import RefundTimeline from '@/components/refunds/RefundTimeline.vue'
import { useRefundApi } from '@/api/refund.api'
import type { RefundRequest } from '@/types/commerce'
import { RefundRequestStatus } from '@/types/commerce'
import { formatMoney, formatDate } from '@/utils/formatters'

const refundApi = useRefundApi()
const refundRequests = ref<RefundRequest[]>([])
const filterStatus = ref<string>('ALL')

const selectedRequest = ref<RefundRequest | null>(null)
const showApproveModal = ref(false)
const showRejectModal = ref(false)

const adminNote = ref('')
const error = ref('')

async function loadRequests() {
  try {
    const res = await refundApi.getAdminRefundRequests({
      status: filterStatus.value === 'ALL' ? undefined : filterStatus.value,
    })
    refundRequests.value = res.data || []
  } catch (err: any) {
    console.error(err)
  }
}

function openApprove(req: RefundRequest) {
  selectedRequest.value = req
  adminNote.value = 'Đủ điều kiện hoàn tiền trong thời gian quy định.'
  error.value = ''
  showApproveModal.value = true
}

function openReject(req: RefundRequest) {
  selectedRequest.value = req
  adminNote.value = ''
  error.value = ''
  showRejectModal.value = true
}

async function handleApprove() {
  if (!selectedRequest.value) return
  error.value = ''
  try {
    await refundApi.approveRefund(selectedRequest.value.id, adminNote.value)
    showApproveModal.value = false
    selectedRequest.value = null
    await loadRequests()
  } catch (err: any) {
    error.value = err?.message || 'Duyệt hoàn tiền thất bại'
  }
}

async function handleReject() {
  if (!selectedRequest.value) return
  if (!adminNote.value.trim()) {
    error.value = 'Vui lòng cung cấp lý do từ chối'
    return
  }
  error.value = ''
  try {
    await refundApi.rejectRefund(selectedRequest.value.id, adminNote.value.trim())
    showRejectModal.value = false
    selectedRequest.value = null
    await loadRequests()
  } catch (err: any) {
    error.value = err?.message || 'Từ chối hoàn tiền thất bại'
  }
}

onMounted(loadRequests)
</script>

<template>
  <AdminLayout>
    <div class="space-y-6">
      <header class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-black text-slate-900 dark:text-white">Quản lý Yêu cầu Hoàn tiền (Refunds)</h1>
          <p class="text-xs text-slate-500">Xem xét, duyệt hoặc từ chối các yêu cầu hoàn tiền của học viên</p>
        </div>
      </header>

      <!-- Status Filters -->
      <div class="flex items-center gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900">
        <button
          v-for="st in ([
            ['ALL','Tất cả'],
            ['PENDING','Chờ duyệt'],
            ['PROCESSING','Đang xử lý'],
            ['REFUNDED','Đã hoàn tiền'],
            ['REJECTED','Đã từ chối']
          ] as const)"
          :key="st[0]"
          :class="['whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors', filterStatus === st[0] ? 'bg-purple-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800']"
          @click="filterStatus = st[0]; loadRequests()"
        >
          {{ st[1] }}
        </button>
      </div>

      <!-- Requests Table -->
      <div class="surface-card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 text-xs uppercase font-bold tracking-wider text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
              <tr>
                <th class="px-5 py-3.5">Mã đơn / Học viên</th>
                <th class="px-5 py-3.5">Số tiền</th>
                <th class="px-5 py-3.5">Lý do</th>
                <th class="px-5 py-3.5">Ngày yêu cầu</th>
                <th class="px-5 py-3.5 text-center">Trạng thái</th>
                <th class="px-5 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              <tr v-if="refundApi.loading.value">
                <td colspan="6" class="p-8 text-center text-slate-400">Đang tải danh sách yêu cầu hoàn tiền...</td>
              </tr>
              <tr v-else-if="!refundRequests.length">
                <td colspan="6" class="p-8 text-center text-slate-400">Chưa có yêu cầu hoàn tiền phù hợp</td>
              </tr>
              <tr v-for="req in refundRequests" :key="req.id" class="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                <td class="px-5 py-4">
                  <div class="font-bold text-slate-900 dark:text-white">{{ req.user?.name || req.userId }}</div>
                  <div class="text-xs font-mono text-purple-600 dark:text-purple-400">Đơn: {{ req.order?.orderNumber || req.orderId }}</div>
                </td>
                <td class="px-5 py-4 font-black text-slate-900 dark:text-white">
                  {{ formatMoney(req.requestedAmount) }}
                </td>
                <td class="px-5 py-4 text-xs text-slate-600 dark:text-slate-300 max-w-xs truncate">
                  {{ req.reason }}
                </td>
                <td class="px-5 py-4 text-xs font-mono text-slate-500">
                  {{ formatDate(req.createdAt) }}
                </td>
                <td class="px-5 py-4 text-center">
                  <RefundStatusBadge :status="req.status" />
                </td>
                <td class="px-5 py-4 text-right space-x-2">
                  <template v-if="req.status === RefundRequestStatus.PENDING">
                    <BaseButton size="sm" @click="openApprove(req)">Duyệt</BaseButton>
                    <BaseButton size="sm" variant="ghost" class="text-rose-600" @click="openReject(req)">Từ chối</BaseButton>
                  </template>
                  <template v-else>
                    <BaseButton size="sm" variant="secondary" @click="selectedRequest = req">Chi tiết</BaseButton>
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Approve Modal -->
    <BaseModal :show="showApproveModal" title="Xác nhận duyệt hoàn tiền" size="md" @close="showApproveModal = false">
      <div v-if="selectedRequest" class="space-y-4">
        <p class="text-sm text-slate-700 dark:text-slate-300">
          Bạn chuẩn bị duyệt yêu cầu hoàn số tiền <b class="text-purple-600">{{ formatMoney(selectedRequest.requestedAmount) }}</b> cho đơn hàng <b>{{ selectedRequest.order?.orderNumber }}</b>.
        </p>

        <div>
          <label class="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-300">Ghi chú của Admin</label>
          <textarea
            v-model="adminNote"
            rows="3"
            class="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm focus:border-purple-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          ></textarea>
        </div>

        <p v-if="error" class="text-xs font-bold text-rose-600">{{ error }}</p>

        <div class="flex justify-end gap-3 pt-2">
          <BaseButton variant="secondary" @click="showApproveModal = false">Hủy</BaseButton>
          <BaseButton :loading="refundApi.loading.value" @click="handleApprove">Đồng ý hoàn tiền</BaseButton>
        </div>
      </div>
    </BaseModal>

    <!-- Reject Modal -->
    <BaseModal :show="showRejectModal" title="Từ chối yêu cầu hoàn tiền" size="md" @close="showRejectModal = false">
      <div v-if="selectedRequest" class="space-y-4">
        <p class="text-sm text-slate-700 dark:text-slate-300">
          Từ chối hoàn tiền cho đơn <b>{{ selectedRequest.order?.orderNumber }}</b>.
        </p>

        <div>
          <label class="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-300">Lý do từ chối (bắt buộc) *</label>
          <textarea
            v-model="adminNote"
            rows="3"
            placeholder="Yêu cầu đã quá thời hạn 7 ngày từ thời điểm thanh toán..."
            class="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm focus:border-purple-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          ></textarea>
        </div>

        <p v-if="error" class="text-xs font-bold text-rose-600">{{ error }}</p>

        <div class="flex justify-end gap-3 pt-2">
          <BaseButton variant="secondary" @click="showRejectModal = false">Hủy</BaseButton>
          <BaseButton variant="danger" :loading="refundApi.loading.value" @click="handleReject">Xác nhận từ chối</BaseButton>
        </div>
      </div>
    </BaseModal>

    <!-- View Detail Modal -->
    <BaseModal
      :show="Boolean(selectedRequest && !showApproveModal && !showRejectModal)"
      title="Chi tiết yêu cầu hoàn tiền"
      size="md"
      @close="selectedRequest = null"
    >
      <div v-if="selectedRequest" class="space-y-4">
        <RefundTimeline :refund="selectedRequest" />

        <div class="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs dark:border-slate-800 dark:bg-slate-900">
          <p class="font-bold text-slate-700 dark:text-slate-300">Lý do của Student:</p>
          <p class="mt-1 text-slate-600 dark:text-slate-400">{{ selectedRequest.reason }}</p>
          <p v-if="selectedRequest.adminNote" class="mt-3 font-bold text-slate-700 dark:text-slate-300">Ghi chú của Admin:</p>
          <p v-if="selectedRequest.adminNote" class="mt-1 text-slate-600 dark:text-slate-400">{{ selectedRequest.adminNote }}</p>
        </div>

        <div class="flex justify-end">
          <BaseButton variant="secondary" @click="selectedRequest = null">Đóng</BaseButton>
        </div>
      </div>
    </BaseModal>
  </AdminLayout>
</template>
