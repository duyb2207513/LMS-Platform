<script setup lang="ts">
import type { Course } from '@/types'
import { CourseLevel } from '@/types'

defineProps<{
  course: Course
}>()

function getLevelBadge(level: CourseLevel) {
  switch (level) {
    case CourseLevel.BEGINNER:
      return { text: 'Cơ bản', class: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' }
    case CourseLevel.INTERMEDIATE:
      return { text: 'Trung cấp', class: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' }
    case CourseLevel.ADVANCED:
      return { text: 'Nâng cao', class: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' }
    default:
      return { text: level, class: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' }
  }
}

function formatPrice(price: number, isFree: boolean) {
  if (isFree) return 'Miễn phí'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
}
</script>

<template>
  <router-link
    :to="`/courses/${course.slug}`"
    class="group block bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 dark:hover:shadow-indigo-500/5 hover:-translate-y-1"
  >
    <!-- Thumbnail -->
    <div class="relative aspect-video bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-950 dark:to-purple-950 overflow-hidden">
      <img
        v-if="course.thumbnailUrl"
        :src="course.thumbnailUrl"
        :alt="course.title"
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      />
      <div v-else class="w-full h-full flex items-center justify-center">
        <svg class="w-12 h-12 text-indigo-300 dark:text-indigo-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      </div>
      <!-- Level Badge -->
      <span
        :class="[
          'absolute top-3 left-3 px-2.5 py-1 rounded-lg text-xs font-semibold',
          getLevelBadge(course.level).class,
        ]"
      >
        {{ getLevelBadge(course.level).text }}
      </span>
      <!-- Price Badge -->
      <span
        :class="[
          'absolute top-3 right-3 px-2.5 py-1 rounded-lg text-xs font-bold',
          course.isFree ? 'bg-emerald-500 text-white' : 'bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white backdrop-blur-sm',
        ]"
      >
        {{ formatPrice(course.price, course.isFree) }}
      </span>
    </div>

    <!-- Content -->
    <div class="p-5">
      <!-- Category -->
      <p v-if="course.category" class="text-xs font-medium text-indigo-600 dark:text-indigo-400 mb-2 uppercase tracking-wide">
        {{ course.category.name }}
      </p>

      <!-- Title -->
      <h3 class="text-base font-bold text-slate-900 dark:text-slate-100 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
        {{ course.title }}
      </h3>

      <!-- Description -->
      <p class="mt-2 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
        {{ course.description }}
      </p>

      <!-- Instructor -->
      <div v-if="course.instructor" class="mt-4 flex items-center gap-2">
        <div class="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
          {{ course.instructor.fullName?.charAt(0)?.toUpperCase() }}
        </div>
        <span class="text-sm text-slate-600 dark:text-slate-400">{{ course.instructor.fullName }}</span>
      </div>
    </div>
  </router-link>
</template>
