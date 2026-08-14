<script setup lang="ts">
import { onMounted } from 'vue'
import InstructorLayout from '@/layouts/InstructorLayout.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useCourseStore } from '@/stores/courses'
import { CourseStatus, CourseLevel } from '@/types'

const courseStore = useCourseStore()

function getStatusBadge(status: CourseStatus) {
  switch (status) {
    case CourseStatus.PUBLISHED:
      return { text: 'Đã xuất bản', class: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' }
    case CourseStatus.DRAFT:
      return { text: 'Bản nháp', class: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' }
    case CourseStatus.ARCHIVED:
      return { text: 'Đã lưu trữ', class: 'bg-slate-100 text-slate-600 dark:bg-slate-850 dark:text-slate-400' }
    default:
      return { text: status, class: 'bg-slate-100 text-slate-600 dark:bg-slate-850 dark:text-slate-400' }
  }
}

function getLevelText(level: CourseLevel) {
  switch (level) {
    case CourseLevel.BEGINNER: return 'Cơ bản'
    case CourseLevel.INTERMEDIATE: return 'Trung cấp'
    case CourseLevel.ADVANCED: return 'Nâng cao'
    default: return level
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('vi-VN')
}

onMounted(async () => {
  await courseStore.fetchMyCourses()
})
</script>

<template>
  <InstructorLayout>
    <div class="max-w-6xl">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-extrabold text-slate-900 dark:text-white">Khóa học của tôi</h1>
          <p class="mt-2 text-slate-500 dark:text-slate-400">Quản lý tất cả khóa học bạn đã tạo</p>
        </div>
        <router-link to="/instructor/courses/create">
          <BaseButton>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Tạo khóa học
          </BaseButton>
        </router-link>
      </div>

      <!-- Loading -->
      <div v-if="courseStore.loading" class="py-12">
        <LoadingSpinner />
      </div>

      <!-- Empty State -->
      <div v-else-if="courseStore.myCourses.length === 0" class="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 transition-colors duration-300">
        <svg class="w-20 h-20 mx-auto text-slate-300 dark:text-slate-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <h3 class="text-xl font-semibold text-slate-700 dark:text-slate-300">Chưa có khóa học nào</h3>
        <p class="text-slate-500 dark:text-slate-400 mt-2 mb-6">Bắt đầu tạo khóa học đầu tiên của bạn</p>
        <router-link to="/instructor/courses/create">
          <BaseButton>Tạo khóa học đầu tiên</BaseButton>
        </router-link>
      </div>

      <!-- Course List -->
      <div v-else class="space-y-4">
        <div
          v-for="course in courseStore.myCourses"
          :key="course.id"
          class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden hover:shadow-md transition-shadow duration-300"
        >
          <div class="flex flex-col sm:flex-row">
            <!-- Thumbnail -->
            <div class="sm:w-48 aspect-video sm:aspect-auto bg-gradient-to-br from-purple-100 to-purple-100 dark:from-purple-950 dark:to-purple-950 flex-shrink-0">
              <img
                v-if="course.thumbnailUrl"
                :src="course.thumbnailUrl"
                :alt="course.title"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center">
                <svg class="w-10 h-10 text-purple-300 dark:text-purple-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>

            <!-- Info -->
            <div class="flex-1 p-5">
              <div class="flex items-start justify-between gap-4">
                <div class="min-w-0">
                  <div class="flex items-center gap-2 mb-2">
                    <span :class="['px-2.5 py-0.5 rounded-lg text-xs font-semibold', getStatusBadge(course.status).class]">
                      {{ getStatusBadge(course.status).text }}
                    </span>
                    <span class="text-xs text-slate-400 dark:text-slate-500">{{ getLevelText(course.level) }}</span>
                  </div>
                  <h3 class="text-lg font-bold text-slate-900 dark:text-white truncate">{{ course.title }}</h3>
                  <p class="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{{ course.description }}</p>
                  <p class="text-xs text-slate-400 dark:text-slate-500 mt-2">Tạo ngày {{ formatDate(course.createdAt) }}</p>
                </div>
                <div class="flex flex-shrink-0 gap-2">
                  <router-link :to="`/instructor/courses/${course.id}/builder`">
                    <BaseButton size="sm">Nội dung</BaseButton>
                  </router-link>
                  <router-link :to="`/instructor/courses/${course.id}/assignments`">
                    <BaseButton variant="secondary" size="sm">Bài tập</BaseButton>
                  </router-link>
                  <router-link :to="`/instructor/courses/${course.id}/announcements`">
                    <BaseButton variant="outline" size="sm">Thông báo</BaseButton>
                  </router-link>
                  <router-link :to="`/instructor/courses/${course.id}/edit`">
                    <BaseButton variant="outline" size="sm">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Chỉnh sửa
                    </BaseButton>
                  </router-link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </InstructorLayout>
</template>
