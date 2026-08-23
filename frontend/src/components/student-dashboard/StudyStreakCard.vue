<script setup lang="ts">
import { Flame, Trophy } from '@lucide/vue'

defineProps<{
  currentStreak: number
  longestStreak: number
}>()
</script>

<template>
  <div class="surface-card flex flex-wrap items-center gap-4 border-amber-200/60 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent p-4 dark:border-amber-900/40">
    <span class="grid h-12 w-12 shrink-0 place-items-center bg-amber-500 text-white">
      <Flame :size="24" :stroke-width="2" />
    </span>

    <div class="min-w-0 flex-1">
      <p class="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">Chuỗi học tập</p>
      <div class="mt-1 flex flex-wrap items-center gap-x-5 gap-y-1">
        <p class="flex items-baseline gap-1.5">
          <strong class="text-2xl font-black text-slate-950 dark:text-white">{{ currentStreak }}</strong>
          <span class="text-sm font-semibold text-slate-600 dark:text-slate-300">ngày liên tiếp</span>
        </p>
        <p class="flex items-center gap-2 text-sm font-bold text-amber-700 dark:text-amber-300">
          <Trophy :size="17" :stroke-width="2" />
          Kỷ lục {{ longestStreak }} ngày
        </p>
      </div>
    </div>

    <p class="w-full text-xs text-slate-500 sm:w-auto dark:text-slate-400">Duy trì thói quen học mỗi ngày để nối dài kỷ lục.</p>
  </div>
</template>
