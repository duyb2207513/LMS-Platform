import { prisma } from "../../config/database.js";
import { logger } from "../../config/logger.js";
import { sendMailMessage } from "../../config/mail.js";
import type { NotificationType } from "../../prisma/enums.js";

type EmailPreference = { emailEnabled: boolean; courseUpdates: boolean; assignmentReminders: boolean; quizResults: boolean; certificateUpdates: boolean } | null;
export function allowsEmail(type: NotificationType, preference: EmailPreference) {
  if (preference?.emailEnabled === false) return false;
  if (["COURSE_ENROLLED", "NEW_LESSON", "COURSE_ANNOUNCEMENT"].includes(type)) return preference?.courseUpdates !== false;
  if (type === "ASSIGNMENT_DUE") return preference?.assignmentReminders !== false;
  if (type === "QUIZ_RESULT") return preference?.quizResults !== false;
  if (type === "CERTIFICATE_ISSUED") return preference?.certificateUpdates !== false;
  return true;
}

type TrackedEmailInput = { userId?: string; to: string; subject: string; template: string; text: string; html?: string };
export async function sendTrackedEmail(input: TrackedEmailInput) {
  const log = await prisma.emailLog.create({ data: { userId: input.userId, toEmail: input.to, subject: input.subject, template: input.template } });
  try {
    await sendMailMessage({ to: input.to, subject: input.subject, text: input.text, ...(input.html ? { html: input.html } : {}) });
    return prisma.emailLog.update({ where: { id: log.id }, data: { status: "SENT", sentAt: new Date() } });
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 2000) : "Email delivery failed";
    logger.warn({ emailLogId: log.id, error: message }, "Tracked email delivery failed");
    return prisma.emailLog.update({ where: { id: log.id }, data: { status: "FAILED", errorMessage: message } });
  }
}

async function preference(userId: string) { return prisma.notificationPreference.findUnique({ where: { userId } }); }

export async function sendWelcomeEmail(user: { id: string; email: string; fullName: string }) {
  if (!allowsEmail("WELCOME", await preference(user.id))) return null;
  return sendTrackedEmail({ userId: user.id, to: user.email, subject: "Chào mừng đến LMS Platform", template: "WELCOME", text: `Xin chào ${user.fullName}, chào mừng bạn đến với LMS Platform.` });
}

export async function sendCourseEnrollmentEmail(user: { id: string; email: string; fullName: string }, course: { id: string; title: string }) {
  if (!allowsEmail("COURSE_ENROLLED", await preference(user.id))) return null;
  return sendTrackedEmail({ userId: user.id, to: user.email, subject: `Đăng ký khóa học ${course.title} thành công`, template: `COURSE_ENROLLED:${course.id}`.slice(0, 100), text: `Xin chào ${user.fullName}, bạn đã đăng ký thành công khóa học ${course.title}.` });
}

export async function sendAssignmentDueEmail(user: { id: string; email: string; fullName: string }, assignment: { id: string; title: string; dueAt: Date; course: { title: string } }) {
  if (!allowsEmail("ASSIGNMENT_DUE", await preference(user.id))) return null;
  return sendTrackedEmail({ userId: user.id, to: user.email, subject: `Sắp đến hạn: ${assignment.title}`, template: `ASSIGNMENT_DUE:${assignment.id}`.slice(0, 100), text: `Xin chào ${user.fullName}, bài tập ${assignment.title} trong khóa ${assignment.course.title} sẽ hết hạn lúc ${assignment.dueAt.toISOString()}.` });
}
