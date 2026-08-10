<script setup lang="ts">
import { onMounted } from 'vue'
import InstructorLayout from '@/layouts/InstructorLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { useCourseStore } from '@/stores/courses'
import { CourseStatus } from '@/types'

const auth = useAuthStore()
const courseStore = useCourseStore()

onMounted(async () => {
  await courseStore.fetchMyCourses()
})

function countByStatus(status: CourseStatus) {
  return courseStore.myCourses.filter((c) => c.status === status).length
}
</script>

<template>
  <InstructorLayout>
    <div class="max-w-6xl">
      <!-- Welcome -->
      <div class="mb-8">
        <h1 class="text-3xl font-extrabold text-slate-900 dark:text-white">
          Dashboard Giảng viên 📚
        </h1>
        <p class="mt-2 text-lg text-slate-500 dark:text-slate-400">
          Xin chào, {{ auth.user?.fullName }}! Quản lý khóa học của bạn tại đây.
        </p>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div class="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 transition-colors duration-300">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/25">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <p class="text-2xl font-bold text-slate-900 dark:text-white">{{ courseStore.myCourses.length }}</p>
              <p class="text-sm text-slate-500 dark:text-slate-400">Tổng khóa học</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 transition-colors duration-300">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p class="text-2xl font-bold text-slate-900 dark:text-white">{{ countByStatus(CourseStatus.PUBLISHED) }}</p>
              <p class="text-sm text-slate-500 dark:text-slate-400">Đã xuất bản</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 transition-colors duration-300">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/25">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <p class="text-2xl font-bold text-slate-900 dark:text-white">{{ countByStatus(CourseStatus.DRAFT) }}</p>
              <p class="text-sm text-slate-500 dark:text-slate-400">Bản nháp</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 transition-colors duration-300">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center text-white shadow-lg shadow-slate-500/25">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
            <div>
              <p class="text-2xl font-bold text-slate-900 dark:text-white">{{ countByStatus(CourseStatus.ARCHIVED) }}</p>
              <p class="text-sm text-slate-500 dark:text-slate-400">Đã lưu trữ</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-lg shadow-indigo-500/10">
        <h2 class="text-2xl font-bold">Tạo khóa học mới</h2>
        <p class="mt-2 text-indigo-100">Chia sẻ kiến thức của bạn với hàng ngàn học viên</p>
        <router-link
          to="/instructor/courses/create"
          class="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-xl bg-white text-purple-700 font-semibold hover:shadow-lg transition-all"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Tạo khóa học
        </router-link>
      </div>
    </div>
  </InstructorLayout>
</template>
