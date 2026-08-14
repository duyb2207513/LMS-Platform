import { AppError } from "../../common/errors/AppError.js";
import { prisma } from "../../config/database.js";

export async function instructorCourses(instructorId: string, courseId?: string) {
  if (courseId) {
    const course = await prisma.course.findUnique({ where: { id: courseId }, select: { id: true, title: true, instructorId: true } });
    if (!course) throw new AppError(404, "Course not found");
    if (course.instructorId !== instructorId) throw new AppError(403, "You do not have permission to view analytics for this course");
    return [{ id: course.id, title: course.title }];
  }
  return prisma.course.findMany({ where: { instructorId }, select: { id: true, title: true }, orderBy: { createdAt: "desc" } });
}
