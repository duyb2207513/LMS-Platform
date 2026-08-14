export interface CouponInput {
  code: string;
  name: string;
  description?: string | null;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  maxDiscountAmount?: number | null;
  minOrderAmount?: number | null;
  startsAt: Date;
  expiresAt: Date;
  maxRedemptions?: number | null;
  appliesToAllCourses: boolean;
  courseIds: string[];
  isActive: boolean;
}

export type CouponUpdateInput = Partial<Omit<CouponInput, "code">> & { code?: string };
export interface ValidateCouponInput { code: string; courseId: string }
export interface CouponStatusInput { isActive: boolean }
