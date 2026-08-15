<template>
  <div class="space-y-6 animate-pulse">
    <!-- Metric Cards Skeleton -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div v-for="i in 4" :key="i" class="h-28 rounded-2xl bg-slate-200 dark:bg-slate-800" />
    </div>

    <!-- Chart Skeleton -->
    <div class="h-72 rounded-2xl bg-slate-200 dark:bg-slate-800" />

    <!-- Table / List Skeleton -->
    <div class="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800" />
  </div>
</template>
