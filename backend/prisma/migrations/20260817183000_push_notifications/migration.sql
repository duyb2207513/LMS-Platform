ALTER TABLE "notification_preferences"
ADD COLUMN "push_enabled" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "push_devices" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "expo_push_token" VARCHAR(255) NOT NULL,
  "platform" VARCHAR(20) NOT NULL,
  "device_name" VARCHAR(120),
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "last_used_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "push_devices_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "push_devices_expo_push_token_key" ON "push_devices"("expo_push_token");
CREATE INDEX "push_devices_user_id_is_active_idx" ON "push_devices"("user_id", "is_active");

ALTER TABLE "push_devices"
ADD CONSTRAINT "push_devices_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
