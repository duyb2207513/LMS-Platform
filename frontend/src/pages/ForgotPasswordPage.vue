<script setup lang="ts">
import { ref } from 'vue'
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
<template><AuthLayout><div v-if="sent" class="text-center"><span class="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-2xl text-emerald-700">✓</span><h1 class="mt-5 text-2xl font-extrabold">Kiểm tra email của bạn</h1><p class="mt-3 text-sm leading-6 text-slate-500">Nếu tài khoản tồn tại, chúng tôi đã gửi liên kết đặt lại mật khẩu. Liên kết có hiệu lực trong 30 phút.</p><RouterLink to="/login"><BaseButton class="mt-6">Quay lại đăng nhập</BaseButton></RouterLink></div><form v-else class="space-y-5" @submit.prevent="submit"><div class="text-center"><h1 class="text-2xl font-extrabold">Quên mật khẩu?</h1><p class="mt-2 text-sm text-slate-500">Nhập email để nhận liên kết đặt lại mật khẩu.</p></div><BaseInput id="forgot-email" v-model="email" type="email" label="Email" placeholder="ban@gmail.com" :error="emailError" required @blur="validateEmail" @input="validateEmail"/><p v-if="error" class="rounded-xl bg-red-50 p-3 text-sm text-red-700">{{ error }}</p><BaseButton type="submit" :loading="api.loading.value" :full-width="true">Gửi liên kết đặt lại</BaseButton><RouterLink to="/login" class="block text-center text-sm font-bold text-purple-600">← Quay lại đăng nhập</RouterLink></form></AuthLayout></template>
