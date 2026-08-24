<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import InstructorLayout from '@/layouts/InstructorLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { useCourseStore } from '@/stores/courses'
import { useRevenueApi } from '@/api/revenue.api'
import { formatMoney } from '@/utils/formatters'
import { CourseStatus } from '@/types'
import type { CourseRevenue, InstructorEarning, RevenueOverview } from '@/types/commerce'

const auth = useAuthStore()
const courseStore = useCourseStore()
const revenueApi = useRevenueApi()
const overview = ref<RevenueOverview | null>(null)
const earnings = ref<InstructorEarning[]>([])
const courseRevenues = ref<CourseRevenue[]>([])

function countByStatus(status: CourseStatus) {
  return courseStore.myCourses.filter((course) => course.status === status).length
}

const publishedCount = computed(() => countByStatus(CourseStatus.PUBLISHED))
const draftCount = computed(() => countByStatus(CourseStatus.DRAFT))
const archivedCount = computed(() => countByStatus(CourseStatus.ARCHIVED))
const publishPercent = computed(() => {
  if (!courseStore.myCourses.length) return 0
  return Math.round((publishedCount.value / courseStore.myCourses.length) * 100)
})

const revenuePoints = computed(() => {
  const now = new Date()
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1)
    const amount = earnings.value
      .filter((item) => {
        const createdAt = new Date(item.createdAt)
        return createdAt.getFullYear() === date.getFullYear() && createdAt.getMonth() === date.getMonth()
      })
      .reduce((total, item) => total + Number(item.netAmount || 0), 0)

    return { key: `${date.getFullYear()}-${date.getMonth()}`, label: `T${date.getMonth() + 1}`, amount }
  })
})

const maxRevenue = computed(() => Math.max(...revenuePoints.value.map((point) => point.amount), 1))
const hasRevenueTrend = computed(() => revenuePoints.value.some((point) => point.amount > 0))
const topCourseRevenues = computed(() =>
  [...courseRevenues.value].sort((left, right) => right.netRevenue - left.netRevenue).slice(0, 4),
)

function barHeight(amount: number) {
  if (!amount) return '3%'
  return `${Math.max(8, Math.round((amount / maxRevenue.value) * 100))}%`
}

onMounted(async () => {
  const [, overviewResult, earningsResult, coursesResult] = await Promise.allSettled([
    courseStore.fetchMyCourses(),
    revenueApi.getRevenueOverview(),
    revenueApi.getEarningsHistory({ limit: 100 }),
    revenueApi.getRevenueByCourse(),
  ])

  if (overviewResult.status === 'fulfilled') overview.value = overviewResult.value.data || null
  if (earningsResult.status === 'fulfilled') earnings.value = earningsResult.value.data || []
  if (coursesResult.status === 'fulfilled') courseRevenues.value = coursesResult.value.data || []
})
</script>

