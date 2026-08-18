<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import VueOfficePdf from '@vue-office/pdf'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { useApi } from '@/composables/useApi'
import { useAuthStore } from '@/stores/auth'
import { useCourseStore } from '@/stores/courses'
import type { ApiResponse, DirectMessage, MessageContact, MessageConversation } from '@/types'
import { UserRole, UserStatus } from '@/types'
import { generateAiBotResponse } from '@/utils/aiBotHelper'

type Attachment = {
  type: 'pdf' | 'video' | 'audio'
  name: string
  url: string
  size?: string
}

const route = useRoute(), router = useRouter(), api = useApi(), auth = useAuthStore(), courseStore = useCourseStore()
const conversations = ref<MessageConversation[]>([]), contacts = ref<MessageContact[]>([]), selected = ref<MessageContact | null>(null), messages = ref<DirectMessage[]>([])
const search = ref(''), content = ref(''), loadingChat = ref(false), sending = ref(false), isBotTyping = ref(false), error = ref(''), messageList = ref<HTMLElement | null>(null)

// PDF Preview modal state
const previewPdf = ref<{ name: string; url: string } | null>(null)
function openPdfPreview(name: string, url: string) {
  previewPdf.value = { name, url }
}
function closePdfPreview() {
  previewPdf.value = null
}

// Attachment & Voice Recorder states
const pendingAttachment = ref<Attachment | null>(null)
const pdfInput = ref<HTMLInputElement | null>(null)
const videoInput = ref<HTMLInputElement | null>(null)
const isRecording = ref(false)
const recordingSeconds = ref(0)
let recordingInterval: ReturnType<typeof setInterval> | null = null
let mediaRecorder: MediaRecorder | null = null
let recordedChunks: Blob[] = []

// AI Bot Contact
const AI_BOT_CONTACT: MessageContact = {
  id: 'lms-ai-bot',
  fullName: 'Trợ lý AI LMS',
  email: 'bot@lms.local',
  role: UserRole.STUDENT,
  status: UserStatus.ACTIVE,
  avatarUrl: null,
}

function createMockDirectMessage(id: string, senderId: string, recipientId: string, contentStr: string): DirectMessage {
  const now = new Date().toISOString()
  const botUser: MessageContact = {
    id: AI_BOT_CONTACT.id,
    fullName: AI_BOT_CONTACT.fullName,
    email: AI_BOT_CONTACT.email,
    role: UserRole.STUDENT,
    status: UserStatus.ACTIVE,
    avatarUrl: null,
  }
  const otherUser: MessageContact = {
    id: recipientId,
    fullName: 'Học viên',
    email: 'user@lms.local',
    role: UserRole.STUDENT,
    status: UserStatus.ACTIVE,
    avatarUrl: null,
  }
  return {
    id,
    senderId,
    recipientId,
    content: contentStr,
    readAt: now,
    createdAt: now,
    updatedAt: now,
    sender: senderId === AI_BOT_CONTACT.id ? botUser : otherUser,
    recipient: recipientId === AI_BOT_CONTACT.id ? botUser : otherUser,
  }
}

const selectedId = computed(() => String(route.query.userId || selected.value?.id || ''))
const visibleContacts = computed(() => {
  const list: MessageContact[] = []
  if (!search.value.trim() || 'trợ lý ai lms bot'.includes(search.value.toLowerCase())) {
    list.push(AI_BOT_CONTACT)
  }
  const rawList = search.value.trim() ? contacts.value : conversations.value.map(item => item.contact)
  rawList.forEach((c) => {
    if (c.id !== AI_BOT_CONTACT.id) list.push(c)
  })
  return list
})

function parseMessage(rawContent: string) {
  const match = rawContent.match(/^\[attachment:(pdf|video|audio)\|name=([^|]*)\|url=([^\]]+)\]\n?([\s\S]*)$/)
  if (!match) return { attachment: null, text: rawContent }
  return {
    attachment: {
      type: match[1] as 'pdf' | 'video' | 'audio',
      name: match[2],
      url: match[3],
    } as Attachment,
    text: match[4] || '',
  }
}

async function scrollToLatest(behavior: ScrollBehavior = 'auto') {
  await nextTick()
  setTimeout(() => {
    if (messageList.value) {
      messageList.value.scrollTo({ top: messageList.value.scrollHeight, behavior })
    }
  }, 50)
}

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

