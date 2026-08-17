<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import CourseThumbnail from '@/components/course/CourseThumbnail.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import CouponInput from '@/components/checkout/CouponInput.vue'
import OrderPriceSummary from '@/components/checkout/OrderPriceSummary.vue'
import { useApi } from '@/composables/useApi'
import type { ApiResponse, Order } from '@/types'
import type { CouponValidationResult } from '@/types/commerce'

const route = useRoute()
const router = useRouter()
const api = useApi()
const order = ref<Order | null>(null)
const error = ref('')
const paying = ref(false)
const appliedCoupon = ref<CouponValidationResult | null>(null)
const appliedCouponCode = ref<string>('')
const selectedPaymentMethod = ref<'MOMO' | 'MOCK'>('MOMO')

async function load() {
  error.value = ''
  try {
    const response = await api.get<ApiResponse<Order>>(`/orders/${route.params.orderId}`)
    order.value = response.data || null
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Không tải được đơn hàng'
  }
}

function handleCouponApplied(result: CouponValidationResult) {
  appliedCoupon.value = result
  if (result.coupon?.code) {
    appliedCouponCode.value = result.coupon.code
  }
}

function handleCouponRemoved() {
  appliedCoupon.value = null
  appliedCouponCode.value = ''
}

async function pay() {
  if (order.value?.status !== 'PENDING') {
    await router.push(`/payment-result/${route.params.orderId}`)
    return
  }
  paying.value = true
  error.value = ''
  try {
    const body: Record<string, unknown> = {}
    if (appliedCouponCode.value) {
      body.couponCode = appliedCouponCode.value
    }
    const response = await api.post<ApiResponse<{ mockPaymentUrl: string }>>(`/orders/${route.params.orderId}/payments/mock`, body)
    if (response.data?.mockPaymentUrl) {
      const targetUrl = selectedPaymentMethod.value === 'MOMO'
        ? `${response.data.mockPaymentUrl}&method=MOMO`
        : response.data.mockPaymentUrl
      window.open(targetUrl, '_blank', 'noopener,noreferrer')
    }
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Không tạo được phiên thanh toán'
    if ((cause as Error & { status?: number })?.status === 409) {
      await load()
    }
  } finally {
    paying.value = false
  }
}

onMounted(() => { void load(); window.addEventListener('focus', load) })
onBeforeUnmount(() => window.removeEventListener('focus', load))
</script>

