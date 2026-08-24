<script setup lang="ts">
import { ref } from "vue";
import WorkspaceHeader from "@/components/layout/WorkspaceHeader.vue";
import AppSidebar from "@/components/layout/AppSidebar.vue";
import { adminNavItems } from "@/config/adminNavigation";

const sidebarOpen = ref(false);
</script>

<template>
  <div
    class="flex min-h-screen flex-col bg-[var(--app-bg)] transition-colors duration-300"
  >
    <WorkspaceHeader @toggle-workspace="sidebarOpen = true" />
    <div class="flex flex-1">
      <AppSidebar
        :items="adminNavItems"
        :open="sidebarOpen"
        @close="sidebarOpen = false"
      />
      <main class="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10">
        <slot />
      </main>
    </div>
  </div>
</template>
