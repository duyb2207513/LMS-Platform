ALTER TABLE "quizzes"
  ADD COLUMN "section_id" UUID;

ALTER TABLE "quizzes"
  ALTER COLUMN "lesson_id" DROP NOT NULL;

CREATE UNIQUE INDEX "quizzes_section_id_key" ON "quizzes"("section_id");
CREATE INDEX "quizzes_section_id_idx" ON "quizzes"("section_id");

ALTER TABLE "quizzes"
  ADD CONSTRAINT "quizzes_section_id_fkey"
  FOREIGN KEY ("section_id") REFERENCES "sections"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "quizzes"
  ADD CONSTRAINT "quizzes_parent_check"
  CHECK (
    ("lesson_id" IS NOT NULL AND "section_id" IS NULL)
    OR ("lesson_id" IS NULL AND "section_id" IS NOT NULL)
  );