<template>
  <DefaultLayout>
    <main class="app-page max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div class="mb-9 flex items-center justify-center gap-2 text-xs font-bold sm:gap-4">
        <span class="checkout-step checkout-step--active"><b>1</b> Kiểm tra đơn</span>
        <span class="h-px w-8 bg-slate-200 dark:bg-slate-700 sm:w-16" />
        <span class="checkout-step"><b>2</b> Thanh toán</span>
        <span class="h-px w-8 bg-slate-200 dark:bg-slate-700 sm:w-16" />
        <span class="checkout-step"><b>3</b> Hoàn tất</span>
      </div>

      <LoadingSpinner v-if="api.loading.value && !order" class="py-24" />
      <p v-else-if="error && !order" class="surface-card p-5 text-red-700">{{ error }}</p>

      <div v-else-if="order" class="grid gap-7 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section class="space-y-6">
          <div>
            <p class="text-sm font-bold uppercase tracking-wider text-purple-600">Checkout</p>
            <h1 class="app-page-title mt-2">Kiểm tra đơn hàng</h1>
            <p class="app-page-description">Mã đơn {{ order.orderNumber }}</p>
          </div>

          <div class="surface-card overflow-hidden">
            <header class="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
              <h2 class="font-extrabold">Khóa học đã chọn</h2>
              <StatusBadge :status="order.status" />
            </header>

            <div class="divide-y divide-slate-100 p-5 dark:divide-slate-800">
              <article v-for="item in order.items" :key="item.id" class="grid min-w-0 gap-4 overflow-hidden py-4 first:pt-0 last:pb-0 sm:grid-cols-[8rem_minmax(0,1fr)]">
                <CourseThumbnail :src="item.course?.thumbnailUrl" :alt="item.courseTitleSnapshot" compact class="h-20 w-full shrink-0 sm:w-32" />
                <div class="min-w-0 flex-1">
                  <h3 class="line-clamp-2 font-bold">{{ item.courseTitleSnapshot }}</h3>
                  <p class="mt-1 text-xs text-slate-500">Truy cập trọn đời · Học theo tốc độ cá nhân</p>
                  <p class="mt-3 font-extrabold text-purple-700 dark:text-purple-300">
                    {{ new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.priceSnapshot) }}
                  </p>
                </div>
              </article>
            </div>
          </div>

          <!-- Select Payment Method Section -->
          <div class="surface-card p-5">
            <h2 class="font-extrabold text-slate-900 dark:text-white mb-4">Phương thức thanh toán</h2>
            <div class="space-y-3">
              <label
                :class="[
                  'flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all',
                  selectedPaymentMethod === 'MOMO'
                    ? 'border-[#a50064] bg-[#fff0f6] dark:bg-[#a50064]/10 dark:border-[#d82d8b]'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                ]"
              >
                <div class="flex items-center gap-3">
                  <input
                    v-model="selectedPaymentMethod"
                    type="radio"
                    value="MOMO"
                    class="h-4 w-4 text-[#a50064] focus:ring-[#a50064]"
                  />
                  <div class="grid h-10 w-10 place-items-center rounded-lg bg-[#a50064] font-black text-white text-xs">
                    momo
                  </div>
                  <div>
                    <p class="font-extrabold text-slate-900 dark:text-white text-sm">Ví điện tử MoMo Sandbox</p>
                    <p class="text-xs text-slate-500">Quét mã QR hoặc thanh toán qua ứng dụng Ví MoMo</p>
                  </div>
                </div>
                <span class="rounded bg-[#a50064] px-2 py-0.5 text-[10px] font-bold text-white">Khuyên dùng</span>
              </label>

              <label
                :class="[
                  'flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all',
                  selectedPaymentMethod === 'MOCK'
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/20 dark:border-purple-800'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                ]"
              >
                <div class="flex items-center gap-3">
                  <input
                    v-model="selectedPaymentMethod"
                    type="radio"
                    value="MOCK"
                    class="h-4 w-4 text-purple-600 focus:ring-purple-600"
                  />
                  <div class="grid h-10 w-10 place-items-center rounded-lg bg-purple-600 font-black text-white text-xs">
                    CARD
                  </div>
                  <div>
                    <p class="font-extrabold text-slate-900 dark:text-white text-sm">Thanh toán Thẻ / Sandbox Mặc định</p>
                    <p class="text-xs text-slate-500">Cổng thử nghiệm mô phỏng đơn giản</p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          <!-- Coupon Input Section -->
          <CouponInput v-if="order.status === 'PENDING'"
            :course-id="order.items?.[0]?.courseId"
            :applied-coupon-code="appliedCouponCode"
            @apply="handleCouponApplied"
            @remove="handleCouponRemoved"
          />

          <div class="flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-300">
            <span class="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-sky-100 font-black dark:bg-sky-900">i</span>
            <p><b>Thanh toán an toàn.</b><br>Đây là cổng thanh toán mô phỏng phục vụ kiểm thử. Bạn không bị trừ tiền thật.</p>
          </div>
        </section>

        <aside class="surface-card h-fit p-6 lg:sticky lg:top-24">
          <h2 class="text-xl font-black mb-6">Tóm tắt thanh toán</h2>

          <OrderPriceSummary
            :subtotal="order.subtotal"
            :discount-amount="appliedCoupon?.pricing?.discountAmount ?? (order.subtotal - order.total)"
            :total="appliedCoupon?.pricing?.finalAmount ?? order.total"
            :coupon-code="appliedCouponCode"
          />

          <p v-if="error" class="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{{ error }}</p>

          <BaseButton
            class="mt-6"
            size="lg"
            :full-width="true"
            :loading="paying"
            @click="pay"
          >
            {{ order.status === 'PENDING' ? (selectedPaymentMethod === 'MOMO' ? 'Thanh toán qua Ví MoMo' : 'Tiếp tục thanh toán') : 'Xem kết quả thanh toán' }} →
          </BaseButton>

          <RouterLink :to="`/payment-result/${order.id}`" class="mt-4 block text-center text-sm font-bold text-purple-700 dark:text-purple-300">
            Kiểm tra kết quả thanh toán
          </RouterLink>

          <div class="mt-6 flex items-center justify-center gap-3 border-t border-slate-100 pt-5 text-xs font-semibold text-slate-400 dark:border-slate-800">
            <span>🔒 Bảo mật</span>
            <span>•</span>
            <span>Hỗ trợ 24/7</span>
          </div>
        </aside>
      </div>
    </main>
  </DefaultLayout>
</template>

<style scoped>
.checkout-step { display: flex; align-items: center; gap: .4rem; color: var(--text-muted); white-space: nowrap; }
.checkout-step b { display: grid; width: 1.6rem; height: 1.6rem; place-items: center; border: 1px solid var(--border); border-radius: 50%; font-size: .65rem; }
.checkout-step--active { color: var(--brand); }
.checkout-step--active b { border-color: var(--brand); background: var(--brand); color: white; }
</style>
