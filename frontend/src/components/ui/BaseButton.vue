<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
  type?: 'button' | 'submit' | 'reset'
}

withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  loading: false,
  disabled: false,
  fullWidth: false,
  type: 'button',
})
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :aria-busy="loading"
    :class="[
      'relative inline-flex select-none items-center justify-center gap-2 overflow-hidden rounded-xl font-semibold',
      'transition-[transform,background-color,border-color,color,box-shadow] duration-200',
      'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple-500/20',
      'disabled:pointer-events-none disabled:opacity-50 active:translate-y-px',
      {
        'border border-transparent bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-purple-500/20 hover:from-violet-700 hover:to-purple-700 hover:shadow-lg hover:shadow-purple-500/25': variant === 'primary',
        'border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-purple-200 hover:bg-purple-50 hover:text-purple-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-purple-700 dark:hover:bg-purple-950/30 dark:hover:text-purple-300': variant === 'secondary',
        'border border-transparent bg-red-600 text-white shadow-sm hover:bg-red-700 focus-visible:ring-red-500/20': variant === 'danger',
        'border border-transparent bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white': variant === 'ghost',
        'border border-slate-300 bg-transparent text-slate-700 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 dark:border-slate-700 dark:text-slate-200 dark:hover:border-purple-700 dark:hover:bg-purple-950/30 dark:hover:text-purple-300': variant === 'outline',
        'min-h-9 px-3.5 py-2 text-sm': size === 'sm',
        'min-h-11 px-5 py-2.5 text-sm': size === 'md',
        'min-h-12 px-6 py-3 text-base': size === 'lg',
        'w-full': fullWidth,
      },
    ]"
  >
    <svg v-if="loading" class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
    <span v-if="loading" class="sr-only">Đang xử lý</span>
    <slot />
  </button>
</template>
