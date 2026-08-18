CREATE TYPE "AssignmentSubmissionStatus" AS ENUM ('SUBMITTED', 'GRADED');

CREATE TABLE "assignments" (
    "id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "instructions" TEXT,
    "due_at" TIMESTAMPTZ(3) NOT NULL,
    "max_score" DECIMAL(8,2) NOT NULL DEFAULT 100,
    "allow_resubmission" BOOLEAN NOT NULL DEFAULT false,
    "max_submissions" INTEGER NOT NULL DEFAULT 1,
    "allow_late_submissions" BOOLEAN NOT NULL DEFAULT false,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "assignments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "assignments_max_score_check" CHECK ("max_score" > 0),
    CONSTRAINT "assignments_max_submissions_check" CHECK ("max_submissions" BETWEEN 1 AND 20)
);

CREATE TABLE "assignment_submissions" (
    "id" UUID NOT NULL,
    "assignment_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "attempt_number" INTEGER NOT NULL,
    "text_content" TEXT,
    "status" "AssignmentSubmissionStatus" NOT NULL DEFAULT 'SUBMITTED',
    "submitted_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "assignment_submissions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "submission_files" (
    "id" UUID NOT NULL,
    "submission_id" UUID NOT NULL,
    "original_name" VARCHAR(255) NOT NULL,
    "stored_name" VARCHAR(255) NOT NULL,
    "file_url" TEXT NOT NULL,
    "mime_type" VARCHAR(150) NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "submission_files_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "submission_feedback" (
    "id" UUID NOT NULL,
    "submission_id" UUID NOT NULL,
    "grader_id" UUID NOT NULL,
    "score" DECIMAL(8,2) NOT NULL,
    "comment" TEXT,
    "graded_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "submission_feedback_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "submission_feedback_score_check" CHECK ("score" >= 0)
);

CREATE TABLE "course_grade_rules" (
    "id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "assignment_weight" DECIMAL(5,2) NOT NULL DEFAULT 60,
    "quiz_weight" DECIMAL(5,2) NOT NULL DEFAULT 40,
    "passing_score" DECIMAL(5,2) NOT NULL DEFAULT 70,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "course_grade_rules_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "course_grade_rules_weights_check" CHECK ("assignment_weight" >= 0 AND "quiz_weight" >= 0 AND "assignment_weight" + "quiz_weight" = 100),
    CONSTRAINT "course_grade_rules_passing_score_check" CHECK ("passing_score" BETWEEN 0 AND 100)
);

CREATE INDEX "assignments_course_id_due_at_idx" ON "assignments"("course_id", "due_at");
CREATE INDEX "assignments_is_published_idx" ON "assignments"("is_published");
CREATE UNIQUE INDEX "assignment_submissions_assignment_id_student_id_attempt_number_key" ON "assignment_submissions"("assignment_id", "student_id", "attempt_number");
CREATE INDEX "assignment_submissions_assignment_id_submitted_at_idx" ON "assignment_submissions"("assignment_id", "submitted_at");
CREATE INDEX "assignment_submissions_student_id_submitted_at_idx" ON "assignment_submissions"("student_id", "submitted_at");
CREATE INDEX "submission_files_submission_id_idx" ON "submission_files"("submission_id");
CREATE UNIQUE INDEX "submission_feedback_submission_id_key" ON "submission_feedback"("submission_id");
CREATE INDEX "submission_feedback_grader_id_graded_at_idx" ON "submission_feedback"("grader_id", "graded_at");
CREATE UNIQUE INDEX "course_grade_rules_course_id_key" ON "course_grade_rules"("course_id");

ALTER TABLE "assignments" ADD CONSTRAINT "assignments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "submission_files" ADD CONSTRAINT "submission_files_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "assignment_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "submission_feedback" ADD CONSTRAINT "submission_feedback_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "assignment_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "submission_feedback" ADD CONSTRAINT "submission_feedback_grader_id_fkey" FOREIGN KEY ("grader_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "course_grade_rules" ADD CONSTRAINT "course_grade_rules_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
