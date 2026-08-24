<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import VueOfficePdf from "@vue-office/pdf";
import { Bot } from "@lucide/vue";
import { useRoute } from "vue-router";
import BaseModal from "@/components/ui/BaseModal.vue";
import BaseButton from "@/components/ui/BaseButton.vue";
import { generateAiBotResponse } from "@/utils/aiBotHelper";
import { RouterLink } from "vue-router";
import { API_BASE_URL, useApi } from "@/composables/useApi";
import { useAuthStore } from "@/stores/auth";
import { useCourseStore } from "@/stores/courses";
import { useNotificationStore } from "@/stores/notification";
import { NotificationType } from "@/types/notification";
import type {
  ApiResponse,
  DirectMessage,
  MessageContact,
  MessageConversation,
} from "@/types";
import { UserRole, UserStatus } from "@/types";

type Attachment = {
  type: "pdf" | "video" | "audio";
  name: string;
  url: string;
  size?: string;
};

const api = useApi();
const route = useRoute();
const auth = useAuthStore();
const courseStore = useCourseStore();
const notification = useNotificationStore();

// PDF Preview modal state
const previewPdf = ref<{ name: string; url: string } | null>(null);
function openPdfPreview(name: string, url: string) {
  previewPdf.value = { name, url };
}
function closePdfPreview() {
  previewPdf.value = null;
}

const isOpen = ref(false);
const search = ref("");
const conversations = ref<MessageConversation[]>([]);
const contacts = ref<MessageContact[]>([]);
const activeContact = ref<MessageContact | null>(null);
const messages = ref<DirectMessage[]>([]);
const draft = ref("");
const loadingList = ref(false);
const loadingChat = ref(false);
const sending = ref(false);
const isBotTyping = ref(false);
const error = ref("");
const messageList = ref<HTMLElement | null>(null);

// Attachments & Voice states
const pendingAttachment = ref<Attachment | null>(null);
const pdfInput = ref<HTMLInputElement | null>(null);
const videoInput = ref<HTMLInputElement | null>(null);
const isRecording = ref(false);
const recordingSeconds = ref(0);
let recordingInterval: ReturnType<typeof setInterval> | null = null;
let mediaRecorder: MediaRecorder | null = null;
let recordedChunks: Blob[] = [];

// AI Bot Contact
const AI_BOT_CONTACT: MessageContact = {
  id: "lms-ai-bot",
  fullName: "Trợ lý AI LMS",
  email: "bot@lms.local",
  role: UserRole.STUDENT,
  status: UserStatus.ACTIVE,
  avatarUrl: null,
};

function createMockDirectMessage(
  id: string,
  senderId: string,
  recipientId: string,
  content: string,
): DirectMessage {
  const now = new Date().toISOString();
  const botUser: MessageContact = {
    id: AI_BOT_CONTACT.id,
    fullName: AI_BOT_CONTACT.fullName,
    email: AI_BOT_CONTACT.email,
    role: UserRole.STUDENT,
    status: UserStatus.ACTIVE,
    avatarUrl: null,
  };
  const otherUser: MessageContact = {
    id: recipientId,
    fullName: "Học viên",
    email: "user@lms.local",
    role: UserRole.STUDENT,
    status: UserStatus.ACTIVE,
    avatarUrl: null,
  };
  return {
    id,
    senderId,
    recipientId,
    content,
    readAt: now,
    createdAt: now,
    updatedAt: now,
    sender: senderId === AI_BOT_CONTACT.id ? botUser : otherUser,
    recipient: recipientId === AI_BOT_CONTACT.id ? botUser : otherUser,
  };
}

const unreadCount = computed(() =>
  conversations.value.reduce((total, item) => total + item.unreadCount, 0),
);

const rows = computed(() => {
  const list: Array<{ contact: MessageContact; lastMessage: DirectMessage | null; unreadCount: number }> = [];

  if (!search.value.trim() || "trợ lý ai lms bot".includes(search.value.toLowerCase())) {
    list.push({
      contact: AI_BOT_CONTACT,
      lastMessage: createMockDirectMessage(
        "bot-welcome-msg",
        AI_BOT_CONTACT.id,
        auth.user?.id || "user",
        "Hỏi tôi về các khóa học, bài tập, chứng chỉ hay quy định hoàn tiền 24h!",
      ),
      unreadCount: 0,
    });
  }

  if (search.value.trim()) {
    contacts.value.forEach((contact) => {
      if (contact.id !== AI_BOT_CONTACT.id) {
        list.push({ contact, lastMessage: null, unreadCount: 0 });
      }
    });
  } else {
    conversations.value.forEach((item) => {
      if (item.contact.id !== AI_BOT_CONTACT.id) {
        list.push(item);
      }
    });
  }

  return list;
});

