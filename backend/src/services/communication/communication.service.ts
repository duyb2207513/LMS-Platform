import { logger } from "../../config/logger.js";
import { prisma } from "../../config/database.js";
import { sendCourseEnrollmentEmail, sendWelcomeEmail } from "../email/email.service.js";
import { createNotification } from "../../modules/notifications/notification.service.js";

export async function safelyRunCommunication(job: () => Promise<unknown>) {
  try { await job(); } catch (error) { logger.warn({ err: error }, "Non-critical communication job failed"); }
}

export async function sendWelcomeCommunication(user: { id: string; email: string; fullName: string }) {
  await Promise.allSettled([
    createNotification({ userId: user.id, type: "WELCOME", title: "Chào mừng đến LMS Platform", message: `Xin chào ${user.fullName}!`, data: { url: "/dashboard" } }),
    sendWelcomeEmail(user)
  ]);
}

export async function sendEnrollmentCommunication(studentId: string, courseId: string) {
  const [user, course] = await Promise.all([
    prisma.user.findUnique({ where: { id: studentId }, select: { id: true, email: true, fullName: true } }),
    prisma.course.findUnique({ where: { id: courseId }, select: { id: true, title: true, slug: true } })
  ]);
  if (!user || !course) return;
  await Promise.allSettled([
    createNotification({ userId: user.id, type: "COURSE_ENROLLED", title: "Đăng ký khóa học thành công", message: course.title, data: { url: `/courses/${course.slug}`, courseId: course.id } }),
    sendCourseEnrollmentEmail(user, course)
  ]);
}
