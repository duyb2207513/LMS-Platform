<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppBrand from '@/components/layout/AppBrand.vue'
import ThemeToggle from '@/components/ui/ThemeToggle.vue'
import NotificationBell from '@/components/notifications/NotificationBell.vue'
import { useAuthStore } from '@/stores/auth'

const props = withDefaults(defineProps<{ workspace?: boolean }>(), { workspace: false })
const emit = defineEmits<{ toggleWorkspace: [] }>()
const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const mobileMenuOpen = ref(false)
const profileOpen = ref(false)

const dashboardPath = () => auth.isAdmin ? '/admin' : auth.isInstructor ? '/instructor' : '/dashboard'
const mainLinkClass = (path: string) => {
  const active = path === '/' ? route.path === '/' : route.path === path || route.path.startsWith(`${path}/`)
  return [
    'rounded-xl px-4 py-2 text-sm font-semibold transition-colors',
    active
      ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
  ]
}

async function logout() {
  await auth.logout()
  profileOpen.value = false
  mobileMenuOpen.value = false
  await router.push('/login')
}

function toggleMobileNavigation() {
  profileOpen.value = false
  if (props.workspace) emit('toggleWorkspace')
  else mobileMenuOpen.value = !mobileMenuOpen.value
}

watch(() => route.fullPath, () => {
  mobileMenuOpen.value = false
  profileOpen.value = false
})
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-slate-200/80 bg-white/88 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/88">
    <div class="mx-auto flex h-16 max-w-[90rem] items-center justify-between gap-3 px-3 sm:px-5 lg:px-8">
      <AppBrand />

      <nav class="hidden items-center gap-1 md:flex" aria-label="Điều hướng chính">
        <RouterLink to="/" :class="mainLinkClass('/')">Trang chủ</RouterLink>
        <RouterLink to="/courses" :class="mainLinkClass('/courses')">Khóa học</RouterLink>
        <RouterLink v-if="auth.isStudent" to="/my-courses" :class="mainLinkClass('/my-courses')">Khóa học của tôi</RouterLink>
      </nav>

      <div class="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <ThemeToggle />

        <NotificationBell v-if="auth.isLoggedIn" />

        <template v-if="!auth.isLoggedIn">
          <RouterLink to="/login" class="hidden min-h-10 items-center rounded-xl px-3.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 sm:inline-flex dark:text-slate-200 dark:hover:bg-slate-800">
            Đăng nhập
          </RouterLink>
          <RouterLink to="/register" class="inline-flex min-h-10 items-center rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-3.5 text-sm font-bold text-white shadow-md shadow-purple-500/20 transition hover:from-violet-700 hover:to-purple-700 sm:px-4">
            Đăng ký
          </RouterLink>
        </template>

        <div v-else class="relative">
          <button
            type="button"
            class="flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 pr-1.5 text-left shadow-sm transition hover:border-purple-200 hover:bg-purple-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple-500/15 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-purple-800 dark:hover:bg-purple-950/30 sm:pr-3"
            :aria-expanded="profileOpen"
            aria-haspopup="menu"
            @click="profileOpen = !profileOpen; mobileMenuOpen = false"
          >
            <img v-if="auth.user?.avatarUrl" :src="auth.user.avatarUrl" alt="" class="h-7 w-7 rounded-lg object-cover">
            <span v-else class="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 text-xs font-bold text-white">{{ auth.userInitials }}</span>
            <span class="hidden text-sm font-semibold text-slate-800 sm:block dark:text-slate-100 whitespace-nowrap">{{ auth.user?.fullName }}</span>
            <svg class="hidden h-4 w-4 text-slate-400 sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m6 9 6 6 6-6" /></svg>
          </button>

          <Transition name="dropdown">
            <div v-if="profileOpen" class="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900" role="menu">
              <div class="mb-1 rounded-xl bg-slate-50 px-3 py-3 dark:bg-slate-800/70">
                <p class="truncate text-sm font-bold text-slate-900 dark:text-white">{{ auth.user?.fullName }}</p>
                <p class="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{{ auth.user?.email }}</p>
                <span class="mt-2 inline-flex rounded-full bg-purple-100 px-2 py-1 text-[10px] font-bold tracking-wide text-purple-700 dark:bg-purple-950/50 dark:text-purple-300">{{ auth.user?.role }}</span>
              </div>
              <RouterLink :to="dashboardPath()" class="profile-link" role="menuitem">Dashboard</RouterLink>
              <RouterLink v-if="auth.isStudent" to="/dashboard/analytics" class="profile-link" role="menuitem">📊 Phân tích tiến độ</RouterLink>
              <RouterLink v-if="auth.isInstructor" to="/instructor/analytics" class="profile-link" role="menuitem">📊 Báo cáo giảng dạy</RouterLink>
              <RouterLink to="/profile" class="profile-link" role="menuitem">Hồ sơ cá nhân</RouterLink>
              <RouterLink to="/change-password" class="profile-link" role="menuitem">Đổi mật khẩu</RouterLink>
              <RouterLink to="/notifications" class="profile-link" role="menuitem">Trung tâm thông báo</RouterLink>
              <RouterLink to="/notifications/settings" class="profile-link" role="menuitem">Cài đặt thông báo</RouterLink>
              <template v-if="auth.isStudent">
                <RouterLink to="/my-courses" class="profile-link" role="menuitem">Khóa học của tôi</RouterLink>
                <RouterLink to="/orders" class="profile-link" role="menuitem">Đơn hàng</RouterLink>
                <RouterLink to="/certificates" class="profile-link" role="menuitem">Chứng chỉ</RouterLink>
              </template>
              <div class="my-1 border-t border-slate-100 dark:border-slate-800" />
              <button type="button" class="w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30" role="menuitem" @click="logout">Đăng xuất</button>
            </div>
          </Transition>
        </div>

        <button
          type="button"
          :class="['grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-purple-200 hover:bg-purple-50 hover:text-purple-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-purple-800 dark:hover:bg-purple-950/30', workspace ? 'lg:hidden' : 'md:hidden']"
          :aria-label="workspace ? 'Mở menu quản lý' : 'Mở menu điều hướng'"
          :aria-expanded="mobileMenuOpen"
          @click="toggleMobileNavigation"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7h16M4 12h16M4 17h16" /></svg>
        </button>
      </div>
    </div>

    <Transition name="mobile-nav">
      <nav v-if="mobileMenuOpen && !workspace" class="border-t border-slate-100 bg-white px-3 py-3 shadow-lg md:hidden dark:border-slate-800 dark:bg-slate-950" aria-label="Điều hướng mobile">
        <div class="mx-auto grid max-w-7xl gap-1">
          <RouterLink to="/" :class="mainLinkClass('/')">Trang chủ</RouterLink>
          <RouterLink to="/courses" :class="mainLinkClass('/courses')">Khóa học</RouterLink>
          <RouterLink v-if="auth.isStudent" to="/my-courses" :class="mainLinkClass('/my-courses')">Khóa học của tôi</RouterLink>
          <RouterLink v-if="!auth.isLoggedIn" to="/login" class="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">Đăng nhập</RouterLink>
        </div>
      </nav>
    </Transition>
  </header>
</template>

<style scoped>
.profile-link { display: block; border-radius: .75rem; padding: .625rem .75rem; font-size: .875rem; font-weight: 600; color: #475569; transition: background-color 150ms ease, color 150ms ease; }
.profile-link:hover { background: #f3e8ff; color: #6d28d9; }
:global(.dark) .profile-link { color: #cbd5e1; }
:global(.dark) .profile-link:hover { background: rgba(88, 28, 135, .28); color: #d8b4fe; }
.dropdown-enter-active, .dropdown-leave-active, .mobile-nav-enter-active, .mobile-nav-leave-active { transition: opacity 150ms ease, transform 150ms ease; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-6px) scale(.98); }
.mobile-nav-enter-from, .mobile-nav-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
