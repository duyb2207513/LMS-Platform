<script setup lang="ts">
import { ref } from 'vue'
import { API_BASE_URL } from '@/composables/useApi'

const githubLoginUrl = `${API_BASE_URL}/auth/github`
const redirecting = ref(false)

function openGitHub() {
  redirecting.value = true
  window.location.assign(githubLoginUrl)
}
</script>

<template>
  <button
    type="button"
    :disabled="redirecting"
    class="flex min-h-11 w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60 dark:border-slate-600 dark:bg-white dark:text-slate-950"
    @click="openGitHub"
  >
    <svg viewBox="0 0 24 24" class="h-5 w-5" aria-hidden="true" fill="currentColor"><path d="M12 .7a11.5 11.5 0 0 0-3.64 22.41c.58.11.79-.25.79-.56v-2.23c-3.22.7-3.9-1.37-3.9-1.37-.52-1.34-1.28-1.7-1.28-1.7-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.2 1.77 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.57-.3-5.27-1.29-5.27-5.69 0-1.26.45-2.29 1.19-3.1-.12-.3-.52-1.47.11-3.06 0 0 .97-.31 3.17 1.18a10.9 10.9 0 0 1 5.78 0c2.2-1.5 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.06.74.81 1.19 1.84 1.19 3.1 0 4.41-2.71 5.39-5.29 5.68.42.36.79 1.07.79 2.16v3.2c0 .31.21.68.8.56A11.5 11.5 0 0 0 12 .7Z" /></svg>
    {{ redirecting ? 'Đang đăng nhập GitHub...' : 'Tiếp tục với GitHub' }}
  </button>
</template>
