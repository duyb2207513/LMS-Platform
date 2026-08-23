<script setup lang="ts">
import { ref } from 'vue'
import { ArrowLeft } from '@lucide/vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useApi } from '@/composables/useApi'
const api = useApi(), email = ref(''), sent = ref(false), error = ref(''), emailError = ref('')
function validateEmail() {
  const mail = email.value.trim().toLowerCase()
  if (!mail) {
    emailError.value = ''
  } else if (mail.endsWith('@example.com')) {
    emailError.value = 'Không được sử dụng email có đuôi @example.com'
  } else {
    emailError.value = ''
  }
}
async function submit() {
  error.value = ''
  validateEmail()
  if (emailError.value) return
  try {
    await api.post('/auth/forgot-password', { email: email.value.trim() })
    sent.value = true
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Không thể gửi yêu cầu'
  }
}
</script>
<template>
  <AuthLayout>
    <div v-if="sent" class="text-center">
      <span class="mx-auto grid h-14 w-14 place-items-center border border-emerald-300 text-xl text-emerald-700">✓</span>
      <h1 class="mt-5 text-2xl font-extrabold">Kiểm tra email của bạn</h1>
      <p class="mt-3 text-sm leading-6 text-slate-500">Nếu tài khoản tồn tại, chúng tôi đã gửi liên kết đặt lại mật khẩu. Liên kết có hiệu lực trong 30 phút.</p>
      <RouterLink to="/login" class="mx-auto mt-6 grid h-10 w-10 place-items-center border border-purple-200 text-purple-600 hover:bg-purple-50" aria-label="Quay lại đăng nhập" title="Quay lại đăng nhập"><ArrowLeft :size="18" /></RouterLink>
    </div>
    <form v-else class="space-y-5" @submit.prevent="submit">
      <div class="text-center"><h1 class="text-2xl font-extrabold">Quên mật khẩu?</h1><p class="mt-2 text-sm text-slate-500">Nhập email để nhận liên kết đặt lại mật khẩu.</p></div>
      <BaseInput id="forgot-email" v-model="email" type="email" label="Email" placeholder="ban@gmail.com" :error="emailError" required @blur="validateEmail" @input="validateEmail" />
      <p v-if="error" class="border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>
      <div class="flex items-stretch gap-2">
        <RouterLink to="/login" class="grid w-11 shrink-0 place-items-center border border-purple-200 text-purple-600 hover:bg-purple-50" aria-label="Quay lại đăng nhập" title="Quay lại đăng nhập"><ArrowLeft :size="18" /></RouterLink>
        <BaseButton class="flex-1" type="submit" :loading="api.loading.value" :full-width="true">Gửi liên kết đặt lại</BaseButton>
      </div>
    </form>
  </AuthLayout>
</template>
