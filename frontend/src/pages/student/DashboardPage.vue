<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Compass,
  GraduationCap,
  PlayCircle,
  Receipt,
  Sparkles,
  TrendingUp,
} from '@lucide/vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import CourseThumbnail from '@/components/course/CourseThumbnail.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { useAuthStore } from '@/stores/auth'
import { useApi } from '@/composables/useApi'
import type { ApiResponse, Enrollment } from '@/types'

const auth = useAuthStore()
const api = useApi()
const enrollments = ref<Enrollment[]>([])
const error = ref('')

const completed = computed(() => enrollments.value.filter((item) => item.status === 'COMPLETED').length)
const inProgress = computed(() => enrollments.value.filter((item) => item.status === 'ACTIVE').length)
const average = computed(() =>
  enrollments.value.length
    ? Math.round(enrollments.value.reduce((total, item) => total + item.progressPercent, 0) / enrollments.value.length)
    : 0,
)
const recent = computed(() => enrollments.value.slice(0, 4))

const shortcuts = [
  {
    to: '/dashboard/analytics',
    label: 'Phân tích tiến độ',
    caption: 'Thống kê hoạt động học tập',
    icon: BarChart3,
    iconBg: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  },
  {
    to: '/my-courses',
    label: 'Khóa học của tôi',
    caption: 'Tiếp tục bài giảng đang học',
    icon: BookOpen,
    iconBg: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
  },
  {
    to: '/orders',
    label: 'Đơn hàng & Giao dịch',
    caption: 'Lịch sử thanh toán đơn hàng',
    icon: Receipt,
    iconBg: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
  },
  {
    to: '/certificates',
    label: 'Chứng chỉ của tôi',
    caption: 'Thành tích đã đạt được',
    icon: Award,
    iconBg: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  },
]

function progressColor(progress: number) {
  if (progress >= 100) return '#10b981'
  if (progress >= 80) return '#0ea5e9'
  if (progress >= 50) return '#7c3aed'
  if (progress > 0) return '#f59e0b'
  return '#cbd5e1'
}

function progressWidth(progress: number) {
  return `${Math.min(100, Math.max(0, progress))}%`
}

function progressTextColor(progress: number) {
  if (progress >= 100) return 'text-emerald-600 dark:text-emerald-400'
  if (progress >= 80) return 'text-sky-600 dark:text-sky-400'
  if (progress >= 50) return 'text-violet-600 dark:text-violet-400'
  if (progress > 0) return 'text-amber-600 dark:text-amber-400'
  return 'text-slate-500 dark:text-slate-400'
}

async function load() {
  try {
    const response = await api.get<ApiResponse<Enrollment[]>>('/enrollments/me')
    enrollments.value = response.data || []
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Không tải được dữ liệu học tập.'
  }
}

onMounted(load)
</script>

