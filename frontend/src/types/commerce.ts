export enum DiscountType {
  PERCENTAGE = "PERCENTAGE",
  FIXED_AMOUNT = "FIXED_AMOUNT",
}

export interface Coupon {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount?: number | null;
  minOrderAmount?: number | null;
  startsAt: string;
  expiresAt: string;
  maxRedemptions?: number | null;
  redeemedCount: number;
  appliesToAllCourses: boolean;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  courses?: { id: string; title: string }[];
  courseIds?: string[];
}

export interface CouponValidationResult {
  valid: boolean;
  coupon?: {
    code: string;
    discountType: DiscountType;
    discountValue: number;
    name?: string;
  };
  pricing?: {
    originalAmount: number;
    discountAmount: number;
    finalAmount: number;
    currency: string;
  };
}

export interface CouponUsage {
  id: string;
  couponId: string;
  userId: string;
  orderId: string;
  discountAmount: number;
  status: string;
  usedAt?: string | null;
  createdAt: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
  };
  order?: {
    id: string;
    orderNumber: string;
    total: number;
  };
}

export enum RefundRequestStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  PROCESSING = "PROCESSING",
  REFUNDED = "REFUNDED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

export interface RefundRequest {
  id: string;
  userId: string;
  orderId: string;
  paymentId: string;
  reason: string;
  status: RefundRequestStatus;
  requestedAmount: number;
  approvedAmount?: number | null;
  adminNote?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  order?: {
    id: string;
    orderNumber: string;
    total: number;
    items?: {
      id: string;
      courseTitleSnapshot: string;
      priceSnapshot: number;
    }[];
  };
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export enum EarningStatus {
  PENDING = "PENDING",
  AVAILABLE = "AVAILABLE",
  PAID = "PAID",
  REVERSED = "REVERSED",
}

export interface InstructorEarning {
  id: string;
  instructorId: string;
  courseId: string;
  orderId: string;
  paymentId: string;
  grossAmount: number;
  platformFeeRate: number;
  platformFeeAmount: number;
  netAmount: number;
  currency: string;
  status: EarningStatus;
  availableAt: string;
  payoutId?: string | null;
  reversedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  course?: {
    id: string;
    title: string;
  };
}

export interface RevenueOverview {
  grossRevenue: number;
  platformFees: number;
  netRevenue: number;
  pendingBalance: number;
  availableBalance: number;
  paidAmount: number;
  reversedAmount: number;
  currency: string;
}

export interface CourseRevenue {
  courseId: string;
  title: string;
  successfulOrders: number;
  refundCount: number;
  grossRevenue: number;
  platformFees: number;
  netRevenue: number;
  currency: string;
}

export enum PayoutStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  PAID = "PAID",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

export interface Payout {
  id: string;
  instructorId: string;
  amount: number;
  currency: string;
  status: PayoutStatus;
  providerReference?: string | null;
  failureReason?: string | null;
  createdBy: string;
  processedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  instructor?: {
    id: string;
    name: string;
    email: string;
  };
}
