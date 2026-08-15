<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import InstructorLayout from '@/layouts/InstructorLayout.vue'
import { useApi } from '@/composables/useApi'
import { useAnalyticsFormatter } from '@/composables/useAnalyticsFormatter'
import type {
  InstructorOverview,
  EnrollmentTrendItem,
  CoursePerformanceItem,
  DropOffLessonItem,
} from '@/types/analytics'
import MetricCard from '@/components/analytics/MetricCard.vue'
import DateRangeFilter from '@/components/analytics/DateRangeFilter.vue'
import DashboardSkeleton from '@/components/analytics/DashboardSkeleton.vue'
import EnrollmentTrendChart from '@/components/instructor-dashboard/EnrollmentTrendChart.vue'
import CoursePerformanceTable from '@/components/instructor-dashboard/CoursePerformanceTable.vue'
import DropOffLessonsTable from '@/components/instructor-dashboard/DropOffLessonsTable.vue'

const router = useRouter()
const api = useApi()
const { formatPercent, formatMoney } = useAnalyticsFormatter()

const overview = ref<InstructorOverview | null>(null)
const enrollmentTrend = ref<EnrollmentTrendItem[]>([])
const coursePerformance = ref<CoursePerformanceItem[]>([])
const dropOffLessons = ref<DropOffLessonItem[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const selectedCourseId = ref<string>('')

function goBack() {
  if (window.history.state?.back) {
    router.back()
  } else {
    router.push('/instructor')
  }
}

async function loadData(range?: { from: string; to: string }) {
  loading.value = true
  error.value = null
  try {
    const queryParams: Record<string, string> = { ...(range || {}) }
    if (selectedCourseId.value) {
      queryParams.courseId = selectedCourseId.value
    }

    const [overviewRes, trendRes, performanceRes] = await Promise.all([
      api.get<{ data: InstructorOverview }>('/analytics/instructor/overview', queryParams),
      api.get<{ data: EnrollmentTrendItem[] }>('/analytics/instructor/enrollments', queryParams),
      api.get<{ data: CoursePerformanceItem[] }>('/analytics/instructor/course-performance', queryParams),
    ])

    if (overviewRes?.data) overview.value = overviewRes.data
    if (trendRes?.data) enrollmentTrend.value = trendRes.data
    if (performanceRes?.data) {
      coursePerformance.value = performanceRes.data
      // Set default courseId for dropOffLessons from first course if not selected yet
      if (!selectedCourseId.value && performanceRes.data.length > 0) {
        selectedCourseId.value = performanceRes.data[0].courseId
      }
    }

    // Load drop-off lessons only if courseId is available
    if (selectedCourseId.value) {
      const dropOffRes = await api.get<{ data: DropOffLessonItem[] }>('/analytics/instructor/drop-off-lessons', {
        ...queryParams,
        courseId: selectedCourseId.value,
      })
      if (dropOffRes?.data) dropOffLessons.value = dropOffRes.data
    } else {
      dropOffLessons.value = []
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Không thể tải dữ liệu phân tích giảng viên'
  } finally {
    loading.value = false
  }
}

async function onCourseChange(courseId: string) {
  selectedCourseId.value = courseId
  await loadData()
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <InstructorLayout>
    <div class="mx-auto max-w-7xl px-4 py-8">
      <div class="mb-4">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-purple-800 dark:hover:bg-purple-950/30"
          @click="goBack"
        >
          ← Quay lại trang trước
        </button>
      </div>

      <header class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p class="text-xs font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400">
            Trung Tâm Báo Cáo
          </p>
          <h1 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
            Phân Tích Giảng Dạy & Hiệu Quả
          </h1>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <select
            v-if="coursePerformance.length"
            v-model="selectedCourseId"
            class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:border-purple-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            @change="loadData()"
          >
            <option value="">Tất cả khóa học</option>
            <option v-for="c in coursePerformance" :key="c.courseId" :value="c.courseId">
              {{ c.title }}
            </option>
          </select>
          <DateRangeFilter @change="loadData" />
        </div>
      </header>

      <div v-if="error" class="mt-6 rounded-2xl bg-rose-50 p-4 text-sm font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
        {{ error }}
      </div>

      <DashboardSkeleton v-if="loading && !overview" class="mt-6" />

      <template v-else-if="overview">
        <!-- KPI Metrics Grid -->
        <section class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Tổng học viên"
            :value="overview.uniqueStudents"
            subtitle="Học viên duy nhất"
            icon="👥"
            color="purple"
          />
          <MetricCard
            title="Ghi danh mới"
            :value="overview.newEnrollments"
            subtitle="Trong khoảng thời gian"
            icon="📈"
            color="blue"
          />
          <MetricCard
            title="Tỷ lệ hoàn thành"
            :value="formatPercent(overview.completionRate)"
            subtitle="Tất cả các khóa học"
            icon="🎓"
            color="emerald"
          />
          <MetricCard
            title="Doanh thu"
            :value="overview.revenue?.available ? formatMoney(overview.revenue.amount, overview.revenue.currency) : 'Chưa có'"
            subtitle="Tổng thanh toán thành công"
            icon="💰"
            color="amber"
          />
        </section>

        <!-- Charts section -->
        <section class="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <EnrollmentTrendChart :items="enrollmentTrend" />
          <DropOffLessonsTable :items="dropOffLessons" />
        </section>

        <!-- Table section -->
        <section class="mt-6">
          <CoursePerformanceTable :items="coursePerformance" />
        </section>
      </template>
    </div>
  </InstructorLayout>
</template>
