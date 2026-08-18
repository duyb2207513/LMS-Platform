<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthLayout from '@/layouts/AuthLayout.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import GoogleSignInButton from '@/components/auth/GoogleSignInButton.vue'
import GitHubSignInButton from '@/components/auth/GitHubSignInButton.vue'
import { useAuthStore } from '@/stores/auth'
import { useApi } from '@/composables/useApi'

const auth = useAuthStore(), router = useRouter(), api = useApi()
const fullName = ref(''), email = ref(''), password = ref(''), confirmPassword = ref('')
const loading = ref(false), error = ref(''), emailError = ref('')
let checkEmailTimer: ReturnType<typeof setTimeout> | null = null

async function validateEmail(checkRemote = false) {
  const mail = email.value.trim().toLowerCase()
  if (!mail) {
    emailError.value = ''
    return false
  }
  if (mail.endsWith('@example.com')) {
    emailError.value = 'Không được sử dụng email có đuôi @example.com'
    return false
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
    emailError.value = 'Email không hợp lệ'
    return false
  }
  emailError.value = ''

  if (checkRemote) {
    try {
      const res = await api.get<{ data: { exists: boolean } }>(`/auth/check-email?email=${encodeURIComponent(mail)}`)
      if (res && res.data?.exists) {
        emailError.value = 'Email đã tồn tại'
        return false
      }
    } catch {
      // Bỏ qua nếu lỗi mạng trong lúc gõ
    }
  }
  return true
}

function onEmailInput() {
  validateEmail(false)
  if (checkEmailTimer) clearTimeout(checkEmailTimer)
  const mail = email.value.trim().toLowerCase()
  if (mail && !mail.endsWith('@example.com') && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
    checkEmailTimer = setTimeout(() => {
      validateEmail(true)
    }, 400)
  }
}

function onEmailBlur() {
  if (checkEmailTimer) clearTimeout(checkEmailTimer)
  validateEmail(true)
}

async function finishLogin() {
  await router.push(auth.isAdmin ? '/admin' : auth.isInstructor ? '/instructor/courses' : '/dashboard')
}

async function loginWithGoogle(idToken: string) {
  loading.value = true; error.value = ''
  try { await auth.googleLogin(idToken); await finishLogin() }
  catch (cause) { error.value = cause instanceof Error ? cause.message : 'Đăng nhập Google thất bại' }
  finally { loading.value = false }
}

async function submit() {
  const name = fullName.value.trim(), mail = email.value.trim().toLowerCase()
  error.value = ''
  validateEmail()
  if (emailError.value) return
  if (name.length < 2 || name.length > 100) { error.value = 'Họ tên phải từ 2 đến 100 ký tự'; return }
  if (!mail) { error.value = 'Email là bắt buộc'; return }
  if (password.value.length < 8 || !/[A-Z]/.test(password.value) || !/[a-z]/.test(password.value) || !/[0-9]/.test(password.value)) {
    error.value = 'Mật khẩu tối thiểu 8 ký tự, có chữ hoa, chữ thường và số'; return
  }
  if (password.value !== confirmPassword.value) { error.value = 'Mật khẩu xác nhận không khớp'; return }
  loading.value = true
  try {
    await auth.register({ fullName: name, email: mail, password: password.value, confirmPassword: confirmPassword.value })
    await router.push({ path: '/login', query: { registered: '1' } })
  } catch (e) {
    if (e instanceof Error && (e.message.includes('409') || e.message.toLowerCase().includes('already exists'))) {
      error.value = 'Email đã tồn tại'
    } else {
      error.value = e instanceof Error ? e.message : 'Đăng ký thất bại'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthLayout>
    <div class="space-y-6">
      <div class="text-center">
        <h1 class="text-2xl font-extrabold">Tạo tài khoản học viên</h1>
        <p class="mt-2 text-sm text-slate-500">Bắt đầu hành trình học tập của bạn</p>
      </div>

      <GitHubSignInButton />
      <GoogleSignInButton @credential="loginWithGoogle" @error="error = $event" />

      <div class="flex items-center gap-3">
        <span class="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
        <span class="text-xs text-slate-400">hoặc đăng ký bằng email</span>
        <span class="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
      </div>

      <form class="space-y-4" @submit.prevent="submit">
        <BaseInput id="full-name" v-model="fullName" label="Họ và tên" required />
        <BaseInput
          id="register-email"
          v-model="email"
          type="email"
          label="Email"
          placeholder="ban@gmail.com"
          :error="emailError"
          required
          @blur="onEmailBlur"
          @input="onEmailInput"
        />
        <BaseInput id="register-password" v-model="password" type="password" label="Mật khẩu" required />
        <BaseInput id="confirm-password" v-model="confirmPassword" type="password" label="Xác nhận mật khẩu" required />
        <p v-if="error" class="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{{ error }}</p>
        <BaseButton type="submit" :loading="loading" :full-width="true">Đăng ký</BaseButton>
      </form>
      <p class="text-center text-sm">Đã có tài khoản? <RouterLink to="/login" class="font-bold text-purple-600">Đăng nhập</RouterLink></p>
    </div>
  </AuthLayout>
</template>
