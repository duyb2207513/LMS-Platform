ALTER TYPE "EnrollmentStatus" ADD VALUE IF NOT EXISTS 'REFUNDED';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'REFUNDED';
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'REFUNDED';

CREATE TYPE "CouponDiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');
CREATE TYPE "CouponUsageStatus" AS ENUM ('REDEEMED', 'RELEASED');
CREATE TYPE "RefundRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PROCESSING', 'REFUNDED', 'FAILED', 'CANCELLED');
CREATE TYPE "PaymentRefundStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED');
CREATE TYPE "EarningStatus" AS ENUM ('PENDING', 'AVAILABLE', 'PAID', 'REVERSED');
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED');

CREATE TABLE "coupons" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "code" VARCHAR(50) NOT NULL, "name" VARCHAR(255) NOT NULL,
  "description" TEXT, "discount_type" "CouponDiscountType" NOT NULL, "discount_value" DECIMAL(12,2) NOT NULL,
  "max_discount_amount" DECIMAL(12,2), "min_order_amount" DECIMAL(12,2), "starts_at" TIMESTAMPTZ(3) NOT NULL,
  "expires_at" TIMESTAMPTZ(3) NOT NULL, "max_redemptions" INTEGER, "redeemed_count" INTEGER NOT NULL DEFAULT 0,
  "applies_to_all_courses" BOOLEAN NOT NULL DEFAULT false, "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_by" UUID NOT NULL, "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "coupons_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "coupons_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "coupons_dates_check" CHECK ("starts_at" < "expires_at"),
  CONSTRAINT "coupons_discount_check" CHECK ("discount_value" > 0 AND ("discount_type" <> 'PERCENTAGE' OR "discount_value" <= 100)),
  CONSTRAINT "coupons_limits_check" CHECK (("max_redemptions" IS NULL OR "max_redemptions" > 0) AND "redeemed_count" >= 0)
);
CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");
CREATE INDEX "coupons_is_active_starts_at_expires_at_idx" ON "coupons"("is_active", "starts_at", "expires_at");

