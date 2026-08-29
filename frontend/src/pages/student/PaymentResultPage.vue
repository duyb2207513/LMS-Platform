<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Receipt,
  RotateCw,
  ShoppingBag,
  XCircle,
} from '@lucide/vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import CourseThumbnail from '@/components/course/CourseThumbnail.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { useApi } from '@/composables/useApi'
import type { ApiResponse, Order } from '@/types'

const route = useRoute()
const api = useApi()
const order = ref<Order | null>(null)
const error = ref('')
const refreshing = ref(false)
let pollTimer: ReturnType<typeof setInterval> | null = null

const money = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)

const state = computed(() => {
  if (order.value?.status === 'PAID') {
    return {
      title: 'Thanh toán thành công!',
      description: 'Khóa học đã được mở và sẵn sàng trong tài khoản học tập của bạn.',
      tone: 'success',
    }
  }
  if (order.value?.status === 'CANCELLED') {
    return {
      title: 'Giao dịch đã hủy',
      description: 'Đơn hàng đã được kết thúc hoặc hủy bỏ. Bạn có thể chọn mua lại bất cứ lúc nào.',
      tone: 'danger',
    }
  }
  return {
    title: 'Đang xác nhận giao dịch...',
    description: 'Hệ thống đang đồng bộ và chờ tín hiệu thanh toán từ ngân hàng/MoMo.',
    tone: 'pending',
  }
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
    error.value = cause instanceof Error ? cause.message : 'Không tải được kết quả giao dịch.'
  } finally {
    if (!silent) refreshing.value = false
  }
}

onMounted(async () => {
  await load()
  if (order.value?.status === 'PENDING') {
    pollTimer = setInterval(() => void load(true), 2500)
  }
})

