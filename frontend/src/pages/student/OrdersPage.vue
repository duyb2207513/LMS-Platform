<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import RefundRequestForm from '@/components/refunds/RefundRequestForm.vue'
import RefundStatusBadge from '@/components/refunds/RefundStatusBadge.vue'
import RefundTimeline from '@/components/refunds/RefundTimeline.vue'
import { useApi } from '@/composables/useApi'
import { useRefundApi } from '@/api/refund.api'
import { RefundRequestStatus, type RefundRequest } from '@/types/commerce'
import type { ApiResponse, Order } from '@/types'
import { formatDate, formatMoney } from '@/utils/formatters'

type Filter = 'ALL' | Order['status'] | 'REFUNDED'
type Section = 'orders' | 'refunds'

const api = useApi()
const refundApi = useRefundApi()
const route = useRoute()
const router = useRouter()
const orders = ref<Order[]>([])
const refunds = ref<RefundRequest[]>([])
const error = ref('')
const filter = ref<Filter>('ALL')
const cancelTarget = ref<Order | null>(null)
const refundOrderTarget = ref<Order | null>(null)
const selectedRefund = ref<RefundRequest | null>(null)
const cancelling = ref(false)
const cancellingRefundId = ref<string | null>(null)

const activeSection = computed<Section>(() => route.query.section === 'refunds' ? 'refunds' : 'orders')
const visibleOrders = computed(() => filter.value === 'ALL' ? orders.value : orders.value.filter((order) => order.status === filter.value))
const paidTotal = computed(() => orders.value.filter((order) => order.status === 'PAID').reduce((sum, order) => sum + order.total, 0))
const money = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)

function setSection(section: Section) {
  void router.replace({ path: '/orders', query: section === 'refunds' ? { section: 'refunds' } : {} })
}

async function loadOrders() {
  try {
    const response = await api.get<ApiResponse<Order[]>>('/orders/me')
    orders.value = response.data || []
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Không tải được đơn hàng.'
  }
}

async function loadRefunds() {
  try {
    const response = await refundApi.getMyRefundRequests()
    refunds.value = response.data || []
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Không tải được yêu cầu hoàn tiền.'
  }
}

async function cancelOrder() {
  if (!cancelTarget.value) return
  cancelling.value = true
  try {
    await api.del(`/orders/${cancelTarget.value.id}`)
    cancelTarget.value = null
    await loadOrders()
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Không thể hủy đơn hàng.'
  } finally {
    cancelling.value = false
  }
}

async function cancelRefund(id: string) {
  cancellingRefundId.value = id
  try {
    await refundApi.cancelRefundRequest(id)
    if (selectedRefund.value?.id === id) selectedRefund.value = null
    await loadRefunds()
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Không thể hủy yêu cầu hoàn tiền.'
  } finally {
    cancellingRefundId.value = null
  }
}

async function handleRefundSubmitted() {
  refundOrderTarget.value = null
  await Promise.all([loadOrders(), loadRefunds()])
  setSection('refunds')
}

onMounted(() => Promise.all([loadOrders(), loadRefunds()]))
</script>

