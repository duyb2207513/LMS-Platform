<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import BaseButton from "@/components/ui/BaseButton.vue";
import BaseModal from "@/components/ui/BaseModal.vue";
import { useApi } from "@/composables/useApi";
import { useAuthStore } from "@/stores/auth";
import type { ApiResponse, AuthSession } from "@/types";

const api = useApi(),
  auth = useAuthStore(),
  sessions = ref<AuthSession[]>([]),
  message = ref(""),
  error = ref(""),
  revokeTarget = ref<AuthSession | null>(null);
const otherSessions = computed(
  () => sessions.value.filter((session) => !session.isCurrent).length,
);
function deviceName(userAgent: string | null) {
  if (!userAgent) return "Thiết bị không xác định";
  const browser = userAgent.includes("Edg/")
    ? "Microsoft Edge"
    : userAgent.includes("Chrome/")
      ? "Google Chrome"
      : userAgent.includes("Safari/")
        ? "Safari"
        : "Trình duyệt";
  const platform = userAgent.includes("iPhone")
    ? "iPhone"
    : userAgent.includes("Android")
      ? "Android"
      : userAgent.includes("Windows")
        ? "Windows"
        : userAgent.includes("Mac")
          ? "macOS"
          : "Thiết bị";
  return `${browser} trên ${platform}`;
}
async function loadSessions() {
  try {
    const response =
      await api.get<ApiResponse<AuthSession[]>>("/auth/sessions");
    sessions.value = response.data || [];
  } catch (cause) {
    error.value =
      cause instanceof Error ? cause.message : "Không thể tải phiên đăng nhập";
  }
}
async function revoke(session: AuthSession) {
  try {
    await api.del(`/auth/sessions/${session.id}`);
    revokeTarget.value = null;
    if (session.isCurrent) {
      await auth.logout();
      window.location.assign("/login");
      return;
    }
    await loadSessions();
    message.value = "Đã đăng xuất thiết bị.";
  } catch (cause) {
    error.value =
      cause instanceof Error ? cause.message : "Không thể thu hồi phiên";
  }
}
async function revokeOthers() {
  try {
    await api.del("/auth/sessions/others");
    await loadSessions();
    message.value = "Đã đăng xuất tất cả thiết bị khác.";
  } catch (cause) {
    error.value =
      cause instanceof Error ? cause.message : "Không thể thu hồi phiên";
  }
}
onMounted(loadSessions);
</script>

<template>
  <DefaultLayout
    ><main class="app-page navbar-page">
      <p
        v-if="message"
        class="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
      >
        {{ message }}
      </p>
      <p
        v-if="error"
        class="mt-5 rounded-2xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300"
      >
        {{ error }}
      </p>
      <section class="surface-card mt-4 overflow-hidden">
        <header
          class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 dark:border-slate-800"
        >
          <div>
            <h2 class="text-base font-black">Thiết bị đang đăng nhập</h2>
            <p class="mt-1 text-xs text-slate-500">
              {{ sessions.length }} phiên hoạt động
            </p>
          </div>
          <BaseButton
            v-if="otherSessions"
            variant="secondary"
            size="sm"
            @click="revokeOthers"
            >Đăng xuất {{ otherSessions }} thiết bị khác</BaseButton
          >
        </header>
        <div class="divide-y divide-slate-100 px-4 dark:divide-slate-800">
          <article
            v-for="session in sessions"
            :key="session.id"
            class="flex flex-wrap items-center gap-3 py-3"
          >
            <span
              class="grid h-11 w-11 place-items-center rounded-xl bg-purple-100 text-xl dark:bg-purple-950/50"
              >▣</span
            >
            <div class="min-w-48 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <b>{{ deviceName(session.userAgent) }}</b
                ><span
                  v-if="session.isCurrent"
                  class="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700"
                  >Thiết bị hiện tại</span
                >
              </div>
              <p class="mt-1 text-xs text-slate-500">
                IP {{ session.ipAddress || "Không rõ" }} · Hoạt động
                {{ new Date(session.lastUsedAt).toLocaleString("vi-VN") }}
              </p>
            </div>
            <BaseButton
              size="sm"
              variant="ghost"
              @click="revokeTarget = session"
              >Đăng xuất</BaseButton
            >
          </article>
          <p
            v-if="!sessions.length"
            class="py-10 text-center text-sm text-slate-500"
          >
            Không có phiên đăng nhập hoạt động.
          </p>
        </div>
      </section>
    </main>
    <BaseModal
      :show="Boolean(revokeTarget)"
      title="Đăng xuất thiết bị?"
      :description="
        revokeTarget?.isCurrent
          ? 'Bạn sẽ phải đăng nhập lại trên thiết bị này.'
          : 'Refresh token của thiết bị sẽ bị thu hồi ngay lập tức.'
      "
      size="sm"
      @close="revokeTarget = null"
      ><p class="text-sm text-slate-600 dark:text-slate-300">
        {{ deviceName(revokeTarget?.userAgent || null) }}
      </p>
      <div class="mt-6 flex justify-end gap-3">
        <BaseButton variant="secondary" @click="revokeTarget = null"
          >Hủy</BaseButton
        ><BaseButton
          variant="danger"
          @click="revokeTarget && revoke(revokeTarget)"
          >Đăng xuất</BaseButton
        >
      </div></BaseModal
    ></DefaultLayout
  >
</template>
