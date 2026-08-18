# Implementation Plan — Sprint 10 Frontend (Coupon, Refund & Revenue)

Implementation of all Frontend (FE) features for Sprint 10 as specified in [`docs/SPRINT_10_COUPON_REFUND_REVENUE.md`](file:///d:/LMS-Platform/docs/SPRINT_10_COUPON_REFUND_REVENUE.md).

## Summary of Goals

1. **Coupon Checkout & Validation**:
   - Enable Students to input, validate, apply, and remove coupon codes during checkout.
   - Display real-time subtotal, discount amount, applied coupon details, and total price calculated by Backend.
2. **Admin Coupon Management**:
   - Provide Admin interface to create, edit, toggle (active/inactive), search, and filter coupons (Percentage or Fixed Amount, start/end dates, max redemptions, min order amount, course applicability).
   - View usage history for each coupon.
3. **Student Refund Workflow**:
   - Allow Students to request a refund for eligible orders within the refund window.
   - Student dashboard view for tracking refund request status (`PENDING`, `APPROVED`, `REJECTED`, `PROCESSING`, `REFUNDED`, `FAILED`, `CANCELLED`) with reason and status timeline.
4. **Admin Refund Management**:
   - Provide Admin interface to review refund requests, view student reason, order history, and learning progress.
   - Approve or reject requests with required/optional admin notes and trigger payment sandbox refund.
5. **Instructor Revenue Dashboard**:
   - Provide Instructor dashboard displaying revenue KPIs (Gross Revenue, Platform Fees, Net Revenue, Pending, Available, Paid, Reversed balances).
   - Date range filter, revenue breakdown by course, detailed earnings table, and payout history.
6. **Admin Payout Sandbox UI**:
   - Provide Admin interface to view available instructor balances, create sandbox payouts, and process simulated payouts.
7. **Frontend Unit Tests**:
   - Component & unit tests using Vitest for Coupon input/summary, Refund badge/timeline, and Money formatters.

---

## User Review Required

> [!IMPORTANT]
> All financial amounts and totals displayed in the UI will strictly rely on Backend calculations. Frontend will format amounts using `Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })`.

> [!NOTE]
> Navigation menus in `AdminLayout.vue` and `InstructorLayout.vue` will be updated to include links to the new management pages.

---

## Proposed Changes

### 1. Data Types & Utility Helpers

#### [NEW] [`src/types/commerce.ts`](file:///d:/LMS-Platform/frontend/src/types/commerce.ts)
- Interfaces for `Coupon`, `CouponValidationResult`, `CouponUsage`, `RefundRequest`, `PaymentRefund`, `InstructorEarning`, `RevenueOverview`, `CourseRevenue`, `Payout`.
- Enums for `DiscountType`, `RefundRequestStatus`, `EarningStatus`, `PayoutStatus`.

#### [NEW] [`src/utils/formatters.ts`](file:///d:/LMS-Platform/frontend/src/utils/formatters.ts)
- `formatMoney(amount: number, currency?: string)`: Standardized VND/currency formatting.
- `formatDate(dateString: string)`: Date and time formatting utility.

---

### 2. API Clients & Pinia Stores

#### [NEW] [`src/api/coupon.api.ts`](file:///d:/LMS-Platform/frontend/src/api/coupon.api.ts)
- `validateCoupon(code, courseId)`
- `getAdminCoupons(params)`
- `createCoupon(data)`
- `updateCoupon(id, data)`
- `toggleCouponStatus(id, isActive)`
- `getCouponUsages(id)`

#### [NEW] [`src/api/refund.api.ts`](file:///d:/LMS-Platform/frontend/src/api/refund.api.ts)
- `createRefundRequest(orderId, reason)`
- `getMyRefundRequests()`
- `getRefundDetail(id)`
- `cancelRefundRequest(id)`
- `getAdminRefundRequests(params)`
- `approveRefund(id, adminNote)`
- `rejectRefund(id, adminNote)`

#### [NEW] [`src/api/revenue.api.ts`](file:///d:/LMS-Platform/frontend/src/api/revenue.api.ts)
- `getRevenueOverview(from?, to?)`
- `getEarningsHistory(params)`
- `getRevenueByCourse()`
- `getInstructorPayouts()`

#### [NEW] [`src/api/payout.api.ts`](file:///d:/LMS-Platform/frontend/src/api/payout.api.ts)
- `getAdminPayouts(params)`
- `createPayoutSandbox(instructorId, earningIds)`
- `processPayoutSandbox(id)`

---

### 3. Components

#### [NEW] [`src/components/checkout/CouponInput.vue`](file:///d:/LMS-Platform/frontend/src/components/checkout/CouponInput.vue)
- Input box with auto-uppercase transform, Trim, Apply and Remove buttons, validation state, error messages.

#### [NEW] [`src/components/checkout/OrderPriceSummary.vue`](file:///d:/LMS-Platform/frontend/src/components/checkout/OrderPriceSummary.vue)
- Visual breakdown of Subtotal, Discount, Applied Coupon Badge, and Final Total.

#### [NEW] [`src/components/refunds/RefundRequestForm.vue`](file:///d:/LMS-Platform/frontend/src/components/refunds/RefundRequestForm.vue)
- Modal form for Student to enter reason and submit a refund request.

#### [NEW] [`src/components/refunds/RefundStatusBadge.vue`](file:///d:/LMS-Platform/frontend/src/components/refunds/RefundStatusBadge.vue)
- Status badge with unique colors for PENDING, APPROVED, REJECTED, PROCESSING, REFUNDED, FAILED, CANCELLED.

#### [NEW] [`src/components/refunds/RefundTimeline.vue`](file:///d:/LMS-Platform/frontend/src/components/refunds/RefundTimeline.vue)
- Step-by-step visual timeline tracking refund request status progress.

#### [NEW] [`src/components/revenue/RevenueMetricCard.vue`](file:///d:/LMS-Platform/frontend/src/components/revenue/RevenueMetricCard.vue)
- KPI Metric card with icon, title, formatted value, subtext/tooltip explanation.

#### [NEW] [`src/components/revenue/RevenueByCourseTable.vue`](file:///d:/LMS-Platform/frontend/src/components/revenue/RevenueByCourseTable.vue)
- Table listing revenue breakdown by course (Gross, Platform fee, Net, Orders count, Refund count).

#### [NEW] [`src/components/revenue/EarningsTable.vue`](file:///d:/LMS-Platform/frontend/src/components/revenue/EarningsTable.vue)
- Paginated table showing instructor earnings log with status filters (`PENDING`, `AVAILABLE`, `PAID`, `REVERSED`).

#### [NEW] [`src/components/revenue/PayoutHistoryTable.vue`](file:///d:/LMS-Platform/frontend/src/components/revenue/PayoutHistoryTable.vue)
- Table showing payout transactions history.

---

### 4. Pages & Views

#### [MODIFY] [`src/pages/student/CheckoutPage.vue`](file:///d:/LMS-Platform/frontend/src/pages/student/CheckoutPage.vue)
- Integrate `CouponInput` and `OrderPriceSummary`, handle validation and pass coupon code on payment submission.

#### [MODIFY] [`src/pages/student/OrdersPage.vue`](file:///d:/LMS-Platform/frontend/src/pages/student/OrdersPage.vue)
- Add "Yêu cầu hoàn tiền" button for eligible paid orders, displaying refund status if request exists.

#### [NEW] [`src/pages/student/RefundRequestsView.vue`](file:///d:/LMS-Platform/frontend/src/pages/student/RefundRequestsView.vue)
- Student view listing all refund requests with filter, details modal, cancel pending request button.

#### [NEW] [`src/pages/admin/CouponManagementView.vue`](file:///d:/LMS-Platform/frontend/src/pages/admin/CouponManagementView.vue)
- Admin table for coupons with search, status filters, Create/Edit modal form, toggle active status, view redemptions count & usage list modal.

#### [NEW] [`src/pages/admin/RefundManagementView.vue`](file:///d:/LMS-Platform/frontend/src/pages/admin/RefundManagementView.vue)
- Admin dashboard to review refund requests, filter by status, view student progress & reason, modal to Approve or Reject with Admin Note.

#### [NEW] [`src/pages/admin/PayoutManagementView.vue`](file:///d:/LMS-Platform/frontend/src/pages/admin/PayoutManagementView.vue)
- Admin UI to list instructor available balances, create payout sandbox, process payout with status feedback.

#### [NEW] [`src/pages/instructor/RevenueDashboardView.vue`](file:///d:/LMS-Platform/frontend/src/pages/instructor/RevenueDashboardView.vue)
- Instructor revenue dashboard featuring KPI cards, date filter, revenue by course, earnings table, payout history.

---

### 5. Routing & Layout Navigation

#### [MODIFY] [`src/router/index.ts`](file:///d:/LMS-Platform/frontend/src/router/index.ts)
- Add routes for:
  - `/refund-requests` (Student)
  - `/instructor/revenue` (Instructor)
  - `/admin/coupons` (Admin)
  - `/admin/refunds` (Admin)
  - `/admin/payouts` (Admin)

#### [MODIFY] [`src/layouts/AdminLayout.vue`](file:///d:/LMS-Platform/frontend/src/layouts/AdminLayout.vue)
- Add sidebar menu items for Coupon, Refund, and Payout Management.

#### [MODIFY] [`src/layouts/InstructorLayout.vue`](file:///d:/LMS-Platform/frontend/src/layouts/InstructorLayout.vue)
- Add sidebar menu item for Revenue Dashboard.

---

## Verification Plan

### Automated Tests
- Run Vitest tests for components and utilities:
  ```bash
  cd frontend
  npm run test
  ```
- Run linter & type checks:
  ```bash
  cd frontend
  npm run type-check
  ```

### Manual Verification
1. **Student Coupon Checkout**:
   - Go to checkout page, enter valid percentage/fixed coupon -> verify discount and total calculation from backend response.
   - Enter invalid/expired coupon -> verify error message displays correctly.
2. **Admin Coupon Management**:
   - Navigate to `/admin/coupons`.
   - Create percentage coupon & fixed coupon with date limits, course selector, and max usage.
   - Toggle status enable/disable.
3. **Student & Admin Refund Flow**:
   - Navigate to `/orders` as student -> click "Yêu cầu hoàn tiền" -> submit reason.
   - Check status on `/refund-requests`.
   - Login as Admin -> navigate to `/admin/refunds` -> inspect request -> Approve or Reject with note.
   - Verify status updates on Student side.
4. **Instructor Revenue & Admin Payout**:
   - Login as Instructor -> navigate to `/instructor/revenue` -> view KPI cards, filter dates, check course breakdown.
   - Login as Admin -> navigate to `/admin/payouts` -> create and process sandbox payout.
