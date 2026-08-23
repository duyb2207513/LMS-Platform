<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, Mail } from '@lucide/vue'
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
    <main class="app-page navbar-page course-news-page">
      <!-- Breadcrumbs -->
      <div class="mb-4 flex items-center gap-2 text-sm text-slate-500">
        <RouterLink :to="`/learn/${courseId}`" class="grid h-9 w-9 place-items-center border border-purple-200 text-purple-600 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-400" aria-label="Quay lại phòng học" title="Quay lại phòng học">
          <ArrowLeft :size="17" />
        </RouterLink>
      </div>

      <!-- Header -->
      <div class="border-b border-slate-200 pb-4 dark:border-slate-800">
        <span class="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
          Bảng tin khóa học
        </span>
        <h1 class="mt-1 text-2xl font-extrabold text-slate-950 dark:text-white">
          {{ course?.title || 'Thông báo từ giảng viên' }}
        </h1>
        <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Cập nhật các thông báo chính thức, tin tức và lưu ý từ giảng viên phụ trách
        </p>
      </div>

      <!-- Content -->
      <div class="mt-4">
        <div v-if="loading" class="py-16 text-center">
          <LoadingSpinner />
        </div>

        <div
          v-else-if="error"
          class="border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300"
        >
          {{ error }}
        </div>

        <div
          v-else-if="!announcements.length"
          class="empty-news border-y border-slate-200 py-10 text-left dark:border-slate-800"
        >
          <div class="flex items-start gap-3">
            <Mail :size="24" class="mt-0.5 shrink-0 text-purple-600" />
            <div><h3 class="text-base font-bold text-slate-800 dark:text-slate-200">Chưa có thông báo nào</h3><p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Giảng viên chưa đăng thông báo mới cho khóa học này.</p></div>
          </div>
        </div>

        <div v-else class="border-y border-slate-200 dark:border-slate-800">
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

<style scoped>
.course-news-page{padding-top:.75rem!important}
.empty-news{min-height:8rem;padding-inline:.25rem}
</style>