CREATE TABLE "coupon_courses" (
  "coupon_id" UUID NOT NULL, "course_id" UUID NOT NULL, "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "coupon_courses_pkey" PRIMARY KEY ("coupon_id", "course_id"),
  CONSTRAINT "coupon_courses_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "coupon_courses_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "coupon_courses_course_id_idx" ON "coupon_courses"("course_id");

ALTER TABLE "orders" ADD COLUMN "coupon_id" UUID, ADD COLUMN "discount_amount" DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE "orders" ADD CONSTRAINT "orders_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "coupon_usages" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "coupon_id" UUID NOT NULL, "user_id" UUID NOT NULL, "order_id" UUID NOT NULL,
  "discount_amount" DECIMAL(12,2) NOT NULL, "status" "CouponUsageStatus" NOT NULL DEFAULT 'REDEEMED',
  "used_at" TIMESTAMPTZ(3), "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "coupon_usages_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "coupon_usages_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "coupon_usages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "coupon_usages_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "coupon_usages_order_id_key" ON "coupon_usages"("order_id");
CREATE UNIQUE INDEX "coupon_usages_coupon_id_user_id_key" ON "coupon_usages"("coupon_id", "user_id");
CREATE INDEX "coupon_usages_coupon_id_status_idx" ON "coupon_usages"("coupon_id", "status");

CREATE TABLE "refund_requests" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "user_id" UUID NOT NULL, "order_id" UUID NOT NULL, "payment_id" UUID NOT NULL,
  "reason" TEXT NOT NULL, "status" "RefundRequestStatus" NOT NULL DEFAULT 'PENDING', "requested_amount" DECIMAL(12,2) NOT NULL,
  "approved_amount" DECIMAL(12,2), "admin_note" TEXT, "reviewed_by" UUID, "reviewed_at" TIMESTAMPTZ(3),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "refund_requests_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "refund_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "refund_requests_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "refund_requests_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "refund_requests_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "refund_requests_user_id_created_at_idx" ON "refund_requests"("user_id", "created_at");
CREATE INDEX "refund_requests_payment_id_status_idx" ON "refund_requests"("payment_id", "status");
CREATE INDEX "refund_requests_status_created_at_idx" ON "refund_requests"("status", "created_at");

CREATE TABLE "payment_refunds" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "refund_request_id" UUID NOT NULL, "payment_id" UUID NOT NULL,
  "provider_refund_id" VARCHAR(255), "idempotency_key" VARCHAR(255) NOT NULL, "amount" DECIMAL(12,2) NOT NULL,
  "status" "PaymentRefundStatus" NOT NULL DEFAULT 'PENDING', "failure_reason" TEXT, "processed_at" TIMESTAMPTZ(3),
  "provider_payload" JSONB, "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "payment_refunds_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "payment_refunds_refund_request_id_fkey" FOREIGN KEY ("refund_request_id") REFERENCES "refund_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "payment_refunds_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "payment_refunds_provider_refund_id_key" ON "payment_refunds"("provider_refund_id");
CREATE UNIQUE INDEX "payment_refunds_idempotency_key_key" ON "payment_refunds"("idempotency_key");
CREATE INDEX "payment_refunds_refund_request_id_idx" ON "payment_refunds"("refund_request_id");
CREATE INDEX "payment_refunds_payment_id_status_idx" ON "payment_refunds"("payment_id", "status");

CREATE TABLE "payouts" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "instructor_id" UUID NOT NULL, "amount" DECIMAL(12,2) NOT NULL,
  "currency" VARCHAR(3) NOT NULL DEFAULT 'VND', "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
  "provider_reference" VARCHAR(255), "failure_reason" TEXT, "created_by" UUID NOT NULL,
  "idempotency_key" VARCHAR(255) NOT NULL, "processed_at" TIMESTAMPTZ(3),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "payouts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "payouts_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "payouts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "payouts_provider_reference_key" ON "payouts"("provider_reference");
CREATE UNIQUE INDEX "payouts_idempotency_key_key" ON "payouts"("idempotency_key");
CREATE INDEX "payouts_instructor_id_status_created_at_idx" ON "payouts"("instructor_id", "status", "created_at");

CREATE TABLE "instructor_earnings" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "instructor_id" UUID NOT NULL, "course_id" UUID NOT NULL,
  "order_id" UUID NOT NULL, "order_item_id" UUID NOT NULL, "payment_id" UUID NOT NULL,
  "gross_amount" DECIMAL(12,2) NOT NULL, "platform_fee_rate" DECIMAL(5,2) NOT NULL,
  "platform_fee_amount" DECIMAL(12,2) NOT NULL, "net_amount" DECIMAL(12,2) NOT NULL,
  "currency" VARCHAR(3) NOT NULL DEFAULT 'VND', "status" "EarningStatus" NOT NULL DEFAULT 'PENDING',
  "available_at" TIMESTAMPTZ(3) NOT NULL, "payout_id" UUID, "reversed_at" TIMESTAMPTZ(3),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "instructor_earnings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "instructor_earnings_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "instructor_earnings_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "instructor_earnings_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "instructor_earnings_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "instructor_earnings_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "instructor_earnings_payout_id_fkey" FOREIGN KEY ("payout_id") REFERENCES "payouts"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "instructor_earnings_amounts_check" CHECK ("gross_amount" = "platform_fee_amount" + "net_amount")
);
CREATE UNIQUE INDEX "instructor_earnings_order_item_id_key" ON "instructor_earnings"("order_item_id");
CREATE INDEX "instructor_earnings_instructor_id_status_available_at_idx" ON "instructor_earnings"("instructor_id", "status", "available_at");
CREATE INDEX "instructor_earnings_course_id_created_at_idx" ON "instructor_earnings"("course_id", "created_at");
CREATE INDEX "instructor_earnings_order_id_idx" ON "instructor_earnings"("order_id");
