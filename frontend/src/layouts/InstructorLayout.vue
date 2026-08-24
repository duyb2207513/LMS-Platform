<script setup lang="ts">
import { ref } from 'vue'
import WorkspaceHeader from '@/components/layout/WorkspaceHeader.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import { instructorNavItems } from '@/config/instructorNavigation'

const sidebarOpen = ref(false)
const navItems = instructorNavItems
</script>

<template>
  <div class="flex min-h-screen flex-col bg-[var(--app-bg)] transition-colors duration-300">
    <WorkspaceHeader @toggle-workspace="sidebarOpen = true" />
    <div class="flex flex-1">
      <AppSidebar :items="navItems" :open="sidebarOpen" @close="sidebarOpen = false" />
      <main class="instructor-content min-w-0 flex-1 px-2 py-3 sm:px-3 sm:py-4"><slot /></main>
    </div>
  </div>
</template>

<style scoped>
.instructor-content :deep(.app-page) {
  max-width: none;
  margin-inline: 0;
}
</style>
