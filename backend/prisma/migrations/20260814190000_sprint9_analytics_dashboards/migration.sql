-- Sprint 9: learning analytics event storage.
CREATE TYPE "LearningEventType" AS ENUM (
  'COURSE_OPENED',
  'LESSON_STARTED',
  'LESSON_COMPLETED',
  'QUIZ_STARTED',
  'QUIZ_SUBMITTED',
  'STUDY_SESSION'
);

CREATE TABLE "learning_events" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "course_id" UUID NOT NULL,
  "lesson_id" UUID,
  "event_type" "LearningEventType" NOT NULL,
  "session_id" UUID NOT NULL,
  "duration_seconds" INTEGER,
  "metadata" JSONB,
  "occurred_at" TIMESTAMPTZ(3) NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "learning_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "video_watch_events" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "course_id" UUID NOT NULL,
  "lesson_id" UUID NOT NULL,
  "session_id" UUID NOT NULL,
  "started_at" TIMESTAMPTZ(3) NOT NULL,
  "ended_at" TIMESTAMPTZ(3),
  "start_position_seconds" INTEGER NOT NULL,
  "end_position_seconds" INTEGER,
  "watched_seconds" INTEGER NOT NULL,
  "completed" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "video_watch_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "learning_events_idempotency_key"
  ON "learning_events"("user_id", "session_id", "event_type", "occurred_at");
CREATE INDEX "learning_events_user_occurred_idx" ON "learning_events"("user_id", "occurred_at");
CREATE INDEX "learning_events_course_occurred_idx" ON "learning_events"("course_id", "occurred_at");
CREATE INDEX "learning_events_lesson_type_idx" ON "learning_events"("lesson_id", "event_type");
CREATE INDEX "learning_events_user_course_occurred_idx" ON "learning_events"("user_id", "course_id", "occurred_at");

CREATE UNIQUE INDEX "video_watch_events_idempotency_key"
  ON "video_watch_events"("user_id", "session_id", "started_at");
CREATE INDEX "video_watch_events_user_lesson_started_idx" ON "video_watch_events"("user_id", "lesson_id", "started_at");
CREATE INDEX "video_watch_events_course_lesson_idx" ON "video_watch_events"("course_id", "lesson_id");
CREATE INDEX "video_watch_events_user_course_started_idx" ON "video_watch_events"("user_id", "course_id", "started_at");

ALTER TABLE "learning_events"
  ADD CONSTRAINT "learning_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "learning_events_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "learning_events_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "video_watch_events"
  ADD CONSTRAINT "video_watch_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "video_watch_events_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "video_watch_events_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
