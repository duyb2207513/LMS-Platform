<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'

type GoogleCredentialResponse = { credential: string }
type GoogleAccounts = {
  id: {
    initialize(options: { client_id: string; callback(response: GoogleCredentialResponse): void; ux_mode?: 'popup' }): void
    renderButton(parent: HTMLElement, options: Record<string, string | number>): void
  }
}
declare global { interface Window { google?: { accounts: GoogleAccounts } } }

const emit = defineEmits<{ credential: [token: string]; error: [message: string] }>()
const clientId = String(import.meta.env.VITE_GOOGLE_CLIENT_ID || '')
const buttonHost = ref<HTMLElement | null>(null)

async function renderGoogleButton() {
  await nextTick()
  if (!window.google || !buttonHost.value || !clientId) return
  buttonHost.value.replaceChildren()
  window.google.accounts.id.initialize({
    client_id: clientId,
    ux_mode: 'popup',
    callback: response => emit('credential', response.credential),
  })
  window.google.accounts.id.renderButton(buttonHost.value, {
    type: 'standard',
    theme: 'outline',
    size: 'large',
    text: 'continue_with',
    shape: 'rectangular',
    width: Math.min(400, buttonHost.value.clientWidth || 360),
    locale: 'vi',
  })
}

onMounted(() => {
  if (!clientId) {
    emit('error', 'Chưa cấu hình Google Client ID')
    return
  }
  if (window.google) {
    void renderGoogleButton()
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
  script.addEventListener('load', () => void renderGoogleButton(), { once: true })
  script.addEventListener('error', () => emit('error', 'Không thể tải cửa sổ đăng nhập Google'), { once: true })
})
</script>

<template>
  <div v-if="clientId" ref="buttonHost" class="google-button-host min-h-11 w-full overflow-hidden rounded-xl" aria-label="Tiếp tục với Google" />
</template>

<style scoped>
.google-button-host :deep(div[role='button']) { width: 100% !important; min-height: 44px; border-radius: 12px !important; }
.google-button-host :deep(iframe) { width: 100% !important; }
</style>
