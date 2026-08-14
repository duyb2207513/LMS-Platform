<script setup lang="ts">
defineProps<{
  count: number
  max?: number
}>()
</script>

<template>
  <span
    v-if="count > 0"
    class="inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[11px] font-black leading-none text-white shadow-sm ring-2 ring-white dark:ring-slate-900 animate-in zoom-in-50 duration-200"
  >
    {{ count > (max ?? 99) ? `${max ?? 99}+` : count }}
  </span>
</template>
