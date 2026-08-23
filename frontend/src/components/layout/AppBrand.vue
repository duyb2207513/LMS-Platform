<script setup lang="ts">
import brandIcon from '@/assets/lms-learning-logo.png'

withDefaults(defineProps<{
  compact?: boolean
  iconSize?: 'sm' | 'md' | 'lg'
  to?: string
}>(), {
  compact: false,
  iconSize: 'md',
  to: '/',
})
</script>

<template>
  <RouterLink :to="to" class="group inline-flex min-w-0 items-center gap-2.5" aria-label="LMS Platform">
    <span
      :class="[
        'grid shrink-0 place-items-center overflow-hidden rounded-xl bg-white shadow-md transition-transform duration-200 group-hover:-rotate-3 group-hover:scale-105',
        iconSize === 'sm' ? 'h-8 w-8' : '',
        iconSize === 'md' ? 'h-10 w-10' : '',
        iconSize === 'lg' ? 'h-12 w-12 rounded-2xl' : '',
      ]"
    >
      <img :src="brandIcon" alt="" class="h-full w-full object-contain" />
    </span>
    <span v-if="!compact" class="max-[359px]:hidden truncate whitespace-nowrap bg-gradient-to-r from-violet-700 to-purple-600 bg-clip-text text-lg font-extrabold tracking-[-0.035em] text-transparent sm:text-xl dark:from-violet-400 dark:to-purple-300">
      LMS Platform
    </span>
  </RouterLink>
</template>
