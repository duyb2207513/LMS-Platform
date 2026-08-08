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

type LoginRole = 'student' | 'instructor' | 'admin'
const selectedRole = ref<LoginRole>('student')

const roleOptions = [
  {
    key: 'student' as LoginRole,
    label: 'Học viên',
    icon: '👨‍🎓',
    description: 'Truy cập khóa học',
    redirect: '/courses',
  },
  {
    key: 'instructor' as LoginRole,
    label: 'Giảng viên',
    icon: '👨‍🏫',
    description: 'Quản lý khóa học',
    redirect: '/instructor/courses',
  },
  {
    key: 'admin' as LoginRole,
    label: 'Quản trị',
    icon: '👑',
    description: 'Quản lý hệ thống',
    redirect: '/admin',
  }
]

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    await auth.login({ email: email.value, password: password.value })
    // Redirect based on role requirements
    if (auth.isAdmin) {
      router.push('/admin')
    } else if (auth.isInstructor) {
      router.push('/instructor/courses')
    } else {
      router.push('/courses')
    }
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

      <!-- Role Selection -->
      <div class="space-y-2">
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">Đăng nhập với vai trò</label>
        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="r in roleOptions"
            :key="r.key"
            type="button"
            @click="selectedRole = r.key"
            :class="[
              'flex flex-col items-center p-3 rounded-xl border-2 transition-all cursor-pointer text-center',
              selectedRole === r.key
                ? 'border-purple-500 bg-purple-50 shadow-sm shadow-purple-500/10 dark:bg-slate-800 dark:border-slate-500 dark:shadow-none'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600',
            ]"
          >
            <span class="text-xl mb-1">{{ r.icon }}</span>
            <span :class="['text-xs font-semibold', selectedRole === r.key ? 'text-purple-700 dark:text-white' : 'text-slate-700 dark:text-slate-300']">
              {{ r.label }}
            </span>
            <span :class="['text-[10px] mt-0.5 leading-tight', selectedRole === r.key ? 'text-purple-500 dark:text-slate-400' : 'text-slate-400 dark:text-slate-500']">
              {{ r.description }}
            </span>
          </button>
        </div>
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

      <!-- Role-based redirect info -->
      <div class="rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4">
        <p class="text-xs text-slate-500 dark:text-slate-400 text-center">
          Sau khi đăng nhập, bạn sẽ được chuyển đến:
          <span class="font-semibold text-indigo-600 dark:text-indigo-400">
            {{ roleOptions.find(r => r.key === selectedRole)?.redirect }}
          </span>
        </p>
      </div>

      <p class="text-center text-sm text-slate-500 dark:text-slate-400">
        Chưa có tài khoản?
        <router-link to="/register" class="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
          Đăng ký ngay
        </router-link>
      </p>
    </div>
  </AuthLayout>
</template>
