<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { useApi } from '@/composables/useApi'
import { useAuthStore } from '@/stores/auth'
import type { ApiResponse, DirectMessage, MessageContact, MessageConversation } from '@/types'

const route = useRoute(), router = useRouter(), api = useApi(), auth = useAuthStore()
const conversations = ref<MessageConversation[]>([]), contacts = ref<MessageContact[]>([]), selected = ref<MessageContact | null>(null), messages = ref<DirectMessage[]>([])
const search = ref(''), content = ref(''), loadingChat = ref(false), sending = ref(false), error = ref(''), messageList = ref<HTMLElement | null>(null)
const selectedId = computed(() => String(route.query.userId || selected.value?.id || ''))
const visibleContacts = computed(() => search.value.trim() ? contacts.value : conversations.value.map(item => item.contact))

async function loadSidebar() {
  try {
    const [conversationResponse, contactResponse] = await Promise.all([
      api.get<ApiResponse<MessageConversation[]>>('/messages/conversations'),
      api.get<ApiResponse<MessageContact[]>>('/messages/contacts', search.value.trim() ? { search: search.value.trim() } : undefined),
    ])
    conversations.value = conversationResponse.data || []
    contacts.value = contactResponse.data || []
  } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Không thể tải danh sách trò chuyện' }
}

async function openChat(userId: string) {
  loadingChat.value = true; error.value = ''
  try {
    const response = await api.get<ApiResponse<{ contact: MessageContact; messages: DirectMessage[] }>>(`/messages/${userId}`)
    selected.value = response.data?.contact || null
    messages.value = response.data?.messages || []
    if (route.query.userId !== userId) await router.replace({ query: { ...route.query, userId } })
    await nextTick(); messageList.value?.scrollTo({ top: messageList.value.scrollHeight })
    await loadSidebar()
  } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Không thể tải tin nhắn' }
  finally { loadingChat.value = false }
}

async function send() {
  if (!selected.value || !content.value.trim()) return
  sending.value = true; error.value = ''
  try {
    const response = await api.post<ApiResponse<DirectMessage>>(`/messages/${selected.value.id}`, { content: content.value.trim() })
    if (response.data) messages.value.push(response.data)
    content.value = ''
    await nextTick(); messageList.value?.scrollTo({ top: messageList.value.scrollHeight, behavior: 'smooth' })
    await loadSidebar()
  } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Không thể gửi tin nhắn' }
  finally { sending.value = false }
}

let searchTimer: ReturnType<typeof setTimeout>
watch(search, () => { clearTimeout(searchTimer); searchTimer = setTimeout(loadSidebar, 300) })
onMounted(async () => { await loadSidebar(); if (selectedId.value) await openChat(selectedId.value) })
</script>

<template>
  <DefaultLayout>
    <main class="app-page max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
      <header class="mb-6"><p class="text-sm font-bold uppercase tracking-wider text-purple-600">Giao tiếp</p><h1 class="app-page-title mt-2">Tin nhắn</h1><p class="app-page-description">Trao đổi trực tiếp với học viên, giảng viên và quản trị viên trên LMS.</p></header>
      <p v-if="error" class="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>
      <section class="grid min-h-[68vh] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:grid-cols-[21rem_minmax(0,1fr)]">
        <aside class="border-b border-slate-200 p-4 dark:border-slate-800 lg:border-b-0 lg:border-r">
          <input v-model="search" class="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-purple-500 dark:border-slate-700 dark:bg-slate-800" placeholder="Tìm người dùng..." />
          <div class="mt-4 max-h-[56vh] space-y-1 overflow-y-auto">
            <button v-for="contact in visibleContacts" :key="contact.id" type="button" :class="['flex w-full items-center gap-3 rounded-xl p-3 text-left transition', selected?.id === contact.id ? 'bg-purple-100 text-purple-900 dark:bg-purple-950/50 dark:text-purple-100' : 'hover:bg-slate-100 dark:hover:bg-slate-800']" @click="openChat(contact.id)">
              <img v-if="contact.avatarUrl" :src="contact.avatarUrl" alt="" class="h-11 w-11 rounded-full object-cover"><span v-else class="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-purple-700 font-bold text-white">{{ contact.fullName.charAt(0) }}</span>
              <span class="min-w-0"><b class="block truncate text-sm">{{ contact.fullName }}</b><small class="text-slate-500">{{ contact.role }}</small></span>
            </button>
            <p v-if="!visibleContacts.length" class="py-10 text-center text-sm text-slate-500">Chưa có người dùng phù hợp.</p>
          </div>
        </aside>
        <div v-if="selected" class="flex min-h-[68vh] min-w-0 flex-col">
          <header class="flex items-center gap-3 border-b border-slate-200 p-4 dark:border-slate-800"><img v-if="selected.avatarUrl" :src="selected.avatarUrl" alt="" class="h-10 w-10 rounded-full object-cover"><span v-else class="grid h-10 w-10 place-items-center rounded-full bg-purple-600 font-bold text-white">{{ selected.fullName.charAt(0) }}</span><div><h2 class="font-black">{{ selected.fullName }}</h2><p class="text-xs text-slate-500">{{ selected.role }}</p></div></header>
          <div ref="messageList" class="flex-1 space-y-3 overflow-y-auto bg-slate-50/60 p-4 dark:bg-slate-950/30 sm:p-6"><LoadingSpinner v-if="loadingChat" class="py-16"/><template v-else><article v-for="item in messages" :key="item.id" :class="['flex', item.senderId === auth.user?.id ? 'justify-end' : 'justify-start']"><div :class="['max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm', item.senderId === auth.user?.id ? 'rounded-br-md bg-purple-600 text-white' : 'rounded-bl-md border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800']"><p class="whitespace-pre-wrap break-words">{{ item.content }}</p><time class="mt-1 block text-[10px] opacity-65">{{ new Date(item.createdAt).toLocaleString('vi-VN') }}</time></div></article><p v-if="!messages.length" class="py-16 text-center text-sm text-slate-500">Hãy gửi lời chào để bắt đầu cuộc trò chuyện.</p></template></div>
          <form class="flex gap-3 border-t border-slate-200 p-4 dark:border-slate-800" @submit.prevent="send"><textarea v-model="content" rows="2" maxlength="5000" class="min-w-0 flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-purple-500 dark:border-slate-700 dark:bg-slate-800" placeholder="Nhập tin nhắn..."/><BaseButton type="submit" :loading="sending" :disabled="!content.trim()">Gửi</BaseButton></form>
        </div>
        <div v-else class="grid min-h-[50vh] place-items-center p-8 text-center"><div><span class="text-5xl">💬</span><h2 class="mt-4 text-xl font-black">Chọn một người để trò chuyện</h2><p class="mt-2 text-sm text-slate-500">Tìm theo tên hoặc chọn cuộc trò chuyện gần đây.</p></div></div>
      </section>
    </main>
  </DefaultLayout>
</template>
