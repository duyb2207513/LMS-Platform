<script setup lang="ts">
import { useThemeStore } from '@/stores/theme'
const themeStore = useThemeStore()
</script>

<template>
  <button
    type="button"
    class="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/20 bg-white/10 text-white shadow-sm backdrop-blur-md transition-[background-color,border-color,color] duration-200 hover:border-white/40 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
    :title="themeStore.isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'"
    :aria-label="themeStore.isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'"
    @click="themeStore.toggleTheme"
  >
    <svg v-if="themeStore.isDark" class="h-5 w-5 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.36-6.36-.7.7M6.34 17.66l-.7.7m0-12.72.7.7m12.72 12.72.7-.7M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" />
    </svg>
    <svg v-else class="h-5 w-5 text-violet-100" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M20.35 15.35A9 9 0 0 1 8.65 3.65 9 9 0 1 0 20.35 15.35Z" />
    </svg>
  </button>
</template>
