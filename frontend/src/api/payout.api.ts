import { useApi } from '@/composables/useApi'
import type { Payout } from '@/types/commerce'
import type { ApiResponse, PaginatedResponse } from '@/types'

export interface InstructorBalance {
  instructorId: string
  instructorName: string
  email: string
  availableBalance: number
  pendingBalance: number
  currency: string
  earningIds: string[]
}

export function usePayoutApi() {
  const api = useApi()

  async function getAdminPayouts(params?: Record<string, string | number | boolean | undefined>) {
    return api.get<PaginatedResponse<Payout>>('/admin/payouts', params)
  }

  async function getInstructorBalances() {
    return api.get<ApiResponse<InstructorBalance[]>>('/admin/payouts/balances')
  }

  async function createPayoutSandbox(instructorId: string, earningIds?: string[]) {
    return api.post<ApiResponse<Payout>>(
      '/admin/payouts',
      { instructorId, earningIds },
      { 'Idempotency-Key': `payout-${instructorId}-${Date.now()}` }
    )
  }

  async function processPayoutSandbox(id: string) {
    return api.post<ApiResponse<Payout>>(`/admin/payouts/${id}/process`)
  }

  return {
    loading: api.loading,
    error: api.error,
    getAdminPayouts,
    getInstructorBalances,
    createPayoutSandbox,
    processPayoutSandbox,
  }
}
