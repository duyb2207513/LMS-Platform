ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ASSIGNMENT_GRADED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PAYMENT_SUCCEEDED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'DIRECT_MESSAGE';

ALTER TABLE "users"
  ADD COLUMN "first_name" VARCHAR(50),
  ADD COLUMN "last_name" VARCHAR(50),
  ADD COLUMN "phone_number" VARCHAR(20);

CREATE UNIQUE INDEX "users_phone_number_key" ON "users"("phone_number");

CREATE TABLE "direct_messages" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "sender_id" UUID NOT NULL,
  "recipient_id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "read_at" TIMESTAMPTZ(3),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "direct_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "direct_messages_sender_id_recipient_id_created_at_idx" ON "direct_messages"("sender_id", "recipient_id", "created_at" DESC);
CREATE INDEX "direct_messages_recipient_id_read_at_created_at_idx" ON "direct_messages"("recipient_id", "read_at", "created_at" DESC);
ALTER TABLE "direct_messages" ADD CONSTRAINT "direct_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "direct_messages" ADD CONSTRAINT "direct_messages_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
