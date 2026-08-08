<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20 relative overflow-hidden transition-colors duration-300">
    <!-- Decorative Background -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-indigo-200/40 to-purple-200/40 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-full blur-3xl" />
      <div class="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-purple-200/40 to-pink-200/40 dark:from-purple-900/20 dark:to-pink-900/20 rounded-full blur-3xl" />
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-indigo-100/20 to-purple-100/20 dark:from-indigo-950/10 dark:to-purple-950/10 rounded-full blur-3xl" />
    </div>

    <!-- Content -->
    <div class="relative z-10 w-full max-w-md px-4 py-8">
      <!-- Logo -->
      <div class="text-center mb-8">
        <router-link to="/" class="inline-flex items-center gap-2.5 group">
          <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/30 transition-transform group-hover:scale-110">
            <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <span class="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            LMS Platform
          </span>
        </router-link>
      </div>

      <!-- Card -->
      <div class="bg-white/80 dark:bg-slate-900/85 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-white/50 dark:border-slate-800 p-8 transition-colors duration-300">
        <slot />
      </div>
    </div>
  </div>
</template>
