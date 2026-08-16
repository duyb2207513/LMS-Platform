# Walkthrough — Sprint 10 Frontend Implementation

Completed all Frontend (FE) features for Sprint 10 (Coupon, Refund & Revenue) as specified in [`docs/SPRINT_10_COUPON_REFUND_REVENUE.md`](file:///d:/LMS-Platform/docs/SPRINT_10_COUPON_REFUND_REVENUE.md) and [`docs/SPRINT_10_FE_IMPLEMENTATION_PLAN.md`](file:///d:/LMS-Platform/docs/SPRINT_10_FE_IMPLEMENTATION_PLAN.md).

## Accomplished Changes

### 1. Data Types & Utility Helpers
- **[`src/types/commerce.ts`](file:///d:/LMS-Platform/frontend/src/types/commerce.ts)**: Added TypeScript interfaces for `Coupon`, `CouponValidationResult`, `CouponUsage`, `RefundRequest`, `InstructorEarning`, `RevenueOverview`, `CourseRevenue`, `Payout` and enums (`DiscountType`, `RefundRequestStatus`, `EarningStatus`, `PayoutStatus`).
- **[`src/utils/formatters.ts`](file:///d:/LMS-Platform/frontend/src/utils/formatters.ts)**: Created `formatMoney` utility for formatting VND currency and `formatDate` utility.

### 2. API Service Clients
- **[`src/api/coupon.api.ts`](file:///d:/LMS-Platform/frontend/src/api/coupon.api.ts)**: `validateCoupon`, `getAdminCoupons`, `createCoupon`, `updateCoupon`, `toggleCouponStatus`, `getCouponUsages`.
- **[`src/api/refund.api.ts`](file:///d:/LMS-Platform/frontend/src/api/refund.api.ts)**: `createRefundRequest`, `getMyRefundRequests`, `getRefundDetail`, `cancelRefundRequest`, `getAdminRefundRequests`, `approveRefund`, `rejectRefund`.
- **[`src/api/revenue.api.ts`](file:///d:/LMS-Platform/frontend/src/api/revenue.api.ts)**: `getRevenueOverview`, `getEarningsHistory`, `getRevenueByCourse`, `getInstructorPayouts`.
- **[`src/api/payout.api.ts`](file:///d:/LMS-Platform/frontend/src/api/payout.api.ts)**: `getAdminPayouts`, `getInstructorBalances`, `createPayoutSandbox`, `processPayoutSandbox`.

### 3. Components
- **[`src/components/checkout/CouponInput.vue`](file:///d:/LMS-Platform/frontend/src/components/checkout/CouponInput.vue)**: Coupon entry with auto-uppercase format, validate & remove buttons, applied coupon state badge.
- **[`src/components/checkout/OrderPriceSummary.vue`](file:///d:/LMS-Platform/frontend/src/components/checkout/OrderPriceSummary.vue)**: Visual breakdown of subtotal, discount amount, applied coupon badge, and total price.
- **[`src/components/refunds/RefundStatusBadge.vue`](file:///d:/LMS-Platform/frontend/src/components/refunds/RefundStatusBadge.vue)**: Status badge for PENDING, APPROVED, REJECTED, PROCESSING, REFUNDED, FAILED, CANCELLED.
- **[`src/components/refunds/RefundTimeline.vue`](file:///d:/LMS-Platform/frontend/src/components/refunds/RefundTimeline.vue)**: Timeline visualizing refund request progress step-by-step.
- **[`src/components/refunds/RefundRequestForm.vue`](file:///d:/LMS-Platform/frontend/src/components/refunds/RefundRequestForm.vue)**: Modal dialog for students to submit a refund reason.
- **[`src/components/revenue/RevenueMetricCard.vue`](file:///d:/LMS-Platform/frontend/src/components/revenue/RevenueMetricCard.vue)**: Card component for revenue KPIs (Gross, Platform fee, Net, Available, Pending, Paid, Reversed).
- **[`src/components/revenue/RevenueByCourseTable.vue`](file:///d:/LMS-Platform/frontend/src/components/revenue/RevenueByCourseTable.vue)**: Course-level revenue breakdown table.
- **[`src/components/revenue/EarningsTable.vue`](file:///d:/LMS-Platform/frontend/src/components/revenue/EarningsTable.vue)**: Instructor earnings history table.
- **[`src/components/revenue/PayoutHistoryTable.vue`](file:///d:/LMS-Platform/frontend/src/components/revenue/PayoutHistoryTable.vue)**: Payout transactions table.

### 4. Pages & Views
- **[`src/pages/student/CheckoutPage.vue`](file:///d:/LMS-Platform/frontend/src/pages/student/CheckoutPage.vue)**: Integrated `CouponInput` and `OrderPriceSummary`, passing coupon code on payment submission.
- **[`src/pages/student/OrdersPage.vue`](file:///d:/LMS-Platform/frontend/src/pages/student/OrdersPage.vue)**: Added refund request trigger button for paid orders and links to refund requests page.
- **[`src/pages/student/RefundRequestsView.vue`](file:///d:/LMS-Platform/frontend/src/pages/student/RefundRequestsView.vue)**: Student refund tracking page with progress timeline modal and pending request cancellation.
- **[`src/pages/admin/CouponManagementView.vue`](file:///d:/LMS-Platform/frontend/src/pages/admin/CouponManagementView.vue)**: Admin coupon CRUD table, create/edit modal form (percentage or fixed amount, date range, course picker), enable/disable toggle, usage history.
- **[`src/pages/admin/RefundManagementView.vue`](file:///d:/LMS-Platform/frontend/src/pages/admin/RefundManagementView.vue)**: Admin dashboard to review refund requests, inspect student reason, approve/reject with admin notes.
- **[`src/pages/admin/PayoutManagementView.vue`](file:///d:/LMS-Platform/frontend/src/pages/admin/PayoutManagementView.vue)**: Admin sandbox payout view to list available instructor balances and process payouts.
- **[`src/pages/instructor/RevenueDashboardView.vue`](file:///d:/LMS-Platform/frontend/src/pages/instructor/RevenueDashboardView.vue)**: Instructor revenue dashboard featuring KPI cards, date range filter, course breakdown, earnings, and payout history.

### 5. Routing & Layout Navigation
- Updated **[`src/router/index.ts`](file:///d:/LMS-Platform/frontend/src/router/index.ts)** with routes for `/refund-requests`, `/instructor/revenue`, `/admin/coupons`, `/admin/refunds`, `/admin/payouts` guarded by role.
- Updated **[`src/layouts/AdminLayout.vue`](file:///d:/LMS-Platform/frontend/src/layouts/AdminLayout.vue)** sidebar links for Coupon, Refund, and Payout Management.
- Updated **[`src/layouts/InstructorLayout.vue`](file:///d:/LMS-Platform/frontend/src/layouts/InstructorLayout.vue)** sidebar link for Revenue Dashboard.

### 6. Automated Verification & Testing
- Added **[`src/tests/commerce.spec.ts`](file:///d:/LMS-Platform/frontend/src/tests/commerce.spec.ts)**.
- Ran TypeScript type checks (`npm run type-check`) - Passed with 0 errors.
- Ran Vitest unit test suite (`npx vitest run`) - Passed 9/9 tests.
- Ran production build (`npm run build-only`) - Succeeded in 2.83s.
