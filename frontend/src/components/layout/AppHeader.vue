<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import ThemeToggle from '@/components/ui/ThemeToggle.vue'

const auth = useAuthStore()
const router = useRouter()
const mobileMenuOpen = ref(false)
const profileMenuOpen = ref(false)

function handleLogout() {
  auth.logout()
  profileMenuOpen.value = false
  router.push('/login')
}

function getDashboardRoute() {
  if (auth.isAdmin) return '/admin'
  if (auth.isInstructor) return '/instructor'
  return '/dashboard'
}
</script>

<template>
  <header class="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl transition-colors duration-300">
    <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
      <!-- Logo -->
      <router-link to="/" class="flex items-center gap-2.5 group">
        <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/25 transition-transform group-hover:scale-110">
          <svg class="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <span class="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          LMS Platform
        </span>
      </router-link>

      <!-- Desktop Nav -->
      <nav class="hidden md:flex items-center gap-2">
        <router-link
          to="/"
          class="px-4 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-purple-600 hover:text-white transition-all duration-200"
          active-class="!bg-purple-600 !text-white"
        >
          Trang chủ
        </router-link>
        <router-link
          to="/courses"
          class="px-4 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-purple-600 hover:text-white transition-all duration-200"
          active-class="!bg-purple-600 !text-white"
        >
          Khóa học
        </router-link>
      </nav>

      <!-- Right Section -->
      <div class="flex items-center gap-2.5">
        <!-- Theme Toggle -->
        <ThemeToggle />

        <!-- Auth Buttons (Guest) -->
        <template v-if="!auth.isLoggedIn">
          <router-link
            to="/register"
            class="inline-flex px-5 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-purple-600 hover:text-white active:bg-purple-700 transition-all duration-200"
          >
            Đăng ký
          </router-link>
          <router-link
            to="/login"
            class="hidden sm:inline-flex px-4 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-purple-600 hover:text-white active:bg-purple-700 transition-all duration-200"
          >
            Đăng nhập
          </router-link>
        </template>

        <!-- Logged In User -->
        <template v-else>
          <router-link
            :to="getDashboardRoute()"
            class="hidden sm:inline-flex px-4 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-purple-600 hover:text-white active:bg-purple-700 transition-all duration-200"
          >
            Dashboard
          </router-link>

          <!-- Profile Dropdown -->
          <div class="relative">
            <button
              @click="profileMenuOpen = !profileMenuOpen"
              class="flex items-center gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-purple-600 hover:text-white transition-colors cursor-pointer"
            >
              <div class="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-md">
                {{ auth.userInitials }}
              </div>
              <svg class="w-4 h-4 text-slate-400 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <!-- Dropdown -->
            <Transition name="dropdown">
              <div
                v-if="profileMenuOpen"
                class="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-slate-900 shadow-xl border border-slate-100 dark:border-slate-800 py-1 z-50"
              >
                <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                  <p class="text-sm font-semibold text-slate-900 dark:text-white">{{ auth.user?.fullName }}</p>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{{ auth.user?.email }}</p>
                  <span class="inline-block mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-400">
                    {{ auth.user?.role }}
                  </span>
                </div>
                <router-link
                  :to="getDashboardRoute()"
                  @click="profileMenuOpen = false"
                  class="block px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-purple-600 hover:text-white transition-colors"
                >
                  Dashboard
                </router-link>
                <button
                  @click="handleLogout"
                  class="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                >
                  Đăng xuất
                </button>
              </div>
            </Transition>
          </div>
        </template>

        <!-- Mobile Menu Toggle -->
        <button
          @click="mobileMenuOpen = !mobileMenuOpen"
          class="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-purple-600 hover:text-white transition-colors cursor-pointer"
        >
          <svg v-if="!mobileMenuOpen" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Mobile Menu -->
    <Transition name="slide-down">
      <div v-if="mobileMenuOpen" class="md:hidden border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 pb-4 pt-2 space-y-1">
        <router-link to="/" @click="mobileMenuOpen = false" class="block py-2.5 px-3 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-purple-600 hover:text-white transition-all">Trang chủ</router-link>
        <router-link to="/courses" @click="mobileMenuOpen = false" class="block py-2.5 px-3 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-purple-600 hover:text-white transition-all">Khóa học</router-link>
        <template v-if="!auth.isLoggedIn">
          <router-link to="/register" @click="mobileMenuOpen = false" class="block py-2.5 px-3 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-purple-600 hover:text-white transition-all">Đăng ký</router-link>
          <router-link to="/login" @click="mobileMenuOpen = false" class="block py-2.5 px-3 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-purple-600 hover:text-white transition-all">Đăng nhập</router-link>
        </template>
      </div>
    </Transition>
  </header>
</template>

<style scoped>
.dropdown-enter-active, .dropdown-leave-active { transition: all 0.15s ease; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-4px) scale(0.97); }
.slide-down-enter-active, .slide-down-leave-active { transition: all 0.2s ease; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-8px); }
</style>