<template>
  <footer class="mt-auto border-t border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-950">
    <div class="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row sm:px-6 lg:px-8">
      <div class="flex items-center gap-2" aria-label="Mạng xã hội">
        <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" class="social-link" aria-label="Facebook" title="Facebook">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.7 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.5 1.6-1.5H17V3.9a23 23 0 0 0-2.4-.1c-2.4 0-4.1 1.5-4.1 4.2v2H7.8v3h2.7v8h3.2Z" /></svg>
        </a>
        <a href="https://zalo.me" target="_blank" rel="noopener noreferrer" class="social-link text-[10px] font-black tracking-[-0.04em]" aria-label="Zalo" title="Zalo">Zalo</a>
        <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" class="social-link" aria-label="Instagram" title="Instagram">
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>
        </a>
      </div>
      <p class="text-center text-xs leading-5 text-slate-500 dark:text-slate-400 sm:text-right">© {{ new Date().getFullYear() }}. Học tập không giới hạn.</p>
    </div>
  </footer>
</template>

<style scoped>
.social-link {
  display: grid;
  width: 2.5rem;
  height: 2.5rem;
  place-items: center;
  border: 1px solid rgb(226 232 240);
  border-radius: 0.75rem;
  color: rgb(71 85 105);
  transition: border-color 180ms ease, color 180ms ease, transform 180ms ease, background-color 180ms ease;
}
.social-link:hover {
  transform: translateY(-2px);
  border-color: rgb(196 181 253);
  background: rgb(245 243 255);
  color: rgb(109 40 217);
}
.social-link svg { width: 1.25rem; height: 1.25rem; }
:global(.dark) .social-link { border-color: rgb(51 65 85); color: rgb(203 213 225); }
:global(.dark) .social-link:hover { border-color: rgb(124 58 237); background: rgb(46 16 101 / 0.45); color: rgb(196 181 253); }
</style>
