import { AppError } from "../../common/errors/AppError.js";
import { prisma } from "../../config/database.js";
import type { AuthTokenPayload } from "../auth/auth.types.js";

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const canManageCourse = (instructorId: string, actor: AuthTokenPayload) => actor.role === "ADMIN" || (actor.role === "INSTRUCTOR" && instructorId === actor.userId);

export async function getLessonContext(lessonId: string) {
  if (!UUID.test(lessonId)) throw new AppError(404, "Lesson not found");
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { section: { include: { course: { select: { id: true, instructorId: true, status: true } } } } }
  });
  if (!lesson) throw new AppError(404, "Lesson not found");
  return lesson;
}

export async function assertLessonAccess(lessonId: string, actor: AuthTokenPayload) {
  const lesson = await getLessonContext(lessonId);
  const course = lesson.section.course;
  if (canManageCourse(course.instructorId, actor)) return lesson;
  if (actor.role !== "STUDENT" || course.status !== "PUBLISHED" || !lesson.isPublished) throw new AppError(403, "You do not have permission to access this lesson");
  const enrollment = await prisma.enrollment.findUnique({ where: { studentId_courseId: { studentId: actor.userId, courseId: course.id } }, select: { status: true } });
  if (!enrollment || !["ACTIVE", "COMPLETED"].includes(enrollment.status)) throw new AppError(403, "Enroll in this course to access this lesson");
  return lesson;
}

export async function assertCourseEnrollment(courseId: string, studentId: string) {
  if (!UUID.test(courseId)) throw new AppError(404, "Course not found");
  const enrollment = await prisma.enrollment.findUnique({ where: { studentId_courseId: { studentId, courseId } }, select: { status: true, course: { select: { status: true } } } });
  if (!enrollment || !["ACTIVE", "COMPLETED"].includes(enrollment.status) || enrollment.course.status !== "PUBLISHED") throw new AppError(403, "Enroll in this course to perform this action");
  return enrollment;
}
