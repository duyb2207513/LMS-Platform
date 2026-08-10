CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED');
CREATE TYPE "PaymentProvider" AS ENUM ('MOCK', 'VNPAY');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED');

CREATE TABLE "orders" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "order_number" VARCHAR(32) NOT NULL,
  "user_id" UUID NOT NULL, "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
  "subtotal" DECIMAL(12,2) NOT NULL, "total" DECIMAL(12,2) NOT NULL,
  "currency" VARCHAR(3) NOT NULL DEFAULT 'VND', "paid_at" TIMESTAMPTZ(3),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL, CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "orders_order_number_key" ON "orders"("order_number");
CREATE INDEX "orders_user_id_created_at_idx" ON "orders"("user_id", "created_at");
CREATE INDEX "orders_status_idx" ON "orders"("status");

CREATE TABLE "order_items" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "order_id" UUID NOT NULL, "course_id" UUID NOT NULL,
  "course_title_snapshot" VARCHAR(255) NOT NULL, "price_snapshot" DECIMAL(12,2) NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "order_items_order_id_course_id_key" ON "order_items"("order_id", "course_id");
CREATE INDEX "order_items_course_id_idx" ON "order_items"("course_id");

CREATE TABLE "payments" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "order_id" UUID NOT NULL,
  "provider" "PaymentProvider" NOT NULL, "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "amount" DECIMAL(12,2) NOT NULL, "currency" VARCHAR(3) NOT NULL DEFAULT 'VND',
  "idempotency_key" VARCHAR(100) NOT NULL, "provider_transaction_id" VARCHAR(100),
  "failure_reason" TEXT, "paid_at" TIMESTAMPTZ(3),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL, CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "payments_idempotency_key_key" ON "payments"("idempotency_key");
CREATE UNIQUE INDEX "payments_provider_transaction_id_key" ON "payments"("provider_transaction_id");
CREATE INDEX "payments_order_id_created_at_idx" ON "payments"("order_id", "created_at");
CREATE INDEX "payments_status_idx" ON "payments"("status");

CREATE TABLE "payment_webhook_events" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "payment_id" UUID NOT NULL,
  "provider" "PaymentProvider" NOT NULL, "event_id" VARCHAR(100) NOT NULL,
  "payload" JSONB NOT NULL, "processed_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payment_webhook_events_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "payment_webhook_events_provider_event_id_key" ON "payment_webhook_events"("provider", "event_id");
CREATE INDEX "payment_webhook_events_payment_id_idx" ON "payment_webhook_events"("payment_id");

CREATE TABLE "certificates" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "certificate_number" VARCHAR(40) NOT NULL,
  "verification_code" VARCHAR(64) NOT NULL, "enrollment_id" UUID NOT NULL,
  "student_id" UUID NOT NULL, "course_id" UUID NOT NULL,
  "student_name_snapshot" VARCHAR(100) NOT NULL, "course_title_snapshot" VARCHAR(255) NOT NULL,
  "instructor_name_snapshot" VARCHAR(100) NOT NULL,
  "issued_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "revoked_at" TIMESTAMPTZ(3),
  CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "certificates_certificate_number_key" ON "certificates"("certificate_number");
CREATE UNIQUE INDEX "certificates_verification_code_key" ON "certificates"("verification_code");
CREATE UNIQUE INDEX "certificates_enrollment_id_key" ON "certificates"("enrollment_id");
CREATE UNIQUE INDEX "certificates_student_id_course_id_key" ON "certificates"("student_id", "course_id");
CREATE INDEX "certificates_course_id_idx" ON "certificates"("course_id");

ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payment_webhook_events" ADD CONSTRAINT "payment_webhook_events_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
