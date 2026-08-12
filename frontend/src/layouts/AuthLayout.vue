<script setup lang="ts">
import AppBrand from '@/components/layout/AppBrand.vue'
</script>

<template>
  <div class="relative min-h-screen overflow-hidden bg-[var(--app-bg)]">
    <div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div class="absolute -right-32 -top-36 h-96 w-96 rounded-full bg-purple-300/25 blur-3xl dark:bg-purple-900/20" />
      <div class="absolute -bottom-44 -left-36 h-[28rem] w-[28rem] rounded-full bg-indigo-300/20 blur-3xl dark:bg-indigo-900/20" />
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,.9),transparent_58%)] dark:bg-[radial-gradient(circle_at_center,rgba(30,41,59,.35),transparent_60%)]" />
    </div>

    <RouterLink to="/" class="absolute left-4 top-4 z-20 inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-3.5 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur transition hover:border-purple-200 hover:bg-purple-50 hover:text-purple-700 sm:left-7 sm:top-7 dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-200 dark:hover:bg-purple-950/30">
      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m15 19-7-7 7-7" /></svg>
      Trở về
    </RouterLink>

    <main class="relative z-10 mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-4 py-24 sm:px-6">
      <div class="mb-7 flex justify-center"><AppBrand icon-size="lg" /></div>
      <section class="rounded-3xl border border-white/80 bg-white/88 p-6 shadow-2xl shadow-slate-900/8 backdrop-blur-xl dark:border-slate-700/80 dark:bg-slate-900/88 dark:shadow-black/30 sm:p-8">
        <slot />
      </section>
    </main>
  </div>
</template>
