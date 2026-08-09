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

  const trimmedFullName = fullName.value.trim()
  if (!trimmedFullName) {
    error.value = 'Họ và tên là bắt buộc'
    return
  }
  if (trimmedFullName.length < 2 || trimmedFullName.length > 100) {
    error.value = 'Họ và tên phải từ 2 đến 100 ký tự'
    return
  }

  const trimmedEmail = email.value.trim()
  if (!trimmedEmail) {
    error.value = 'Email là bắt buộc'
    return
  }
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailPattern.test(trimmedEmail) || trimmedEmail.length > 255) {
    error.value = 'Email không hợp lệ'
    return
  }

  if (password.value.length < 8) {
    error.value = 'Mật khẩu phải có ít nhất 8 ký tự'
    return
  }
  if (!/[A-Z]/.test(password.value) || !/[a-z]/.test(password.value) || !/\d/.test(password.value)) {
    error.value = 'Mật khẩu phải chứa ít nhất một chữ hoa, một chữ thường và một chữ số'
    return
  }

  if (password.value !== confirmPassword.value) {
    error.value = 'Mật khẩu xác nhận không khớp'
    return
  }

  loading.value = true
  try {
    await auth.register({
      fullName: trimmedFullName,
      email: trimmedEmail,
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
    <div class="space-y-6 ">

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
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/20 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700',
              ]"
            >
              <span :class="['text-sm font-semibold', role === r.value ? 'text-purple-700 dark:text-purple-400' : 'text-slate-700 dark:text-slate-300']">
                {{ r.label }}
              </span>
              <span :class="['text-xs mt-1', role === r.value ? 'text-purple-500 dark:text-purple-400' : 'text-slate-400 dark:text-slate-500']">
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
          placeholder="your@gmail.com"
          :required="true"
        />
        <BaseInput
          id="register-password"
          v-model="password"
          label="Mật khẩu"
          type="password"
          placeholder="Tối thiểu 8 ký tự,gồm chữ hoa,thường và số"
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
        <router-link to="/login" class="font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors">
          Đăng nhập
        </router-link>
      </p>
    </div>

    
  </AuthLayout>
</template>
