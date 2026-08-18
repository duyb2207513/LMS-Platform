import { useApi } from '@/composables/useApi'
import type { RevenueOverview, CourseRevenue, InstructorEarning, Payout } from '@/types/commerce'
import type { ApiResponse, PaginatedResponse } from '@/types'

export function useRevenueApi() {
  const api = useApi()

  async function getRevenueOverview(from?: string, to?: string) {
    return api.get<ApiResponse<RevenueOverview>>('/instructor/revenue/overview', { from, to })
  }

  async function getEarningsHistory(params?: Record<string, string | number | boolean | undefined>) {
    return api.get<PaginatedResponse<InstructorEarning>>('/instructor/revenue/earnings', params)
  }

  async function getRevenueByCourse() {
    return api.get<ApiResponse<CourseRevenue[]>>('/instructor/revenue/by-course')
  }

  async function getInstructorPayouts() {
    return api.get<ApiResponse<Payout[]>>('/instructor/payouts')
  }

  return {
    loading: api.loading,
    error: api.error,
    getRevenueOverview,
    getEarningsHistory,
    getRevenueByCourse,
    getInstructorPayouts,
  }
}
