<script setup lang="ts">
import { formatMoney } from '@/utils/formatters'

defineProps<{
  title: string
  amount: number
  currency?: string
  description?: string
  icon?: string
  variant?: 'default' | 'success' | 'warning' | 'purple' | 'danger'
}>()
</script>

<template>
  <div class="surface-card flex flex-col justify-between p-5 transition-shadow hover:shadow-md">
    <div class="flex items-start justify-between gap-3">
      <div>
        <p class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {{ title }}
        </p>
        <p class="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          {{ formatMoney(amount, currency) }}
        </p>
      </div>

      <div
        v-if="icon"
        :class="[
          'grid h-10 w-10 shrink-0 place-items-center rounded-xl text-lg',
          variant === 'purple' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300' :
          variant === 'success' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' :
          variant === 'warning' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' :
          variant === 'danger' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300' :
          'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
        ]"
      >
        <span>{{ icon }}</span>
      </div>
    </div>

    <p v-if="description" class="mt-3 text-xs text-slate-500 dark:text-slate-400">
      {{ description }}
    </p>
  </div>
</template>