async function getBotAnswer(userText: string): Promise<string> {
  // Load real courses from database if not loaded
  let courseList = courseStore.courses
  if (!courseList.length) {
    try {
      await courseStore.fetchCourses({ limit: 30 })
      courseList = courseStore.courses
    } catch {}
  }

  return generateAiBotResponse(userText, courseList)
}

async function openChat(userId: string) {
  loadingChat.value = true; error.value = ''; pendingAttachment.value = null
  if (userId === AI_BOT_CONTACT.id) {
    selected.value = AI_BOT_CONTACT
    messages.value = [
      createMockDirectMessage(
        'bot-init',
        AI_BOT_CONTACT.id,
        auth.user?.id || 'user',
        '👋 Xin chào! Tôi là Trợ lý AI LMS. Bạn cần hỏi thông tin gì về các khóa học, học phí, bài tập, chứng chỉ hay chính sách hoàn tiền 24h không?',
      ),
    ]
    if (route.query.userId !== userId) await router.replace({ query: { ...route.query, userId } })
    loadingChat.value = false
    await scrollToLatest()
    return
  }

  try {
    const response = await api.get<ApiResponse<{ contact: MessageContact; messages: DirectMessage[] }>>(`/messages/${userId}`)
    selected.value = response.data?.contact || null
    messages.value = response.data?.messages || []
    if (route.query.userId !== userId) await router.replace({ query: { ...route.query, userId } })
    await scrollToLatest()
    await loadSidebar()
  } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Không thể tải tin nhắn' }
  finally { loadingChat.value = false }
}

function buildFinalMessageContent(rawText: string, attachment: Attachment | null): string {
  if (!attachment) return rawText.trim()
  const tag = `[attachment:${attachment.type}|name=${attachment.name}|url=${attachment.url}]`
  return rawText.trim() ? `${tag}\n${rawText.trim()}` : tag
}

async function send() {
  const contact = selected.value
  const rawText = content.value.trim()
  const attachment = pendingAttachment.value
  if (!contact || (!rawText && !attachment) || sending.value) return

  const fullContent = buildFinalMessageContent(rawText, attachment)
  sending.value = true; error.value = ''
  content.value = ''
  pendingAttachment.value = null

  if (contact.id === AI_BOT_CONTACT.id) {
    const userMsg = createMockDirectMessage(
      `usr-${Date.now()}`,
      auth.user?.id || 'user',
      AI_BOT_CONTACT.id,
      fullContent,
    )
    messages.value.push(userMsg)
    await scrollToLatest('smooth')
    sending.value = false

    isBotTyping.value = true
    const botAnswer = await getBotAnswer(rawText)
    setTimeout(async () => {
      isBotTyping.value = false
      messages.value.push(
        createMockDirectMessage(
          `bot-${Date.now()}`,
          AI_BOT_CONTACT.id,
          auth.user?.id || 'user',
          botAnswer,
        ),
      )
      await scrollToLatest('smooth')
    }, 700)
    return
  }

  try {
    const response = await api.post<ApiResponse<DirectMessage>>(`/messages/${contact.id}`, { content: fullContent })
    if (response.data) messages.value.push(response.data)
    await scrollToLatest('smooth')
    await loadSidebar()
  } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Không thể gửi tin nhắn' }
  finally { sending.value = false }
}

// Attachment File Trigger Handlers
function triggerPdfUpload() { pdfInput.value?.click() }
function triggerVideoUpload() { videoInput.value?.click() }

function onPdfSelected(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (file.size > 500 * 1024 * 1024) { error.value = 'Dung lượng file PDF tối đa 500MB'; return }
  const reader = new FileReader()
  reader.onload = () => { pendingAttachment.value = { type: 'pdf', name: file.name, url: reader.result as string } }
  reader.readAsDataURL(file)
  ;(event.target as HTMLInputElement).value = ''
}

function onVideoSelected(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (file.size > 500 * 1024 * 1024) { error.value = 'Dung lượng video tối đa 500MB'; return }
  const reader = new FileReader()
  reader.onload = () => { pendingAttachment.value = { type: 'video', name: file.name, url: reader.result as string } }
  reader.readAsDataURL(file)
  ;(event.target as HTMLInputElement).value = ''
}

