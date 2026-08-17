import { randomUUID } from "node:crypto";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { AppError } from "../../common/errors/AppError.js";
import { prisma } from "../../config/database.js";
import { isValidStoredSubmissionFile, SUBMISSION_FILE_DIRECTORY, SUBMISSION_TOTAL_MAX_SIZE } from "../../config/upload.js";
import type { AuthTokenPayload } from "../auth/auth.types.js";
import { assertCourseEnrollment, canManageCourse, UUID } from "../interactions/access.js";
import type { AssignmentInput, CourseGradeRuleInput, GradeSubmissionInput, UpdateAssignmentInput } from "./assignments.types.js";
import { safelyRunCommunication } from "../../services/communication/communication.service.js";
import { createNotification } from "../notifications/notification.service.js";

const studentSelect = { id: true, fullName: true, email: true, avatarUrl: true } as const;
const submissionInclude = { student: { select: studentSelect }, files: { orderBy: { createdAt: "asc" as const } }, feedback: { include: { grader: { select: { id: true, fullName: true } } } } };
const round = (value: number) => Math.round(value * 100) / 100;
const decimal = (value: unknown) => Number(value ?? 0);

function serializeSubmission<T extends Record<string, any>>(submission: T) {
  return { ...submission, feedback: submission.feedback ? { ...submission.feedback, score: decimal(submission.feedback.score) } : null };
}
function serializeAssignment<T extends Record<string, any>>(assignment: T) {
  return {
    ...assignment,
    maxScore: decimal(assignment.maxScore),
    ...(Array.isArray(assignment.submissions) ? { submissions: assignment.submissions.map(serializeSubmission) } : {})
  };
}

async function courseContext(courseId: string) {
  if (!UUID.test(courseId)) throw new AppError(404, "Course not found");
  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { id: true, title: true, instructorId: true, status: true } });
  if (!course) throw new AppError(404, "Course not found");
  return course;
}
async function managedCourse(courseId: string, actor: AuthTokenPayload) {
  const course = await courseContext(courseId);
  if (!canManageCourse(course.instructorId, actor)) throw new AppError(403, "You do not have permission to manage assignments in this course");
  return course;
}
async function assignmentContext(assignmentId: string) {
  if (!UUID.test(assignmentId)) throw new AppError(404, "Assignment not found");
  const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId }, include: { course: { select: { id: true, title: true, instructorId: true, status: true } } } });
  if (!assignment) throw new AppError(404, "Assignment not found");
  return assignment;
}
async function managedAssignment(assignmentId: string, actor: AuthTokenPayload) {
  const assignment = await assignmentContext(assignmentId);
  if (!canManageCourse(assignment.course.instructorId, actor)) throw new AppError(403, "You do not have permission to manage this assignment");
  return assignment;
}
async function removeUploadedFiles(files: Express.Multer.File[]) {
  await Promise.allSettled(files.map(file => unlink(file.path)));
}

export async function listCourseAssignments(courseId: string, actor: AuthTokenPayload) {
  const course = await courseContext(courseId);
  if (canManageCourse(course.instructorId, actor)) {
    const assignments = await prisma.assignment.findMany({ where: { courseId }, orderBy: [{ dueAt: "asc" }, { createdAt: "asc" }], include: { _count: { select: { submissions: true } } } });
    return assignments.map(serializeAssignment);
  }
  if (actor.role !== "STUDENT") throw new AppError(403, "You do not have permission to view these assignments");
  await assertCourseEnrollment(courseId, actor.userId);
  const assignments = await prisma.assignment.findMany({
    where: { courseId, isPublished: true }, orderBy: [{ dueAt: "asc" }, { createdAt: "asc" }],
    include: { submissions: { where: { studentId: actor.userId }, orderBy: { attemptNumber: "desc" }, include: submissionInclude } }
  });
  return assignments.map(item => ({ ...serializeAssignment(item), isOverdue: item.dueAt < new Date(), remainingSubmissions: Math.max(0, item.maxSubmissions - item.submissions.length) }));
}

