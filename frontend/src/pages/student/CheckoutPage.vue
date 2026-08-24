<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
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
let pollTimer: ReturnType<typeof setInterval> | null = null
const checkoutStep = computed(() => order.value?.status === 'PAID' ? 3 : paying.value ? 2 : 1)

async function load() {
  error.value = ''
  try {
    const response = await api.get<ApiResponse<Order>>(`/orders/${route.params.orderId}`)
    order.value = response.data || null
    if (order.value?.status === 'PAID') {
      if (pollTimer) clearInterval(pollTimer)
      await router.push(`/payment-result/${route.params.orderId}`)
    }
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Không tải được đơn hàng'
  }
}

function startPolling() {
  if (pollTimer) clearInterval(pollTimer)
  pollTimer = setInterval(async () => {
    if (order.value?.status === 'PENDING') {
      try {
        const response = await api.get<ApiResponse<Order>>(`/orders/${route.params.orderId}`)
        if (response.data?.status === 'PAID') {
          order.value = response.data
          if (pollTimer) clearInterval(pollTimer)
          await router.push(`/payment-result/${route.params.orderId}`)
        }
      } catch {
        // Silently ignore polling network glitches
      }
    }
  }, 2500)
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
      // Keep the provider checkout in the same tab. Its callback can then return
      // directly to /payment-result instead of leaving the original checkout stale.
      window.location.assign(targetUrl)
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

onMounted(() => {
  void load()
  startPolling()
  window.addEventListener('focus', load)
})
onBeforeUnmount(() => {
  if (pollTimer) clearInterval(pollTimer)
  window.removeEventListener('focus', load)
})
</script>

<template>
  <DefaultLayout>
    <main class="checkout-page">
      <nav class="checkout-progress" aria-label="Tiến trình thanh toán">
        <div v-for="(label, index) in ['Xác nhận đơn', 'Thanh toán', 'Hoàn tất']" :key="label" :class="['checkout-step', { 'checkout-step--active': checkoutStep >= index + 1 }]">
          <span>{{ index + 1 }}</span><b>{{ label }}</b>
        </div>
      </nav>

      <LoadingSpinner v-if="api.loading.value && !order" class="py-24" />
      <p v-else-if="error && !order" class="surface-card p-5 text-red-700">{{ error }}</p>

      <Transition name="checkout-view" mode="out-in">
      <div v-if="order" :key="order.status" class="checkout-layout">
        <section class="checkout-main">
          <div class="checkout-heading">
            <p>GIAO DỊCH · {{ order.orderNumber }}</p>
            <h1>Kiểm tra và thanh toán</h1>
            <span>Xác nhận khóa học, ưu đãi và phương thức thanh toán trước khi tiếp tục.</span>
          </div>

          <div class="checkout-section">
            <header class="checkout-section__header">
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
          <div class="checkout-section p-5">
            <div class="mb-4 flex items-center justify-between gap-3"><h2 class="font-extrabold text-slate-900 dark:text-white">Phương thức thanh toán</h2><span class="text-xs font-semibold text-slate-400">Bước 2/3</span></div>
            <div class="grid gap-3 sm:grid-cols-2">
              <label
                :class="[
                  'payment-method',
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
                  <div class="grid h-10 w-10 place-items-center bg-[#a50064] font-black text-white text-xs">
                    QR
                  </div>
                  <div>
                    <p class="font-extrabold text-slate-900 dark:text-white text-sm">Chuyển khoản QR (MoMo / MBBank / Ngân hàng)</p>
                    <p class="text-xs text-slate-500">Quét mã QR tự động xác nhận qua SePay & MBBank (0941014007)</p>
                  </div>
                </div>
                <span class="bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">24/7</span>
              </label>

              <label
                :class="[
                  'payment-method',
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
                  <div class="grid h-10 w-10 place-items-center bg-purple-600 font-black text-white text-xs">
                    CARD
                  </div>
                  <div>
                    <p class="font-extrabold text-slate-900 dark:text-white text-sm">Cổng thử nghiệm Sandbox</p>
                    <p class="text-xs text-slate-500">Mô phỏng thanh toán đơn giản</p>
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

          <div class="checkout-notice">
            <span>i</span>
            <p><b>Lưu ý khi kiểm thử.</b><br>Cổng Sandbox cho phép xác nhận mô phỏng. Chuyển khoản QR thật chỉ tự xác nhận khi webhook SePay truy cập được backend đang chạy.</p>
          </div>
        </section>

        <aside class="checkout-summary">
          <p class="text-xs font-black uppercase tracking-[.16em] text-purple-600">Bước cuối</p>
          <h2 class="mb-6 mt-2 text-xl font-black">Tóm tắt thanh toán</h2>

          <OrderPriceSummary
            :subtotal="order.subtotal"
            :discount-amount="appliedCoupon?.pricing?.discountAmount ?? (order.subtotal - order.total)"
            :total="appliedCoupon?.pricing?.finalAmount ?? order.total"
            :coupon-code="appliedCouponCode"
          />

          <p v-if="error" class="mt-4 border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{{ error }}</p>

          <BaseButton
            class="mt-6 !rounded-none"
            size="lg"
            :full-width="true"
            :loading="paying"
            @click="pay"
          >
            {{ order.status === 'PENDING' ? (selectedPaymentMethod === 'MOMO' ? 'Mở mã chuyển khoản QR' : 'Mở cổng Sandbox') : 'Xem kết quả thanh toán' }} →
          </BaseButton>

          <RouterLink :to="`/payment-result/${order.id}`" class="mt-4 block text-center text-sm font-bold text-purple-700 dark:text-purple-300">
            Kiểm tra kết quả thanh toán
          </RouterLink>

          <div class="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-5 text-xs font-semibold text-slate-400 dark:border-slate-800">
            <span>Kết nối bảo mật</span>
            <span>Tự động kiểm tra trạng thái</span>
          </div>
        </aside>
      </div>
      </Transition>
    </main>
  </DefaultLayout>
</template>

<style scoped>
.checkout-page { width: 100%; padding: 0 0 3rem; }
.checkout-progress { display: grid; grid-template-columns: repeat(3,1fr); border-bottom: 1px solid var(--border); background: var(--surface); }
.checkout-step { display:flex; min-height:4.25rem; align-items:center; justify-content:center; gap:.65rem; border-right:1px solid var(--border); color:var(--text-muted); font-size:.75rem; }
.checkout-step:last-child { border-right:0; }
.checkout-step span { display:grid; width:1.6rem; height:1.6rem; place-items:center; border:1px solid var(--border); font-weight:900; }
.checkout-step--active { color:var(--brand); }
.checkout-step--active span { border-color:var(--brand); background:var(--brand); color:white; }
.checkout-layout { display:grid; width:100%; gap:0; }
.checkout-main { min-width:0; }
.checkout-heading { border-bottom:1px solid var(--border); padding:2rem clamp(1rem,4vw,3.5rem); }
.checkout-heading p { color:var(--brand); font-size:.72rem; font-weight:900; letter-spacing:.14em; }
.checkout-heading h1 { margin-top:.45rem; font-size:clamp(1.9rem,4vw,3.25rem); font-weight:950; letter-spacing:-.04em; }
.checkout-heading span { display:block; margin-top:.5rem; color:var(--text-muted); }
.checkout-section { border-bottom:1px solid var(--border); background:var(--surface); }
.checkout-section__header { display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid var(--border); padding:1rem 1.25rem; }
.payment-method { display:flex; min-height:6.5rem; cursor:pointer; align-items:center; justify-content:space-between; border:2px solid var(--border); padding:1rem; transition:border-color .18s ease, background-color .18s ease; }
.checkout-notice { display:flex; gap:.75rem; border-bottom:1px solid #bae6fd; background:#f0f9ff; padding:1rem 1.25rem; color:#075985; font-size:.8rem; }
.checkout-notice>span { display:grid; width:1.5rem; height:1.5rem; flex:none; place-items:center; background:#0ea5e9; color:white; font-weight:900; }
.checkout-summary { border-bottom:1px solid var(--border); background:var(--surface); padding:1.5rem; }
.checkout-view-enter-active,.checkout-view-leave-active { transition:opacity .18s ease, transform .18s ease; }
.checkout-view-enter-from,.checkout-view-leave-to { opacity:0; transform:translateY(8px); }
@media (min-width:1024px) {
  .checkout-layout { grid-template-columns:minmax(0,1fr) 25rem; }
  .checkout-summary { position:sticky; top:4.5rem; height:fit-content; border-left:1px solid var(--border); }
}
@media (max-width:639px) {
  .checkout-step { min-height:3.5rem; gap:.35rem; font-size:.65rem; }
  .checkout-step span { width:1.35rem; height:1.35rem; }
}
:global(.dark) .checkout-notice { border-color:#0c4a6e; background:#082f49; color:#bae6fd; }
</style>
