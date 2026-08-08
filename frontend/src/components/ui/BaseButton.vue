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
    :class="[
      'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 cursor-pointer',
      'focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
      {
        'bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800 focus:ring-purple-500 shadow-lg shadow-purple-500/25': variant === 'primary',
        'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-purple-600 hover:text-white dark:hover:bg-purple-600 dark:hover:text-white active:bg-purple-700 focus:ring-purple-400': variant === 'secondary',
        'bg-red-500 text-white hover:bg-red-600 focus:ring-red-400 shadow-lg shadow-red-500/25': variant === 'danger',
        'text-slate-600 dark:text-slate-400 hover:bg-purple-600 hover:text-white dark:hover:bg-purple-600 dark:hover:text-white focus:ring-purple-400': variant === 'ghost',
        'border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-purple-600 hover:text-white hover:border-purple-600 dark:hover:bg-purple-600 dark:hover:text-white dark:hover:border-purple-600 active:bg-purple-700 focus:ring-purple-400': variant === 'outline',
        'px-3 py-1.5 text-sm': size === 'sm',
        'px-5 py-2.5 text-sm': size === 'md',
        'px-7 py-3.5 text-base': size === 'lg',
        'w-full': fullWidth,
      },
    ]"
  >
    <svg
      v-if="loading"
      class="animate-spin -ml-1 h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
    <slot />
  </button>
</template>