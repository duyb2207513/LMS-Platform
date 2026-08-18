<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import InstructorLayout from '@/layouts/InstructorLayout.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import AnnouncementCard from '@/components/announcements/AnnouncementCard.vue'
import AnnouncementModal from '@/components/announcements/AnnouncementModal.vue'
import { useApi } from '@/composables/useApi'
import type { ApiResponse, Course, CourseAnnouncement, AnnouncementFormData } from '@/types'

const route = useRoute()
const api = useApi()

const courseId = String(route.params.courseId)
const course = ref<Course | null>(null)
const announcements = ref<CourseAnnouncement[]>([])
const loading = ref(false)
const modalOpen = ref(false)
const modalLoading = ref(false)
const editingAnnouncement = ref<CourseAnnouncement | null>(null)
const feedbackMessage = ref('')
const errorMessage = ref('')

async function loadData() {
  loading.value = true
  errorMessage.value = ''
  try {
    const [courseRes, announcementsRes] = await Promise.all([
      api.get<ApiResponse<Course>>(`/courses/${courseId}`),
      api.get<ApiResponse<CourseAnnouncement[]>>(`/courses/${courseId}/announcements`),
    ])
    course.value = courseRes.data || null
    announcements.value = announcementsRes.data || []
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : 'Không thể tải dữ liệu thông báo'
  } finally {
    loading.value = false
  }
}

function openCreateModal() {
  editingAnnouncement.value = null
  modalOpen.value = true
}

function openEditModal(item: CourseAnnouncement) {
  editingAnnouncement.value = item
  modalOpen.value = true
}

async function handleSave(data: AnnouncementFormData) {
  modalLoading.value = true
  errorMessage.value = ''
  try {
    if (editingAnnouncement.value) {
      await api.patch(`/announcements/${editingAnnouncement.value.id}`, data)
      feedbackMessage.value = 'Đã cập nhật bản nháp thành công!'
    } else {
      await api.post(`/courses/${courseId}/announcements`, data)
      feedbackMessage.value = 'Đã tạo thông báo bản nháp mới!'
    }
    modalOpen.value = false
    await loadData()
    setTimeout(() => (feedbackMessage.value = ''), 4000)
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : 'Lỗi khi lưu thông báo'
  } finally {
    modalLoading.value = false
  }
}

async function handlePublish(item: CourseAnnouncement) {
  if (!confirm(`Bạn có chắc chắn muốn phát hành thông báo "${item.title}"? Học viên của khóa học sẽ nhận được thông báo ngay lập tức.`)) {
    return
  }

  try {
    await api.post(`/announcements/${item.id}/publish`)
    feedbackMessage.value = `Đã phát hành thông báo "${item.title}" thành công!`
    await loadData()
    setTimeout(() => (feedbackMessage.value = ''), 4000)
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : 'Lỗi khi phát hành thông báo'
  }
}

async function handleDelete(item: CourseAnnouncement) {
  if (!confirm(`Bạn có chắc muốn xóa thông báo "${item.title}"?`)) return

  try {
    await api.del(`/announcements/${item.id}`)
    feedbackMessage.value = 'Đã xóa thông báo thành công!'
    await loadData()
    setTimeout(() => (feedbackMessage.value = ''), 4000)
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : 'Lỗi khi xóa thông báo'
  }
}

onMounted(loadData)
</script>

<template>
  <InstructorLayout>
    <div class="max-w-5xl mx-auto">
      <!-- Breadcrumb -->
      <div class="mb-6 flex items-center justify-between">
        <RouterLink
          to="/instructor/courses"
          class="inline-flex items-center gap-2 text-sm font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400"
        >
          ← Quay lại danh sách khóa học
        </RouterLink>
      </div>

      <!-- Header -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
            Quản lý thông báo
          </span>
          <h1 class="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {{ course?.title || 'Thông báo khóa học' }}
          </h1>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Đăng tin tức, lịch học hoặc tài liệu quan trọng gửi tới toàn bộ học viên
          </p>
        </div>

        <BaseButton @click="openCreateModal">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Tạo thông báo mới
        </BaseButton>
      </div>

      <!-- Feedback alert -->
      <div
        v-if="feedbackMessage"
        class="mt-6 rounded-2xl bg-emerald-50 p-4 text-sm font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
      >
        ✓ {{ feedbackMessage }}
      </div>
      <div
        v-if="errorMessage"
        class="mt-6 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300"
      >
        ✕ {{ errorMessage }}
      </div>

      <!-- Content -->
      <div class="mt-8">
        <div v-if="loading" class="py-16 text-center">
          <LoadingSpinner />
        </div>

        <div
          v-else-if="!announcements.length"
          class="rounded-3xl border border-dashed border-slate-200 bg-white/50 p-12 text-center dark:border-slate-800 dark:bg-slate-900/50"
        >
          <div class="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-purple-50 text-3xl dark:bg-purple-950/40">
            📢
          </div>
          <h3 class="mt-4 text-lg font-bold text-slate-800 dark:text-slate-200">
            Chưa có thông báo nào
          </h3>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Hãy tạo thông báo đầu tiên để cập nhật thông tin cho học viên đã tham gia khóa học.
          </p>
          <div class="mt-6">
            <BaseButton size="sm" @click="openCreateModal">
              Tạo thông báo ngay
            </BaseButton>
          </div>
        </div>

        <div v-else class="space-y-4">
          <AnnouncementCard
            v-for="item in announcements"
            :key="item.id"
            :announcement="item"
            can-manage
            @edit="openEditModal"
            @publish="handlePublish"
            @delete="handleDelete"
          />
        </div>
      </div>

      <!-- Modal Create / Edit -->
      <AnnouncementModal
        :open="modalOpen"
        :announcement="editingAnnouncement"
        :loading="modalLoading"
        @close="modalOpen = false"
        @submit="handleSave"
      />
    </div>
  </InstructorLayout>
</template>