<template>
  <InstructorLayout>
    <main class="instructor-dashboard w-full">
      <header class="border-b border-slate-200 pb-3 dark:border-slate-800">
        <div>
          <p class="text-[10px] font-bold uppercase tracking-[0.16em] text-purple-600 dark:text-purple-400">Tổng quan giảng viên</p>
          <h1 class="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-white">Xin chào, {{ auth.user?.fullName }}</h1>
          <p class="mt-1 text-xs text-slate-500">Theo dõi khóa học và doanh thu trong cùng một màn hình.</p>
        </div>
      </header>

      <section class="mt-3 grid border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-2 xl:grid-cols-4">
        <article class="metric-cell"><span>Khóa học</span><b>{{ courseStore.myCourses.length }}</b><small>{{ publishedCount }} đang xuất bản</small></article>
        <article class="metric-cell metric-cell--green"><span>Doanh thu thực nhận</span><b>{{ formatMoney(overview?.netRevenue || 0, overview?.currency) }}</b><small>Sau phí nền tảng</small></article>
        <article class="metric-cell metric-cell--purple"><span>Số dư khả dụng</span><b>{{ formatMoney(overview?.availableBalance || 0, overview?.currency) }}</b><small>Sẵn sàng giải ngân</small></article>
        <article class="metric-cell metric-cell--amber"><span>Đang chờ</span><b>{{ formatMoney(overview?.pendingBalance || 0, overview?.currency) }}</b><small>Chưa khả dụng</small></article>
      </section>

      <section class="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1.65fr)_minmax(18rem,.75fr)]">
        <article class="dashboard-panel">
          <header class="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <div><h2 class="text-sm font-extrabold">Doanh thu 6 tháng gần nhất</h2><p class="mt-0.5 text-[11px] text-slate-500">Doanh thu thực nhận theo tháng</p></div>
            <b class="text-sm text-emerald-600 dark:text-emerald-400">{{ formatMoney(overview?.netRevenue || 0, overview?.currency) }}</b>
          </header>

          <div class="relative h-64 px-4 pb-3 pt-5">
            <div class="pointer-events-none absolute inset-x-4 bottom-9 top-5 flex flex-col justify-between">
              <span v-for="line in 4" :key="line" class="block border-t border-dashed border-slate-200 dark:border-slate-800" />
            </div>
            <div class="relative flex h-full items-end gap-3">
              <div v-for="point in revenuePoints" :key="point.key" class="flex h-full min-w-0 flex-1 flex-col justify-end">
                <div class="group relative flex min-h-0 flex-1 items-end justify-center">
                  <span class="revenue-tooltip">{{ formatMoney(point.amount, overview?.currency) }}</span>
                  <div :class="['w-full max-w-14 bg-purple-600 transition-[height] duration-500', point.amount ? 'opacity-100' : 'opacity-20']" :style="{ height: barHeight(point.amount) }" />
                </div>
                <span class="mt-2 text-center text-[10px] font-semibold text-slate-500">{{ point.label }}</span>
              </div>
            </div>
            <p v-if="!hasRevenueTrend" class="pointer-events-none absolute inset-x-0 top-1/2 text-center text-xs text-slate-400">Chưa phát sinh doanh thu trong giai đoạn này</p>
          </div>
        </article>

        <article class="dashboard-panel">
          <header class="border-b border-slate-100 px-4 py-3 dark:border-slate-800"><h2 class="text-sm font-extrabold">Cơ cấu tài chính</h2><p class="mt-0.5 text-[11px] text-slate-500">Tóm tắt dòng tiền hiện tại</p></header>
          <dl class="divide-y divide-slate-100 px-4 dark:divide-slate-800">
            <div class="finance-row"><dt>Doanh thu gộp</dt><dd>{{ formatMoney(overview?.grossRevenue || 0, overview?.currency) }}</dd></div>
            <div class="finance-row"><dt>Phí nền tảng</dt><dd class="text-rose-600">− {{ formatMoney(overview?.platformFees || 0, overview?.currency) }}</dd></div>
            <div class="finance-row"><dt>Đã thanh toán</dt><dd class="text-emerald-600">{{ formatMoney(overview?.paidAmount || 0, overview?.currency) }}</dd></div>
            <div class="finance-row"><dt>Đảo ngược</dt><dd>{{ formatMoney(overview?.reversedAmount || 0, overview?.currency) }}</dd></div>
          </dl>
        </article>
      </section>

      <section class="mt-3 grid gap-3 xl:grid-cols-[.75fr_1.25fr]">
        <article class="dashboard-panel p-4">
          <div class="flex items-center justify-between gap-3">
            <div><h2 class="text-sm font-extrabold">Tình trạng khóa học</h2><p class="mt-0.5 text-[11px] text-slate-500">{{ publishPercent }}% khóa học đã xuất bản</p></div>
            <b class="text-xl text-purple-600">{{ publishedCount }}/{{ courseStore.myCourses.length }}</b>
          </div>
          <div class="mt-4 flex h-3 overflow-hidden bg-slate-100 dark:bg-slate-800">
            <span class="bg-emerald-500" :style="{ width: `${publishPercent}%` }" />
            <span class="bg-amber-400" :style="{ width: `${courseStore.myCourses.length ? (draftCount / courseStore.myCourses.length) * 100 : 0}%` }" />
            <span class="bg-slate-400" :style="{ width: `${courseStore.myCourses.length ? (archivedCount / courseStore.myCourses.length) * 100 : 0}%` }" />
          </div>
          <div class="mt-3 grid grid-cols-3 gap-2 text-[11px]">
            <span><i class="status-dot bg-emerald-500" />Xuất bản · {{ publishedCount }}</span>
            <span><i class="status-dot bg-amber-400" />Bản nháp · {{ draftCount }}</span>
            <span><i class="status-dot bg-slate-400" />Lưu trữ · {{ archivedCount }}</span>
          </div>
        </article>

        <article class="dashboard-panel">
          <header class="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <div><h2 class="text-sm font-extrabold">Khóa học tạo doanh thu</h2><p class="mt-0.5 text-[11px] text-slate-500">Xếp theo doanh thu thực nhận</p></div>
            <RouterLink to="/instructor/courses" class="text-[11px] font-bold text-purple-600">Xem khóa học</RouterLink>
          </header>
          <div v-if="topCourseRevenues.length" class="divide-y divide-slate-100 px-4 dark:divide-slate-800">
            <div v-for="course in topCourseRevenues" :key="course.courseId" class="grid grid-cols-[minmax(0,1fr)_auto] gap-3 py-2.5 text-xs">
              <div class="min-w-0"><b class="block truncate">{{ course.title }}</b><span class="mt-0.5 block text-[10px] text-slate-500">{{ course.successfulOrders }} đơn thành công</span></div>
              <b class="text-emerald-600">{{ formatMoney(course.netRevenue, course.currency) }}</b>
            </div>
          </div>
          <p v-else class="px-4 py-8 text-center text-xs text-slate-400">Chưa có khóa học phát sinh doanh thu.</p>
        </article>
      </section>
    </main>
  </InstructorLayout>
