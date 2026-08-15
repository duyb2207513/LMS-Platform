<script setup lang="ts">
defineProps<{
  currentStreak: number
  longestStreak: number
}>()
</script>

<template>
  <div class="surface-card flex items-center justify-between p-5 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border-amber-200/50 dark:border-amber-900/30">
    <div class="flex items-center gap-4">
      <span class="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-2xl text-white shadow-lg shadow-amber-500/20">
        🔥
      </span>
      <div>
        <div class="flex items-baseline gap-2">
          <span class="text-3xl font-black text-slate-900 dark:text-white">{{ currentStreak }}</span>
          <span class="text-sm font-bold text-slate-600 dark:text-slate-300">ngày liên tiếp</span>
        </div>
        <p class="mt-0.5 text-xs text-amber-700 dark:text-amber-300 font-medium">
          Duy trì thói quen học tập mỗi ngày để giữ vững chuỗi học!
        </p>
      </div>
    </div>

    <div class="hidden sm:block text-right border-l border-amber-200/40 dark:border-amber-900/40 pl-6">
      <span class="text-xs text-slate-400 font-bold uppercase tracking-wider">Kỷ lục dài nhất</span>
      <p class="text-lg font-extrabold text-amber-600 dark:text-amber-400">
        {{ longestStreak }} ngày
      </p>
    </div>
  </div>
</template>
