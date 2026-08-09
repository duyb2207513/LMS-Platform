<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useCourseStore } from '@/stores/courses'
import { CourseLevel } from '@/types'

const route = useRoute()
const courseStore = useCourseStore()
const notFound = ref(false)

function getLevelBadge(level: CourseLevel) {
  switch (level) {
    case CourseLevel.BEGINNER:
      return { text: 'Cơ bản', class: 'bg-emerald-100 text-emerald-700' }
    case CourseLevel.INTERMEDIATE:
      return { text: 'Trung cấp', class: 'bg-amber-100 text-amber-700' }
    case CourseLevel.ADVANCED:
      return { text: 'Nâng cao', class: 'bg-rose-100 text-rose-700' }
    default:
      return { text: level, class: 'bg-slate-100 text-slate-700' }
  }
}

function formatPrice(price: number, isFree: boolean) {
  if (isFree) return 'Miễn phí'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

onMounted(async () => {
  try {
    await courseStore.fetchCourseBySlug(route.params.slug as string)
  } catch {
    notFound.value = true
  }
})
</script>

<template>
  <DefaultLayout>
    <!-- Loading -->
    <div v-if="courseStore.loading" class="py-20">
      <LoadingSpinner />
    </div>

    <!-- Not Found -->
    <div v-else-if="notFound" class="flex flex-col items-center justify-center py-20">
      <svg class="w-20 h-20 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h2 class="text-2xl font-bold text-slate-700">Khóa học không tồn tại</h2>
      <p class="text-slate-500 mt-2">Khóa học bạn tìm kiếm không tồn tại hoặc đã bị xóa</p>
      <router-link to="/courses" class="mt-6 px-6 py-3 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-colors">
        Quay lại danh sách khóa học
      </router-link>
    </div>

    <!-- Course Detail -->
    <div v-else-if="courseStore.currentCourse" class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-8">
          <!-- Breadcrumb -->
          <nav class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <router-link to="/courses" class="hover:text-purple-600 transition-colors">Khóa học</router-link>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
            <span v-if="courseStore.currentCourse.category" class="hover:text-purple-600 dark:hover:text-purple-400">
              {{ courseStore.currentCourse.category.name }}
            </span>
          </nav>

          <!-- Title & Meta -->
          <div>
            <div class="flex flex-wrap gap-2 mb-4">
              <span :class="['px-3 py-1 rounded-lg text-xs font-semibold', getLevelBadge(courseStore.currentCourse.level).class]">
                {{ getLevelBadge(courseStore.currentCourse.level).text }}
              </span>
              <span v-if="courseStore.currentCourse.language" class="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {{ courseStore.currentCourse.language }}
              </span>
            </div>

            <h1 class="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
              {{ courseStore.currentCourse.title }}
            </h1>

            <!-- Instructor -->
            <div v-if="courseStore.currentCourse.instructor" class="mt-4 flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md">
                {{ courseStore.currentCourse.instructor.fullName?.charAt(0)?.toUpperCase() }}
              </div>
              <div>
                <p class="font-semibold text-slate-900 dark:text-white">{{ courseStore.currentCourse.instructor.fullName }}</p>
                <p class="text-sm text-slate-500 dark:text-slate-400">Giảng viên</p>
              </div>
            </div>
          </div>

          <!-- Thumbnail -->
          <div class="aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-purple-100 to-purple-100">
            <img
              v-if="courseStore.currentCourse.thumbnailUrl"
              :src="courseStore.currentCourse.thumbnailUrl"
              :alt="courseStore.currentCourse.title"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <svg class="w-20 h-20 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>

          <!-- Description -->
          <div class="prose prose-slate dark:prose-invert max-w-none">
            <h2 class="text-xl font-bold text-slate-900 dark:text-white">Giới thiệu khóa học</h2>
            <p class="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">{{ courseStore.currentCourse.description }}</p>
          </div>

          <!-- Learning Outcomes -->
          <div v-if="courseStore.currentCourse.learningOutcomes" class="bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl p-6 border dark:border-emerald-900/40">
            <h2 class="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <svg class="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Bạn sẽ học được gì
            </h2>
            <div class="text-slate-700 dark:text-slate-300 whitespace-pre-line">{{ courseStore.currentCourse.learningOutcomes }}</div>
          </div>

          <!-- Requirements -->
          <div v-if="courseStore.currentCourse.requirements">
            <h2 class="text-xl font-bold text-slate-900 dark:text-white mb-4">Yêu cầu</h2>
            <div class="text-slate-600 dark:text-slate-300 whitespace-pre-line">{{ courseStore.currentCourse.requirements }}</div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="lg:col-span-1">
          <div class="sticky top-24 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            <!-- Price -->
            <div class="p-6 text-center border-b border-slate-100 dark:border-slate-800">
              <p :class="[
                'text-3xl font-extrabold',
                courseStore.currentCourse.isFree ? 'text-emerald-600' : 'text-slate-900 dark:text-white'
              ]">
                {{ formatPrice(courseStore.currentCourse.price, courseStore.currentCourse.isFree) }}
              </p>
            </div>

            <!-- Enroll Button -->
            <div class="p-6 space-y-4">
              <BaseButton :full-width="true" size="lg">
                Đăng ký khóa học
              </BaseButton>

              <!-- Course Info -->
              <div class="space-y-3 pt-4">
                <div class="flex items-center justify-between text-sm">
                  <span class="text-slate-500 dark:text-slate-400">Cấp độ</span>
                  <span class="font-medium text-slate-900 dark:text-slate-100">{{ getLevelBadge(courseStore.currentCourse.level).text }}</span>
                </div>
                <div class="flex items-center justify-between text-sm">
                  <span class="text-slate-500 dark:text-slate-400">Ngôn ngữ</span>
                  <span class="font-medium text-slate-900 dark:text-slate-100">{{ courseStore.currentCourse.language }}</span>
                </div>
                <div v-if="courseStore.currentCourse.publishedAt" class="flex items-center justify-between text-sm">
                  <span class="text-slate-500 dark:text-slate-400">Ngày xuất bản</span>
                  <span class="font-medium text-slate-900 dark:text-slate-100">{{ formatDate(courseStore.currentCourse.publishedAt) }}</span>
                </div>
                <div class="flex items-center justify-between text-sm">
                  <span class="text-slate-500 dark:text-slate-400">Cập nhật lần cuối</span>
                  <span class="font-medium text-slate-900 dark:text-slate-100">{{ formatDate(courseStore.currentCourse.updatedAt) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>
