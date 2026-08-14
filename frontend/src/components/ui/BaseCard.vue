<script setup lang="ts">
withDefaults(defineProps<{
  padding?: 'none' | 'sm' | 'md' | 'lg'
  interactive?: boolean
  muted?: boolean
}>(), {
  padding: 'md',
  interactive: false,
  muted: false,
})
</script>

<template>
  <div
    :class="[
      'rounded-2xl border transition-[border-color,box-shadow,transform,background-color] duration-200',
      muted
        ? 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60'
        : 'border-slate-200/90 bg-white shadow-sm shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/10',
      interactive ? 'hover:-translate-y-0.5 hover:border-purple-200 hover:shadow-lg hover:shadow-slate-900/8 dark:hover:border-purple-800' : '',
      padding === 'sm' ? 'p-4' : '',
      padding === 'md' ? 'p-5 sm:p-6' : '',
      padding === 'lg' ? 'p-6 sm:p-8' : '',
    ]"
  >
    <slot />
  </div>
</template>
