<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { useApi } from '@/composables/useApi'
import { useAnalyticsFormatter } from '@/composables/useAnalyticsFormatter'
import type {
  StudentOverview,
  StudentCourseProgress,
  StudentActivityItem,
  StudentActivityResponse,
} from '@/types/analytics'
import MetricCard from '@/components/analytics/MetricCard.vue'
import DateRangeFilter from '@/components/analytics/DateRangeFilter.vue'
import DashboardSkeleton from '@/components/analytics/DashboardSkeleton.vue'
import StudyStreakCard from '@/components/student-dashboard/StudyStreakCard.vue'
import LearningActivityChart from '@/components/student-dashboard/LearningActivityChart.vue'
import CourseProgressList from '@/components/student-dashboard/CourseProgressList.vue'

const router = useRouter()
const api = useApi()
const { formatSeconds, formatPercent } = useAnalyticsFormatter()

const overview = ref<StudentOverview | null>(null)
const courseProgress = ref<StudentCourseProgress[]>([])
const activityData = ref<StudentActivityItem[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

function goBack() {
  if (window.history.state?.back) {
    router.back()
  } else {
    router.push('/dashboard')
  }
}

async function loadData(range?: { from: string; to: string }) {
  loading.value = true
  error.value = null
  try {
    const [overviewRes, progressRes, activityRes] = await Promise.all([
      api.get<{ data: StudentOverview }>('/analytics/student/overview'),
      api.get<{ data: StudentCourseProgress[] }>('/analytics/student/course-progress'),
      api.get<StudentActivityResponse>('/analytics/student/activity', range || {}),
    ])

    if (overviewRes?.data) overview.value = overviewRes.data
    if (progressRes?.data) courseProgress.value = progressRes.data
    if (activityRes?.data) activityData.value = activityRes.data
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Không thể tải dữ liệu phân tích'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <DefaultLayout>
    <div class="mx-auto max-w-7xl px-4 py-8">
      <div class="mb-4">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-purple-800 dark:hover:bg-purple-950/30"
          @click="goBack"
        >
          ← Quay lại 
        </button>
      </div>

      <header class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p class="text-xs font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400">
            Dashboard Cá Nhân
          </p>
          <h1 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
            Phân Tích Tiến Độ Học Tập
          </h1>
        </div>

        <DateRangeFilter @change="loadData" />
      </header>

      <div v-if="error" class="mt-6 rounded-2xl bg-rose-50 p-4 text-sm font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
        {{ error }}
      </div>

      <DashboardSkeleton v-if="loading && !overview" class="mt-6" />

      <template v-else-if="overview">
        <!-- Streak Banner -->
        <section class="mt-6">
          <StudyStreakCard
            :current-streak="overview.currentStreakDays"
            :longest-streak="overview.longestStreakDays"
          />
        </section>

        <!-- KPI Metrics Grid -->
        <section class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Tổng khóa học"
            :value="overview.enrolledCourses"
            subtitle="Đã đăng ký"
            icon="📚"
            color="purple"
          />
          <MetricCard
            title="Đang học"
            :value="overview.inProgressCourses"
            :subtitle="`${overview.completedCourses} khóa đã hoàn thành`"
            icon="📖"
            color="blue"
          />
          <MetricCard
            title="Thời gian học"
            :value="formatSeconds(overview.totalLearningSeconds)"
            subtitle="Tổng thời lượng thực tế"
            icon="⏱️"
            color="emerald"
          />
          <MetricCard
            title="Điểm Quiz TB"
            :value="overview.averageQuizScore ? formatPercent(overview.averageQuizScore) : 'N/A'"
            subtitle="Attempt cao nhất"
            icon="🎯"
            color="amber"
          />
        </section>

        <!-- Charts & Lists -->
        <section class="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <LearningActivityChart :items="activityData" />
          <CourseProgressList :items="courseProgress" />
        </section>
      </template>
    </div>
  </DefaultLayout>
</template>
