<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { API_BASE_URL } from '@/composables/useApi'
import { useAuthStore } from '@/stores/auth'

withDefaults(defineProps<{ open?: boolean; collapsed?: boolean }>(), {
  open: false,
  collapsed: false,
})
const emit = defineEmits<{ close: []; toggleCollapse: [] }>()
const route = useRoute()
const auth = useAuthStore()

const assetUrl = (url?: string | null) =>
  !url || url.startsWith('http') ? url || '' : `${API_BASE_URL.replace('/api/v1', '')}${url}`

const groups = [
  {
    label: 'Điều hướng chính',
    mobileOnly: true,
    items: [
      { label: 'Trang chủ', to: '/dashboard', icon: 'home' },
      { label: 'Khám phá', to: '/courses', icon: 'search' },
      { label: 'Khóa học của tôi', to: '/my-courses', icon: 'book' },
    ],
  },
  {
    label: 'Trao đổi',
    items: [
      { label: 'Trung tâm thông báo', to: '/notifications', icon: 'bell' },
      { label: 'Tin nhắn', to: '/messages', icon: 'message' },
    ],
  },
  {
    label: 'Tài khoản',
    items: [
      { label: 'Bảo mật & thiết bị', to: '/security', icon: 'shield' },
    ],
  },
  {
    label: 'Giao dịch & thành tích',
    items: [
      { label: 'Đơn hàng', to: '/orders', icon: 'receipt' },
      { label: 'Chứng chỉ', to: '/certificates', icon: 'certificate' },
    ],
  },
]

const activePath = computed(() =>
  groups
    .flatMap((group) => group.items)
    .filter((item) => route.path === item.to || route.path.startsWith(`${item.to}/`))
    .sort((left, right) => right.to.length - left.to.length)[0]?.to,
)

const linkClass = (path: string) => [
  'sidebar-link group flex min-h-[2.25rem] items-center gap-2.5 px-2.5 py-1.5 text-xs font-semibold transition border-l-2',
  activePath.value === path
    ? 'border-purple-600 bg-white/95 text-purple-900 font-bold shadow-xs dark:border-purple-400 dark:bg-slate-800 dark:text-purple-200'
    : 'border-transparent text-slate-700 hover:bg-white/70 hover:text-purple-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white',
]
</script>

