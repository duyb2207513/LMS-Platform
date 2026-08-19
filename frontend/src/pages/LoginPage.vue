<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AuthLayout from '@/layouts/AuthLayout.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import GoogleSignInButton from '@/components/auth/GoogleSignInButton.vue'
import GitHubSignInButton from '@/components/auth/GitHubSignInButton.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore(), route = useRoute(), router = useRouter()
const email = ref(''), password = ref(''), loading = ref(false), error = ref(''), emailError = ref('')

function validateEmail() {
  const cleanEmail = email.value.trim().toLowerCase()
  if (cleanEmail && cleanEmail.endsWith('@example.com')) {
    emailError.value = 'Không được sử dụng email có đuôi @example.com'
  } else {
    emailError.value = ''
  }
}

async function finishLogin() {
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : ''
  await router.push(redirect || (auth.isAdmin ? '/admin' : auth.isInstructor ? '/instructor/courses' : '/dashboard'))
}
async function submit() {
  error.value = ''
  validateEmail()
  if (emailError.value) return
  const cleanEmail = email.value.trim().toLowerCase()
  if (!cleanEmail || !password.value) { error.value = 'Email và mật khẩu là bắt buộc'; return }
  loading.value = true
  try { await auth.login({ email: cleanEmail, password: password.value }); await finishLogin() }
  catch (cause) { error.value = cause instanceof Error ? cause.message : 'Đăng nhập thất bại' }
  finally { loading.value = false }
}
async function loginWithGoogle(idToken: string) {
  loading.value = true; error.value = ''
  try { await auth.googleLogin(idToken); await finishLogin() }
  catch (cause) { error.value = cause instanceof Error ? cause.message : 'Đăng nhập Google thất bại' }
  finally { loading.value = false }
}
</script>

<template>
  <AuthLayout>
    <div class="space-y-6">
      <div class="text-center"><h1 class="text-2xl font-extrabold">Chào mừng trở lại</h1><p class="mt-2 text-sm text-slate-500">Đăng nhập để tiếp tục hành trình học tập</p></div>
      <p v-if="$route.query.registered" class="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">Đăng ký thành công. Hãy kiểm tra email để xác minh tài khoản.</p>
      <p v-if="$route.query.reset" class="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">Mật khẩu đã được đặt lại. Bạn có thể đăng nhập.</p>
      <p v-if="$route.query.expired" class="rounded-xl bg-amber-50 p-3 text-sm text-amber-700">Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.</p>
      <GitHubSignInButton />
      <GoogleSignInButton @credential="loginWithGoogle" @error="error = $event" />
      <div class="flex items-center gap-3"><span class="h-px flex-1 bg-slate-200 dark:bg-slate-700"/><span class="text-xs text-slate-400">hoặc dùng email</span><span class="h-px flex-1 bg-slate-200 dark:bg-slate-700"/></div>
      <form class="space-y-5" @submit.prevent="submit">
        <BaseInput id="email" v-model="email" type="email" label="Email" placeholder="ban@gmail.com" :error="emailError" required @blur="validateEmail" @input="validateEmail" />
        <div><BaseInput id="password" v-model="password" type="password" label="Mật khẩu" required /><div class="mt-2 text-right"><RouterLink to="/forgot-password" class="text-xs font-bold text-purple-600">Quên mật khẩu?</RouterLink></div></div>
        <p v-if="error" class="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{{ error }}</p>
        <BaseButton type="submit" :loading="loading" :full-width="true">Đăng nhập</BaseButton>
      </form>
      <p class="text-center text-sm">Chưa có tài khoản? <RouterLink to="/register" class="font-bold text-purple-600">Đăng ký</RouterLink></p>
    </div>
  </AuthLayout>
</template>
