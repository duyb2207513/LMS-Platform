<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

export interface SidebarNavItem {
  label: string
  to: string
  icon: string
}

const props = withDefaults(defineProps<{
  items: SidebarNavItem[]
  open?: boolean
}>(), { open: false })

const emit = defineEmits<{ close: [] }>()
const route = useRoute()
const auth = useAuthStore()

const activePath = computed(() => props.items
  .filter((item) => route.path === item.to || route.path.startsWith(`${item.to}/`))
  .sort((left, right) => right.to.length - left.to.length)[0]?.to)

const roleLabel = computed(() => auth.isAdmin ? 'Quản trị viên' : auth.isInstructor ? 'Giảng viên' : 'Học viên')

function linkClasses(path: string) {
  return [
    'group flex min-h-11 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-[background-color,color,box-shadow,transform] duration-200',
    activePath.value === path
      ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-purple-500/20'
      : 'text-slate-600 hover:translate-x-0.5 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
  ]
}
</script>

<template>
  <Transition name="fade">
    <button v-if="open" type="button" class="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[2px] lg:hidden" aria-label="Đóng menu quản lý" @click="$emit('close')" />
  </Transition>

  <aside
    :class="[
      'fixed inset-y-0 left-0 z-50 flex w-[17.5rem] flex-col border-r border-slate-200 bg-white shadow-2xl shadow-slate-950/15 transition-transform duration-300 dark:border-slate-800 dark:bg-slate-900 lg:sticky lg:top-16 lg:z-20 lg:h-[calc(100vh-4rem)] lg:translate-x-0 lg:shadow-none',
      open ? 'translate-x-0' : '-translate-x-full',
    ]"
    aria-label="Điều hướng quản lý"
  >
    <div class="flex h-16 items-center justify-between border-b border-slate-100 px-4 lg:hidden dark:border-slate-800">
      <span class="text-xs font-extrabold uppercase tracking-[0.16em] text-purple-600 dark:text-purple-400">Không gian làm việc</span>
      <button type="button" class="grid h-9 w-9 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Đóng menu" @click="$emit('close')">
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18 18 6M6 6l12 12" /></svg>
      </button>
    </div>

    <div class="border-b border-slate-100 p-4 dark:border-slate-800 lg:p-5">
      <div class="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/70">
        <img v-if="auth.user?.avatarUrl" :src="auth.user.avatarUrl" alt="" class="h-11 w-11 shrink-0 rounded-xl object-cover">
        <div v-else class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 text-sm font-extrabold text-white shadow-md shadow-purple-500/20">{{ auth.userInitials }}</div>
        <div class="min-w-0">
          <p class="truncate text-sm font-bold text-slate-900 dark:text-white">{{ auth.user?.fullName }}</p>
          <p class="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{{ roleLabel }}</p>
        </div>
      </div>
    </div>

    <nav class="flex-1 space-y-1 overflow-y-auto p-3">
      <RouterLink v-for="item in items" :key="item.to" :to="item.to" :class="linkClasses(item.to)" @click="emit('close')">
        <span v-html="item.icon" class="h-5 w-5 shrink-0" aria-hidden="true" />
        <span>{{ item.label }}</span>
        <span v-if="activePath === item.to" class="ml-auto h-1.5 w-1.5 rounded-full bg-white/90" />
      </RouterLink>
    </nav>

    <div class="border-t border-slate-100 p-4 text-xs leading-5 text-slate-400 dark:border-slate-800 dark:text-slate-500">LMS Workspace · {{ new Date().getFullYear() }}</div>
  </aside>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 200ms ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
