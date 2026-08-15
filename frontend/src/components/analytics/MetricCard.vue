<script setup lang="ts">
defineProps<{
  title: string
  value: string | number
  subtitle?: string
  icon?: string
  color?: 'purple' | 'blue' | 'emerald' | 'amber' | 'rose'
  trend?: string
  trendUp?: boolean
}>()
</script>

<template>
  <div class="surface-card relative overflow-hidden p-5 transition-all hover:shadow-md">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0 flex-1">
        <p class="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
          {{ title }}
        </p>
        <p class="mt-2 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          {{ value }}
        </p>
        <p v-if="subtitle" class="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {{ subtitle }}
        </p>
      </div>

      <div
        v-if="icon"
        :class="[
          'grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-xl font-bold',
          color === 'purple' || !color ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300' : '',
          color === 'blue' ? 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300' : '',
          color === 'emerald' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : '',
          color === 'amber' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' : '',
          color === 'rose' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300' : '',
        ]"
      >
        <span>{{ icon }}</span>
      </div>
    </div>

    <div v-if="trend" class="mt-3 flex items-center gap-1 text-xs font-semibold">
      <span :class="trendUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'">
        {{ trendUp ? '▲' : '▼' }} {{ trend }}
      </span>
      <span class="text-slate-400">so với kỳ trước</span>
    </div>
  </div>
</template>
