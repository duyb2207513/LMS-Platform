<script setup lang="ts">
withDefaults(defineProps<{
  compact?: boolean
  iconSize?: 'sm' | 'md' | 'lg'
}>(), {
  compact: false,
  iconSize: 'md',
})
</script>

<template>
  <RouterLink to="/" class="group inline-flex min-w-0 items-center gap-2.5" aria-label="LMS Platform - Trang chủ">
    <span
      :class="[
        'grid shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 text-white shadow-md shadow-purple-500/20 transition-transform duration-200 group-hover:-rotate-3 group-hover:scale-105',
        iconSize === 'sm' ? 'h-8 w-8' : '',
        iconSize === 'md' ? 'h-10 w-10' : '',
        iconSize === 'lg' ? 'h-12 w-12 rounded-2xl' : '',
      ]"
    >
      <svg :class="iconSize === 'lg' ? 'h-6 w-6' : 'h-5 w-5'" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 6.25v13m0-13C10.83 5.48 9.25 5 7.5 5S4.17 5.48 3 6.25v13C4.17 18.48 5.75 18 7.5 18s3.33.48 4.5 1.25m0-13C13.17 5.48 14.75 5 16.5 5S19.83 5.48 21 6.25v13C19.83 18.48 18.25 18 16.5 18s-3.33.48-4.5 1.25" />
      </svg>
    </span>
    <span v-if="!compact" class="max-[359px]:hidden truncate whitespace-nowrap bg-gradient-to-r from-violet-700 to-purple-600 bg-clip-text text-lg font-extrabold tracking-[-0.035em] text-transparent sm:text-xl dark:from-violet-400 dark:to-purple-300">
      LMS Platform
    </span>
  </RouterLink>
</template>
