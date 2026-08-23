<script setup lang="ts">
import CourseThumbnail from '@/components/course/CourseThumbnail.vue'
import type { Course } from '@/types'
import { CourseLevel } from '@/types'

defineProps<{ course: Course }>()

const levelLabels: Record<CourseLevel, string> = {
  [CourseLevel.BEGINNER]: 'Cơ bản',
  [CourseLevel.INTERMEDIATE]: 'Trung cấp',
  [CourseLevel.ADVANCED]: 'Nâng cao',
}

function formatPrice(price: number, isFree: boolean) {
  return isFree ? 'Miễn phí' : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
}
</script>

<template>
  <RouterLink :to="`/courses/${course.slug}`" class="course-card group">
    <div class="relative overflow-hidden">
      <CourseThumbnail :src="course.thumbnailUrl" :alt="course.title" class="transition-transform duration-500 group-hover:scale-[1.025]" />
      <div class="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
        <span class="border border-white/70 bg-white/90 px-2.5 py-1 text-[11px] font-bold text-slate-700 backdrop-blur dark:border-white/10 dark:bg-slate-950/80 dark:text-slate-100">
          {{ levelLabels[course.level] }}
        </span>
        <span :class="['px-2.5 py-1 text-[11px] font-extrabold backdrop-blur', course.isFree ? 'bg-emerald-500 text-white' : 'bg-slate-950/80 text-white']">
          {{ formatPrice(course.price, course.isFree) }}
        </span>
      </div>
    </div>

    <div class="flex flex-1 flex-col p-4">
      <p class="text-xs font-bold uppercase tracking-[0.12em] text-purple-600 dark:text-purple-400">
        {{ course.category?.name || 'Khóa học' }}
      </p>
      <h3 class="mt-2 line-clamp-2 text-lg font-extrabold leading-snug tracking-tight text-slate-950 transition-colors group-hover:text-purple-700 dark:text-white dark:group-hover:text-purple-300">
        {{ course.title }}
      </h3>
      <p class="mt-2 line-clamp-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
        {{ course.description }}
      </p>

      <div class="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
        <div class="flex min-w-0 items-center gap-2.5">
          <img v-if="course.instructor?.avatarUrl" :src="course.instructor.avatarUrl" :alt="course.instructor.fullName" class="h-8 w-8 rounded-full object-cover" />
          <span v-else class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-purple-700 text-xs font-bold text-white">
            {{ course.instructor?.fullName?.charAt(0)?.toUpperCase() || 'L' }}
          </span>
          <span class="line-clamp-1 text-sm font-medium text-slate-600 dark:text-slate-300">{{ course.instructor?.fullName || 'LMS Instructor' }}</span>
        </div>
        <span class="grid h-8 w-8 shrink-0 place-items-center bg-purple-50 text-purple-700 transition-transform group-hover:translate-x-0.5 dark:bg-purple-950/40 dark:text-purple-300" aria-hidden="true">→</span>
      </div>
    </div>
  </RouterLink>
</template>

<style scoped>
.course-card {
  display: flex;
  min-height: 100%;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--border);
  background: var(--surface);
  transition: border-color 180ms ease, background-color 180ms ease;
}
.course-card:hover { border-color: rgba(124,58,237,.5); background: rgba(245,243,255,.35); }
</style>
