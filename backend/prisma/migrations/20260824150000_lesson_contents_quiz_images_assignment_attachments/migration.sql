-- Sprint content-builder extensions. Legacy lesson columns remain available for backward compatibility.
ALTER TABLE "questions" ADD COLUMN "image_url" TEXT;

CREATE TABLE "lesson_contents" (
  "id" UUID NOT NULL,
  "lesson_id" UUID NOT NULL,
  "content_type" "LessonType" NOT NULL,
  "text_content" TEXT,
  "file_url" TEXT,
  "original_name" VARCHAR(255),
  "mime_type" VARCHAR(150),
  "size_bytes" INTEGER,
  "position" INTEGER NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "lesson_contents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lesson_contents_lesson_id_position_key" ON "lesson_contents"("lesson_id", "position");
CREATE INDEX "lesson_contents_lesson_id_idx" ON "lesson_contents"("lesson_id");
ALTER TABLE "lesson_contents" ADD CONSTRAINT "lesson_contents_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "lesson_contents" ("id", "lesson_id", "content_type", "text_content", "file_url", "position", "updated_at")
SELECT gen_random_uuid(), "id", "lesson_type", "content",
  CASE WHEN "lesson_type" = 'VIDEO' THEN "video_url" WHEN "lesson_type" = 'DOCUMENT' THEN "document_url" ELSE NULL END,
  1, CURRENT_TIMESTAMP
FROM "lessons"
WHERE "content" IS NOT NULL OR "video_url" IS NOT NULL OR "document_url" IS NOT NULL;

CREATE TABLE "assignment_attachments" (
  "id" UUID NOT NULL,
  "assignment_id" UUID NOT NULL,
  "original_name" VARCHAR(255) NOT NULL,
  "stored_name" VARCHAR(500) NOT NULL,
  "file_url" TEXT NOT NULL,
  "mime_type" VARCHAR(150) NOT NULL,
  "size_bytes" INTEGER NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "assignment_attachments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "assignment_attachments_assignment_id_idx" ON "assignment_attachments"("assignment_id");
ALTER TABLE "assignment_attachments" ADD CONSTRAINT "assignment_attachments_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
