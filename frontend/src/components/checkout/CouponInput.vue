<script setup lang="ts">
import { ref } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useCouponApi } from '@/api/coupon.api'
import type { CouponValidationResult } from '@/types/commerce'
import { DiscountType } from '@/types/commerce'
import { formatMoney } from '@/utils/formatters'

const props = defineProps<{
  courseId?: string
  appliedCouponCode?: string
}>()

const emit = defineEmits<{
  (e: 'apply', result: CouponValidationResult): void
  (e: 'remove'): void
}>()

const couponCode = ref(props.appliedCouponCode || '')
const couponApi = useCouponApi()
const errorMessage = ref('')
const successResult = ref<CouponValidationResult | null>(null)

async function handleApply() {
  if (!couponCode.value.trim()) {
    errorMessage.value = 'Vui lòng nhập mã giảm giá'
    return
  }

  errorMessage.value = ''
  try {
    const response = await couponApi.validateCoupon(couponCode.value, props.courseId)
    if (response.data?.valid) {
      successResult.value = response.data
      emit('apply', response.data)
    } else {
      errorMessage.value = 'Mã giảm giá không hợp lệ hoặc đã hết hạn'
    }
  } catch (err: any) {
    if (err?.errors && typeof err.errors === 'object') {
      const firstErr = Object.values(err.errors)[0]
      errorMessage.value = String(firstErr)
    } else {
      errorMessage.value = err?.message || 'Mã giảm giá không khả dụng'
    }
    successResult.value = null
  }
}

function handleRemove() {
  couponCode.value = ''
  errorMessage.value = ''
  successResult.value = null
  emit('remove')
}
</script>

<template>
  <div class="coupon-input-container rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
    <label class="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
      Mã giảm giá (Coupon)
    </label>

    <div v-if="!successResult && !props.appliedCouponCode" class="flex gap-2">
      <input
        v-model="couponCode"
        type="text"
        placeholder="NHẬP MÃ (VD: WELCOME20)"
        class="flex-1 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold uppercase tracking-wider text-slate-900 placeholder:normal-case placeholder:font-normal placeholder:tracking-normal focus:border-purple-600 focus:outline-none focus:ring-1 focus:ring-purple-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        @keyup.enter="handleApply"
      />
      <BaseButton
        size="sm"
        :loading="couponApi.loading.value"
        @click="handleApply"
      >
        Áp dụng
      </BaseButton>
    </div>

    <!-- Applied coupon badge state -->
    <div v-else class="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 dark:border-emerald-900/50 dark:bg-emerald-950/30">
      <div class="flex items-center gap-2">
        <span class="grid h-6 w-6 place-items-center rounded-full bg-emerald-100 text-xs font-black text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">✓</span>
        <div>
          <p class="text-sm font-bold text-emerald-800 dark:text-emerald-300">
            Mã: {{ successResult?.coupon?.code || props.appliedCouponCode }}
          </p>
          <p v-if="successResult?.pricing" class="text-xs text-emerald-600 dark:text-emerald-400">
            Giảm {{ formatMoney(successResult.pricing.discountAmount, successResult.pricing.currency) }}
            <span v-if="successResult.coupon?.discountType === DiscountType.PERCENTAGE">
              ({{ successResult.coupon.discountValue }}%)
            </span>
          </p>
        </div>
      </div>
      <button
        type="button"
        class="text-xs font-bold text-slate-400 hover:text-red-600 dark:hover:text-red-400"
        @click="handleRemove"
      >
        Gỡ bỏ
      </button>
    </div>

    <p v-if="errorMessage" class="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
      {{ errorMessage }}
    </p>
  </div>
</template>
