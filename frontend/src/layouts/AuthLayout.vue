<script setup lang="ts">
import brandIcon from '@/assets/lms-learning-logo.png'
</script>

<template>
  <div class="relative min-h-screen overflow-hidden bg-[var(--app-bg)]">
    <div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div class="absolute -right-32 -top-36 h-96 w-96 rounded-full bg-purple-300/25 blur-3xl dark:bg-purple-900/20" />
      <div class="absolute -bottom-44 -left-36 h-[28rem] w-[28rem] rounded-full bg-indigo-300/20 blur-3xl dark:bg-indigo-900/20" />
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,.9),transparent_58%)] dark:bg-[radial-gradient(circle_at_center,rgba(30,41,59,.35),transparent_60%)]" />
    </div>

    <RouterLink to="/" class="absolute left-4 top-0 z-20 grid h-10 w-10 place-items-center border border-slate-200 bg-white/90 text-slate-700 shadow-sm backdrop-blur transition hover:border-purple-200 hover:bg-purple-50 hover:text-purple-700 sm:left-7 dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-200 dark:hover:bg-purple-950/30" aria-label="Trở về trang chủ" title="Trở về trang chủ">
      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m15 19-7-7 7-7" /></svg>
    </RouterLink>

    <main class="relative z-10 mx-auto flex min-h-screen w-full max-w-lg flex-col justify-start px-4 pb-8 pt-14 sm:px-6 sm:pt-4">
      <section class="auth-card border border-slate-200 bg-white/92 p-6 shadow-xl shadow-slate-900/8 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/92 dark:shadow-black/30 sm:p-8">
        <div class="auth-brand-mark mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-black p-2 shadow-lg shadow-black/20" aria-hidden="true">
          <img :src="brandIcon" alt="" class="h-full w-full object-contain" />
        </div>
        <slot />
      </section>
    </main>
  </div>
</template>

<style scoped>
.auth-card :deep(input),
.auth-card :deep(button),
.auth-card :deep(.rounded-xl),
.auth-card :deep(.rounded-2xl),
.auth-card :deep(.rounded-3xl),
.auth-card :deep(.rounded-full){border-radius:0!important}
.auth-card .auth-brand-mark,
.auth-card :deep(.auth-social-button),
.auth-card :deep(.google-overlay){border-radius:9999px!important}
</style>
