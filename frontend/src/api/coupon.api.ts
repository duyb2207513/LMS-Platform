import { useApi } from '@/composables/useApi'
import type { Coupon, CouponValidationResult, CouponUsage } from '@/types/commerce'
import type { ApiResponse, PaginatedResponse } from '@/types'

export function useCouponApi() {
  const api = useApi()

  async function validateCoupon(code: string, courseId?: string) {
    return api.post<ApiResponse<CouponValidationResult>>('/coupons/validate', {
      code: code.trim().toUpperCase(),
      courseId,
    })
  }

  async function getAdminCoupons(params?: Record<string, string | number | boolean | undefined>) {
    return api.get<PaginatedResponse<Coupon>>('/admin/coupons', params)
  }

  async function createCoupon(data: Partial<Coupon>) {
    return api.post<ApiResponse<Coupon>>('/admin/coupons', data)
  }

  async function updateCoupon(id: string, data: Partial<Coupon>) {
    return api.patch<ApiResponse<Coupon>>(`/admin/coupons/${id}`, data)
  }

  async function toggleCouponStatus(id: string, isActive: boolean) {
    return api.patch<ApiResponse<Coupon>>(`/admin/coupons/${id}/status`, { isActive })
  }

  async function getCouponUsages(id: string, params?: Record<string, string | number | boolean | undefined>) {
    return api.get<PaginatedResponse<CouponUsage>>(`/admin/coupons/${id}/usages`, params)
  }

  return {
    loading: api.loading,
    error: api.error,
    validateCoupon,
    getAdminCoupons,
    createCoupon,
    updateCoupon,
    toggleCouponStatus,
    getCouponUsages,
  }
}
