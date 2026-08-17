<script setup lang="ts">
import { onMounted, ref } from 'vue'
import InstructorLayout from '@/layouts/InstructorLayout.vue'
import RevenueMetricCard from '@/components/revenue/RevenueMetricCard.vue'
import RevenueByCourseTable from '@/components/revenue/RevenueByCourseTable.vue'
import EarningsTable from '@/components/revenue/EarningsTable.vue'
import PayoutHistoryTable from '@/components/revenue/PayoutHistoryTable.vue'
import { useRevenueApi } from '@/api/revenue.api'
import type { RevenueOverview, CourseRevenue, InstructorEarning, Payout } from '@/types/commerce'

const revenueApi = useRevenueApi()

const overview = ref<RevenueOverview | null>(null)
const courseRevenues = ref<CourseRevenue[]>([])
const earnings = ref<InstructorEarning[]>([])
const payouts = ref<Payout[]>([])

const fromDate = ref('')
const toDate = ref('')
const activeTab = ref<'by-course' | 'earnings' | 'payouts'>('by-course')

async function loadData() {
  try {
    const resOverview = await revenueApi.getRevenueOverview(fromDate.value || undefined, toDate.value || undefined)
    overview.value = resOverview.data || null

    const resCourse = await revenueApi.getRevenueByCourse()
    courseRevenues.value = resCourse.data || []

    const resEarnings = await revenueApi.getEarningsHistory()
    earnings.value = resEarnings.data || []

    const resPayouts = await revenueApi.getInstructorPayouts()
    payouts.value = resPayouts.data || []
  } catch (err: unknown) {
    console.error(err)
  }
}

onMounted(loadData)
</script>

<template>
  <InstructorLayout>
    <div class="space-y-6">
      <header class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-black text-slate-900 dark:text-white">Dashboard Doanh thu</h1>
          <p class="text-xs text-slate-500">Tổng quan thu nhập, phí nền tảng và lịch sử giải ngân của bạn</p>
        </div>

        <!-- Date Range Filters -->
        <div class="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 text-xs dark:border-slate-800 dark:bg-slate-900">
          <label class="font-bold text-slate-500">Từ:</label>
          <input
            v-model="fromDate"
            type="date"
            class="rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            @change="loadData"
          />
          <label class="font-bold text-slate-500">Đến:</label>
          <input
            v-model="toDate"
            type="date"
            class="rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            @change="loadData"
          />
        </div>
      </header>

      <!-- Revenue Metric Cards Grid -->
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <RevenueMetricCard
          title="Doanh thu gộp (Gross)"
          :amount="overview?.grossRevenue || 0"
          :currency="overview?.currency"
          description="Tổng số tiền học viên thanh toán mua khóa học"
          icon="💰"
          variant="purple"
        />
        <RevenueMetricCard
          title="Phí nền tảng (Platform Fee)"
          :amount="overview?.platformFees || 0"
          :currency="overview?.currency"
          description="Chi phí hạ tầng và vận hành hệ thống LMS"
          icon="🏷️"
          variant="default"
        />
        <RevenueMetricCard
          title="Doanh thu thực nhận (Net)"
          :amount="overview?.netRevenue || 0"
          :currency="overview?.currency"
          description="Thu nhập sau khi đã trừ phí nền tảng"
          icon="✨"
          variant="success"
        />
        <RevenueMetricCard
          title="Số dư khả dụng (Available)"
          :amount="overview?.availableBalance || 0"
          :currency="overview?.currency"
          description="Sẵn sàng để giải ngân / payout"
          icon="💳"
          variant="warning"
        />
      </div>

      <!-- Secondary balances row -->
      <div class="grid gap-4 sm:grid-cols-3">
        <div class="surface-card flex items-center justify-between p-4">
          <span class="text-xs font-bold text-slate-500">Thu nhập đang chờ (Pending)</span>
          <b class="text-sm text-amber-600 dark:text-amber-400">{{ overview?.pendingBalance || 0 }} ₫</b>
        </div>
        <div class="surface-card flex items-center justify-between p-4">
          <span class="text-xs font-bold text-slate-500">Đã thanh toán (Paid)</span>
          <b class="text-sm text-emerald-600 dark:text-emerald-400">{{ overview?.paidAmount || 0 }} ₫</b>
        </div>
        <div class="surface-card flex items-center justify-between p-4">
          <span class="text-xs font-bold text-slate-500">Đã bị đảo ngược (Reversed)</span>
          <b class="text-sm text-rose-600 dark:text-rose-400">{{ overview?.reversedAmount || 0 }} ₫</b>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          :class="['px-4 py-2.5 text-sm font-bold border-b-2 transition-colors', activeTab === 'by-course' ? 'border-purple-600 text-purple-600 dark:text-purple-400' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white']"
          @click="activeTab = 'by-course'"
        >
          Theo khóa học
        </button>
        <button
          :class="['px-4 py-2.5 text-sm font-bold border-b-2 transition-colors', activeTab === 'earnings' ? 'border-purple-600 text-purple-600 dark:text-purple-400' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white']"
          @click="activeTab = 'earnings'"
        >
          Lịch sử thu nhập (Earnings)
        </button>
        <button
          :class="['px-4 py-2.5 text-sm font-bold border-b-2 transition-colors', activeTab === 'payouts' ? 'border-purple-600 text-purple-600 dark:text-purple-400' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white']"
          @click="activeTab = 'payouts'"
        >
          Lịch sử Payout
        </button>
      </div>

      <!-- Tab Content -->
      <div>
        <RevenueByCourseTable v-if="activeTab === 'by-course'" :items="courseRevenues" :loading="revenueApi.loading.value" />
        <EarningsTable v-else-if="activeTab === 'earnings'" :items="earnings" :loading="revenueApi.loading.value" />
        <PayoutHistoryTable v-else-if="activeTab === 'payouts'" :items="payouts" :loading="revenueApi.loading.value" />
      </div>
    </div>
  </InstructorLayout>
</template>
