import { prisma } from "../config/database.js";
import { logger } from "../config/logger.js";
import { createNotification } from "../modules/notifications/notification.service.js";
import { sendAssignmentDueEmail } from "../services/email/email.service.js";

export async function runAssignmentDueReminders() {
  const now = new Date(), until = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const assignments = await prisma.assignment.findMany({
    where: { isPublished: true, dueAt: { gt: now, lte: until }, course: { status: "PUBLISHED" } },
    include: { course: { select: { id: true, title: true, enrollments: { where: { status: { not: "CANCELLED" } }, select: { student: { select: { id: true, email: true, fullName: true } } } } } } }
  });
  let processed = 0;
  for (const assignment of assignments) for (const enrollment of assignment.course.enrollments) {
    const user = enrollment.student;
    const [existingNotification, existingEmail] = await Promise.all([
      prisma.notification.findFirst({ where: { userId: user.id, type: "ASSIGNMENT_DUE", data: { path: ["assignmentId"], equals: assignment.id } }, select: { id: true } }),
      prisma.emailLog.findFirst({ where: { userId: user.id, template: `ASSIGNMENT_DUE:${assignment.id}`.slice(0, 100) }, select: { id: true } })
    ]);
    if (!existingNotification) await createNotification({ userId: user.id, type: "ASSIGNMENT_DUE", title: "Bài tập sắp hết hạn", message: assignment.title, data: { url: `/assignments/${assignment.id}`, assignmentId: assignment.id, courseId: assignment.courseId } });
    if (!existingEmail) await sendAssignmentDueEmail(user, assignment);
    processed++;
  }
  return processed;
}

export function startAssignmentReminderJob(intervalMinutes: number) {
  const run = () => void runAssignmentDueReminders().catch(error => logger.error({ err: error }, "Assignment reminder job failed"));
  const initial = setTimeout(run, 5_000); initial.unref();
  const safeIntervalMinutes = Number.isFinite(intervalMinutes) && intervalMinutes >= 1 ? intervalMinutes : 15;
  const timer = setInterval(run, safeIntervalMinutes * 60_000); timer.unref();
  return () => { clearTimeout(initial); clearInterval(timer); };
}
