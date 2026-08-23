<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Clock, Target } from '@lucide/vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { useApi } from '@/composables/useApi'
import { useAnalyticsFormatter } from '@/composables/useAnalyticsFormatter'
import type { StudentOverview, StudentActivityItem, StudentActivityResponse } from '@/types/analytics'
import DateRangeFilter from '@/components/analytics/DateRangeFilter.vue'
import DashboardSkeleton from '@/components/analytics/DashboardSkeleton.vue'
import StudyStreakCard from '@/components/student-dashboard/StudyStreakCard.vue'
import LearningActivityChart from '@/components/student-dashboard/LearningActivityChart.vue'

const api = useApi()
const { formatSeconds, formatPercent } = useAnalyticsFormatter()
const overview = ref<StudentOverview | null>(null)
const activityData = ref<StudentActivityItem[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

async function loadData(range?: { from: string; to: string }) {
  loading.value = true
  error.value = null
  try {
    const [overviewRes, activityRes] = await Promise.all([
      api.get<{ data: StudentOverview }>('/analytics/student/overview'),
      api.get<StudentActivityResponse>('/analytics/student/activity', range || {}),
    ])

    if (overviewRes?.data) overview.value = overviewRes.data
    if (activityRes?.data) activityData.value = activityRes.data
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Không thể tải dữ liệu phân tích.'
  } finally {
    loading.value = false
  }
}

onMounted(() => loadData())
</script>

<template>
  <DefaultLayout>
    <div class="analytics-page navbar-page">
      <header class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="text-xs font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400">Dashboard cá nhân</p>
          <h1 class="mt-1 text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">Phân tích tiến độ học tập</h1>
        </div>
        <DateRangeFilter @change="loadData" />
      </header>

      <div v-if="error" class="mt-6 border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">{{ error }}</div>
      <DashboardSkeleton v-if="loading && !overview" class="mt-6" />

      <template v-else-if="overview">
        <section class="mt-6">
          <StudyStreakCard :current-streak="overview.currentStreakDays" :longest-streak="overview.longestStreakDays" />
        </section>

        <section class="mt-4 grid gap-3 sm:grid-cols-2" aria-label="Chỉ số học tập">
          <article class="flex items-center gap-4 border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <span class="grid h-11 w-11 shrink-0 place-items-center bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"><Clock :size="22" :stroke-width="2" /></span>
            <div class="min-w-0">
              <p class="text-xs font-bold uppercase tracking-wider text-slate-400">Thời gian học</p>
              <p class="mt-1 text-2xl font-black text-slate-950 dark:text-white">{{ formatSeconds(overview.totalLearningSeconds) }}</p>
              <p class="text-xs text-slate-500">Tổng thời lượng học thực tế</p>
            </div>
          </article>

          <article class="flex items-center gap-4 border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <span class="grid h-11 w-11 shrink-0 place-items-center bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"><Target :size="22" :stroke-width="2" /></span>
            <div class="min-w-0">
              <p class="text-xs font-bold uppercase tracking-wider text-slate-400">Điểm Quiz trung bình</p>
              <p class="mt-1 text-2xl font-black text-slate-950 dark:text-white">{{ overview.averageQuizScore ? formatPercent(overview.averageQuizScore) : '0%' }}</p>
              <p class="text-xs text-slate-500">Tính từ kết quả làm bài cao nhất</p>
            </div>
          </article>
        </section>

        <section class="mt-4">
          <LearningActivityChart :items="activityData" />
        </section>
      </template>
    </div>
  </DefaultLayout>
</template>

<style scoped>
.analytics-page :deep(.surface-card),
.analytics-page :deep(.rounded-2xl),
.analytics-page :deep(.rounded-xl),
.analytics-page :deep(.rounded-lg),
.analytics-page :deep(.rounded-full) {
  border-radius: 0 !important;
}
</style>
