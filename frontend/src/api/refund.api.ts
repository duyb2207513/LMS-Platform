import { useApi } from '@/composables/useApi'
import type { RefundRequest } from '@/types/commerce'
import type { ApiResponse, PaginatedResponse } from '@/types'

export function useRefundApi() {
  const api = useApi()

  async function createRefundRequest(orderId: string, reason: string) {
    return api.post<ApiResponse<RefundRequest>>('/refund-requests', { orderId, reason })
  }

  async function getMyRefundRequests() {
    return api.get<ApiResponse<RefundRequest[]>>('/refund-requests/me')
  }

  async function getRefundDetail(id: string) {
    return api.get<ApiResponse<RefundRequest>>(`/refund-requests/${id}`)
  }

  async function cancelRefundRequest(id: string) {
    return api.patch<ApiResponse<RefundRequest>>(`/refund-requests/${id}/cancel`)
  }

  async function getAdminRefundRequests(params?: Record<string, string | number | boolean | undefined>) {
    return api.get<PaginatedResponse<RefundRequest>>('/admin/refund-requests', params)
  }

  async function approveRefund(id: string, adminNote?: string) {
    return api.post<ApiResponse<RefundRequest>>(
      `/admin/refund-requests/${id}/approve`,
      { adminNote },
      { 'Idempotency-Key': `refund-${id}-${Date.now()}` }
    )
  }

  async function rejectRefund(id: string, adminNote: string) {
    return api.post<ApiResponse<RefundRequest>>(`/admin/refund-requests/${id}/reject`, { adminNote })
  }

  return {
    loading: api.loading,
    error: api.error,
    createRefundRequest,
    getMyRefundRequests,
    getRefundDetail,
    cancelRefundRequest,
    getAdminRefundRequests,
    approveRefund,
    rejectRefund,
  }
}