onBeforeUnmount(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<template>
  <DefaultLayout>
    <main class="min-h-[calc(100vh-4.5rem)] bg-slate-100/70 dark:bg-slate-950 py-10 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <LoadingSpinner v-if="api.loading.value && !order" class="py-24" />

      <!-- Centered Sharp Geometric Digital Receipt Card -->
      <div v-else-if="order" class="w-full max-w-2xl">
        <div class="border border-slate-300 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <!-- Top Status Banner -->
          <div
            :class="[
              'relative px-6 pt-9 pb-7 text-center border-b',
              order.status === 'PAID'
                ? 'bg-gradient-to-b from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-200 dark:border-emerald-950/60'
                : order.status === 'CANCELLED'
                ? 'bg-gradient-to-b from-rose-500/10 via-rose-500/5 to-transparent border-rose-200 dark:border-rose-950/60'
                : 'bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent border-amber-200 dark:border-amber-950/60',
            ]"
          >
            <!-- Sharp Badge Icon -->
            <div
              class="mx-auto flex h-16 w-16 items-center justify-center shadow-md"
              :class="[
                order.status === 'PAID'
                  ? 'bg-emerald-600 text-white shadow-emerald-600/25'
                  : order.status === 'CANCELLED'
                  ? 'bg-rose-600 text-white shadow-rose-600/25'
                  : 'bg-amber-500 text-white shadow-amber-500/25 animate-pulse',
              ]"
            >
              <CheckCircle2 v-if="order.status === 'PAID'" :size="36" :stroke-width="2.5" />
              <XCircle v-else-if="order.status === 'CANCELLED'" :size="36" :stroke-width="2.5" />
              <Clock v-else :size="36" :stroke-width="2.5" />
            </div>

            <!-- Title & Subtitle -->
            <h1 class="mt-4 text-2xl sm:text-3xl font-black tracking-tight text-slate-950 dark:text-white">
              {{ state.title }}
            </h1>
            <p class="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              {{ state.description }}
            </p>

            <!-- Auto Polling Indicator for PENDING -->
            <div v-if="order.status === 'PENDING'" class="mt-4 inline-flex items-center gap-2 border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
              <span class="h-2 w-2 bg-amber-500 animate-ping" />
              <span>Đang tự động đồng bộ kết quả (mỗi 2.5s)...</span>
            </div>
          </div>

          <!-- Order Summary Section -->
          <div class="p-6 sm:p-8 space-y-6">
            <!-- Order Meta Grid -->
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-50 p-4 border border-slate-200 dark:bg-slate-800/60 dark:border-slate-800 text-xs">
              <div>
                <p class="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Mã đơn hàng</p>
                <p class="mt-1 font-mono font-bold text-slate-900 dark:text-slate-100 truncate">{{ order.orderNumber }}</p>
              </div>
              <div>
                <p class="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Thời gian</p>
                <p class="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                  {{ new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(order.createdAt)) }}
                </p>
              </div>
              <div class="col-span-2 sm:col-span-1">
                <p class="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Trạng thái</p>
                <span
                  class="mt-1 inline-flex items-center gap-1 border px-2.5 py-0.5 text-xs font-black uppercase tracking-wider"
                  :class="[
                    order.status === 'PAID'
                      ? 'border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : order.status === 'CANCELLED'
                      ? 'border-rose-300 bg-rose-100 text-rose-800 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      : 'border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300',
                  ]"
                >
                  ● {{ order.status === 'PAID' ? 'Đã thanh toán' : order.status === 'CANCELLED' ? 'Đã hủy' : 'Chờ xử lý' }}
                </span>
              </div>
            </div>

            <!-- Purchased Courses List (Taller image & sharp cards) -->
            <div class="space-y-2.5">
              <p class="text-xs font-bold uppercase tracking-wider text-slate-500">Chi tiết khóa học</p>
              <div class="divide-y divide-slate-200 border border-slate-200 dark:divide-slate-800 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div
                  v-for="item in order.items"
                  :key="item.id"
                  class="flex flex-col sm:flex-row sm:items-center gap-4 p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition"
                >
                  <!-- High-aspect course image -->
                  <div class="h-24 w-full sm:w-40 shrink-0 overflow-hidden border border-slate-200 bg-slate-900 dark:border-slate-700">
                    <CourseThumbnail
                      :src="item.course?.thumbnailUrl"
                      :alt="item.courseTitleSnapshot"
                      class="h-full w-full object-cover"
                    />
                  </div>

                  <div class="min-w-0 flex-1">
                    <h3 class="font-bold text-sm sm:text-base text-slate-950 dark:text-white leading-snug line-clamp-2">
                      {{ item.courseTitleSnapshot }}
                    </h3>
                    <p class="text-xs text-slate-500 mt-1">Truy cập học tập trọn đời</p>
                  </div>

                  <div class="text-left sm:text-right shrink-0">
                    <span class="font-black text-base sm:text-lg text-purple-700 dark:text-purple-300">
                      {{ money(item.priceSnapshot) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Total Amount Bar -->
            <div class="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-4">
              <span class="text-sm font-bold text-slate-600 dark:text-slate-400">Tổng thanh toán</span>
              <span class="text-2xl font-black text-purple-700 dark:text-purple-400">
                {{ money(order.total) }}
              </span>
            </div>

            <!-- Error message if any -->
            <p v-if="error" class="border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700 dark:bg-red-950/30 dark:text-red-300">
              {{ error }}
            </p>

            <!-- Actions Footer (Sharp Flat Buttons) -->
            <div class="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <!-- If PAID -->
              <template v-if="order.status === 'PAID'">
                <RouterLink to="/my-courses" class="w-full sm:flex-1">
                  <button
                    type="button"
                    class="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-3.5 text-sm font-bold text-white shadow-md transition hover:from-violet-700 hover:to-purple-700 active:translate-y-px"
                  >
                    <BookOpen :size="18" />
                    <span>Vào khóa học của tôi</span>
                    <ArrowRight :size="16" />
                  </button>
                </RouterLink>
                <RouterLink to="/orders" class="w-full sm:w-auto">
                  <button
                    type="button"
                    class="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-slate-300 bg-white px-5 py-3.5 text-sm font-bold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition"
                  >
                    <Receipt :size="16" />
                    <span>Xem lịch sử đơn hàng</span>
                  </button>
                </RouterLink>
              </template>

              <!-- If PENDING -->
              <template v-else-if="order.status === 'PENDING'">
                <button
                  type="button"
                  :disabled="refreshing"
                  class="w-full sm:flex-1 inline-flex items-center justify-center gap-2 bg-purple-700 px-6 py-3.5 text-sm font-bold text-white shadow-md hover:bg-purple-800 transition disabled:opacity-60"
                  @click="load()"
                >
                  <RotateCw :size="16" :class="{ 'animate-spin': refreshing }" />
                  <span>Kiểm tra lại trạng thái</span>
                </button>
                <RouterLink :to="`/checkout/${order.id}`" class="w-full sm:w-auto">
                  <button
                    type="button"
                    class="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-slate-300 bg-white px-5 py-3.5 text-sm font-bold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition"
                  >
                    <span>Quay lại trang thanh toán</span>
                  </button>
                </RouterLink>
              </template>

              <!-- If CANCELLED / FAILED -->
              <template v-else>
                <RouterLink to="/courses" class="w-full sm:flex-1">
                  <button
                    type="button"
                    class="w-full inline-flex items-center justify-center gap-2 bg-purple-700 px-6 py-3.5 text-sm font-bold text-white shadow-md hover:bg-purple-800 transition"
                  >
                    <ShoppingBag :size="18" />
                    <span>Khám phá các khóa học khác</span>
                  </button>
                </RouterLink>
              </template>
            </div>
          </div>
        </div>
      </div>
    </main>
  </DefaultLayout>
</template>
