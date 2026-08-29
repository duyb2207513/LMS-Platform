<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import StudentSidebar from '@/components/layout/StudentSidebar.vue'
import WorkspaceHeader from '@/components/layout/WorkspaceHeader.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import { instructorNavItems } from '@/config/instructorNavigation'
import { adminNavItems } from '@/config/adminNavigation'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const sidebarOpen = ref(false)
const sidebarCollapsed = ref(false)
const immersiveRoutes = new Set(['learning', 'take-quiz', 'quiz-result', 'checkout', 'payment-result', 'verify-certificate'])
const sharedWorkspaceRoutes = new Set(['profile', 'security', 'notifications', 'notification-settings', 'messages'])
const showStudentSidebar = computed(() => auth.isStudent && !immersiveRoutes.has(String(route.name)))
const showManagementWorkspace = computed(() => (auth.isInstructor || auth.isAdmin) && sharedWorkspaceRoutes.has(String(route.name)))
const managementNavItems = computed(() => auth.isAdmin ? adminNavItems : instructorNavItems)

onMounted(() => {
  sidebarCollapsed.value = localStorage.getItem('student-sidebar-collapsed') === 'true'
})

function toggleSidebarCollapsed() {
  sidebarCollapsed.value = !sidebarCollapsed.value
  localStorage.setItem('student-sidebar-collapsed', String(sidebarCollapsed.value))
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-[var(--app-bg)] transition-colors duration-300">
    <WorkspaceHeader v-if="showManagementWorkspace" @toggle-workspace="sidebarOpen = true" />
    <AppHeader v-else :sidebar="showStudentSidebar" @toggle-workspace="sidebarOpen = true" />
    <div v-if="showManagementWorkspace" class="flex w-full flex-1">
      <AppSidebar :items="managementNavItems" :open="sidebarOpen" @close="sidebarOpen = false" />
      <main class="min-w-0 flex-1"><slot /></main>
    </div>
    <div v-else-if="showStudentSidebar" class="w-full flex-1">
      <StudentSidebar
        :open="sidebarOpen"
        :collapsed="sidebarCollapsed"
        @close="sidebarOpen = false"
        @toggle-collapse="toggleSidebarCollapsed"
      />
      <main
        :class="[
          'min-w-0 w-full transition-[padding] duration-300',
          sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-56',
        ]"
      >
        <slot />
      </main>
    </div>
    <main v-else class="flex-1">
      <slot />
    </main>
    <div
      :class="[
        'transition-[padding] duration-300',
        showStudentSidebar
          ? sidebarCollapsed
            ? 'lg:pl-16'
            : 'lg:pl-56'
          : '',
      ]"
    >
      <AppFooter />
    </div>
  </div>
</template>
