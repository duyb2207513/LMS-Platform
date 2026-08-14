<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import CourseThumbnail from '@/components/course/CourseThumbnail.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { useApi } from '@/composables/useApi'
import type { ApiResponse, Order } from '@/types'

const route = useRoute()
const api = useApi()
const order = ref<Order | null>(null)
const error = ref('')
const paying = ref(false)
const money = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)

async function load() {
  try { const response = await api.get<ApiResponse<Order>>(`/orders/${route.params.orderId}`); order.value = response.data || null }
  catch (cause) { error.value = cause instanceof Error ? cause.message : 'Không tải được đơn hàng' }
}
async function pay() {
  paying.value = true; error.value = ''
  try {
    const response = await api.post<ApiResponse<{ mockPaymentUrl: string }>>(`/orders/${route.params.orderId}/payments/mock`)
    if (response.data?.mockPaymentUrl) window.open(response.data.mockPaymentUrl, '_blank', 'noopener,noreferrer')
  } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Không tạo được phiên thanh toán' }
  finally { paying.value = false }
}
onMounted(load)
</script>

<template>
  <DefaultLayout>
    <main class="app-page max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div class="mb-9 flex items-center justify-center gap-2 text-xs font-bold sm:gap-4"><span class="checkout-step checkout-step--active"><b>1</b> Kiểm tra đơn</span><span class="h-px w-8 bg-slate-200 dark:bg-slate-700 sm:w-16"/><span class="checkout-step"><b>2</b> Thanh toán</span><span class="h-px w-8 bg-slate-200 dark:bg-slate-700 sm:w-16"/><span class="checkout-step"><b>3</b> Hoàn tất</span></div>
      <LoadingSpinner v-if="api.loading.value && !order" class="py-24" />
      <p v-else-if="error && !order" class="surface-card p-5 text-red-700">{{ error }}</p>
      <div v-else-if="order" class="grid gap-7 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section><div class="mb-6"><p class="text-sm font-bold uppercase tracking-wider text-purple-600">Checkout</p><h1 class="app-page-title mt-2">Kiểm tra đơn hàng</h1><p class="app-page-description">Mã đơn {{ order.orderNumber }}</p></div><div class="surface-card overflow-hidden"><header class="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800"><h2 class="font-extrabold">Khóa học đã chọn</h2><StatusBadge :status="order.status" /></header><div class="divide-y divide-slate-100 p-5 dark:divide-slate-800"><article v-for="item in order.items" :key="item.id" class="flex gap-4 py-4 first:pt-0 last:pb-0"><CourseThumbnail :src="item.course?.thumbnailUrl" :alt="item.courseTitleSnapshot" compact class="h-20 w-32 shrink-0"/><div class="min-w-0 flex-1"><h3 class="line-clamp-2 font-bold">{{ item.courseTitleSnapshot }}</h3><p class="mt-1 text-xs text-slate-500">Truy cập trọn đời · Học theo tốc độ cá nhân</p><p class="mt-3 font-extrabold text-purple-700 dark:text-purple-300">{{ money(item.priceSnapshot) }}</p></div></article></div></div><div class="mt-5 flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-300"><span class="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-sky-100 font-black dark:bg-sky-900">i</span><p><b>Thanh toán an toàn.</b><br>Đây là cổng thanh toán mô phỏng phục vụ kiểm thử. Bạn không bị trừ tiền thật.</p></div></section>
        <aside class="surface-card h-fit p-6 lg:sticky lg:top-24"><h2 class="text-xl font-black">Tóm tắt thanh toán</h2><dl class="mt-6 space-y-4 text-sm"><div class="flex justify-between gap-4"><dt class="text-slate-500">Tạm tính</dt><dd class="font-semibold">{{ money(order.subtotal) }}</dd></div><div class="flex justify-between gap-4"><dt class="text-slate-500">Giảm giá</dt><dd class="font-semibold text-emerald-600">{{ money(order.subtotal - order.total) }}</dd></div></dl><div class="my-5 border-t border-dashed border-slate-200 dark:border-slate-700"/><div class="flex items-end justify-between gap-4"><span class="font-bold">Tổng cộng</span><span class="text-3xl font-black text-purple-700 dark:text-purple-300">{{ money(order.total) }}</span></div><p v-if="error" class="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{{ error }}</p><BaseButton class="mt-6" size="lg" :full-width="true" :loading="paying" :disabled="order.status !== 'PENDING'" @click="pay">{{ order.status === 'PENDING' ? 'Tiếp tục thanh toán' : 'Đơn hàng đã xử lý' }} →</BaseButton><RouterLink :to="`/payment-result/${order.id}`" class="mt-4 block text-center text-sm font-bold text-purple-700 dark:text-purple-300">Kiểm tra kết quả thanh toán</RouterLink><div class="mt-6 flex items-center justify-center gap-3 border-t border-slate-100 pt-5 text-xs font-semibold text-slate-400 dark:border-slate-800"><span>🔒 Bảo mật</span><span>•</span><span>Hỗ trợ 24/7</span></div></aside>
      </div>
    </main>
  </DefaultLayout>
</template>

<style scoped>
.checkout-step{display:flex;align-items:center;gap:.4rem;color:var(--text-muted);white-space:nowrap}.checkout-step b{display:grid;width:1.6rem;height:1.6rem;place-items:center;border:1px solid var(--border);border-radius:50%;font-size:.65rem}.checkout-step--active{color:var(--brand)}.checkout-step--active b{border-color:var(--brand);background:var(--brand);color:white}
</style>
