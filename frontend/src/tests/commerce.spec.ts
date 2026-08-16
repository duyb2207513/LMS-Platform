import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { formatMoney, formatDate } from '@/utils/formatters'
import RefundStatusBadge from '@/components/refunds/RefundStatusBadge.vue'
import OrderPriceSummary from '@/components/checkout/OrderPriceSummary.vue'
import { RefundRequestStatus } from '@/types/commerce'

describe('Commerce Formatters', () => {
  it('formats money in VND correctly', () => {
    expect(formatMoney(100000)).toContain('100.000')
    expect(formatMoney(0)).toContain('0')
    expect(formatMoney(null)).toContain('0')
  })

  it('formats dates cleanly', () => {
    const formatted = formatDate('2026-08-20T10:00:00.000Z')
    expect(formatted).not.toBe('-')
    expect(formatDate(null)).toBe('-')
  })
})

describe('RefundStatusBadge component', () => {
  it('renders PENDING badge label', () => {
    const wrapper = mount(RefundStatusBadge, {
      props: { status: RefundRequestStatus.PENDING },
    })
    expect(wrapper.text()).toBe('Chờ duyệt')
  })

  it('renders REFUNDED badge label', () => {
    const wrapper = mount(RefundStatusBadge, {
      props: { status: RefundRequestStatus.REFUNDED },
    })
    expect(wrapper.text()).toBe('Đã hoàn tiền')
  })
})

describe('OrderPriceSummary component', () => {
  it('renders subtotal, discount, and total correctly', () => {
    const wrapper = mount(OrderPriceSummary, {
      props: {
        subtotal: 1000000,
        discountAmount: 200000,
        total: 800000,
        couponCode: 'WELCOME20',
      },
    })
    expect(wrapper.text()).toContain('Tạm tính')
    expect(wrapper.text()).toContain('WELCOME20')
    expect(wrapper.text()).toContain('Tổng cộng')
  })
})
