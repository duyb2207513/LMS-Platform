<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
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
  { to: '/dashboard/analytics', label: 'Phân tích tiến độ', caption: 'Xem hoạt động học tập', icon: 'chart', tone: 'text-violet-700 bg-violet-100 dark:bg-violet-950 dark:text-violet-300' },
  { to: '/my-courses', label: 'Khóa học của tôi', caption: 'Tiếp tục bài đang học', icon: 'book', tone: 'text-indigo-700 bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300' },
  { to: '/orders', label: 'Đơn hàng', caption: 'Lịch sử thanh toán', icon: 'receipt', tone: 'text-sky-700 bg-sky-100 dark:bg-sky-950 dark:text-sky-300' },
  { to: '/certificates', label: 'Chứng chỉ', caption: 'Xem thành tích', icon: 'award', tone: 'text-amber-700 bg-amber-100 dark:bg-amber-950 dark:text-amber-300' },
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
    <main class="navbar-page">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.18em] text-violet-600">Dashboard học viên</p>
          <h1 class="mt-1 text-3xl font-extrabold text-slate-950 dark:text-white">Xin chào, {{ auth.user?.fullName }}! </h1>
          <p class="mt-1 text-slate-500 dark:text-slate-400">Theo dõi tiến độ và tiếp tục hành trình học tập của bạn.</p>
        </div>
        <RouterLink to="/courses" class="bg-violet-700 px-5 py-3 font-bold text-white transition hover:bg-violet-800">Khám phá khóa học</RouterLink>
      </div>

      <section class="mt-6 grid gap-2 sm:grid-cols-2 xl:grid-cols-4" aria-label="Truy cập nhanh">
        <RouterLink
          v-for="shortcut in shortcuts"
          :key="shortcut.to"
          :to="shortcut.to"
          class="group flex min-h-16 items-center gap-3 border border-slate-200 bg-white px-3 py-2.5 transition hover:border-violet-300 hover:bg-violet-50/50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-violet-700"
        >
          <span class="grid h-10 w-10 shrink-0 place-items-center" :class="shortcut.tone">
            <svg v-if="shortcut.icon === 'chart'" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 19V9m5 10V5m5 14v-7m5 7V3" /></svg>
            <svg v-else-if="shortcut.icon === 'book'" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5.5A3.5 3.5 0 0 1 7.5 2H11v17H7.5A3.5 3.5 0 0 0 4 22V5.5ZM20 5.5A3.5 3.5 0 0 0 16.5 2H13v17h3.5A3.5 3.5 0 0 1 20 22V5.5Z" /></svg>
            <svg v-else-if="shortcut.icon === 'receipt'" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Zm3 5h6m-6 4h6" /></svg>
            <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m12 3 2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.6-4.8 2.6.9-5.4-3.9-3.8 5.4-.8L12 3Z" /></svg>
          </span>
          <span class="min-w-0">
            <b class="block truncate text-sm text-slate-900 dark:text-white">{{ shortcut.label }}</b>
            <span class="block truncate text-xs text-slate-500">{{ shortcut.caption }}</span>
          </span>
          <svg class="ml-auto h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m9 18 6-6-6-6" /></svg>
        </RouterLink>
      </section>

      <LoadingSpinner v-if="api.loading.value && !enrollments.length" class="py-12" />
      <p v-if="error" class="mt-6 border border-red-200 bg-red-50 p-4 text-red-700">{{ error }}</p>

      <section class="mt-6 border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" aria-label="Tổng quan học tập">
        <div class="border-b border-slate-200 px-4 py-2.5 dark:border-slate-800">
          <h2 class="text-sm font-bold text-slate-900 dark:text-white">Tổng quan học tập</h2>
        </div>
        <div class="grid divide-y divide-slate-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0 dark:divide-slate-800">
          <div class="flex items-center gap-3 px-4 py-4">
            <span class="grid h-10 w-10 place-items-center bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">📚</span>
            <div><p class="text-2xl font-black text-slate-950 dark:text-white">{{ enrollments.length }}</p><p class="text-xs text-slate-500">Khóa học đã đăng ký</p></div>
          </div>
          <div class="flex items-center gap-3 px-4 py-4">
            <span class="grid h-10 w-10 place-items-center bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">✓</span>
            <div><p class="text-2xl font-black text-slate-950 dark:text-white">{{ completed }} <span class="text-sm font-semibold text-slate-400">/ {{ enrollments.length }}</span></p><p class="text-xs text-slate-500">Hoàn thành · {{ inProgress }} đang học</p></div>
          </div>
          <div class="px-4 py-4">
            <div class="flex items-end justify-between"><div><p class="text-2xl font-black" :class="progressTextColor(average)">{{ average }}%</p><p class="text-xs text-slate-500">Tiến độ trung bình</p></div><span class="flex items-center gap-1.5 text-xs font-bold" :class="progressTextColor(average)"><i class="h-2.5 w-2.5" :style="{ backgroundColor: progressColor(average) }"></i>{{ average >= 100 ? 'Đã hoàn tất' : average > 0 ? 'Đang tiến bộ' : 'Chưa bắt đầu' }}</span></div>
            <div class="mt-2.5 h-2.5 overflow-hidden bg-slate-100 ring-1 ring-inset ring-slate-200 dark:bg-slate-800 dark:ring-slate-700"><div class="h-full transition-[width] duration-500" :style="{ width: progressWidth(average), backgroundColor: progressColor(average) }"></div></div>
          </div>
        </div>
      </section>

      <section class="mt-8">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-2xl font-extrabold text-slate-950 dark:text-white">Tiếp tục học</h2>
          <RouterLink to="/my-courses" class="font-bold text-violet-600 hover:text-violet-800">Xem tất cả →</RouterLink>
        </div>

        <div v-if="recent.length" class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article v-for="item in recent" :key="item.id" class="flex overflow-hidden border border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div class="flex min-w-0 flex-1 flex-col">
              <img v-if="item.course.thumbnailUrl" :src="item.course.thumbnailUrl" :alt="item.course.title" class="h-36 w-full object-cover">
              <div v-else class="grid h-36 place-items-center bg-violet-50 text-4xl dark:bg-violet-950/40">📚</div>
              <div class="flex flex-1 flex-col p-4">
                <h3 class="line-clamp-2 min-h-12 font-bold text-slate-950 dark:text-white">{{ item.course.title }}</h3>
                <div class="mt-auto pt-4">
                  <div class="h-2.5 overflow-hidden bg-slate-100 ring-1 ring-inset ring-slate-200 dark:bg-slate-800 dark:ring-slate-700"><div class="h-full transition-[width] duration-500" :style="{ width: progressWidth(item.progressPercent), backgroundColor: progressColor(item.progressPercent) }"></div></div>
                  <p class="mt-2 text-xs font-semibold" :class="progressTextColor(item.progressPercent)">{{ Math.round(item.progressPercent) }}% hoàn thành</p>
                </div>
              </div>
              <RouterLink :to="`/learn/${item.courseId}`" class="block w-full border-t border-violet-800 bg-violet-700 px-4 py-3 text-center font-bold text-white transition hover:bg-violet-800">{{ item.progressPercent ? 'Tiếp tục học' : 'Bắt đầu học' }}</RouterLink>
            </div>
          </article>
        </div>

        <div v-else class="border border-dashed border-slate-300 p-12 text-center dark:border-slate-700">
          <p class="text-slate-500">Bạn chưa đăng ký khóa học nào.</p>
          <RouterLink to="/courses" class="mt-4 inline-block bg-violet-700 px-5 py-3 font-bold text-white hover:bg-violet-800">Chọn khóa học đầu tiên</RouterLink>
        </div>
      </section>
    </main>
  </DefaultLayout>
</template>