<template>
  <DefaultLayout>
    <main class="w-full px-2 py-6 sm:px-4 lg:px-4 space-y-6">
      <!-- Top Action Toolbar -->
      <div class="flex items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div class="flex items-center gap-2">
          <span class="grid h-8 w-8 place-items-center bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300 font-bold">
            <GraduationCap :size="18" />
          </span>
          <span class="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
            Bảng điều khiển học tập
          </span>
        </div>

        <RouterLink
          to="/courses"
          class="inline-flex items-center gap-2 bg-gradient-to-r from-violet-700 to-purple-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:from-violet-800 hover:to-purple-800 active:translate-y-px"
        >
          <Compass :size="15" />
          <span>Khám phá khóa học</span>
        </RouterLink>
      </div>

      <!-- Quick Access Shortcuts Grid -->
      <section class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Truy cập nhanh">
        <RouterLink
          v-for="shortcut in shortcuts"
          :key="shortcut.to"
          :to="shortcut.to"
          class="group flex min-h-[4.5rem] items-center gap-3.5 border border-slate-200 bg-white p-3.5 shadow-xs transition hover:border-purple-300 hover:bg-purple-50/40 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-purple-800"
        >
          <span class="grid h-10 w-10 shrink-0 place-items-center font-bold" :class="shortcut.iconBg">
            <component :is="shortcut.icon" :size="20" />
          </span>
          <div class="min-w-0 flex-1">
            <b class="block truncate text-xs font-bold text-slate-900 dark:text-white">{{ shortcut.label }}</b>
            <span class="block truncate text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{{ shortcut.caption }}</span>
          </div>
          <ArrowRight :size="15" class="text-slate-400 transition group-hover:translate-x-1 group-hover:text-purple-700 dark:text-slate-600 dark:group-hover:text-purple-400 shrink-0" />
        </RouterLink>
      </section>

      <LoadingSpinner v-if="api.loading.value && !enrollments.length" class="py-12" />
      <p v-if="error" class="border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700">{{ error }}</p>

      <!-- Learning Statistics Overview Card -->
      <section class="border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900" aria-label="Tổng quan học tập">
        <div class="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <div class="flex items-center gap-2">
            <TrendingUp :size="16" class="text-purple-600" />
            <h2 class="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">Tổng quan học tập</h2>
          </div>
          <span class="text-[11px] font-bold text-slate-400">{{ enrollments.length }} khóa học đang theo dõi</span>
        </div>

        <div class="grid divide-y divide-slate-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0 dark:divide-slate-800">
          <!-- Metric 1: Enrolled Courses -->
          <div class="flex items-center gap-3.5 p-4 sm:p-5">
            <span class="grid h-12 w-12 shrink-0 place-items-center bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
              <BookOpen :size="22" />
            </span>
            <div>
              <p class="text-2xl font-black text-slate-950 dark:text-white leading-tight">{{ enrollments.length }}</p>
              <p class="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Khóa học đã đăng ký</p>
            </div>
          </div>

          <!-- Metric 2: Completed / In Progress -->
          <div class="flex items-center gap-3.5 p-4 sm:p-5">
            <span class="grid h-12 w-12 shrink-0 place-items-center bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <CheckCircle2 :size="22" />
            </span>
            <div>
              <p class="text-2xl font-black text-slate-950 dark:text-white leading-tight">
                {{ completed }}
                <span class="text-xs font-normal text-slate-400">/ {{ enrollments.length }} hoàn thành</span>
              </p>
              <p class="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                {{ inProgress }} khóa đang học tích cực
              </p>
            </div>
          </div>

          <!-- Metric 3: Average Progress -->
          <div class="p-4 sm:p-5 flex flex-col justify-center">
            <div class="flex items-end justify-between">
              <div>
                <p class="text-2xl font-black leading-tight" :class="progressTextColor(average)">{{ average }}%</p>
                <p class="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Tiến độ trung bình</p>
              </div>
              <span class="flex items-center gap-1.5 text-[11px] font-bold" :class="progressTextColor(average)">
                <i class="h-2 w-2" :style="{ backgroundColor: progressColor(average) }"></i>
                {{ average >= 100 ? 'Đã hoàn tất' : average > 0 ? 'Đang tiến bộ' : 'Chưa bắt đầu' }}
              </span>
            </div>
            <div class="mt-2.5 h-2 w-full bg-slate-100 dark:bg-slate-800">
              <div
                class="h-full transition-[width] duration-500"
                :style="{ width: progressWidth(average), backgroundColor: progressColor(average) }"
              />
            </div>
          </div>
        </div>
      </section>

      <!-- Continue Learning (Recent Courses) -->
      <section class="space-y-4 pt-2">
        <div class="flex items-center justify-between border-b border-slate-200 pb-2.5 dark:border-slate-800">
          <div class="flex items-center gap-2">
            <Sparkles :size="18" class="text-purple-600" />
            <h2 class="text-base font-black text-slate-950 dark:text-white">Tiếp tục bài học</h2>
          </div>
          <RouterLink to="/my-courses" class="text-xs font-bold text-purple-700 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300">
            Xem tất cả khóa học →
          </RouterLink>
        </div>

        <div v-if="recent.length" class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article
            v-for="item in recent"
            :key="item.id"
            class="flex flex-col border border-slate-200 bg-white shadow-xs transition hover:border-purple-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
          >
            <!-- Course Image -->
            <div class="h-40 w-full overflow-hidden bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <CourseThumbnail
                :src="item.course.thumbnailUrl"
                :alt="item.course.title"
                class="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
              />
            </div>

            <!-- Course Info -->
            <div class="flex flex-1 flex-col p-4">
              <h3 class="line-clamp-2 min-h-[2.75rem] text-sm font-bold text-slate-950 dark:text-white leading-snug">
                {{ item.course.title }}
              </h3>

              <div class="mt-auto pt-4 space-y-2">
                <div class="flex items-center justify-between text-[11px]">
                  <span class="font-bold text-slate-500">Tiến độ</span>
                  <span class="font-black" :class="progressTextColor(item.progressPercent)">
                    {{ Math.round(item.progressPercent) }}%
                  </span>
                </div>
                <div class="h-1.5 w-full bg-slate-100 dark:bg-slate-800">
                  <div
                    class="h-full transition-[width] duration-500"
                    :style="{ width: progressWidth(item.progressPercent), backgroundColor: progressColor(item.progressPercent) }"
                  />
                </div>
              </div>
            </div>

            <!-- Action Button -->
            <RouterLink
              :to="`/learn/${item.courseId}`"
              class="flex items-center justify-center gap-2 border-t border-purple-700 bg-violet-700 px-4 py-3 text-xs font-bold text-white transition hover:bg-violet-800 active:translate-y-px"
            >
              <PlayCircle :size="15" />
              <span>{{ item.progressPercent > 0 ? 'Tiếp tục học' : 'Bắt đầu học' }}</span>
              <ArrowRight :size="14" />
            </RouterLink>
          </article>
        </div>

        <!-- Empty State -->
        <div v-else class="border border-dashed border-slate-300 p-12 text-center dark:border-slate-800 bg-white dark:bg-slate-900">
          <BookOpen :size="36" class="mx-auto text-slate-400 mb-3" />
          <p class="text-sm font-bold text-slate-700 dark:text-slate-300">Bạn chưa đăng ký khóa học nào</p>
          <p class="text-xs text-slate-500 mt-1">Khám phá hàng trăm khóa học chất lượng cao trên hệ thống.</p>
          <RouterLink
            to="/courses"
            class="mt-4 inline-flex items-center gap-1.5 bg-violet-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-violet-800"
          >
            <Compass :size="15" />
            <span>Khám phá khóa học ngay</span>
          </RouterLink>
        </div>
      </section>
    </main>
  </DefaultLayout>
</template>