</template>

<style scoped>
.metric-cell{position:relative;min-width:0;padding:.9rem 1rem;border-right:1px solid var(--border)}
.metric-cell:last-child{border-right:0}.metric-cell::before{position:absolute;inset:0 auto 0 0;width:3px;background:#64748b;content:''}
.metric-cell--green::before{background:#10b981}.metric-cell--purple::before{background:#9333ea}.metric-cell--amber::before{background:#f59e0b}
.metric-cell span{display:block;font-size:.65rem;font-weight:700;color:var(--text-muted)}
.metric-cell b{display:block;margin-top:.2rem;overflow:hidden;text-overflow:ellipsis;font-size:1.1rem;font-weight:900;white-space:nowrap}
.metric-cell small{display:block;margin-top:.15rem;font-size:.625rem;color:var(--text-muted)}
.dashboard-panel{border:1px solid var(--border);background:var(--surface);box-shadow:var(--shadow-sm)}
.finance-row{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:.85rem 0;font-size:.72rem}
.finance-row dt{color:var(--text-muted)}.finance-row dd{font-weight:800;text-align:right}
.status-dot{display:inline-block;width:.45rem;height:.45rem;margin-right:.35rem;border-radius:50%}
.revenue-tooltip{position:absolute;bottom:calc(100% + .35rem);display:none;z-index:2;white-space:nowrap;background:#0f172a;padding:.25rem .4rem;color:white;font-size:.6rem}
.group:hover .revenue-tooltip{display:block}
@media(max-width:639px){.metric-cell{border-right:0;border-bottom:1px solid var(--border)}.metric-cell:last-child{border-bottom:0}}
</style>
