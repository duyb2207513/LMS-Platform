import { AppError } from "../../common/errors/AppError.js";
import { prisma } from "../../config/database.js";
import type { AuthTokenPayload } from "../auth/auth.types.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function getCourseContent(courseId: string, actor: AuthTokenPayload) {
  if (!UUID.test(courseId)) throw new AppError(404, "Course not found");
  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { id: true, title: true, status: true, instructorId: true } });
  if (!course) throw new AppError(404, "Course not found");
  const manager = actor.role === "ADMIN" || (actor.role === "INSTRUCTOR" && course.instructorId === actor.userId);
  let enrolled = false;
  if (!manager && actor.role === "STUDENT") {
    const enrollment = await prisma.enrollment.findUnique({ where: { studentId_courseId: { studentId: actor.userId, courseId } }, select: { status: true } });
    enrolled = Boolean(enrollment && ["ACTIVE", "COMPLETED"].includes(enrollment.status) && course.status === "PUBLISHED");
  }
  if (!manager && !enrolled) throw new AppError(403, "Enroll in this course to view its content");

  const sections = await prisma.section.findMany({
    where: { courseId },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    select: {
      id: true, title: true, position: true,
      quiz: { where: manager ? {} : { isPublished: true }, select: { id: true, sectionId: true, title: true, description: true, passingScore: true, maxAttempts: true, timeLimitMinutes: true, isPublished: true } },
      lessons: {
        where: manager ? {} : { isPublished: true },
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        select: { id: true, title: true, lessonType: true, content: true, videoUrl: true, documentUrl: true, durationSeconds: true, position: true, isPreview: true, isRequired: true, isPublished: true, contents: { orderBy: [{ position: "asc" }, { createdAt: "asc" }] }, quiz: { where: manager ? {} : { isPublished: true }, select: { id: true, title: true, description: true, passingScore: true, maxAttempts: true, timeLimitMinutes: true, isPublished: true } } }
      }
    }
  });

  if (actor.role === "STUDENT") {
    const progress = await prisma.lessonProgress.findMany({
      where: { studentId: actor.userId, lesson: { section: { courseId } } },
      select: { lessonId: true, isCompleted: true, lastWatchedSecond: true, completedAt: true, updatedAt: true }
    });
    const byLesson = new Map(progress.map(item => [item.lessonId, item]));
    return { course: { id: course.id, title: course.title }, sections: sections.map(section => ({ ...section, lessons: section.lessons.map(lesson => ({ ...lesson, progress: byLesson.get(lesson.id) ?? { isCompleted: false, lastWatchedSecond: 0, completedAt: null } })) })) };
  }
  return { course: { id: course.id, title: course.title }, sections };
}
