<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import AnnouncementCard from '@/components/announcements/AnnouncementCard.vue'
import { useApi } from '@/composables/useApi'
import type { ApiResponse, CourseContent, CourseAnnouncement } from '@/types'

const route = useRoute()
const api = useApi()

const courseId = String(route.params.courseId)
const course = ref<CourseContent['course'] | null>(null)
const announcements = ref<CourseAnnouncement[]>([])
const loading = ref(false)
const error = ref('')

async function loadAnnouncements() {
  loading.value = true
  error.value = ''
  try {
    const [courseRes, announcementsRes] = await Promise.all([
      api.get<ApiResponse<CourseContent>>(`/courses/${courseId}/content`),
      api.get<ApiResponse<CourseAnnouncement[]>>(`/courses/${courseId}/announcements`),
    ])
    course.value = courseRes.data?.course || null
    announcements.value = announcementsRes.data || []
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Không thể tải thông báo khóa học'
  } finally {
    loading.value = false
  }
}

onMounted(loadAnnouncements)
</script>

<template>
  <DefaultLayout>
    <main class="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <!-- Breadcrumbs -->
      <div class="mb-6 flex items-center gap-2 text-sm text-slate-500">
        <RouterLink :to="`/learn/${courseId}`" class="font-semibold text-purple-600 hover:underline dark:text-purple-400">
          ← Quay lại phòng học
        </RouterLink>
      </div>

      <!-- Header -->
      <div class="border-b border-slate-200 pb-6 dark:border-slate-800">
        <span class="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
          Bảng tin khóa học
        </span>
        <h1 class="mt-1 text-3xl font-extrabold text-slate-950 dark:text-white">
          {{ course?.title || 'Thông báo từ giảng viên' }}
        </h1>
        <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Cập nhật các thông báo chính thức, tin tức và lưu ý từ giảng viên phụ trách
        </p>
      </div>

      <!-- Content -->
      <div class="mt-8">
        <div v-if="loading" class="py-16 text-center">
          <LoadingSpinner />
        </div>

        <div
          v-else-if="error"
          class="rounded-2xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300"
        >
          {{ error }}
        </div>

        <div
          v-else-if="!announcements.length"
          class="rounded-3xl border border-dashed border-slate-200 bg-white/50 p-12 text-center dark:border-slate-800 dark:bg-slate-900/50"
        >
          <div class="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-purple-50 text-3xl dark:bg-purple-950/40">
            📬
          </div>
          <h3 class="mt-4 text-lg font-bold text-slate-800 dark:text-slate-200">
            Chưa có thông báo nào
          </h3>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Giảng viên chưa đăng thông báo mới cho khóa học này.
          </p>
        </div>

        <div v-else class="space-y-4">
          <AnnouncementCard
            v-for="item in announcements"
            :key="item.id"
            :announcement="item"
          />
        </div>
      </div>
    </main>
  </DefaultLayout>
</template>
