<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue'

type GoogleCredentialResponse = { credential: string }
type GoogleAccounts = {
  id: {
    initialize(options: {
      client_id: string
      callback(response: GoogleCredentialResponse): void
      ux_mode?: 'popup' | 'redirect'
      auto_select?: boolean
      cancel_on_tap_outside?: boolean
    }): void
    renderButton(parent: HTMLElement, options: Record<string, string | number>): void
    prompt?(): void
  }
}

declare global {
  interface Window {
    google?: { accounts: GoogleAccounts }
  }
}

const emit = defineEmits<{ credential: [token: string]; error: [message: string] }>()
const clientId = String(import.meta.env.VITE_GOOGLE_CLIENT_ID || '')
const googleOverlayHost = ref<HTMLElement | null>(null)
const opening = ref(false)

function handleFocus() {
  setTimeout(() => {
    opening.value = false
  }, 1200)
}

function renderGoogle() {
  if (!window.google || !googleOverlayHost.value || !clientId) return

  googleOverlayHost.value.replaceChildren()

  window.google.accounts.id.initialize({
    client_id: clientId,
    ux_mode: 'popup',
    cancel_on_tap_outside: true,
    callback: response => {
      opening.value = false
      emit('credential', response.credential)
    },
  })

  window.google.accounts.id.renderButton(googleOverlayHost.value, {
    type: 'icon',
    theme: 'outline',
    size: 'large',
    shape: 'square',
  })
}

async function initGoogleButton() {
  await nextTick()
  renderGoogle()
}

onMounted(() => {
  window.addEventListener('focus', handleFocus)
  if (!clientId) {
    emit('error', 'Chưa cấu hình Google Client ID')
    return
  }
  if (window.google) {
    void initGoogleButton()
    return
  }
  const existing = document.querySelector<HTMLScriptElement>('script[data-lms-google-identity]')
  const script = existing || document.createElement('script')
  if (!existing) {
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.dataset.lmsGoogleIdentity = 'true'
    document.head.appendChild(script)
  }
  script.addEventListener('load', () => void initGoogleButton(), { once: true })
  script.addEventListener('error', () => {
    opening.value = false
    emit('error', 'Không thể tải cửa sổ đăng nhập Google')
  }, { once: true })
})

onUnmounted(() => {
  window.removeEventListener('focus', handleFocus)
})
</script>

<template>
  <div v-if="clientId" class="group relative h-11 w-11 shrink-0" title="Tiếp tục với Google">
    <!-- Visual custom button matching GitHub button style with hover bounce effect -->
    <div
      class="auth-social-button grid h-11 w-11 place-items-center rounded-full border border-slate-300 bg-white text-slate-700 transition group-hover:border-purple-500 group-hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
    >
      <svg class="h-[18px] w-[18px]" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
      </svg>
      <span v-if="opening" class="sr-only">Đang mở Google...</span>
    </div>

    <!-- Invisible Google SDK button overlay so click directly opens Google login popup natively -->
    <div
      ref="googleOverlayHost"
      class="google-overlay absolute inset-0 z-10 h-full w-full cursor-pointer overflow-hidden rounded-full opacity-0"
      aria-label="Tiếp tục với Google"
      @click="opening = true"
    />
  </div>
</template>

<style scoped>
.google-overlay :deep(div[role='button']),
.google-overlay :deep(iframe) {
  width: 44px !important;
  height: 44px !important;
  min-height: 44px !important;
  cursor: pointer !important;
}
</style>