export async function getAssignment(assignmentId: string, actor: AuthTokenPayload) {
  const context = await assignmentContext(assignmentId);
  const manager = canManageCourse(context.course.instructorId, actor);
  if (!manager) {
    if (actor.role !== "STUDENT" || !context.isPublished) throw new AppError(404, "Published assignment not found");
    await assertCourseEnrollment(context.courseId, actor.userId);
  }
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: { course: { select: { id: true, title: true, slug: true } }, submissions: manager ? false : { where: { studentId: actor.userId }, orderBy: { attemptNumber: "desc" }, include: submissionInclude }, _count: manager ? { select: { submissions: true } } : false }
  });
  return serializeAssignment(assignment as Record<string, any>);
}

export async function createAssignment(courseId: string, actor: AuthTokenPayload, input: AssignmentInput) {
  await managedCourse(courseId, actor);
  if (input.dueAt <= new Date()) throw new AppError(400, "dueAt must be in the future");
  const allowResubmission = input.allowResubmission ?? false;
  const maxSubmissions = allowResubmission ? Math.max(2, input.maxSubmissions ?? 2) : 1;
  const assignment = await prisma.assignment.create({ data: { ...input, courseId, allowResubmission, maxSubmissions } });
  return serializeAssignment(assignment);
}

export async function updateAssignment(assignmentId: string, actor: AuthTokenPayload, input: UpdateAssignmentInput) {
  const existing = await managedAssignment(assignmentId, actor);
  const data: UpdateAssignmentInput = { ...input };
  if (data.allowResubmission === false) data.maxSubmissions = 1;
  if (data.allowResubmission === true && (data.maxSubmissions ?? existing.maxSubmissions) < 2) data.maxSubmissions = 2;
  if (data.maxSubmissions !== undefined) {
    const largestAttempt = await prisma.assignmentSubmission.aggregate({ where: { assignmentId }, _max: { attemptNumber: true } });
    if ((largestAttempt._max.attemptNumber ?? 0) > data.maxSubmissions) throw new AppError(409, "maxSubmissions cannot be lower than an existing attempt number");
  }
  if (data.maxScore !== undefined) {
    const highestGrade = await prisma.submissionFeedback.aggregate({ where: { submission: { assignmentId } }, _max: { score: true } });
    if (decimal(highestGrade._max.score) > data.maxScore) throw new AppError(409, "maxScore cannot be lower than an existing grade");
  }
  return serializeAssignment(await prisma.assignment.update({ where: { id: assignmentId }, data }));
}

export async function deleteAssignment(assignmentId: string, actor: AuthTokenPayload) {
  await managedAssignment(assignmentId, actor);
  if (await prisma.assignmentSubmission.count({ where: { assignmentId } })) throw new AppError(409, "An assignment with submissions cannot be deleted");
  await prisma.assignment.delete({ where: { id: assignmentId } });
}

export async function submitAssignment(assignmentId: string, studentId: string, textContent: unknown, files: Express.Multer.File[], baseUrl: string) {
  const assignment = await assignmentContext(assignmentId);
  try {
    if (!assignment.isPublished || assignment.course.status !== "PUBLISHED") throw new AppError(404, "Published assignment not found");
    await assertCourseEnrollment(assignment.courseId, studentId);
    if (!assignment.allowLateSubmissions && assignment.dueAt < new Date()) throw new AppError(409, "The assignment deadline has passed");
    const text = typeof textContent === "string" ? textContent.trim() : "";
    if (!text && files.length === 0) throw new AppError(400, "Provide textContent or at least one file");
    if (text.length > 50000) throw new AppError(400, "textContent must not exceed 50000 characters");
    if (files.reduce((sum, file) => sum + file.size, 0) > SUBMISSION_TOTAL_MAX_SIZE) throw new AppError(400, "Submission files must not exceed 50 MB in total");
    for (const file of files) if (!(await isValidStoredSubmissionFile(file.path, file.mimetype))) throw new AppError(400, `File content does not match its type: ${file.originalname}`);
    const previousCount = await prisma.assignmentSubmission.count({ where: { assignmentId, studentId } });
    if (previousCount > 0 && !assignment.allowResubmission) throw new AppError(409, "This assignment does not allow resubmission");
    if (previousCount >= assignment.maxSubmissions) throw new AppError(409, "Submission attempt limit reached");
    const fileRows = files.map(file => {
      const id = randomUUID();
      return { id, originalName: path.basename(file.originalname).slice(0, 255), storedName: file.filename, fileUrl: `${baseUrl}/api/v1/submission-files/${id}/download`, mimeType: file.mimetype, sizeBytes: file.size };
    });
    const submission = await prisma.assignmentSubmission.create({
      data: { assignmentId, studentId, attemptNumber: previousCount + 1, textContent: text || null, files: { create: fileRows } }, include: submissionInclude
    });
    return serializeSubmission(submission);
  } catch (error) {
    await removeUploadedFiles(files);
    throw error;
  }
}

