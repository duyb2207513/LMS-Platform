<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

interface NavItem {
  label: string
  to: string
  icon: string
}

defineProps<{
  items: NavItem[]
}>()

const route = useRoute()
const auth = useAuthStore()

function isActive(path: string) {
  return route.path === path || route.path.startsWith(path + '/')
}
</script>

<template>
  <aside class="hidden lg:flex lg:flex-col w-64 border-r border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 min-h-[calc(100vh-4rem)] transition-colors duration-300">
    <!-- User Info -->
    <div class="p-5 border-b border-slate-100 dark:border-slate-800">
      <div class="flex items-center gap-3">
        <div class="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md">
          {{ auth.userInitials }}
        </div>
        <div class="min-w-0">
          <p class="text-sm font-semibold text-slate-900 dark:text-white truncate">{{ auth.user?.fullName }}</p>
          <p class="text-xs text-slate-500 dark:text-slate-400 truncate">{{ auth.user?.email }}</p>
        </div>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 p-3 space-y-1">
      <router-link
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        :class="[
          'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
          isActive(item.to)
            ? 'bg-purple-600 dark:bg-gradient-to-r dark:from-purple-950/30 dark:to-purple-950/30 text-white dark:text-purple-400 shadow-sm shadow-purple-500/25'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100',
        ]"
      >
        <span v-html="item.icon" class="w-5 h-5 flex-shrink-0" />
        {{ item.label }}
      </router-link>
    </nav>
  </aside>
</template>
