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
    <div class="relative overflow-hidden bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      <CourseThumbnail
        :src="course.thumbnailUrl"
        :alt="course.title"
        class="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <!-- Top Badges (Sharp Flat) -->
      <div class="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2.5">
        <span class="border border-white/40 bg-white/95 px-2 py-0.5 text-[10px] font-bold text-slate-800 shadow-xs backdrop-blur-sm dark:border-white/10 dark:bg-slate-950/90 dark:text-slate-100">
          {{ levelLabels[course.level] }}
        </span>
        <span
          :class="[
            'border px-2 py-0.5 text-[10px] font-black tracking-wider uppercase shadow-xs',
            course.isFree
              ? 'border-emerald-400 bg-emerald-600 text-white'
              : 'border-slate-800 bg-slate-950 text-white',
          ]"
        >
          {{ formatPrice(course.price, course.isFree) }}
        </span>
      </div>
    </div>

    <div class="flex flex-1 flex-col p-4 bg-white dark:bg-slate-900">
      <p class="text-[10px] font-black uppercase tracking-[0.14em] text-purple-700 dark:text-purple-400">
        {{ course.category?.name || 'Công nghệ' }}
      </p>
      <h3 class="mt-1.5 line-clamp-2 min-h-[2.75rem] text-sm font-extrabold leading-snug text-slate-950 transition-colors group-hover:text-purple-700 dark:text-white dark:group-hover:text-purple-300">
        {{ course.title }}
      </h3>
      <p class="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
        {{ course.description }}
      </p>

      <div class="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-3.5 dark:border-slate-800">
        <div class="flex min-w-0 items-center gap-2">
          <img v-if="course.instructor?.avatarUrl" :src="course.instructor.avatarUrl" :alt="course.instructor.fullName" class="h-6 w-6 object-cover border border-slate-200" />
          <span v-else class="grid h-6 w-6 shrink-0 place-items-center bg-violet-700 text-[10px] font-black text-white">
            {{ course.instructor?.fullName?.charAt(0)?.toUpperCase() || 'G' }}
          </span>
          <span class="truncate text-xs font-semibold text-slate-700 dark:text-slate-300">
            {{ course.instructor?.fullName || 'LMS Instructor' }}
          </span>
        </div>
        <span class="grid h-6 w-6 shrink-0 place-items-center bg-purple-50 text-purple-700 transition-transform group-hover:translate-x-0.5 dark:bg-purple-950/60 dark:text-purple-300" aria-hidden="true">
          →
        </span>
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
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.course-card:hover {
  border-color: #a855f7;
  box-shadow: 0 4px 12px rgba(168, 85, 247, 0.08);
}
</style>