export async function listMySubmissions(assignmentId: string, studentId: string) {
  const assignment = await assignmentContext(assignmentId); await assertCourseEnrollment(assignment.courseId, studentId);
  const items = await prisma.assignmentSubmission.findMany({ where: { assignmentId, studentId }, orderBy: { attemptNumber: "desc" }, include: submissionInclude });
  return items.map(serializeSubmission);
}

export async function listAssignmentSubmissions(assignmentId: string, actor: AuthTokenPayload) {
  await managedAssignment(assignmentId, actor);
  const items = await prisma.assignmentSubmission.findMany({ where: { assignmentId }, orderBy: [{ submittedAt: "desc" }], include: submissionInclude });
  return items.map(serializeSubmission);
}

export async function getSubmission(submissionId: string, actor: AuthTokenPayload) {
  if (!UUID.test(submissionId)) throw new AppError(404, "Submission not found");
  const submission = await prisma.assignmentSubmission.findUnique({ where: { id: submissionId }, include: { ...submissionInclude, assignment: { include: { course: { select: { id: true, title: true, instructorId: true } } } } } });
  if (!submission) throw new AppError(404, "Submission not found");
  if (submission.studentId !== actor.userId && !canManageCourse(submission.assignment.course.instructorId, actor)) throw new AppError(403, "You do not have permission to view this submission");
  return serializeSubmission(submission);
}

export async function gradeSubmission(submissionId: string, actor: AuthTokenPayload, input: GradeSubmissionInput) {
  if (!UUID.test(submissionId)) throw new AppError(404, "Submission not found");
  const submission = await prisma.assignmentSubmission.findUnique({ where: { id: submissionId }, include: { assignment: { include: { course: { select: { id: true, title: true, instructorId: true } } } } } });
  if (!submission) throw new AppError(404, "Submission not found");
  if (!canManageCourse(submission.assignment.course.instructorId, actor)) throw new AppError(403, "You do not have permission to grade this submission");
  if (input.score > decimal(submission.assignment.maxScore)) throw new AppError(400, `score must not exceed ${decimal(submission.assignment.maxScore)}`);
  const [, feedback] = await prisma.$transaction([
    prisma.assignmentSubmission.update({ where: { id: submissionId }, data: { status: "GRADED" } }),
    prisma.submissionFeedback.upsert({ where: { submissionId }, create: { submissionId, graderId: actor.userId, score: input.score, comment: input.comment ?? null }, update: { graderId: actor.userId, score: input.score, comment: input.comment ?? null, gradedAt: new Date() }, include: { grader: { select: { id: true, fullName: true } } } })
  ]);
  await safelyRunCommunication(() => createNotification({
    userId: submission.studentId,
    type: "ASSIGNMENT_GRADED",
    title: `Bài tập đã được chấm: ${submission.assignment.title}`,
    message: `Bạn nhận được ${input.score}/${decimal(submission.assignment.maxScore)} điểm trong khóa học ${submission.assignment.course.title}.`,
    data: {
      url: `/assignments/${submission.assignmentId}`,
      assignmentId: submission.assignmentId,
      submissionId,
      courseId: submission.assignment.course.id
    }
  }));
  return { ...feedback, score: decimal(feedback.score) };
}

