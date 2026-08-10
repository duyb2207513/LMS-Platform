import { AppError } from "../../common/errors/AppError.js";
import { prisma } from "../../config/database.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const serialize = <T extends { progressPercent: unknown }>(value: T) => ({ ...value, progressPercent: Number(value.progressPercent) });

export async function enrollFreeCourse(courseId: string, studentId: string) {
  if (!UUID.test(courseId)) throw new AppError(404, "Course not found");
  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { id: true, isFree: true, status: true } });
  if (!course || course.status !== "PUBLISHED") throw new AppError(404, "Published course not found");
  if (!course.isFree) throw new AppError(409, "This course requires payment");
  const existing = await prisma.enrollment.findUnique({ where: { studentId_courseId: { studentId, courseId } } });
  if (existing) throw new AppError(409, "You are already enrolled in this course");
  return serialize(await prisma.enrollment.create({
    data: { studentId, courseId },
    include: { course: { select: { id: true, title: true, slug: true, thumbnailUrl: true } } }
  }));
}

export async function listMyEnrollments(studentId: string) {
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId },
    orderBy: { enrolledAt: "desc" },
    include: { course: { select: { id: true, title: true, slug: true, thumbnailUrl: true, instructor: { select: { id: true, fullName: true } }, category: { select: { id: true, name: true, slug: true } } } } }
  });
  return enrollments.map(serialize);
}
