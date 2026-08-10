CREATE TYPE "QuizAttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED');

CREATE TABLE "quizzes" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "lesson_id" UUID NOT NULL,
  "title" VARCHAR(255) NOT NULL, "description" TEXT,
  "passing_score" INTEGER NOT NULL DEFAULT 70, "max_attempts" INTEGER NOT NULL DEFAULT 3,
  "time_limit_minutes" INTEGER, "is_published" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "quizzes_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "quizzes_lesson_id_key" ON "quizzes"("lesson_id");
CREATE INDEX "quizzes_is_published_idx" ON "quizzes"("is_published");

CREATE TABLE "questions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "quiz_id" UUID NOT NULL,
  "text" TEXT NOT NULL, "explanation" TEXT, "points" INTEGER NOT NULL DEFAULT 1,
  "position" INTEGER NOT NULL, "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL, CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "questions_quiz_id_position_idx" ON "questions"("quiz_id", "position");

CREATE TABLE "quiz_options" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "question_id" UUID NOT NULL,
  "text" TEXT NOT NULL, "is_correct" BOOLEAN NOT NULL DEFAULT false, "position" INTEGER NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL, CONSTRAINT "quiz_options_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "quiz_options_question_id_position_idx" ON "quiz_options"("question_id", "position");

CREATE TABLE "quiz_attempts" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "quiz_id" UUID NOT NULL, "student_id" UUID NOT NULL,
  "attempt_number" INTEGER NOT NULL, "status" "QuizAttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
  "score" DECIMAL(5,2), "earned_points" INTEGER, "total_points" INTEGER, "passed" BOOLEAN,
  "started_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "submitted_at" TIMESTAMPTZ(3),
  CONSTRAINT "quiz_attempts_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "quiz_attempts_quiz_id_student_id_attempt_number_key" ON "quiz_attempts"("quiz_id", "student_id", "attempt_number");
CREATE INDEX "quiz_attempts_student_id_quiz_id_idx" ON "quiz_attempts"("student_id", "quiz_id");

CREATE TABLE "attempt_answers" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "attempt_id" UUID NOT NULL, "question_id" UUID NOT NULL,
  "option_id" UUID NOT NULL, "is_correct" BOOLEAN NOT NULL, "points_earned" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "attempt_answers_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "attempt_answers_attempt_id_question_id_key" ON "attempt_answers"("attempt_id", "question_id");
CREATE INDEX "attempt_answers_option_id_idx" ON "attempt_answers"("option_id");

CREATE TABLE "reviews" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "course_id" UUID NOT NULL, "user_id" UUID NOT NULL,
  "rating" INTEGER NOT NULL, "content" TEXT,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "reviews_course_id_user_id_key" ON "reviews"("course_id", "user_id");
CREATE INDEX "reviews_course_id_created_at_idx" ON "reviews"("course_id", "created_at");

CREATE TABLE "comments" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "lesson_id" UUID NOT NULL, "user_id" UUID NOT NULL,
  "parent_id" UUID, "content" TEXT NOT NULL, "deleted_at" TIMESTAMPTZ(3),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "comments_lesson_id_created_at_idx" ON "comments"("lesson_id", "created_at");
CREATE INDEX "comments_parent_id_idx" ON "comments"("parent_id");

ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "questions" ADD CONSTRAINT "questions_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quiz_options" ADD CONSTRAINT "quiz_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "attempt_answers" ADD CONSTRAINT "attempt_answers_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "quiz_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "attempt_answers" ADD CONSTRAINT "attempt_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "attempt_answers" ADD CONSTRAINT "attempt_answers_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "quiz_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "comments" ADD CONSTRAINT "comments_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