export async function getSubmissionFile(fileId: string, actor: AuthTokenPayload) {
  if (!UUID.test(fileId)) throw new AppError(404, "Submission file not found");
  const file = await prisma.submissionFile.findUnique({ where: { id: fileId }, include: { submission: { include: { assignment: { include: { course: { select: { instructorId: true } } } } } } } });
  if (!file) throw new AppError(404, "Submission file not found");
  if (file.submission.studentId !== actor.userId && !canManageCourse(file.submission.assignment.course.instructorId, actor)) throw new AppError(403, "You do not have permission to download this file");
  return { path: path.join(SUBMISSION_FILE_DIRECTORY, file.storedName), name: file.originalName, mimeType: file.mimeType };
}

async function gradeRule(courseId: string) {
  const rule = await prisma.courseGradeRule.findUnique({ where: { courseId } });
  return rule ? { ...rule, assignmentWeight: decimal(rule.assignmentWeight), quizWeight: decimal(rule.quizWeight), passingScore: decimal(rule.passingScore) } : { courseId, assignmentWeight: 60, quizWeight: 40, passingScore: 70 };
}

export async function getCourseGradeRule(courseId: string, actor: AuthTokenPayload) {
  const course = await courseContext(courseId);
  if (!canManageCourse(course.instructorId, actor)) { if (actor.role !== "STUDENT") throw new AppError(403, "You do not have permission to view the grade rule"); await assertCourseEnrollment(courseId, actor.userId); }
  return gradeRule(courseId);
}

export async function updateCourseGradeRule(courseId: string, actor: AuthTokenPayload, input: CourseGradeRuleInput) {
  await managedCourse(courseId, actor);
  const rule = await prisma.courseGradeRule.upsert({ where: { courseId }, create: { courseId, ...input }, update: input });
  return { ...rule, assignmentWeight: decimal(rule.assignmentWeight), quizWeight: decimal(rule.quizWeight), passingScore: decimal(rule.passingScore) };
}

async function calculateCourseGrade(courseId: string, studentId: string) {
  const [rule, assignments, quizzes] = await Promise.all([
    gradeRule(courseId),
    prisma.assignment.findMany({ where: { courseId, isPublished: true }, select: { id: true, title: true, maxScore: true, submissions: { where: { studentId }, orderBy: { attemptNumber: "desc" }, take: 1, select: { id: true, attemptNumber: true, status: true, feedback: { select: { score: true } } } } } }),
    prisma.quiz.findMany({ where: { isPublished: true, lesson: { section: { courseId } } }, select: { id: true, title: true, attempts: { where: { studentId, status: "SUBMITTED" }, select: { score: true } } } })
  ]);
  const assignmentMax = assignments.reduce((sum, item) => sum + decimal(item.maxScore), 0);
  const assignmentEarned = assignments.reduce((sum, item) => sum + decimal(item.submissions[0]?.feedback?.score), 0);
  const assignmentPercent = assignmentMax ? round(Math.min(100, assignmentEarned / assignmentMax * 100)) : 0;
  const quizScores = quizzes.map(item => Math.max(0, ...item.attempts.map(attempt => decimal(attempt.score))));
  const quizPercent = quizScores.length ? round(quizScores.reduce((sum, score) => sum + score, 0) / quizScores.length) : 0;
  const finalScore = round(assignmentPercent * rule.assignmentWeight / 100 + quizPercent * rule.quizWeight / 100);
  return {
    courseId, studentId, finalScore, passed: finalScore >= rule.passingScore, rule,
    assignment: { percent: assignmentPercent, earned: round(assignmentEarned), maximum: round(assignmentMax), total: assignments.length, graded: assignments.filter(item => item.submissions[0]?.feedback).length },
    quiz: { percent: quizPercent, total: quizzes.length, attempted: quizzes.filter(item => item.attempts.length).length }
  };
}

export async function getMyCourseGrade(courseId: string, studentId: string) {
  await assertCourseEnrollment(courseId, studentId);
  return calculateCourseGrade(courseId, studentId);
}

export async function listCourseGrades(courseId: string, actor: AuthTokenPayload) {
  await managedCourse(courseId, actor);
  const enrollments = await prisma.enrollment.findMany({ where: { courseId, status: { in: ["ACTIVE", "COMPLETED"] } }, orderBy: { enrolledAt: "asc" }, include: { student: { select: studentSelect } } });
  return Promise.all(enrollments.map(async enrollment => ({ student: enrollment.student, ...(await calculateCourseGrade(courseId, enrollment.studentId)) })));
}
