<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthLayout from '@/layouts/AuthLayout.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    await auth.login({ email: email.value, password: password.value })
    // Redirect based on role
    if (auth.isAdmin) router.push('/admin')
    else if (auth.isInstructor) router.push('/instructor')
    else router.push('/dashboard')
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Đăng nhập thất bại'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthLayout>
    <div class="space-y-6">
      <div class="text-center">
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Chào mừng trở lại!</h1>
        <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">Đăng nhập để tiếp tục học tập</p>
      </div>

      <!-- Error Alert -->
      <div v-if="error" class="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50">
        <p class="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
          <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {{ error }}
        </p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-5">
        <BaseInput
          id="login-email"
          v-model="email"
          label="Email"
          type="email"
          placeholder="your@email.com"
          :required="true"
        />
        <BaseInput
          id="login-password"
          v-model="password"
          label="Mật khẩu"
          type="password"
          placeholder="••••••••"
          :required="true"
        />

        <BaseButton
          type="submit"
          :loading="loading"
          :full-width="true"
          size="lg"
        >
          Đăng nhập
        </BaseButton>
      </form>

      <p class="text-center text-sm text-slate-500 dark:text-slate-400">
        Chưa có tài khoản?
        <router-link to="/register" class="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
          Đăng ký ngay
        </router-link>
      </p>
    </div>
  </AuthLayout>
</template>