function avatarUrl(value?: string | null) {
  if (!value || value.startsWith("http://") || value.startsWith("https://")) {
    return value || "";
  }
  return `${API_BASE_URL.replace(/\/api\/v1$/, "")}${value.startsWith("/") ? "" : "/"}${value}`;
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatTime(value: string) {
  const date = new Date(value);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    ...(sameDay ? {} : { day: "2-digit", month: "2-digit" }),
  }).format(date);
}

function parseMessage(content: string) {
  const match = content.match(/^\[attachment:(pdf|video|audio)\|name=([^|]*)\|url=([^\]]+)\]\n?([\s\S]*)$/);
  if (!match) return { attachment: null, text: content };
  return {
    attachment: {
      type: match[1] as "pdf" | "video" | "audio",
      name: match[2],
      url: match[3],
    } as Attachment,
    text: match[4] || "",
  };
}

async function scrollToLatest(behavior: ScrollBehavior = "auto") {
  await nextTick();
  setTimeout(() => {
    if (messageList.value) {
      messageList.value.scrollTo({ top: messageList.value.scrollHeight, behavior });
    }
  }, 50);
}

async function loadConversations() {
  loadingList.value = true;
  error.value = "";
  try {
    const response = await api.get<ApiResponse<MessageConversation[]>>("/messages/conversations");
    conversations.value = response.data || [];
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : "Không thể tải tin nhắn";
  } finally {
    loadingList.value = false;
  }
}

async function searchContacts() {
  const keyword = search.value.trim();
  if (!keyword) {
    contacts.value = [];
    return;
  }
  loadingList.value = true;
  error.value = "";
  try {
    const response = await api.get<ApiResponse<MessageContact[]>>("/messages/contacts", { search: keyword });
    contacts.value = response.data || [];
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : "Không thể tìm người dùng";
  } finally {
    loadingList.value = false;
  }
}

const botSuggestions = ref<string[]>([
  "Khám phá các khóa học nổi bật",
  "Khóa học nào đang miễn phí?",
  "Chính sách hoàn tiền 24 giờ",
  "Điều kiện nhận chứng chỉ LMS",
]);

