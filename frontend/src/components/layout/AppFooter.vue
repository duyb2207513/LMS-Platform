<script setup lang="ts">
import AppBrand from '@/components/layout/AppBrand.vue'
</script>

<template>
  <footer class="mt-auto border-t border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-950">
    <div class="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row sm:px-6 lg:px-8">
      <AppBrand icon-size="sm" />
      <p class="text-center text-xs leading-5 text-slate-500 dark:text-slate-400 sm:text-right">© {{ new Date().getFullYear() }} LMS Platform. Học tập không giới hạn.</p>
    </div>
  </footer>
</template>