// Voice Recorder Handlers
function getSupportedAudioFormat(): { mimeType: string; extension: string } {
  const preferredFormats = [
    { mimeType: 'audio/mp4', extension: 'mp4' },
    { mimeType: 'audio/aac', extension: 'aac' },
    { mimeType: 'audio/mpeg', extension: 'mp3' },
    { mimeType: 'audio/webm;codecs=opus', extension: 'webm' },
    { mimeType: 'audio/webm', extension: 'webm' },
    { mimeType: 'audio/ogg;codecs=opus', extension: 'ogg' },
    { mimeType: 'audio/wav', extension: 'wav' },
  ]
  for (const fmt of preferredFormats) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(fmt.mimeType)) {
      return fmt
    }
  }
  return { mimeType: 'audio/webm', extension: 'webm' }
}

async function startRecording() {
  error.value = ''
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const audioFormat = getSupportedAudioFormat()
    recordedChunks = []
    try {
      mediaRecorder = new MediaRecorder(stream, { mimeType: audioFormat.mimeType })
    } catch {
      mediaRecorder = new MediaRecorder(stream)
    }
    mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunks.push(e.data) }
    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: audioFormat.mimeType || 'audio/webm' })
      const reader = new FileReader()
      reader.onloadend = () => {
        pendingAttachment.value = {
          type: 'audio',
          name: `Ghi_am_${new Date().toLocaleTimeString('vi-VN').replace(/:/g, '-')}.${audioFormat.extension}`,
          url: reader.result as string,
        }
      }
      reader.readAsDataURL(blob)
      stream.getTracks().forEach((track) => track.stop())
    }
    mediaRecorder.start()
    isRecording.value = true
    recordingSeconds.value = 0
    recordingInterval = setInterval(() => { recordingSeconds.value++ }, 1000)
  } catch {
    error.value = 'Không thể truy cập Micro. Vui lòng cho phép quyền sử dụng micro trên trình duyệt.'
  }
}

function stopRecording() {
  if (mediaRecorder && isRecording.value) {
    mediaRecorder.stop()
    isRecording.value = false
    if (recordingInterval) clearInterval(recordingInterval)
  }
}

function cancelRecording() {
  if (mediaRecorder && isRecording.value) {
    mediaRecorder.onstop = null
    mediaRecorder.stop()
    isRecording.value = false
    if (recordingInterval) clearInterval(recordingInterval)
  }
}

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60), s = sec % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

let searchTimer: ReturnType<typeof setTimeout>
watch(search, () => { clearTimeout(searchTimer); searchTimer = setTimeout(loadSidebar, 300) })
onMounted(async () => {
  await loadSidebar()
  if (selectedId.value) await openChat(selectedId.value)
  else await openChat(AI_BOT_CONTACT.id)
})
onBeforeUnmount(() => {
  if (recordingInterval) clearInterval(recordingInterval)
})
</script>

