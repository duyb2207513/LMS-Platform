<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import AnnouncementCard from '@/components/announcements/AnnouncementCard.vue'
import { useApi } from '@/composables/useApi'
import type { ApiResponse, CourseAnnouncement } from '@/types'

const route = useRoute()
const api = useApi()

const courseId = String(route.params.courseId)
const announcementId = String(route.params.announcementId)
const announcement = ref<CourseAnnouncement | null>(null)
const loading = ref(false)
const error = ref('')

async function loadAnnouncement() {
  loading.value = true
  error.value = ''
  try {
    const res = await api.get<ApiResponse<CourseAnnouncement[]>>(`/courses/${courseId}/announcements`)
    const items = res.data || []
    announcement.value = items.find((item) => item.id === announcementId) || null
    if (!announcement.value && items.length > 0) {
      announcement.value = items[0]
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Không thể tải thông báo'
  } finally {
    loading.value = false
  }
}

onMounted(loadAnnouncement)
</script>

<template>
  <DefaultLayout>
    <main class="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <!-- Back -->
      <div class="mb-6">
        <RouterLink
          :to="`/courses/${courseId}/announcements`"
          class="inline-flex items-center gap-2 text-sm font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400"
        >
          ← Quay lại danh sách thông báo
        </RouterLink>
      </div>

      <div v-if="loading" class="py-16 text-center">
        <LoadingSpinner />
      </div>

      <div
        v-else-if="error"
        class="rounded-2xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300"
      >
        {{ error }}
      </div>

      <div v-else-if="announcement">
        <AnnouncementCard :announcement="announcement" />
      </div>
    </main>
  </DefaultLayout>
</template>