<template>
  <Transition name="sidebar-fade">
    <button
      v-if="open"
      type="button"
      class="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
      aria-label="Đóng thanh điều hướng"
      @click="emit('close')"
    />
  </Transition>

  <aside
    :class="[
      'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-purple-200/90 bg-gradient-to-b from-purple-100/95 via-violet-50/85 to-purple-100/70 shadow-xl transition-[width,transform] duration-300 dark:border-purple-900/40 dark:from-slate-900 dark:via-purple-950/30 dark:to-slate-950 lg:bottom-0 lg:top-[4.5rem] lg:z-20 lg:h-auto lg:translate-x-0 lg:shadow-none',
      collapsed ? 'w-16 lg:w-16' : 'w-56 lg:w-56',
      open ? 'translate-x-0' : '-translate-x-full',
    ]"
    aria-label="Điều hướng học viên"
  >
    <!-- Floating Toggle Collapse Button on Border -->
    <button
      type="button"
      class="absolute -right-3 top-4 z-30 hidden h-6 w-6 place-items-center rounded-full border border-purple-300 bg-white text-purple-700 shadow-md transition-all duration-200 hover:scale-110 hover:border-purple-400 hover:bg-purple-50 hover:text-purple-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 lg:grid dark:border-purple-700 dark:bg-slate-800 dark:text-purple-300 dark:hover:bg-slate-700"
      :aria-label="collapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'"
      :title="collapsed ? 'Mở rộng menu' : 'Thu gọn menu'"
      @click="emit('toggleCollapse')"
    >
      <svg class="h-3 w-3 transition-transform duration-300" :class="collapsed ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="m15 18-6-6 6-6" />
      </svg>
    </button>

    <div class="flex h-[4.5rem] items-center justify-between border-b border-purple-200/80 px-4 dark:border-slate-800 lg:hidden">
      <b class="text-sm font-bold text-purple-800 dark:text-purple-300">Không gian học tập</b>
      <button type="button" class="grid h-9 w-9 place-items-center hover:bg-purple-200/50 dark:hover:bg-slate-800" aria-label="Đóng menu" @click="emit('close')">×</button>
    </div>

    <!-- Student Profile Card (Compact Flat Sharp Styling) -->
    <div class="border-b border-purple-200/80 p-2.5 dark:border-slate-800" :class="collapsed ? 'lg:p-2' : ''">
      <RouterLink
        to="/profile"
        :class="[
          'flex items-center gap-2.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500',
          collapsed
            ? 'lg:justify-center lg:p-0'
            : 'border border-purple-200 bg-white/95 p-2 shadow-xs hover:border-purple-400 hover:bg-white dark:border-purple-800/80 dark:bg-slate-900',
        ]"
        aria-label="Mở hồ sơ cá nhân"
        @click="emit('close')"
      >
        <img v-if="auth.user?.avatarUrl" :src="assetUrl(auth.user.avatarUrl)" alt="" class="h-8 w-8 object-cover ring-1 ring-purple-300 shrink-0" />
        <span v-else class="grid h-8 w-8 shrink-0 place-items-center bg-gradient-to-br from-violet-600 to-purple-600 text-xs font-black text-white shadow-xs">{{ auth.userInitials }}</span>
        <div class="min-w-0 flex-1" :class="collapsed ? 'lg:hidden' : ''">
          <p class="truncate text-xs font-bold text-slate-950 dark:text-white leading-tight">{{ auth.user?.fullName }}</p>
          <p class="truncate text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">{{ auth.user?.email }}</p>
          <span class="mt-1 inline-block border border-purple-300 bg-purple-100 px-1.5 py-0.2 text-[9px] font-black text-purple-800 dark:border-purple-700 dark:bg-purple-950 dark:text-purple-300 leading-none">HỌC VIÊN</span>
        </div>
      </RouterLink>
    </div>

    <!-- Navigation Menu List (Compact spacing) -->
    <nav class="flex-1 space-y-3.5 overflow-y-auto overflow-x-hidden p-2.5">
      <section v-for="group in groups" :key="group.label" :class="[collapsed ? 'lg:border-b lg:border-purple-200/80 lg:pb-2.5 dark:lg:border-slate-800' : '', group.mobileOnly ? 'lg:hidden' : '']">
        <p class="mb-1 px-2.5 text-[9px] font-black uppercase tracking-[0.14em] text-purple-700/80 dark:text-purple-300/80" :class="collapsed ? 'lg:hidden' : ''">{{ group.label }}</p>
        <div class="space-y-0.5">
          <RouterLink v-for="item in group.items" :key="item.to" :to="item.to" :class="[linkClass(item.to), collapsed ? 'lg:justify-center lg:px-2' : '']" :title="collapsed ? item.label : undefined" @click="emit('close')">
            <svg v-if="item.icon === 'home'" class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m3 11 9-8 9 8v9a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1v-9Z" /></svg>
            <svg v-else-if="item.icon === 'search'" class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" stroke-width="2"/><path stroke-linecap="round" stroke-width="2" d="m20 20-4-4"/></svg>
            <svg v-else-if="item.icon === 'book'" class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Zm16 0A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5v-16Z" /></svg>
            <svg v-else-if="item.icon === 'chart'" class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 19V9m5 10V5m5 14v-7m5 7V3" /></svg>
            <svg v-else-if="item.icon === 'bell'" class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0a3 3 0 11-6 0" /></svg>
            <svg v-else-if="item.icon === 'message'" class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h8M8 14h5m8-2a9 9 0 11-4.2-7.6L21 3v9z" /></svg>
            <svg v-else-if="item.icon === 'user'" class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2m7-10a4 4 0 100-8 4 4 0 000 8zm7 0 2 2 4-4" /></svg>
            <svg v-else-if="item.icon === 'shield'" class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3 4 6v5c0 5 3.4 8.7 8 10 4.6-1.3 8-5 8-10V6l-8-3zm-3 9 2 2 4-4" /></svg>
            <svg v-else-if="item.icon === 'receipt'" class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 3h12v18l-3-2-3 2-3-2-3 2V3zm3 5h6m-6 4h6" /></svg>
            <svg v-else-if="item.icon === 'refund'" class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m8 7-4 4 4 4m-4-4h10a5 5 0 010 10h-2" /></svg>
            <svg v-else class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m12 3 2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.6-4.8 2.6.9-5.4-3.9-3.8 5.4-.8L12 3z" /></svg>
            <span :class="collapsed ? 'lg:hidden' : ''">{{ item.label }}</span>
          </RouterLink>
        </div>
      </section>
    </nav>
  </aside>
</template>

<style scoped>
.sidebar-fade-enter-active,
.sidebar-fade-leave-active { transition: opacity 200ms ease; }
.sidebar-fade-enter-from,
.sidebar-fade-leave-to { opacity: 0; }
.sidebar-link svg { flex-shrink: 0; }
</style>
