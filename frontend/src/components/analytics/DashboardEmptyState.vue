<script setup lang="ts">
defineProps<{
  title?: string
  message?: string
  icon?: string
}>()
</script>

<template>
  <div class="surface-card flex flex-col items-center justify-center p-12 text-center">
    <span class="grid h-16 w-16 place-items-center rounded-2xl bg-purple-50 text-3xl text-purple-600 dark:bg-purple-950/40 dark:text-purple-300">
      {{ icon || '📊' }}
    </span>
    <h3 class="mt-4 text-lg font-extrabold text-slate-900 dark:text-white">
      {{ title || 'Chưa có dữ liệu phân tích' }}
    </h3>
    <p class="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
      {{ message || 'Dữ liệu sẽ bắt đầu xuất hiện khi có hoạt động học tập hoặc ghi danh mới.' }}
    </p>
  </div>
</template>
