<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import RefundRequestForm from '@/components/refunds/RefundRequestForm.vue'
import { useApi } from '@/composables/useApi'
import type { ApiResponse, Order } from '@/types'

type Filter = 'ALL' | Order['status'] | 'REFUNDED'
const api = useApi()
const orders = ref<Order[]>([])
const error = ref('')
const filter = ref<Filter>('ALL')
const cancelTarget = ref<Order | null>(null)
const cancelling = ref(false)
const refundOrderTarget = ref<Order | null>(null)
const money = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
const visibleOrders = computed(() => filter.value === 'ALL' ? orders.value : orders.value.filter((order) => order.status === filter.value))
const paidTotal = computed(() => orders.value.filter((order) => order.status === 'PAID').reduce((sum, order) => sum + order.total, 0))

async function load() {
  try {
    const response = await api.get<ApiResponse<Order[]>>('/orders/me')
    orders.value = response.data || []
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Không tải được đơn hàng'
  }
}

async function cancel() {
  if (!cancelTarget.value) return
  cancelling.value = true
  try {
    await api.del(`/orders/${cancelTarget.value.id}`)
    cancelTarget.value = null
    await load()
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Không thể hủy đơn hàng'
  } finally {
    cancelling.value = false
  }
}

onMounted(load)
</script>

<template>
  <DefaultLayout>
    <main class="app-page max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <header class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="text-sm font-bold uppercase tracking-wider text-purple-600">Giao dịch</p>
          <h1 class="app-page-title mt-2">Lịch sử đơn hàng</h1>
          <p class="app-page-description">Theo dõi trạng thái thanh toán, các khóa học đã mua và yêu cầu hoàn tiền.</p>
        </div>
        <div class="flex items-center gap-3">
          <RouterLink to="/refund-requests">
            <BaseButton variant="secondary">Yêu cầu hoàn tiền của tôi</BaseButton>
          </RouterLink>
          <RouterLink to="/courses">
            <BaseButton>Khám phá khóa học</BaseButton>
          </RouterLink>
        </div>
      </header>

      <section class="mt-8 grid gap-4 sm:grid-cols-3">
        <article class="order-metric"><span>Tổng đơn hàng</span><b>{{ orders.length }}</b></article>
        <article class="order-metric"><span>Đã thanh toán</span><b>{{ orders.filter(order => order.status === 'PAID').length }}</b></article>
        <article class="order-metric"><span>Tổng chi tiêu</span><b>{{ money(paidTotal) }}</b></article>
      </section>

      <div class="mt-8 inline-flex max-w-full overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900">
        <button
          v-for="item in ([['ALL','Tất cả'],['PENDING','Chờ thanh toán'],['PAID','Đã thanh toán'],['REFUNDED','Đã hoàn tiền'],['CANCELLED','Đã hủy']] as const)"
          :key="item[0]"
          :class="['whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-semibold', filter === item[0] ? 'bg-purple-600 text-white' : 'text-slate-500 hover:text-slate-950 dark:hover:text-white']"
          @click="filter = item[0]"
        >
          {{ item[1] }}
        </button>
      </div>

      <LoadingSpinner v-if="api.loading.value && !orders.length" class="py-20"/>
      <p v-if="error" class="mt-5 rounded-2xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{{ error }}</p>

      <section v-if="visibleOrders.length" class="mt-6 space-y-4">
        <article v-for="order in visibleOrders" :key="order.id" class="surface-card overflow-hidden">
          <header class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-4 dark:border-slate-800 dark:bg-slate-950/20">
            <div>
              <div class="flex items-center gap-3">
                <b>{{ order.orderNumber }}</b>
                <StatusBadge :status="order.status"/>
              </div>
              <p class="mt-1 text-xs text-slate-500">{{ new Date(order.createdAt).toLocaleString('vi-VN') }}</p>
            </div>
            <b class="text-lg text-purple-700 dark:text-purple-300">{{ money(order.total) }}</b>
          </header>
          <div class="p-5">
            <div v-for="item in order.items" :key="item.id" class="flex justify-between gap-4 py-2 text-sm">
              <span class="font-medium">{{ item.courseTitleSnapshot }}</span>
              <b>{{ money(item.priceSnapshot) }}</b>
            </div>
            <div class="mt-4 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
              <BaseButton v-if="order.status === 'PENDING'" size="sm" variant="ghost" @click="cancelTarget = order">Hủy đơn</BaseButton>
              <RouterLink v-if="order.status === 'PENDING'" :to="`/checkout/${order.id}`"><BaseButton size="sm">Thanh toán ngay</BaseButton></RouterLink>
              <BaseButton v-if="order.status === 'PAID'" size="sm" variant="ghost" @click="refundOrderTarget = order">Hoàn tiền</BaseButton>
              <RouterLink :to="`/payment-result/${order.id}`"><BaseButton size="sm" variant="secondary">Xem chi tiết</BaseButton></RouterLink>
            </div>
          </div>
        </article>
      </section>

      <section v-else-if="!api.loading.value" class="surface-card mt-6 grid min-h-72 place-items-center p-8 text-center">
        <div>
          <span class="text-4xl">▧</span>
          <h2 class="mt-4 text-xl font-extrabold">Không có đơn hàng</h2>
          <p class="mt-2 text-sm text-slate-500">Chưa có đơn hàng phù hợp với bộ lọc hiện tại.</p>
        </div>
      </section>
    </main>

    <!-- Cancel Order Confirmation Modal -->
    <BaseModal :show="Boolean(cancelTarget)" title="Hủy đơn hàng?" description="Đơn đang chờ thanh toán sẽ không thể tiếp tục sau khi hủy." size="sm" @close="!cancelling && (cancelTarget = null)">
      <p class="text-sm text-slate-600 dark:text-slate-300">Xác nhận hủy đơn <b>{{ cancelTarget?.orderNumber }}</b>?</p>
      <div class="mt-6 flex justify-end gap-3">
        <BaseButton variant="secondary" :disabled="cancelling" @click="cancelTarget = null">Giữ đơn hàng</BaseButton>
        <BaseButton variant="danger" :loading="cancelling" @click="cancel">Hủy đơn</BaseButton>
      </div>
    </BaseModal>

    <!-- Refund Request Modal Form -->
    <RefundRequestForm
      :show="Boolean(refundOrderTarget)"
      :order="refundOrderTarget"
      @close="refundOrderTarget = null"
      @submitted="load"
    />
  </DefaultLayout>
</template>

<style scoped>
.order-metric { display:flex; align-items:center; justify-between:space-between; border:1px solid var(--border); border-radius:1.15rem; background:var(--surface); padding:1.15rem 1.25rem; box-shadow:var(--shadow-sm); }
.order-metric span { font-size:.8rem; font-weight:600; color:var(--text-muted); }
.order-metric b { font-size:1.15rem; }
</style>
