<script setup lang="ts">
import { onMounted, ref } from 'vue'

type GoogleCredentialResponse = { credential: string }
type GoogleAccounts = { id: { initialize(options: { client_id: string; callback(response: GoogleCredentialResponse): void }): void; renderButton(element: HTMLElement, options: Record<string, unknown>): void } }
declare global { interface Window { google?: { accounts: GoogleAccounts } } }

const emit = defineEmits<{ credential: [token: string]; error: [message: string] }>()
const target = ref<HTMLElement | null>(null)
const clientId = String(import.meta.env.VITE_GOOGLE_CLIENT_ID || '')

function render() {
  if (!target.value || !window.google || !clientId) return
  window.google.accounts.id.initialize({ client_id: clientId, callback: response => emit('credential', response.credential) })
  window.google.accounts.id.renderButton(target.value, { theme: 'outline', size: 'large', width: 360, text: 'continue_with', locale: 'vi' })
}

onMounted(() => {
  if (!clientId) return
  if (window.google) return render()
  const script = document.createElement('script')
  script.src = 'https://accounts.google.com/gsi/client'
  script.async = true
  script.defer = true
  script.onload = render
  script.onerror = () => emit('error', 'Không thể tải đăng nhập Google')
  document.head.appendChild(script)
})
</script>

<template><div v-if="clientId" ref="target" class="flex min-h-11 justify-center"/></template>
