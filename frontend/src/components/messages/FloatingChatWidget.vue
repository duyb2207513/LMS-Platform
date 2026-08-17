<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import { RouterLink } from "vue-router";
import { API_BASE_URL, useApi } from "@/composables/useApi";
import { useAuthStore } from "@/stores/auth";
import { useNotificationStore } from "@/stores/notification";
import { NotificationType } from "@/types/notification";
import type {
  ApiResponse,
  DirectMessage,
  MessageContact,
  MessageConversation,
} from "@/types";

const api = useApi();
const auth = useAuthStore();
const notification = useNotificationStore();

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
const error = ref("");
const messageList = ref<HTMLElement | null>(null);

const unreadCount = computed(() =>
  conversations.value.reduce((total, item) => total + item.unreadCount, 0),
);

const rows = computed(() => {
  if (search.value.trim()) {
    return contacts.value.map((contact) => ({
      contact,
      lastMessage: null,
      unreadCount: 0,
    }));
  }

  return conversations.value;
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

async function scrollToLatest(behavior: ScrollBehavior = "auto") {
  await nextTick();
  messageList.value?.scrollTo({
    top: messageList.value.scrollHeight,
    behavior,
  });
}

async function loadConversations() {
  loadingList.value = true;
  error.value = "";

  try {
    const response = await api.get<ApiResponse<MessageConversation[]>>(
      "/messages/conversations",
    );
    conversations.value = response.data || [];
  } catch (cause) {
    error.value =
      cause instanceof Error ? cause.message : "Không thể tải tin nhắn";
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
    const response = await api.get<ApiResponse<MessageContact[]>>(
      "/messages/contacts",
      { search: keyword },
    );
    contacts.value = response.data || [];
  } catch (cause) {
    error.value =
      cause instanceof Error ? cause.message : "Không thể tìm người dùng";
  } finally {
    loadingList.value = false;
  }
}

async function openConversation(contact: MessageContact) {
  activeContact.value = contact;
  loadingChat.value = true;
  error.value = "";

  try {
    const response = await api.get<
      ApiResponse<{ contact: MessageContact; messages: DirectMessage[] }>
    >(`/messages/${contact.id}`);
    activeContact.value = response.data?.contact || contact;
    messages.value = response.data?.messages || [];
    conversations.value = conversations.value.map((item) =>
      item.contact.id === contact.id ? { ...item, unreadCount: 0 } : item,
    );
    await scrollToLatest();
    await loadConversations();
  } catch (cause) {
    error.value =
      cause instanceof Error ? cause.message : "Không thể mở cuộc trò chuyện";
  } finally {
    loadingChat.value = false;
  }
}

async function refreshActiveConversation() {
  const contact = activeContact.value;
  if (!contact || loadingChat.value) return;

  try {
    const response = await api.get<
      ApiResponse<{ contact: MessageContact; messages: DirectMessage[] }>
    >(`/messages/${contact.id}`);
    activeContact.value = response.data?.contact || contact;
    messages.value = response.data?.messages || [];
    await scrollToLatest("smooth");
  } catch {
    // Giữ nội dung đang hiển thị nếu lần đồng bộ nền thất bại.
  }
}

async function sendMessage() {
  const contact = activeContact.value;
  const content = draft.value.trim();
  if (!contact || !content || sending.value) return;

  sending.value = true;
  error.value = "";

  try {
    const response = await api.post<ApiResponse<DirectMessage>>(
      `/messages/${contact.id}`,
      { content },
    );
    if (response.data) messages.value.push(response.data);
    draft.value = "";
    await scrollToLatest("smooth");
    await loadConversations();
  } catch (cause) {
    error.value =
      cause instanceof Error ? cause.message : "Không thể gửi tin nhắn";
  } finally {
    sending.value = false;
  }
}

function showConversationList() {
  activeContact.value = null;
  messages.value = [];
  draft.value = "";
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
});
</script>

<template>
  <div class="floating-chat" aria-live="polite">
    <Transition name="chat-panel">
      <section
        v-if="isOpen"
        class="chat-panel flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-2xl dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        aria-label="Tin nhắn"
      >
        <header
          class="flex min-h-16 items-center gap-3 border-b border-slate-200 px-4 dark:border-slate-700"
        >
          <button
            v-if="activeContact"
            type="button"
            class="grid h-10 w-10 shrink-0 place-items-center rounded-full text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Quay lại danh sách trò chuyện"
            @click="showConversationList"
          >
            <svg
              viewBox="0 0 24 24"
              class="h-5 w-5"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                d="m15 18-6-6 6-6"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>

          <template v-if="activeContact">
            <img
              v-if="activeContact.avatarUrl"
              :src="avatarUrl(activeContact.avatarUrl)"
              alt=""
              class="h-10 w-10 shrink-0 rounded-full object-cover"
            />
            <span
              v-else
              class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-purple-700 text-sm font-black text-white"
            >
              {{ initials(activeContact.fullName) }}
            </span>
            <div class="min-w-0 flex-1">
              <h2 class="truncate text-sm font-black">
                {{ activeContact.fullName }}
              </h2>
              <p class="text-xs text-emerald-600 dark:text-emerald-400">
                Đang hoạt động
              </p>
            </div>
          </template>

          <template v-else>
            <span
              class="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-purple-500/20"
            >
              <svg
                viewBox="0 0 24 24"
                class="h-5 w-5"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </span>
            <div class="min-w-0 flex-1">
              <h2 class="text-base font-black">Tin nhắn</h2>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                {{
                  unreadCount
                    ? `${unreadCount} tin chưa đọc`
                    : "Trao đổi cùng mọi người"
                }}
              </p>
            </div>
            <RouterLink
              to="/messages"
              class="rounded-lg px-2 py-1 text-xs font-bold text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-950/40"
              @click="closeWidget"
            >
              Mở rộng
            </RouterLink>
          </template>

          <button
            type="button"
            class="grid h-10 w-10 shrink-0 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:hover:bg-slate-800"
            aria-label="Đóng cửa sổ chat"
            @click="closeWidget"
          >
            <svg
              viewBox="0 0 24 24"
              class="h-5 w-5"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="m6 6 12 12M18 6 6 18" stroke-linecap="round" />
            </svg>
          </button>
        </header>

        <template v-if="!activeContact">
          <div class="border-b border-slate-100 p-3 dark:border-slate-800">
            <label class="relative block">
              <span class="sr-only">Tìm người dùng</span>
              <svg
                viewBox="0 0 24 24"
                class="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" stroke-linecap="round" />
              </svg>
              <input
                v-model="search"
                type="search"
                class="h-11 w-full rounded-xl border border-transparent bg-slate-100 pl-10 pr-4 text-sm outline-none transition focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-100 dark:bg-slate-800 dark:focus:bg-slate-850 dark:focus:ring-purple-900/50"
                placeholder="Tìm người để trò chuyện..."
              />
            </label>
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto p-2">
            <div
              v-if="loadingList && !rows.length"
              class="grid h-full place-items-center"
            >
              <span
                class="h-8 w-8 animate-spin rounded-full border-2 border-purple-200 border-t-purple-600"
              />
            </div>

            <button
              v-for="row in rows"
              v-else
              :key="row.contact.id"
              type="button"
              class="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-400 dark:hover:bg-slate-800"
              @click="openConversation(row.contact)"
            >
              <span class="relative shrink-0">
                <img
                  v-if="row.contact.avatarUrl"
                  :src="avatarUrl(row.contact.avatarUrl)"
                  alt=""
                  class="h-12 w-12 rounded-full object-cover"
                />
                <span
                  v-else
                  class="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-purple-700 text-sm font-black text-white"
                >
                  {{ initials(row.contact.fullName) }}
                </span>
                <span
                  class="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900"
                />
              </span>

              <span class="min-w-0 flex-1">
                <span class="flex items-center justify-between gap-2">
                  <b class="truncate text-sm">{{ row.contact.fullName }}</b>
                  <time
                    v-if="row.lastMessage"
                    class="shrink-0 text-[11px] text-slate-400"
                  >
                    {{ formatTime(row.lastMessage.createdAt) }}
                  </time>
                </span>
                <span class="mt-0.5 flex items-center gap-2">
                  <span
                    class="min-w-0 flex-1 truncate text-xs text-slate-500 dark:text-slate-400"
                  >
                    {{ row.lastMessage?.content || row.contact.role }}
                  </span>
                  <span
                    v-if="row.unreadCount"
                    class="grid min-h-5 min-w-5 shrink-0 place-items-center rounded-full bg-purple-600 px-1.5 text-[10px] font-black text-white"
                  >
                    {{ row.unreadCount > 99 ? "99+" : row.unreadCount }}
                  </span>
                </span>
              </span>
            </button>

            <div
              v-if="!loadingList && !rows.length"
              class="grid h-full min-h-64 place-items-center px-6 text-center"
            >
              <div>
                <span
                  class="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-purple-50 text-purple-500 dark:bg-purple-950/40"
                >
                  <svg
                    viewBox="0 0 24 24"
                    class="h-7 w-7"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                  >
                    <path
                      d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </span>
                <h3 class="mt-3 text-sm font-black">
                  {{
                    search.trim()
                      ? "Không tìm thấy người dùng"
                      : "Chưa có cuộc trò chuyện"
                  }}
                </h3>
                <p class="mt-1 text-xs leading-5 text-slate-500">
                  {{
                    search.trim()
                      ? "Thử tìm bằng một tên khác."
                      : "Tìm tên người dùng để bắt đầu nhắn tin."
                  }}
                </p>
              </div>
            </div>
          </div>
        </template>

        <template v-else>
          <p
            v-if="error"
            class="mx-3 mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-300"
          >
            {{ error }}
          </p>

          <div
            ref="messageList"
            class="chat-messages min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50/70 p-4 dark:bg-slate-950/30"
          >
            <div v-if="loadingChat" class="grid h-full place-items-center">
              <span
                class="h-8 w-8 animate-spin rounded-full border-2 border-purple-200 border-t-purple-600"
              />
            </div>

            <template v-else>
              <article
                v-for="message in messages"
                :key="message.id"
                :class="[
                  'flex',
                  message.senderId === auth.user?.id
                    ? 'justify-end'
                    : 'justify-start',
                ]"
              >
                <div
                  :class="[
                    'max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-5 shadow-sm',
                    message.senderId === auth.user?.id
                      ? 'rounded-br-md bg-gradient-to-br from-violet-600 to-purple-700 text-white'
                      : 'rounded-bl-md border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800',
                  ]"
                >
                  <p class="whitespace-pre-wrap break-words">
                    {{ message.content }}
                  </p>
                  <time class="mt-1 block text-[10px] opacity-65">
                    {{ formatTime(message.createdAt) }}
                  </time>
                </div>
              </article>

              <div
                v-if="!messages.length"
                class="grid h-full min-h-64 place-items-center text-center"
              >
                <div>
                  <p class="text-sm font-bold">Bắt đầu cuộc trò chuyện</p>
                  <p class="mt-1 text-xs text-slate-500">
                    Gửi một lời chào đến {{ activeContact.fullName }}.
                  </p>
                </div>
              </div>
            </template>
          </div>

          <form
            class="flex items-end gap-2 border-t border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900"
            @submit.prevent="sendMessage"
          >
            <textarea
              v-model="draft"
              rows="1"
              maxlength="5000"
              class="max-h-28 min-h-11 min-w-0 flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm outline-none transition focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-100 dark:border-slate-700 dark:bg-slate-800 dark:focus:ring-purple-900/40"
              placeholder="Nhập tin nhắn..."
              @keydown.enter.exact.prevent="sendMessage"
            />
            <button
              type="submit"
              :disabled="!draft.trim() || sending"
              class="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-purple-500/20 transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:scale-100"
              aria-label="Gửi tin nhắn"
            >
              <span
                v-if="sending"
                class="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white"
              />
              <svg
                v-else
                viewBox="0 0 24 24"
                class="h-5 w-5"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  d="m22 2-7 20-4-9-9-4Z"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path d="M22 2 11 13" stroke-linecap="round" />
              </svg>
            </button>
          </form>
        </template>
      </section>
    </Transition>

    <button
      v-if="!isOpen"
      type="button"
      class="chat-launcher relative grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 text-white shadow-xl shadow-purple-600/30 transition duration-200 hover:-translate-y-1 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-300 dark:focus:ring-purple-900"
      aria-label="Mở tin nhắn"
      @click="isOpen = true"
    >
      <svg
        viewBox="0 0 24 24"
        class="h-7 w-7"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path
          d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M8 10h.01M12 10h.01M16 10h.01"
          stroke-linecap="round"
          stroke-width="3"
        />
      </svg>
      <span
        v-if="unreadCount"
        class="absolute -right-1 -top-1 grid min-h-6 min-w-6 place-items-center rounded-full border-2 border-white bg-red-500 px-1 text-[10px] font-black text-white dark:border-slate-950"
      >
        {{ unreadCount > 99 ? "99+" : unreadCount }}
      </span>
    </button>
  </div>
</template>

<style scoped>
.floating-chat {
  position: fixed;
  right: 1.5rem;
  bottom: calc(1.5rem + env(safe-area-inset-bottom));
  z-index: 80;
}

.chat-panel {
  width: min(390px, calc(100vw - 1.5rem));
  height: min(620px, calc(100dvh - 6rem));
}

.chat-messages {
  scrollbar-width: thin;
  scrollbar-color: rgb(196 181 253) transparent;
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
    right: 0.75rem;
    bottom: calc(5.5rem + env(safe-area-inset-bottom));
  }

  .chat-panel {
    width: calc(100vw - 1.5rem);
    height: min(610px, calc(100dvh - 7rem - env(safe-area-inset-bottom)));
  }
}

@media (prefers-reduced-motion: reduce) {
  .chat-panel-enter-active,
  .chat-panel-leave-active,
  .chat-launcher {
    transition: none;
  }
}
</style>
