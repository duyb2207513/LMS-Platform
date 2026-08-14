<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AuthLayout from '@/layouts/AuthLayout.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const error = ref('')

onMounted(async () => {
  const providerError = typeof route.query.error === 'string' ? route.query.error : ''
  if (providerError) {
    error.value = providerError
    return
  }

  try {
    await auth.completeOAuthLogin()
    await router.replace(auth.isAdmin ? '/admin' : auth.isInstructor ? '/instructor/courses' : '/dashboard')
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Không thể hoàn tất đăng nhập GitHub'
  }
})
</script>

<template>
  <AuthLayout>
    <div class="space-y-5 text-center">
      <template v-if="!error">
        <div class="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-purple-100 border-t-purple-600" />
        <h1 class="text-2xl font-extrabold text-slate-950 dark:text-white">Đang hoàn tất đăng nhập</h1>
        <p class="text-sm text-slate-500">LMS Platform đang tạo phiên bảo mật từ tài khoản GitHub của bạn.</p>
      </template>
      <template v-else>
        <div class="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-50 text-2xl text-red-600">!</div>
        <h1 class="text-2xl font-extrabold text-slate-950 dark:text-white">Đăng nhập GitHub thất bại</h1>
        <p class="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{{ error }}</p>
        <RouterLink to="/login" class="inline-flex min-h-11 items-center justify-center rounded-xl bg-purple-600 px-5 py-3 text-sm font-bold text-white hover:bg-purple-700">Quay lại đăng nhập</RouterLink>
      </template>
    </div>
  </AuthLayout>
</template>
