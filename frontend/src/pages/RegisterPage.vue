<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthLayout from '@/layouts/AuthLayout.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useAuthStore } from '@/stores/auth'
import { UserRole } from '@/types'

const auth = useAuthStore()
const router = useRouter()

const fullName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const role = ref<UserRole>(UserRole.STUDENT)
const loading = ref(false)
const error = ref('')

const roles = [
  { value: UserRole.STUDENT, label: 'Học viên', description: 'Đăng ký và học các khóa học' },
  { value: UserRole.INSTRUCTOR, label: 'Giảng viên', description: 'Tạo và quản lý khóa học' },
]

async function handleRegister() {
  error.value = ''

  if (password.value !== confirmPassword.value) {
    error.value = 'Mật khẩu xác nhận không khớp'
    return
  }

  if (password.value.length < 6) {
    error.value = 'Mật khẩu phải có ít nhất 6 ký tự'
    return
  }

  loading.value = true
  try {
    await auth.register({
      fullName: fullName.value,
      email: email.value,
      password: password.value,
      role: role.value,
    })
    if (auth.isInstructor) {
      router.push('/instructor/courses')
    } else {
      router.push('/courses')
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Đăng ký thất bại'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthLayout>
    <div class="space-y-6">

      <!-- Nút Về trang chủ -->
      <router-link
        to="/"
        class="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Về trang chủ
      </router-link>

      <div class="text-center">
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Tạo tài khoản mới</h1>
        <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">Bắt đầu hành trình học tập của bạn</p>
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

      <form @submit.prevent="handleRegister" class="space-y-5">
        <!-- Role Selection -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">Bạn là</label>
          <div class="grid grid-cols-2 gap-3">
            <button
              v-for="r in roles"
              :key="r.value"
              type="button"
              @click="role = r.value"
              :class="[
                'flex flex-col items-center p-4 rounded-xl border-2 transition-all cursor-pointer',
                role === r.value
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700',
              ]"
            >
              <span :class="['text-sm font-semibold', role === r.value ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300']">
                {{ r.label }}
              </span>
              <span :class="['text-xs mt-1', role === r.value ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500']">
                {{ r.description }}
              </span>
            </button>
          </div>
        </div>

        <BaseInput
          id="register-fullname"
          v-model="fullName"
          label="Họ và tên"
          placeholder="Nguyễn Văn A"
          :required="true"
        />
        <BaseInput
          id="register-email"
          v-model="email"
          label="Email"
          type="email"
          placeholder="your@email.com"
          :required="true"
        />
        <BaseInput
          id="register-password"
          v-model="password"
          label="Mật khẩu"
          type="password"
          placeholder="Tối thiểu 6 ký tự"
          :required="true"
        />
        <BaseInput
          id="register-confirm-password"
          v-model="confirmPassword"
          label="Xác nhận mật khẩu"
          type="password"
          placeholder="Nhập lại mật khẩu"
          :required="true"
        />

        <BaseButton
          type="submit"
          :loading="loading"
          :full-width="true"
          size="lg"
        >
          Đăng ký
        </BaseButton>
      </form>

      <p class="text-center text-sm text-slate-500 dark:text-slate-400">
        Đã có tài khoản?
        <router-link to="/login" class="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
          Đăng nhập
        </router-link>
      </p>
    </div>

    
  </AuthLayout>
</template>