function loadAiChatHistory(): DirectMessage[] {
  const userId = auth.user?.id;
  if (!userId) {
    // Khách vãng lai: không lưu và không load từ localStorage
    return [
      createMockDirectMessage(
        "bot-init",
        AI_BOT_CONTACT.id,
        "guest",
        "Xin chào, tôi là Trợ lý Học tập AI của LMS Platform. Bạn cần giải đáp thắc mắc gì về bài giảng, khóa học, làm bài tập hay chính sách hoàn tiền 24 giờ không?",
      ),
    ];
  }

  try {
    const raw = localStorage.getItem(`lms_ai_chat_history_${userId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}

  return [
    createMockDirectMessage(
      "bot-init",
      AI_BOT_CONTACT.id,
      userId,
      "Xin chào, tôi là Trợ lý Học tập AI của LMS Platform. Bạn cần giải đáp thắc mắc gì về bài giảng, khóa học, làm bài tập hay chính sách hoàn tiền 24 giờ không?",
    ),
  ];
}

function saveAiChatHistory(msgs: DirectMessage[]) {
  const userId = auth.user?.id;
  if (!userId) return; // Khách vãng lai: bỏ qua không lưu

  try {
    localStorage.setItem(`lms_ai_chat_history_${userId}`, JSON.stringify(msgs.slice(-20)));
  } catch {}
}

function clearAiChat() {
  const userId = auth.user?.id;
  const resetMsgs = [
    createMockDirectMessage(
      "bot-init",
      AI_BOT_CONTACT.id,
      userId || "guest",
      "Tôi đã làm mới đoạn hội thoại. Bạn có thể bắt đầu đặt câu hỏi hoặc chủ đề mới cần trợ giúp.",
    ),
  ];
  messages.value = resetMsgs;
  if (userId) {
    saveAiChatHistory(resetMsgs);
  }
}

async function sendQuickPrompt(prompt: string) {
  draft.value = prompt;
  await sendMessage();
}

async function getBotAnswer(userText: string, historyPayload: Array<{ role: "user" | "model"; content: string }> = []): Promise<string> {
  console.info("[AI Widget] 💬 Sending query to /api/v1/ai/chat:", { message: userText, historyLength: historyPayload.length });
  try {
    const response = await api.post<ApiResponse<{ reply: string; suggestions?: string[] }>>("/ai/chat", {
      message: userText,
      history: historyPayload,
    });

    if (response.data?.reply) {
      console.info("[AI Widget] 🎯 Received AI response successfully:", response.data);
      if (response.data.suggestions?.length) {
        botSuggestions.value = response.data.suggestions;
      }
      return response.data.reply;
    }
  } catch (error) {
    console.error("[AI Widget] ⚠️ AI Backend API call failed:", error);
  }

  // Graceful fallback to local course knowledge
  console.warn("[AI Widget] 🔄 Fallback to local course catalog helper");
  let courseList = courseStore.courses;
  if (!courseList.length) {
    try {
      await courseStore.fetchCourses({ limit: 30 });
      courseList = courseStore.courses;
    } catch {}
  }

  return generateAiBotResponse(userText, courseList);
}

async function openConversation(contact: MessageContact) {
  activeContact.value = contact;
  loadingChat.value = true;
  error.value = "";
  pendingAttachment.value = null;

  if (contact.id === AI_BOT_CONTACT.id) {
    messages.value = loadAiChatHistory();
    loadingChat.value = false;
    await scrollToLatest();
    return;
  }

  try {
    const response = await api.get<ApiResponse<{ contact: MessageContact; messages: DirectMessage[] }>>(`/messages/${contact.id}`);
    activeContact.value = response.data?.contact || contact;
    messages.value = response.data?.messages || [];
    conversations.value = conversations.value.map((item) =>
      item.contact.id === contact.id ? { ...item, unreadCount: 0 } : item,
    );
    await scrollToLatest();
    await loadConversations();
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : "Không thể mở cuộc trò chuyện";
  } finally {
    loadingChat.value = false;
  }
}

async function refreshActiveConversation() {
  const contact = activeContact.value;
  if (!contact || loadingChat.value || contact.id === AI_BOT_CONTACT.id) return;
  try {
    const response = await api.get<ApiResponse<{ contact: MessageContact; messages: DirectMessage[] }>>(`/messages/${contact.id}`);
    activeContact.value = response.data?.contact || contact;
    messages.value = response.data?.messages || [];
    await scrollToLatest("smooth");
  } catch {}
}

function buildFinalMessageContent(rawText: string, attachment: Attachment | null): string {
  if (!attachment) return rawText.trim();
  const tag = `[attachment:${attachment.type}|name=${attachment.name}|url=${attachment.url}]`;
  return rawText.trim() ? `${tag}\n${rawText.trim()}` : tag;
}

async function sendMessage() {
  const contact = activeContact.value;
  const rawText = draft.value.trim();
  const attachment = pendingAttachment.value;
  if (!contact || (!rawText && !attachment) || sending.value) return;

  const fullContent = buildFinalMessageContent(rawText, attachment);
  sending.value = true;
  error.value = "";

  draft.value = "";
  pendingAttachment.value = null;

  if (contact.id === AI_BOT_CONTACT.id) {
    const historyPayload = messages.value
      .filter((m) => m.content && !m.content.startsWith("[attachment:"))
      .slice(-8)
      .map((m) => ({
        role: m.senderId === AI_BOT_CONTACT.id ? ("model" as const) : ("user" as const),
        content: m.content,
      }));

    const userMsg = createMockDirectMessage(
      `usr-${Date.now()}`,
      auth.user?.id || "user",
      AI_BOT_CONTACT.id,
      fullContent,
    );
    messages.value.push(userMsg);
    saveAiChatHistory(messages.value);
    await scrollToLatest("smooth");
    sending.value = false;

    isBotTyping.value = true;
    const botAnswer = await getBotAnswer(rawText, historyPayload);
    isBotTyping.value = false;
    messages.value.push(
      createMockDirectMessage(
        `bot-${Date.now()}`,
        AI_BOT_CONTACT.id,
        auth.user?.id || "user",
        botAnswer,
      ),
    );
    saveAiChatHistory(messages.value);
    await scrollToLatest("smooth");
    return;
  }

  try {
    const response = await api.post<ApiResponse<DirectMessage>>(`/messages/${contact.id}`, { content: fullContent });
    if (response.data) messages.value.push(response.data);
    await scrollToLatest("smooth");
    await loadConversations();
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : "Không thể gửi tin nhắn";
  } finally {
    sending.value = false;
  }
}

// File Attachment Handlers
function triggerPdfUpload() {
  pdfInput.value?.click();
}
function triggerVideoUpload() {
  videoInput.value?.click();
}

function onPdfSelected(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  if (file.size > 500 * 1024 * 1024) {
    error.value = "Dung lượng file PDF tối đa 500MB";
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    pendingAttachment.value = {
      type: "pdf",
      name: file.name,
      url: reader.result as string,
    };
  };
  reader.readAsDataURL(file);
  (event.target as HTMLInputElement).value = "";
}

function onVideoSelected(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  if (file.size > 500 * 1024 * 1024) {
    error.value = "Dung lượng video tối đa 500MB";
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    pendingAttachment.value = {
      type: "video",
      name: file.name,
      url: reader.result as string,
    };
  };
  reader.readAsDataURL(file);
  (event.target as HTMLInputElement).value = "";
}

// Voice Recorder Handlers
function getSupportedAudioFormat(): { mimeType: string; extension: string } {
  const preferredFormats = [
    { mimeType: "audio/mp4", extension: "mp4" },
    { mimeType: "audio/aac", extension: "aac" },
    { mimeType: "audio/mpeg", extension: "mp3" },
    { mimeType: "audio/webm;codecs=opus", extension: "webm" },
    { mimeType: "audio/webm", extension: "webm" },
    { mimeType: "audio/ogg;codecs=opus", extension: "ogg" },
    { mimeType: "audio/wav", extension: "wav" },
  ];
  for (const fmt of preferredFormats) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(fmt.mimeType)) {
      return fmt;
    }
  }
  return { mimeType: "audio/webm", extension: "webm" };
}

async function startRecording() {
  error.value = "";
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioFormat = getSupportedAudioFormat();
    recordedChunks = [];
    try {
      mediaRecorder = new MediaRecorder(stream, { mimeType: audioFormat.mimeType });
    } catch {
      mediaRecorder = new MediaRecorder(stream);
    }
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.push(e.data);
    };
    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: audioFormat.mimeType || "audio/webm" });
      const reader = new FileReader();
      reader.onloadend = () => {
        pendingAttachment.value = {
          type: "audio",
          name: `Ghi_am_${new Date().toLocaleTimeString("vi-VN").replace(/:/g, "-")}.${audioFormat.extension}`,
          url: reader.result as string,
        };
      };
      reader.readAsDataURL(blob);
      stream.getTracks().forEach((track) => track.stop());
    };
    mediaRecorder.start();
    isRecording.value = true;
    recordingSeconds.value = 0;
    recordingInterval = setInterval(() => {
      recordingSeconds.value++;
    }, 1000);
  } catch {
    error.value = "Không thể truy cập Micro. Vui lòng cho phép quyền sử dụng micro trên trình duyệt.";
  }
}

function stopRecording() {
  if (mediaRecorder && isRecording.value) {
    mediaRecorder.stop();
    isRecording.value = false;
    if (recordingInterval) clearInterval(recordingInterval);
  }
}

function cancelRecording() {
  if (mediaRecorder && isRecording.value) {
    mediaRecorder.onstop = null;
    mediaRecorder.stop();
    isRecording.value = false;
    if (recordingInterval) clearInterval(recordingInterval);
  }
}

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function showConversationList() {
  activeContact.value = null;
  messages.value = [];
  draft.value = "";
  pendingAttachment.value = null;
  error.value = "";
}

function closeWidget() {
  isOpen.value = false;
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === "Escape" && isOpen.value) closeWidget();
}

let searchTimer: ReturnType<typeof setTimeout> | undefined;
let refreshTimer: ReturnType<typeof setInterval> | undefined;

watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(searchContacts, 300);
});

watch(isOpen, async (open) => {
  if (!open) return;
  await loadConversations();
  if (activeContact.value) await scrollToLatest();
});

watch(
  () => notification.latestRealtimeNotification,
  async (latest) => {
    if (!latest || latest.type !== NotificationType.DIRECT_MESSAGE) return;
    await loadConversations();
    const senderId = String(latest.data?.senderId || "");
    if (isOpen.value && activeContact.value?.id === senderId) {
      await refreshActiveConversation();
    }
  },
);

onMounted(async () => {
  window.addEventListener("keydown", handleKeydown);
  await loadConversations();
  refreshTimer = setInterval(() => {
    if (isOpen.value) void loadConversations();
  }, 30_000);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKeydown);
  if (searchTimer) clearTimeout(searchTimer);
  if (refreshTimer) clearInterval(refreshTimer);
  if (recordingInterval) clearInterval(recordingInterval);
});
</script>

<template>
  <div v-if="route.name !== 'messages'" :class="['floating-chat', { 'floating-chat--open': isOpen }]" aria-live="polite">
    <!-- Hidden file inputs -->
    <input ref="pdfInput" type="file" accept="application/pdf" class="hidden" @change="onPdfSelected" />
    <input ref="videoInput" type="file" accept="video/mp4,video/webm,video/ogg,video/quicktime" class="hidden" @change="onVideoSelected" />

    <Transition name="chat-panel">
      <section
        v-if="isOpen"
        class="chat-panel flex flex-col overflow-hidden border border-slate-200 bg-white text-slate-900 shadow-2xl dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        aria-label="Tin nhắn"
      >
        <!-- Header -->
        <header class="flex min-h-12 items-center gap-2 border-b border-slate-200 px-3 dark:border-slate-700">
          <button
            v-if="activeContact"
            type="button"
            class="grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Quay lại danh sách trò chuyện"
            @click="showConversationList"
          >
            <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m15 18-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>

          <template v-if="activeContact">
            <span v-if="activeContact.id === AI_BOT_CONTACT.id" class="grid h-8 w-8 shrink-0 place-items-center bg-violet-700 text-white">
              <Bot :size="16" :stroke-width="2" />
            </span>
            <img v-else-if="activeContact.avatarUrl" :src="avatarUrl(activeContact.avatarUrl)" alt="" class="h-8 w-8 shrink-0 rounded-full object-cover" />
            <span v-else class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-purple-700 text-xs font-black text-white">
              {{ initials(activeContact.fullName) }}
            </span>

            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-1.5">
                <h2 class="truncate text-xs font-black">{{ activeContact.fullName }}</h2>
                <span v-if="activeContact.id === AI_BOT_CONTACT.id" class="rounded-full bg-purple-100 px-1.5 py-0.5 text-[8px] font-black text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">AI BOT</span>
              </div>
              <p :class="['text-[10px]', activeContact.id === AI_BOT_CONTACT.id ? 'text-purple-600 dark:text-purple-400 font-semibold' : 'text-emerald-600 dark:text-emerald-400']">
                {{ activeContact.id === AI_BOT_CONTACT.id ? 'Hỗ trợ 24/7' : 'Đang hoạt động' }}
              </p>
            </div>

            <!-- New Chat / Clear Session Button for AI Bot -->
            <button
              v-if="activeContact.id === AI_BOT_CONTACT.id"
              type="button"
              class="flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-50/80 px-2 py-1 text-[10px] font-bold text-purple-700 transition hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300 dark:hover:bg-purple-900/60"
              title="Làm mới đoạn hội thoại AI"
              @click="clearAiChat"
            >
              <svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M21 3v5h-5" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M3 21v-5h5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <span>Chat mới</span>
            </button>
          </template>

          <template v-else>
            <span class="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-purple-500/20">
              <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
            <div class="min-w-0 flex-1">
              <h2 class="text-sm font-black">Tin nhắn</h2>
              <p class="text-[10px] text-slate-500 dark:text-slate-400">
                {{ unreadCount ? `${unreadCount} tin chưa đọc` : "Trao đổi cùng mọi người" }}
              </p>
            </div>
            <RouterLink to="/messages" class="rounded-lg px-1.5 py-1 text-[10px] font-bold text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-950/40" @click="closeWidget">
              Mở rộng
            </RouterLink>
          </template>

          <button type="button" class="grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:hover:bg-slate-800" aria-label="Đóng cửa sổ chat" @click="closeWidget">
            <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m6 6 12 12M18 6 6 18" stroke-linecap="round" />
            </svg>
          </button>
        </header>

        <!-- Conversation / Contact List View -->
        <template v-if="!activeContact">
          <div class="border-b border-slate-100 p-2 dark:border-slate-800">
            <label class="relative block">
              <span class="sr-only">Tìm người dùng</span>
              <svg viewBox="0 0 24 24" class="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" stroke-linecap="round" />
              </svg>
              <input v-model="search" type="search" class="h-9 w-full rounded-lg border border-transparent bg-slate-100 pl-8 pr-3 text-xs outline-none transition focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-100 dark:bg-slate-800 dark:focus:bg-slate-850 dark:focus:ring-purple-900/50" placeholder="Tìm người hoặc Trợ lý AI..." />
            </label>
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto p-2">
            <div v-if="loadingList && !rows.length" class="grid h-full place-items-center">
              <span class="h-8 w-8 animate-spin rounded-full border-2 border-purple-200 border-t-purple-600" />
            </div>

            <button
              v-for="row in rows"
              v-else
              :key="row.contact.id"
              type="button"
              :class="['flex min-h-12 w-full items-center gap-2 border-b border-slate-100 p-2 text-left transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-400 dark:border-slate-800 dark:hover:bg-slate-800', row.contact.id === AI_BOT_CONTACT.id ? 'bg-purple-50/70 dark:bg-purple-950/20' : '']"
              @click="openConversation(row.contact)"
            >
              <span class="relative shrink-0">
                <span v-if="row.contact.id === AI_BOT_CONTACT.id" class="grid h-9 w-9 place-items-center bg-violet-700 text-white">
                  <Bot :size="17" :stroke-width="2" />
                </span>
                <img v-else-if="row.contact.avatarUrl" :src="avatarUrl(row.contact.avatarUrl)" alt="" class="h-9 w-9 rounded-full object-cover" />
                <span v-else class="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-purple-700 text-xs font-black text-white">
                  {{ initials(row.contact.fullName) }}
                </span>
                <span class="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-white bg-emerald-500 dark:border-slate-900" />
              </span>

              <span class="min-w-0 flex-1">
                <span class="flex items-center justify-between gap-2">
                  <b class="truncate text-xs font-black">{{ row.contact.fullName }}</b>
                  <time v-if="row.lastMessage" class="shrink-0 text-[9px] text-slate-400">
                    {{ formatTime(row.lastMessage.createdAt) }}
                  </time>
                </span>
                <span class="mt-0.5 flex items-center gap-2">
                  <span class="min-w-0 flex-1 truncate text-[10px] text-slate-500 dark:text-slate-400">
                    {{ row.lastMessage?.content || row.contact.role }}
                  </span>
                  <span v-if="row.unreadCount" class="grid min-h-4 min-w-4 shrink-0 place-items-center rounded-full bg-purple-600 px-1 text-[8px] font-black text-white">
                    {{ row.unreadCount > 99 ? "99+" : row.unreadCount }}
                  </span>
                </span>
              </span>
            </button>
          </div>
        </template>

        <!-- Active Chat Message Window -->
        <template v-else>
          <p v-if="error" class="mx-3 mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-300">
            {{ error }}
          </p>

          <div ref="messageList" class="chat-messages min-h-0 flex-1 space-y-2 overflow-y-auto bg-slate-50/70 p-2.5 dark:bg-slate-950/30">
            <div v-if="loadingChat" class="grid h-full place-items-center">
              <span class="h-8 w-8 animate-spin rounded-full border-2 border-purple-200 border-t-purple-600" />
            </div>

            <template v-else>
              <article
                v-for="message in messages"
                :key="message.id"
                :class="['flex', message.senderId === auth.user?.id ? 'justify-end' : 'justify-start']"
              >
                <div
                  :class="[
                    'max-w-[85%] rounded-xl px-3 py-2 text-xs leading-5 shadow-sm',
                    message.senderId === auth.user?.id
                      ? 'rounded-br-md bg-gradient-to-br from-violet-600 to-purple-700 text-white'
                      : 'rounded-bl-md border border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white',
                  ]"
                >
                  <!-- Attachment Display -->
                  <template v-if="parseMessage(message.content).attachment">
                    <!-- PDF -->
                    <div v-if="parseMessage(message.content).attachment?.type === 'pdf'" class="mb-2 rounded-xl border border-red-200 bg-red-50/90 p-3 text-red-950 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
                      <div class="flex items-center gap-2.5 cursor-pointer" @click="openPdfPreview(parseMessage(message.content).attachment!.name, parseMessage(message.content).attachment!.url)">
                        <span class="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-red-600 text-xs font-black text-white">PDF</span>
                        <div class="min-w-0 flex-1">
                          <p class="truncate text-xs font-bold">{{ parseMessage(message.content).attachment?.name }}</p>
                          <p class="text-[10px] opacity-75">Tài liệu PDF · Bấm để xem trực tiếp</p>
                        </div>
                      </div>
                      <div class="mt-2.5 flex items-center gap-2">
                        <button
                          type="button"
                          class="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-red-700"
                          @click="openPdfPreview(parseMessage(message.content).attachment!.name, parseMessage(message.content).attachment!.url)"
                        >
                          👁️ Xem PDF
                        </button>
                        <a
                          :href="parseMessage(message.content).attachment?.url"
                          :download="parseMessage(message.content).attachment?.name"
                          target="_blank"
                          class="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-100 dark:border-red-800 dark:bg-slate-800 dark:text-red-300 dark:hover:bg-slate-700"
                        >
                          📥 Tải về
                        </a>
                      </div>
                    </div>

                    <!-- Video -->
                    <div v-else-if="parseMessage(message.content).attachment?.type === 'video'" class="mb-2 overflow-hidden rounded-xl bg-black">
                      <video :src="parseMessage(message.content).attachment?.url" controls class="max-h-56 w-full object-contain" />
                      <p class="p-2 text-xs font-semibold text-slate-300 truncate">🎥 {{ parseMessage(message.content).attachment?.name }}</p>
                    </div>

                    <!-- Audio / Voice Message -->
                    <div v-else-if="parseMessage(message.content).attachment?.type === 'audio'" class="mb-2 rounded-xl border border-purple-200 bg-purple-50/90 p-2.5 text-slate-900 dark:border-purple-900/50 dark:bg-purple-950/40 dark:text-purple-200">
                      <div class="mb-1.5 flex items-center justify-between gap-2">
                        <p class="truncate text-xs font-bold text-purple-700 dark:text-purple-300">🎙️ {{ parseMessage(message.content).attachment?.name || 'Tin nhắn giọng nói' }}</p>
                        <a
                          :href="parseMessage(message.content).attachment?.url"
                          :download="parseMessage(message.content).attachment?.name || 'ghi_am.mp4'"
                          target="_blank"
                          class="inline-flex shrink-0 items-center gap-1 rounded-md bg-purple-600 px-2 py-1 text-[11px] font-bold text-white transition hover:bg-purple-700"
                          title="Tải ghi âm về máy"
                        >
                          📥 Tải về
                        </a>
                      </div>
                      <audio :src="parseMessage(message.content).attachment?.url" controls class="h-9 w-full max-w-[240px]" />
                    </div>
                  </template>

                  <!-- Text content -->
                  <p v-if="parseMessage(message.content).text" class="whitespace-pre-wrap break-words">
                    {{ parseMessage(message.content).text }}
                  </p>
                  <time class="mt-1 block text-[10px] opacity-65">
                    {{ formatTime(message.createdAt) }}
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

              <div v-if="!messages.length && !isBotTyping" class="grid h-full min-h-64 place-items-center text-center">
                <div>
                  <p class="text-sm font-bold">Bắt đầu cuộc trò chuyện</p>
                  <p class="mt-1 text-xs text-slate-500">
                    Gửi một lời chào đến {{ activeContact.fullName }}.
                  </p>
                </div>
              </div>
            </template>
          </div>

          <!-- Pending Attachment Preview Bar -->
          <div v-if="pendingAttachment" class="flex items-center justify-between border-t border-slate-200 bg-purple-50 px-4 py-2 dark:border-slate-800 dark:bg-purple-950/40">
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

          <!-- Quick Suggestion Chips for AI Bot -->
          <div
            v-if="activeContact.id === AI_BOT_CONTACT.id && botSuggestions.length"
            class="chat-suggestions no-scrollbar border-t border-slate-100 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/60"
          >
            <span class="chat-suggestions__label text-[10px] font-bold text-purple-600 dark:text-purple-400">Gợi ý</span>
            <button
              v-for="(suggestion, idx) in botSuggestions"
              :key="idx"
              type="button"
              class="chat-suggestion-button border border-purple-200 bg-white text-[10px] font-semibold text-slate-700 transition hover:border-purple-400 hover:bg-purple-50 hover:text-purple-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-purple-500 dark:hover:bg-purple-950/40 dark:hover:text-purple-300"
              @click="sendQuickPrompt(suggestion)"
            >
              {{ suggestion }}
            </button>
          </div>

          <!-- Composer Toolbar & Form -->
          <div class="border-t border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900">
            <!-- Voice Recording Active Bar -->
            <div v-if="isRecording" class="flex items-center justify-between rounded-2xl bg-red-50 px-4 py-2.5 dark:bg-red-950/40">
              <div class="flex items-center gap-2 text-xs font-bold text-red-600 dark:text-red-400">
                <span class="h-3 w-3 animate-ping rounded-full bg-red-600" />
                <span>Đang ghi âm giọng nói... ({{ formatDuration(recordingSeconds) }})</span>
              </div>
              <div class="flex items-center gap-2">
                <button type="button" class="rounded-lg px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800" @click="cancelRecording">
                  Hủy
                </button>
                <button type="button" class="rounded-lg bg-red-600 px-3 py-1 text-xs font-bold text-white shadow hover:bg-red-700" @click="stopRecording">
                  Xác nhận
                </button>
              </div>
            </div>

            <!-- Standard Inputs -->
            <form v-else class="flex flex-col gap-2" @submit.prevent="sendMessage">
              <div class="flex items-center gap-2">
                <!-- Action Tools -->
                <button type="button" class="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs text-slate-500 hover:bg-slate-100 hover:text-purple-600 dark:text-slate-400 dark:hover:bg-slate-800" title="Đính kèm file PDF" @click="triggerPdfUpload">
                  📄
                </button>
                <button type="button" class="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs text-slate-500 hover:bg-slate-100 hover:text-purple-600 dark:text-slate-400 dark:hover:bg-slate-800" title="Gửi video" @click="triggerVideoUpload">
                  🎥
                </button>
                <button type="button" class="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs text-slate-500 hover:bg-slate-100 hover:text-purple-600 dark:text-slate-400 dark:hover:bg-slate-800" title="Ghi âm giọng nói" @click="startRecording">
                  🎙️
                </button>

                <textarea
                  v-model="draft"
                  rows="1"
                  maxlength="5000"
                  class="max-h-20 min-h-8 min-w-0 flex-1 resize-none rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-xs text-slate-900 outline-none transition focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-purple-900/40"
                  placeholder="Nhập tin nhắn..."
                  @keydown.enter.exact.prevent="sendMessage"
                />
                <button
                  type="submit"
                  :disabled="(!draft.trim() && !pendingAttachment) || sending"
                  class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-md shadow-purple-500/20 transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:scale-100"
                  aria-label="Gửi tin nhắn"
                >
                  <span v-if="sending" class="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  <svg v-else viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="m22 2-7 20-4-9-9-4Z" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M22 2 11 13" stroke-linecap="round" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </template>
      </section>
    </Transition>

    <!-- Floating Trigger Launcher Button -->
    <button
      v-if="!isOpen"
      type="button"
      class="chat-launcher relative grid h-11 w-11 place-items-center rounded-l-xl bg-violet-700 text-white shadow-xl shadow-purple-600/25 transition duration-200 hover:-translate-x-1 focus:outline-none focus:ring-4 focus:ring-purple-300 dark:focus:ring-purple-900"
      aria-label="Mở tin nhắn"
      @click="isOpen = true"
    >
      <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M8 10h.01M12 10h.01M16 10h.01" stroke-linecap="round" stroke-width="3" />
      </svg>
      <span
        v-if="unreadCount"
        class="absolute -right-1 -top-1 grid min-h-6 min-w-6 place-items-center rounded-full border-2 border-white bg-red-500 px-1 text-[10px] font-black text-white dark:border-slate-950"
      >
        {{ unreadCount > 99 ? "99+" : unreadCount }}
      </span>
    </button>

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
  </div>
</template>

<style scoped>
.floating-chat {
  position: fixed;
  right: -0.35rem;
  bottom: env(safe-area-inset-bottom);
  z-index: 80;
}

.chat-panel {
  width: min(390px, 100vw);
  height: min(450px, calc(100dvh - 1rem));
}

.floating-chat--open {
  right: 0;
  bottom: 0;
}

.chat-messages {
  scrollbar-width: thin;
  scrollbar-color: rgb(196 181 253) transparent;
}

.chat-suggestions {
  display: flex;
  min-height: 2.75rem;
  flex: 0 0 auto;
  align-items: center;
  gap: 0.375rem;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 0.375rem 0.5rem;
}

.chat-suggestions__label {
  position: sticky;
  left: 0;
  z-index: 1;
  display: grid;
  align-self: stretch;
  flex: 0 0 auto;
  place-items: center;
  background: inherit;
  padding-inline: 0.125rem 0.25rem;
}

.chat-suggestion-button {
  display: -webkit-box;
  width: max-content;
  min-width: 5rem;
  max-width: 12rem;
  min-height: 1.75rem;
  flex: 0 0 auto;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  white-space: normal;
  overflow-wrap: anywhere;
  line-height: 0.875rem;
  padding: 0.25rem 0.5rem;
  text-align: left;
}

.chat-panel-enter-active,
.chat-panel-leave-active {
  transform-origin: bottom right;
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.chat-panel-enter-from,
.chat-panel-leave-to {
  opacity: 0;
  transform: translateY(16px) scale(0.96);
}

@media (max-width: 639px) {
  .floating-chat {
    right: -0.35rem;
    bottom: env(safe-area-inset-bottom);
  }

  .chat-panel {
    width: min(400px, 100vw);
    height: min(450px, calc(100dvh - env(safe-area-inset-bottom)));
  }

  .floating-chat--open {
    right: 0;
    bottom: 0;
  }
}
</style>
