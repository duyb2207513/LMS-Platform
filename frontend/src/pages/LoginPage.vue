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

interface DemoAccount {
  role: 'student' | 'instructor' | 'admin'
  name: string
  roleLabel: string
  email: string
  password: string
  description: string
  badgeClass: string
  borderClass: string
}

const demoAccounts: DemoAccount[] = [
  {
    role: 'student',
    name: 'Học viên',
    roleLabel: 'Student',
    email: 'student@lms.test',
    password: 'Password123',
    description: 'Trải nghiệm học tập, làm Quiz, nộp bài tập & nhận chứng chỉ',
    badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    borderClass: 'hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:border-emerald-600 dark:hover:bg-emerald-950/30'
  },
  {
    role: 'instructor',
    name: 'Giảng viên',
    roleLabel: 'Instructor',
    email: 'instructor@lms.test',
    password: 'Password123',
    description: 'Quản lý khóa học, tạo đề thi, chấm bài tập & xem doanh thu',
    badgeClass: 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800',
    borderClass: 'hover:border-sky-400 hover:bg-sky-50/50 dark:hover:border-sky-600 dark:hover:bg-sky-950/30'
  },
  {
    role: 'admin',
    name: 'Quản trị viên',
    roleLabel: 'Admin',
    email: 'admin@lms.test',
    password: 'Password123',
    description: 'Toàn quyền quản trị hệ thống, duyệt khóa học, quản lý users & tài chính',
    badgeClass: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    borderClass: 'hover:border-purple-400 hover:bg-purple-50/50 dark:hover:border-purple-600 dark:hover:bg-purple-950/30'
  }
]

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

async function selectDemoAccount(acc: DemoAccount) {
  email.value = acc.email
  password.value = acc.password
  emailError.value = ''
  error.value = ''
  await submit()
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
      <div class="text-center">
        <h1 class="text-2xl font-extrabold">Chào mừng trở lại</h1>
        <p class="mt-2 text-sm text-slate-500">Đăng nhập để tiếp tục hành trình học tập</p>
      </div>

      <!-- Demo Accounts for Recruiters & Reviewers -->
      <div class="rounded-xl border border-dashed border-purple-300 bg-purple-50/60 p-4 dark:border-purple-800/80 dark:bg-purple-950/30">
        <div class="mb-3 flex items-center justify-between">
          <span class="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
            Tài khoản Demo (Nhà tuyển dụng)
          </span>
          <span class="text-[11px] text-slate-500 dark:text-slate-400">
            Pass: <code class="rounded bg-white/90 px-1.5 py-0.5 font-mono font-semibold text-purple-900 shadow-xs dark:bg-slate-800 dark:text-purple-200">Password123</code>
          </span>
        </div>

        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="acc in demoAccounts"
            :key="acc.role"
            type="button"
            :disabled="loading"
            :title="`Đăng nhập nhanh với vai trò ${acc.name}: ${acc.description}`"
            @click="selectDemoAccount(acc)"
            class="group relative flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-white px-2 py-3 text-center shadow-xs transition hover:-translate-y-0.5 hover:shadow-md disabled:pointer-events-none disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900"
            :class="acc.borderClass"
          >
            <span class="text-xs font-bold text-slate-800 dark:text-slate-100">{{ acc.name }}</span>
            <span class="mt-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">{{ acc.roleLabel }}</span>
            <span class="mt-2 inline-flex items-center rounded-md border px-1.5 py-0.5 text-[9px] font-semibold transition group-hover:scale-105" :class="acc.badgeClass">
              1-Click ➔
            </span>
          </button>
        </div>
        <p class="mt-2 text-center text-[11px] text-slate-500 dark:text-slate-400">
          Bấm vào thẻ vai trò để tự động điền & đăng nhập ngay tức thì.
        </p>
      </div>

      <p v-if="$route.query.registered" class="border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">Đăng ký thành công. Hãy kiểm tra email để xác minh tài khoản.</p>
      <p v-if="$route.query.reset" class="border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">Mật khẩu đã được đặt lại. Bạn có thể đăng nhập.</p>
      <p v-if="$route.query.expired" class="border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.</p>

      <div class="flex items-center justify-center gap-3" aria-label="Đăng nhập bằng mạng xã hội">
        <GitHubSignInButton />
        <GoogleSignInButton @credential="loginWithGoogle" @error="error = $event" />
      </div>

      <div class="flex items-center gap-3">
        <span class="h-px flex-1 bg-slate-200 dark:bg-slate-700"/>
        <span class="text-xs text-slate-400">hoặc dùng email</span>
        <span class="h-px flex-1 bg-slate-200 dark:bg-slate-700"/>
      </div>

      <form class="space-y-5" @submit.prevent="submit">
        <BaseInput id="email" v-model="email" type="email" label="Email" placeholder="ban@gmail.com" :error="emailError" required @blur="validateEmail" @input="validateEmail" />
        <div>
          <BaseInput id="password" v-model="password" type="password" label="Mật khẩu" required />
          <div class="mt-2 text-right">
            <RouterLink to="/forgot-password" class="text-xs font-bold text-purple-600">Quên mật khẩu?</RouterLink>
          </div>
        </div>
        <p v-if="error" class="border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{{ error }}</p>
        <BaseButton type="submit" :loading="loading" :full-width="true">Đăng nhập</BaseButton>
      </form>

      <p class="text-center text-sm">Chưa có tài khoản? <RouterLink to="/register" class="font-bold text-purple-600">Đăng ký</RouterLink></p>
    </div>
  </AuthLayout>
</template>
