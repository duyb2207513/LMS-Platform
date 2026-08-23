<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import StudentSidebar from '@/components/layout/StudentSidebar.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const sidebarOpen = ref(false)
const sidebarCollapsed = ref(false)
const immersiveRoutes = new Set(['learning', 'take-quiz', 'quiz-result', 'checkout', 'payment-result'])
const showStudentSidebar = computed(() => auth.isStudent && !immersiveRoutes.has(String(route.name)))

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
    <AppHeader :sidebar="showStudentSidebar" @toggle-workspace="sidebarOpen = true" />
    <div v-if="showStudentSidebar" class="w-full flex-1">
      <StudentSidebar
        :open="sidebarOpen"
        :collapsed="sidebarCollapsed"
        @close="sidebarOpen = false"
        @toggle-collapse="toggleSidebarCollapsed"
      />
      <main
        :class="[
          'min-w-0 w-full transition-[padding] duration-300',
          sidebarCollapsed ? 'lg:pl-[5.25rem]' : 'lg:pl-[17rem]',
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
            ? 'lg:pl-[5.25rem]'
            : 'lg:pl-[17rem]'
          : '',
      ]"
    >
      <AppFooter />
    </div>
  </div>
</template>