<template>
  <DefaultLayout>
    <!-- Hidden file inputs -->
    <input ref="pdfInput" type="file" accept="application/pdf" class="hidden" @change="onPdfSelected" />
    <input ref="videoInput" type="file" accept="video/mp4,video/webm,video/ogg,video/quicktime" class="hidden" @change="onVideoSelected" />

    <main class="app-page max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
      <header class="mb-6"><p class="text-sm font-bold uppercase tracking-wider text-purple-600">Giao tiếp</p><h1 class="app-page-title mt-2">Tin nhắn</h1><p class="app-page-description">Trao đổi trực tiếp với học viên, giảng viên, quản trị viên và Trợ lý AI LMS.</p></header>
      <p v-if="error" class="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{{ error }}</p>
      
      <section class="grid min-h-[72vh] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <!-- Sidebar Contacts List -->
        <aside class="border-b border-slate-200 p-4 dark:border-slate-800 lg:border-b-0 lg:border-r">
          <input v-model="search" class="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="Tìm người dùng hoặc Trợ lý AI..." />
          <div class="mt-4 max-h-[60vh] space-y-1.5 overflow-y-auto">
            <button
              v-for="contact in visibleContacts"
              :key="contact.id"
              type="button"
              :class="[
                'flex w-full items-center gap-3 rounded-2xl p-3 text-left transition',
                selected?.id === contact.id ? 'bg-purple-100 text-purple-900 dark:bg-purple-950/50 dark:text-purple-100 font-bold' : 'hover:bg-slate-100 dark:hover:bg-slate-800',
                contact.id === AI_BOT_CONTACT.id ? 'border border-purple-200/80 bg-purple-50/40 dark:border-purple-900/40 dark:bg-purple-950/20' : ''
              ]"
              @click="openChat(contact.id)"
            >
              <span v-if="contact.id === AI_BOT_CONTACT.id" class="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-500 via-purple-600 to-fuchsia-600 text-xl shadow-md">
                🤖
              </span>
              <img v-else-if="contact.avatarUrl" :src="contact.avatarUrl" alt="" class="h-11 w-11 rounded-full object-cover">
              <span v-else class="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-purple-700 font-bold text-white">
                {{ contact.fullName.charAt(0) }}
              </span>

              <span class="min-w-0 flex-1">
                <span class="flex items-center gap-1.5">
                  <b class="block truncate text-sm">{{ contact.fullName }}</b>
                  <span v-if="contact.id === AI_BOT_CONTACT.id" class="rounded-full bg-purple-200 px-1.5 py-0.2 text-[9px] font-black text-purple-800 dark:bg-purple-900 dark:text-purple-200">AI</span>
                </span>
                <small :class="['block text-xs', contact.id === AI_BOT_CONTACT.id ? 'text-purple-600 dark:text-purple-400 font-semibold' : 'text-slate-500 dark:text-slate-400']">
                  {{ contact.id === AI_BOT_CONTACT.id ? 'Hỗ trợ tự động 24/7' : contact.role }}
                </small>
              </span>
            </button>
            <p v-if="!visibleContacts.length" class="py-10 text-center text-sm text-slate-500">Chưa có người dùng phù hợp.</p>
          </div>
        </aside>

        <!-- Main Chat Area -->
        <div v-if="selected" class="flex min-h-[72vh] min-w-0 flex-col">
          <!-- Chat Header -->
          <header class="flex items-center gap-3 border-b border-slate-200 p-4 dark:border-slate-800">
            <span v-if="selected.id === AI_BOT_CONTACT.id" class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xl shadow">
              🤖
            </span>
            <img v-else-if="selected.avatarUrl" :src="selected.avatarUrl" alt="" class="h-10 w-10 rounded-full object-cover">
            <span v-else class="grid h-10 w-10 place-items-center rounded-full bg-purple-600 font-bold text-white">
              {{ selected.fullName.charAt(0) }}
            </span>

            <div>
              <div class="flex items-center gap-2">
                <h2 class="font-black text-base">{{ selected.fullName }}</h2>
                <span v-if="selected.id === AI_BOT_CONTACT.id" class="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-black text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">AI BOT</span>
              </div>
              <p :class="['text-xs', selected.id === AI_BOT_CONTACT.id ? 'text-purple-600 dark:text-purple-400 font-semibold' : 'text-emerald-600 dark:text-emerald-400']">
                {{ selected.id === AI_BOT_CONTACT.id ? 'Sẵn sàng giải đáp 24/7' : 'Đang hoạt động' }}
              </p>
            </div>
          </header>

          <!-- Chat Messages Scroll Container -->
          <div ref="messageList" class="flex-1 space-y-3 overflow-y-auto bg-slate-50/60 p-4 dark:bg-slate-950/30 sm:p-6">
            <LoadingSpinner v-if="loadingChat" class="py-16"/>
            <template v-else>
              <article v-for="item in messages" :key="item.id" :class="['flex', item.senderId === auth.user?.id ? 'justify-end' : 'justify-start']">
                <div :class="['max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm', item.senderId === auth.user?.id ? 'rounded-br-md bg-gradient-to-br from-violet-600 to-purple-700 text-white' : 'rounded-bl-md border border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white']">
                  <!-- Attachment Display -->
                  <template v-if="parseMessage(item.content).attachment">
                    <!-- PDF -->
                    <div v-if="parseMessage(item.content).attachment?.type === 'pdf'" class="mb-2 rounded-xl border border-red-200 bg-red-50/90 p-3 text-red-950 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
                      <div class="flex items-center gap-2.5 cursor-pointer" @click="openPdfPreview(parseMessage(item.content).attachment!.name, parseMessage(item.content).attachment!.url)">
                        <span class="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-red-600 text-xs font-black text-white">PDF</span>
                        <div class="min-w-0 flex-1">
                          <p class="truncate text-xs font-bold">{{ parseMessage(item.content).attachment?.name }}</p>
                          <p class="text-[10px] opacity-75">Tài liệu PDF · Bấm để xem trực tiếp</p>
                        </div>
                      </div>
                      <div class="mt-2.5 flex items-center gap-2">
                        <button
                          type="button"
                          class="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-red-700"
                          @click="openPdfPreview(parseMessage(item.content).attachment!.name, parseMessage(item.content).attachment!.url)"
                        >
                          👁️ Xem PDF
                        </button>
                        <a
                          :href="parseMessage(item.content).attachment?.url"
                          :download="parseMessage(item.content).attachment?.name"
                          target="_blank"
                          class="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-100 dark:border-red-800 dark:bg-slate-800 dark:text-red-300 dark:hover:bg-slate-700"
                        >
                          📥 Tải về
                        </a>
                      </div>
                    </div>

                    <!-- Video -->
                    <div v-else-if="parseMessage(item.content).attachment?.type === 'video'" class="mb-2 overflow-hidden rounded-xl bg-black">
                      <video :src="parseMessage(item.content).attachment?.url" controls class="max-h-64 w-full object-contain" />
                      <p class="p-2 text-xs font-semibold text-slate-300 truncate">🎥 {{ parseMessage(item.content).attachment?.name }}</p>
                    </div>

                    <!-- Audio / Voice Message -->
                    <div v-else-if="parseMessage(item.content).attachment?.type === 'audio'" class="mb-2 rounded-xl border border-purple-200 bg-purple-50/90 p-2.5 text-slate-900 dark:border-purple-900/50 dark:bg-purple-950/40 dark:text-purple-200">
                      <div class="mb-1.5 flex items-center justify-between gap-2">
                        <p class="truncate text-xs font-bold text-purple-700 dark:text-purple-300">🎙️ {{ parseMessage(item.content).attachment?.name || 'Tin nhắn giọng nói' }}</p>
                        <a
                          :href="parseMessage(item.content).attachment?.url"
                          :download="parseMessage(item.content).attachment?.name || 'ghi_am.mp4'"
                          target="_blank"
                          class="inline-flex shrink-0 items-center gap-1 rounded-md bg-purple-600 px-2 py-1 text-[11px] font-bold text-white transition hover:bg-purple-700"
                          title="Tải ghi âm về máy"
                        >
                          📥 Tải về
                        </a>
                      </div>
                      <audio :src="parseMessage(item.content).attachment?.url" controls class="h-9 w-full max-w-[280px]" />
                    </div>
                  </template>

                  <!-- Text content -->
                  <p v-if="parseMessage(item.content).text" class="whitespace-pre-wrap break-words">
                    {{ parseMessage(item.content).text }}
                  </p>
                  <time class="mt-1 block text-[10px] opacity-65">
                    {{ new Date(item.createdAt).toLocaleString('vi-VN') }}
                  </time>
                </div>
              </article>

              <!-- Bot Typing Indicator -->
              <div v-if="isBotTyping" class="flex justify-start">
                <div class="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <span class="h-2 w-2 animate-bounce rounded-full bg-purple-600" />
                  <span class="h-2 w-2 animate-bounce rounded-full bg-purple-600 [animation-delay:0.2s]" />
                  <span class="h-2 w-2 animate-bounce rounded-full bg-purple-600 [animation-delay:0.4s]" />
                  <span>Trợ lý AI đang soạn câu trả lời...</span>
                </div>
              </div>

              <p v-if="!messages.length && !isBotTyping" class="py-16 text-center text-sm text-slate-500">
                Hãy gửi lời chào để bắt đầu cuộc trò chuyện.
              </p>
            </template>
          </div>

          <!-- Pending Attachment Preview Bar -->
          <div v-if="pendingAttachment" class="flex items-center justify-between border-t border-slate-200 bg-purple-50 px-4 py-2.5 dark:border-slate-800 dark:bg-purple-950/40">
            <div class="flex items-center gap-2 min-w-0 text-xs font-bold text-purple-900 dark:text-purple-200">
              <span v-if="pendingAttachment.type === 'pdf'">📄 PDF:</span>
              <span v-else-if="pendingAttachment.type === 'video'">🎥 Video:</span>
              <span v-else>🎙️ Ghi âm:</span>
              <span class="truncate">{{ pendingAttachment.name }}</span>
            </div>
            <button type="button" class="text-xs font-bold text-red-600 hover:underline" @click="pendingAttachment = null">
              Hủy
            </button>
          </div>

          <!-- Composer Toolbar & Form -->
          <div class="border-t border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <!-- Voice Recording Active Bar -->
            <div v-if="isRecording" class="flex items-center justify-between rounded-2xl bg-red-50 px-4 py-3 dark:bg-red-950/40">
              <div class="flex items-center gap-2 text-sm font-bold text-red-600 dark:text-red-400">
                <span class="h-3.5 w-3.5 animate-ping rounded-full bg-red-600" />
                <span>Đang ghi âm giọng nói... ({{ formatDuration(recordingSeconds) }})</span>
              </div>
              <div class="flex items-center gap-2">
                <button type="button" class="rounded-xl px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800" @click="cancelRecording">
                  Hủy
                </button>
                <button type="button" class="rounded-xl bg-red-600 px-4 py-1.5 text-xs font-bold text-white shadow hover:bg-red-700" @click="stopRecording">
                  Xác nhận
                </button>
              </div>
            </div>

            <!-- Standard Inputs -->
            <form v-else class="flex items-center gap-3" @submit.prevent="send">
              <!-- Action Tools -->
              <div class="flex items-center gap-1">
                <button type="button" class="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-lg text-slate-500 transition hover:bg-slate-100 hover:text-purple-600 dark:text-slate-400 dark:hover:bg-slate-800" title="Đính kèm file PDF" @click="triggerPdfUpload">
                  📄
                </button>
                <button type="button" class="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-lg text-slate-500 transition hover:bg-slate-100 hover:text-purple-600 dark:text-slate-400 dark:hover:bg-slate-800" title="Gửi video" @click="triggerVideoUpload">
                  🎥
                </button>
                <button type="button" class="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-lg text-slate-500 transition hover:bg-slate-100 hover:text-purple-600 dark:text-slate-400 dark:hover:bg-slate-800" title="Ghi âm giọng nói" @click="startRecording">
                  🎙️
                </button>
              </div>

              <textarea
                v-model="content"
                rows="1"
                maxlength="5000"
                class="max-h-32 min-h-11 min-w-0 flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 outline-none transition focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-purple-900/40"
                placeholder="Nhập tin nhắn..."
                @keydown.enter.exact.prevent="send"
              />
              <BaseButton type="submit" :loading="sending" :disabled="(!content.trim() && !pendingAttachment) || sending">
                Gửi
              </BaseButton>
            </form>
          </div>
        </div>

        <div v-else class="grid min-h-[50vh] place-items-center p-8 text-center">
          <div>
            <span class="text-5xl">💬</span>
            <h2 class="mt-4 text-xl font-black">Chọn một người để trò chuyện</h2>
            <p class="mt-2 text-sm text-slate-500">Tìm theo tên hoặc chọn cuộc trò chuyện gần đây.</p>
          </div>
        </div>
      </section>
    </main>

    <!-- PDF Preview Modal -->
    <BaseModal :show="Boolean(previewPdf)" :title="previewPdf?.name || 'Xem tài liệu PDF'" size="xl" @close="closePdfPreview">
      <div class="h-[75vh] w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-900">
        <VueOfficePdf v-if="previewPdf?.url" :src="previewPdf.url" class="h-full w-full" />
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <a v-if="previewPdf" :href="previewPdf.url" :download="previewPdf.name" class="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-sm font-bold text-white hover:bg-purple-700">
            📥 Tải về máy
          </a>
          <BaseButton variant="secondary" @click="closePdfPreview">Đóng</BaseButton>
        </div>
      </template>
    </BaseModal>
  </DefaultLayout>
</template>
