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
  // {
  //   label: 'Học tập',
  //   items: [
  //     { label: 'Phân tích tiến độ', to: '/dashboard/analytics', icon: 'chart' },
  //   ],
  // },
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
      { label: 'Hồ sơ của tôi', to: '/profile', icon: 'user' },
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
  'sidebar-link group flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition',
  activePath.value === path
    ? 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200'
    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
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
      'fixed inset-y-0 left-0 z-50 flex w-[17rem] flex-col border-r border-slate-200 bg-white shadow-xl transition-[width,transform] duration-300 dark:border-slate-800 dark:bg-slate-900 lg:bottom-0 lg:top-[4.5rem] lg:z-20 lg:h-auto lg:translate-x-0 lg:shadow-none',
      collapsed ? 'lg:w-[5.25rem]' : 'lg:w-[17rem]',
      open ? 'translate-x-0' : '-translate-x-full',
    ]"
    aria-label="Điều hướng học viên"
  >
    <button
      type="button"
      class="absolute right-0 top-3 z-10 hidden h-12 w-7 place-items-center rounded-l-full border border-r-0 border-slate-200 bg-slate-50 text-slate-600 shadow-sm transition hover:border-violet-300 hover:bg-violet-100 hover:text-violet-700 lg:grid dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
      :aria-label="collapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'"
      :title="collapsed ? 'Mở rộng menu' : 'Thu gọn menu'"
      @click="emit('toggleCollapse')"
    >
      <svg class="h-4 w-4 transition-transform duration-300" :class="collapsed ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.25" d="m15 18-6-6 6-6" />
      </svg>
    </button>

    <div class="flex h-[4.5rem] items-center justify-between border-b border-slate-100 px-4 dark:border-slate-800 lg:hidden">
      <b class="text-sm text-violet-700 dark:text-violet-300">Không gian học tập</b>
      <button type="button" class="grid h-9 w-9 place-items-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Đóng menu" @click="emit('close')">×</button>
    </div>

    <div class="border-b border-slate-100 p-4 dark:border-slate-800" :class="collapsed ? 'lg:px-3 lg:py-4' : ''">
      <div class="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800" :class="collapsed ? 'lg:justify-center lg:p-2' : ''">
        <img v-if="auth.user?.avatarUrl" :src="assetUrl(auth.user.avatarUrl)" alt="" class="h-11 w-11 rounded-xl object-cover" />
        <span v-else class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-violet-700 text-sm font-black text-white">{{ auth.userInitials }}</span>
        <div class="min-w-0" :class="collapsed ? 'lg:hidden' : ''">
          <p class="truncate text-sm font-bold text-slate-950 dark:text-white">{{ auth.user?.fullName }}</p>
          <p class="mt-0.5 truncate text-xs text-slate-500">{{ auth.user?.email }}</p>
          <span class="mt-2 inline-flex rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-black text-violet-700 dark:bg-violet-950 dark:text-violet-300">HỌC VIÊN</span>
        </div>
      </div>
    </div>

    <nav class="flex-1 space-y-5 overflow-y-auto overflow-x-hidden p-3">
      <section v-for="group in groups" :key="group.label" :class="collapsed ? 'lg:border-b lg:border-slate-100 lg:pb-3 dark:lg:border-slate-800' : ''">
        <p class="mb-1.5 px-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400" :class="collapsed ? 'lg:hidden' : ''">{{ group.label }}</p>
        <div class="space-y-1">
          <RouterLink v-for="item in group.items" :key="item.to" :to="item.to" :class="[linkClass(item.to), collapsed ? 'lg:justify-center lg:px-2' : '']" :title="collapsed ? item.label : undefined" @click="emit('close')">
            <svg v-if="item.icon === 'chart'" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 19V9m5 10V5m5 14v-7m5 7V3" /></svg>
            <svg v-else-if="item.icon === 'bell'" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0a3 3 0 11-6 0" /></svg>
            <svg v-else-if="item.icon === 'message'" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h8M8 14h5m8-2a9 9 0 11-4.2-7.6L21 3v9z" /></svg>
            <svg v-else-if="item.icon === 'user'" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2m7-10a4 4 0 100-8 4 4 0 000 8zm7 0 2 2 4-4" /></svg>
            <svg v-else-if="item.icon === 'shield'" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3 4 6v5c0 5 3.4 8.7 8 10 4.6-1.3 8-5 8-10V6l-8-3zm-3 9 2 2 4-4" /></svg>
            <svg v-else-if="item.icon === 'receipt'" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 3h12v18l-3-2-3 2-3-2-3 2V3zm3 5h6m-6 4h6" /></svg>
            <svg v-else-if="item.icon === 'refund'" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m8 7-4 4 4 4m-4-4h10a5 5 0 010 10h-2" /></svg>
            <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m12 3 2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.6-4.8 2.6.9-5.4-3.9-3.8 5.4-.8L12 3z" /></svg>
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
