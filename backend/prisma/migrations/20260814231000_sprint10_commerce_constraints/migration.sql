ALTER TABLE "coupons"
  ADD CONSTRAINT "coupons_code_uppercase_check" CHECK ("code" = UPPER("code"));

CREATE UNIQUE INDEX "refund_requests_one_active_payment_idx"
  ON "refund_requests"("payment_id")
  WHERE "status" IN ('PENDING', 'APPROVED', 'PROCESSING', 'REFUNDED');
