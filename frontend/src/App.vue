<script setup lang="ts">
import { onMounted, watch } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useThemeStore } from "@/stores/theme";
import { useNotificationStore } from "@/stores/notification";
import NotificationToast from "@/components/notifications/NotificationToast.vue";
import FloatingChatWidget from "@/components/messages/FloatingChatWidget.vue";

const auth = useAuthStore();
const theme = useThemeStore();
const notification = useNotificationStore();

function syncSocket() {
  if (auth.isLoggedIn && auth.token) {
    notification.initSocket(auth.token);
    notification.fetchUnreadCount();
  } else {
    notification.disconnectSocket();
  }
}

onMounted(() => {
  auth.initialize();
  theme.initialize();
  syncSocket();
});

watch(
  () => [auth.isLoggedIn, auth.token] as const,
  () => {
    syncSocket();
  },
);
</script>

<template>
  <router-view />
  <NotificationToast />
  <FloatingChatWidget v-if="auth.isLoggedIn" />
</template>