<template>
  <DefaultLayout>
    <main class="app-page navbar-page">
      <div class="flex items-center justify-end">
        <RouterLink to="/courses"><BaseButton class="!rounded-none">Khám phá khóa học</BaseButton></RouterLink>
      </div>

      <nav class="mt-4 flex border-b border-slate-200 dark:border-slate-800" aria-label="Quản lý đơn hàng">
        <button type="button" :class="['border-b-2 px-4 py-2.5 text-xs font-bold transition', activeSection === 'orders' ? 'border-violet-700 text-violet-700' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white']" @click="setSection('orders')">Lịch sử đơn hàng <span class="ml-1 text-[10px]">{{ orders.length }}</span></button>
        <button type="button" :class="['border-b-2 px-4 py-2.5 text-xs font-bold transition', activeSection === 'refunds' ? 'border-violet-700 text-violet-700' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white']" @click="setSection('refunds')">Yêu cầu hoàn tiền <span class="ml-1 text-[10px]">{{ refunds.length }}</span></button>
      </nav>

      <p v-if="error" class="mt-3 border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{{ error }}</p>

      <template v-if="activeSection === 'orders'">
        <section class="mt-4 grid gap-2 sm:grid-cols-3">
          <article class="order-metric"><span>Tổng đơn hàng</span><b>{{ orders.length }}</b></article>
          <article class="order-metric"><span>Đã thanh toán</span><b>{{ orders.filter((order) => order.status === 'PAID').length }}</b></article>
          <article class="order-metric"><span>Tổng chi tiêu</span><b>{{ money(paidTotal) }}</b></article>
        </section>

        <div class="mt-4 inline-flex max-w-full overflow-x-auto border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <button v-for="item in ([['ALL','Tất cả'],['PENDING','Chờ thanh toán'],['PAID','Đã thanh toán'],['REFUNDED','Đã hoàn tiền'],['CANCELLED','Đã hủy']] as const)" :key="item[0]" :class="['whitespace-nowrap px-3 py-2 text-xs font-semibold', filter === item[0] ? 'bg-violet-700 text-white' : 'text-slate-500 hover:text-slate-950 dark:hover:text-white']" @click="filter = item[0]">{{ item[1] }}</button>
        </div>

        <LoadingSpinner v-if="api.loading.value && !orders.length" class="py-16" />
        <section v-if="visibleOrders.length" class="mt-3 space-y-2">
          <article v-for="order in visibleOrders" :key="order.id" class="surface-card overflow-hidden">
            <header class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-3 py-3 dark:border-slate-800 dark:bg-slate-950/20">
              <div><div class="flex items-center gap-3"><b class="text-sm">{{ order.orderNumber }}</b><StatusBadge :status="order.status" /></div><p class="mt-1 text-[11px] text-slate-500">{{ new Date(order.createdAt).toLocaleString('vi-VN') }}</p></div>
              <b class="text-base text-violet-700 dark:text-violet-300">{{ money(order.total) }}</b>
            </header>
            <div class="p-3">
              <div v-for="item in order.items" :key="item.id" class="flex justify-between gap-4 py-1.5 text-xs"><span class="font-medium">{{ item.courseTitleSnapshot }}</span><b>{{ money(item.priceSnapshot) }}</b></div>
              <div class="mt-3 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                <BaseButton v-if="order.status === 'PENDING'" class="!rounded-none" size="sm" variant="ghost" @click="cancelTarget = order">Hủy đơn</BaseButton>
                <RouterLink v-if="order.status === 'PENDING'" :to="`/checkout/${order.id}`"><BaseButton class="!rounded-none" size="sm">Thanh toán ngay</BaseButton></RouterLink>
                <BaseButton v-if="order.status === 'PAID'" class="!rounded-none" size="sm" variant="ghost" @click="refundOrderTarget = order">Hoàn tiền</BaseButton>
                <RouterLink :to="`/payment-result/${order.id}`"><BaseButton class="!rounded-none" size="sm" variant="secondary">Xem chi tiết</BaseButton></RouterLink>
              </div>
            </div>
          </article>
        </section>
        <section v-else-if="!api.loading.value" class="surface-card mt-3 grid min-h-56 place-items-center p-6 text-center"><div><h2 class="text-base font-extrabold">Không có đơn hàng</h2><p class="mt-1 text-xs text-slate-500">Chưa có đơn hàng phù hợp với bộ lọc hiện tại.</p></div></section>
      </template>

      <template v-else>
        <LoadingSpinner v-if="refundApi.loading.value && !refunds.length" class="py-16" />
        <section v-else-if="refunds.length" class="mt-4 space-y-2">
          <article v-for="item in refunds" :key="item.id" class="surface-card overflow-hidden">
            <header class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-3 py-3 dark:border-slate-800 dark:bg-slate-950/20">
              <div><div class="flex items-center gap-3"><span class="font-mono text-[11px] font-bold text-slate-500">{{ item.order?.orderNumber || item.orderId }}</span><RefundStatusBadge :status="item.status" /></div><p class="mt-1 text-[11px] text-slate-400">Tạo ngày {{ formatDate(item.createdAt) }}</p></div>
              <b class="text-base text-violet-700 dark:text-violet-300">{{ formatMoney(item.requestedAmount) }}</b>
            </header>
            <div class="p-3">
              <p class="text-xs text-slate-700 dark:text-slate-300"><b class="text-slate-900 dark:text-white">Lý do: </b>{{ item.reason }}</p>
              <div v-if="item.adminNote" class="mt-3 border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300"><b>Ghi chú từ Admin:</b> {{ item.adminNote }}</div>
              <div class="mt-3 flex justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                <BaseButton v-if="item.status === RefundRequestStatus.PENDING" class="!rounded-none" size="sm" variant="ghost" :loading="cancellingRefundId === item.id" @click="cancelRefund(item.id)">Hủy yêu cầu</BaseButton>
                <BaseButton class="!rounded-none" size="sm" variant="secondary" @click="selectedRefund = item">Xem tiến độ</BaseButton>
              </div>
            </div>
          </article>
        </section>
        <section v-else class="surface-card mt-4 grid min-h-56 place-items-center p-6 text-center"><div><h2 class="text-base font-extrabold">Chưa có yêu cầu hoàn tiền</h2><p class="mt-1 text-xs text-slate-500">Yêu cầu được tạo từ một đơn hàng đã thanh toán.</p><button type="button" class="mt-3 text-xs font-bold text-violet-700" @click="setSection('orders')">Xem đơn hàng</button></div></section>
      </template>
    </main>

    <BaseModal :show="Boolean(cancelTarget)" title="Hủy đơn hàng?" description="Đơn đang chờ thanh toán sẽ không thể tiếp tục sau khi hủy." size="sm" @close="!cancelling && (cancelTarget = null)">
      <p class="text-sm text-slate-600 dark:text-slate-300">Xác nhận hủy đơn <b>{{ cancelTarget?.orderNumber }}</b>?</p>
      <div class="mt-6 flex justify-end gap-3"><BaseButton variant="secondary" :disabled="cancelling" @click="cancelTarget = null">Giữ đơn hàng</BaseButton><BaseButton variant="danger" :loading="cancelling" @click="cancelOrder">Hủy đơn</BaseButton></div>
    </BaseModal>

    <RefundRequestForm :show="Boolean(refundOrderTarget)" :order="refundOrderTarget" @close="refundOrderTarget = null" @submitted="handleRefundSubmitted" />

    <BaseModal :show="Boolean(selectedRefund)" title="Chi tiết tiến độ hoàn tiền" size="md" @close="selectedRefund = null">
      <div v-if="selectedRefund"><RefundTimeline :refund="selectedRefund" /><div class="mt-6 flex justify-end"><BaseButton variant="secondary" @click="selectedRefund = null">Đóng</BaseButton></div></div>
    </BaseModal>
  </DefaultLayout>
</template>

<style scoped>
.order-metric { display:flex; align-items:center; justify-content:space-between; border:1px solid var(--border); background:var(--surface); padding:.8rem 1rem; }
.order-metric span { font-size:.7rem; font-weight:600; color:var(--text-muted); }
.order-metric b { font-size:1rem; }
</style>
