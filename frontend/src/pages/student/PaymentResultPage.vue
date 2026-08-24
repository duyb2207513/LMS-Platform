<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { useApi } from '@/composables/useApi'
import type { ApiResponse, Order } from '@/types'

const route = useRoute()
const api = useApi()
const order = ref<Order | null>(null)
const error = ref('')
const refreshing = ref(false)
let pollTimer: ReturnType<typeof setInterval> | null = null

const money = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
const state = computed(() => {
  if (order.value?.status === 'PAID') return { title: 'Thanh toán thành công', description: 'Khóa học đã được mở trong tài khoản của bạn.', symbol: '✓', tone: 'success' }
  if (order.value?.status === 'CANCELLED') return { title: 'Giao dịch đã kết thúc', description: 'Đơn hàng đã bị hủy và không còn hiệu lực.', symbol: '×', tone: 'danger' }
  return { title: 'Đang xác nhận giao dịch', description: 'Hệ thống đang chờ tín hiệu từ cổng thanh toán.', symbol: '…', tone: 'pending' }
})

async function load(silent = false) {
  if (!silent) refreshing.value = true
  error.value = ''
  try {
    const response = await api.get<ApiResponse<Order>>(`/orders/${route.params.orderId}`)
    order.value = response.data || null
    if (order.value?.status !== 'PENDING' && pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Không tải được kết quả'
  } finally {
    if (!silent) refreshing.value = false
  }
}

onMounted(async () => {
  await load()
  if (order.value?.status === 'PENDING') pollTimer = setInterval(() => void load(true), 2500)
})
onBeforeUnmount(() => { if (pollTimer) clearInterval(pollTimer) })
</script>

<template>
  <DefaultLayout>
    <main class="result-page">
      <LoadingSpinner v-if="api.loading.value && !order" class="py-20" />
      <section v-else-if="order" class="result-layout">
        <div :class="['result-status', `result-status--${state.tone}`]">
          <span class="result-symbol">{{ state.symbol }}</span>
          <p class="result-eyebrow">KẾT QUẢ GIAO DỊCH</p>
          <h1>{{ state.title }}</h1>
          <p class="result-description">{{ state.description }}</p>
          <span v-if="order.status === 'PENDING'" class="result-live"><i /> Tự động kiểm tra mỗi 2,5 giây</span>
        </div>
        <div class="result-detail">
          <div class="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
            <div><p class="text-xs font-black uppercase tracking-[.14em] text-slate-400">Mã đơn hàng</p><p class="mt-1 font-mono text-lg font-black">{{ order.orderNumber }}</p></div>
            <StatusBadge :status="order.status" />
          </div>
          <dl class="result-facts">
            <div><dt>Thời gian tạo</dt><dd>{{ new Date(order.createdAt).toLocaleString('vi-VN') }}</dd></div>
            <div><dt>Số khóa học</dt><dd>{{ order.items.length }}</dd></div>
            <div><dt>Tổng thanh toán</dt><dd class="text-xl text-purple-700 dark:text-purple-300">{{ money(order.total) }}</dd></div>
          </dl>
          <div class="border-t border-slate-200 pt-5 dark:border-slate-800">
            <p v-if="error" class="mb-4 border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>
            <div class="grid gap-2 sm:grid-cols-2">
              <BaseButton class="!rounded-none" variant="secondary" :loading="refreshing" @click="load()">Kiểm tra lại trạng thái</BaseButton>
              <RouterLink v-if="order.status === 'PAID'" to="/my-courses"><BaseButton class="!rounded-none" :full-width="true">Vào khóa học →</BaseButton></RouterLink>
              <RouterLink v-else-if="order.status === 'PENDING'" :to="`/checkout/${order.id}`"><BaseButton class="!rounded-none" :full-width="true">Quay lại thanh toán</BaseButton></RouterLink>
              <RouterLink v-else to="/courses"><BaseButton class="!rounded-none" :full-width="true">Chọn khóa học khác</BaseButton></RouterLink>
            </div>
          </div>
        </div>
      </section>
    </main>
  </DefaultLayout>
</template>

<style scoped>
.result-page { width:100%; min-height:calc(100vh - 4.5rem); }
.result-layout { display:grid; min-height:calc(100vh - 4.5rem); }
.result-status { display:flex; min-height:22rem; flex-direction:column; justify-content:center; padding:clamp(2rem,7vw,6rem); color:#fff; }
.result-status--success { background:#047857; }
.result-status--danger { background:#b91c1c; }
.result-status--pending { background:#b45309; }
.result-symbol { display:grid; width:4rem; height:4rem; place-items:center; border:2px solid currentColor; font-size:2rem; font-weight:950; }
.result-eyebrow { margin-top:2rem; font-size:.72rem; font-weight:900; letter-spacing:.18em; opacity:.8; }
.result-status h1 { margin-top:.5rem; font-size:clamp(2.25rem,5vw,4.5rem); font-weight:950; letter-spacing:-.05em; line-height:1; }
.result-description { margin-top:1rem; max-width:34rem; opacity:.85; }
.result-live { display:flex; align-items:center; gap:.5rem; margin-top:2rem; font-size:.75rem; font-weight:800; }
.result-live i { width:.55rem; height:.55rem; animation:pulse 1.4s infinite; background:currentColor; }
.result-detail { align-self:center; padding:clamp(1.5rem,5vw,4rem); }
.result-facts { margin-block:1.5rem; border-block:1px solid var(--border); }
.result-facts>div { display:flex; justify-content:space-between; gap:1rem; border-bottom:1px solid var(--border); padding:1rem 0; }
.result-facts>div:last-child { border-bottom:0; }
.result-facts dt { color:var(--text-muted); }
.result-facts dd { text-align:right; font-weight:800; }
@media (min-width:900px) { .result-layout { grid-template-columns:minmax(0,1.15fr) minmax(24rem,.85fr); } }
@keyframes pulse { 50% { opacity:.3; transform:scale(.75); } }
</style>
