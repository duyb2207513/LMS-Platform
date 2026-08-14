CREATE TYPE "NotificationType" AS ENUM ('WELCOME', 'COURSE_ENROLLED', 'NEW_LESSON', 'ASSIGNMENT_DUE', 'QUIZ_RESULT', 'CERTIFICATE_ISSUED', 'COURSE_ANNOUNCEMENT');
CREATE TYPE "EmailStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');
CREATE TYPE "AnnouncementStatus" AS ENUM ('DRAFT', 'PUBLISHED');

CREATE TABLE "notifications" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "type" "NotificationType" NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "message" TEXT NOT NULL,
  "data" JSONB,
  "is_read" BOOLEAN NOT NULL DEFAULT false,
  "read_at" TIMESTAMPTZ(3),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notification_preferences" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "in_app_enabled" BOOLEAN NOT NULL DEFAULT true,
  "email_enabled" BOOLEAN NOT NULL DEFAULT true,
  "course_updates" BOOLEAN NOT NULL DEFAULT true,
  "assignment_reminders" BOOLEAN NOT NULL DEFAULT true,
  "quiz_results" BOOLEAN NOT NULL DEFAULT true,
  "certificate_updates" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "email_logs" (
  "id" UUID NOT NULL,
  "user_id" UUID,
  "to_email" VARCHAR(255) NOT NULL,
  "subject" VARCHAR(255) NOT NULL,
  "template" VARCHAR(100) NOT NULL,
  "status" "EmailStatus" NOT NULL DEFAULT 'PENDING',
  "error_message" TEXT,
  "sent_at" TIMESTAMPTZ(3),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "course_announcements" (
  "id" UUID NOT NULL,
  "course_id" UUID NOT NULL,
  "author_id" UUID NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "content" TEXT NOT NULL,
  "status" "AnnouncementStatus" NOT NULL DEFAULT 'DRAFT',
  "published_at" TIMESTAMPTZ(3),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "course_announcements_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "notifications_user_id_created_at_idx" ON "notifications"("user_id", "created_at" DESC);
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");
CREATE UNIQUE INDEX "notification_preferences_user_id_key" ON "notification_preferences"("user_id");
CREATE INDEX "email_logs_user_id_created_at_idx" ON "email_logs"("user_id", "created_at" DESC);
CREATE INDEX "email_logs_status_created_at_idx" ON "email_logs"("status", "created_at");
CREATE INDEX "course_announcements_course_id_status_published_at_idx" ON "course_announcements"("course_id", "status", "published_at" DESC);
CREATE INDEX "course_announcements_author_id_idx" ON "course_announcements"("author_id");

ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "course_announcements" ADD CONSTRAINT "course_announcements_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "course_announcements" ADD CONSTRAINT "course_announcements_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
