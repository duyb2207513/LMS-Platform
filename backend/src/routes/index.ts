import { Router } from "express";
import authRouter from "../modules/auth/auth.routes.js";
import categoriesRouter from "../modules/categories/categories.routes.js";
import coursesRouter from "../modules/courses/courses.routes.js";
import instructorCoursesRouter from "../modules/courses/instructor-courses.routes.js";
import { courseEnrollmentRouter, enrollmentsRouter } from "../modules/enrollments/enrollments.routes.js";
import { courseLearningRouter } from "../modules/learning/learning.routes.js";
import { lessonsRouter, sectionLessonsRouter } from "../modules/lessons/lessons.routes.js";
import { courseProgressRouter, lessonProgressRouter } from "../modules/progress/progress.routes.js";
import { courseSectionsRouter, sectionsRouter } from "../modules/sections/sections.routes.js";
import usersRouter from "../modules/users/users.routes.js";
import { commentsRouter, lessonCommentsRouter } from "../modules/comments/comments.routes.js";
import { lessonQuizzesRouter, optionsRouter, questionsRouter, quizAttemptsRouter, quizzesRouter } from "../modules/quizzes/quizzes.routes.js";
import { courseReviewsRouter, reviewsRouter } from "../modules/reviews/reviews.routes.js";
import certificatesRouter, { courseCertificatesRouter } from "../modules/certificates/certificates.routes.js";
import ordersRouter from "../modules/orders/orders.routes.js";
import { orderPaymentsRouter, paymentsRouter } from "../modules/payments/payments.routes.js";
import adminRouter from "../modules/admin/admin.routes.js";
import analyticsRouter from "../modules/analytics/analytics.routes.js";
import { adminCouponRouter, couponRouter } from "../modules/coupons/coupon.routes.js";
import { adminRefundRouter, refundRouter } from "../modules/refunds/refund.routes.js";
import instructorCommerceRouter from "../modules/earnings/earning.routes.js";
import adminPayoutRouter from "../modules/payouts/payout.routes.js";
import messagesRouter from "../modules/messages/messages.routes.js";
import { courseAssignmentsRouter, assignmentsRouter, submissionsRouter, submissionFilesRouter } from "../modules/assignments/assignment.routes.js";
import { courseAnnouncementsRouter, announcementsRouter } from "../modules/announcements/announcement.routes.js";
import { notificationsRouter, preferencesRouter } from "../modules/notifications/notification.routes.js";
import { courseGradesRouter } from "../modules/grades/grade.routes.js";
import aiRouter from "../modules/ai/ai.routes.js";

const router = Router();

router.use("/ai", aiRouter);
router.use("/auth", authRouter);
router.use("/analytics", analyticsRouter);
router.use("/coupons", couponRouter);
router.use("/admin/coupons", adminCouponRouter);
router.use("/refund-requests", refundRouter);
router.use("/admin/refund-requests", adminRefundRouter);
router.use("/admin/payouts", adminPayoutRouter);
router.use("/admin", adminRouter);
router.use("/categories", categoriesRouter);
router.use("/courses/:courseId/sections", courseSectionsRouter);
router.use("/courses/:courseId/enroll", courseEnrollmentRouter);
router.use("/courses/:courseId/content", courseLearningRouter);
router.use("/courses/:courseId/progress", courseProgressRouter);
router.use("/courses/:courseId/reviews", courseReviewsRouter);
router.use("/courses/:courseId/certificates", courseCertificatesRouter);
router.use("/courses/:courseId/assignments", courseAssignmentsRouter);
router.use("/courses/:courseId/grades", courseGradesRouter);
router.use("/courses/:courseId/announcements", courseAnnouncementsRouter);
router.use("/courses", coursesRouter);
router.use("/sections/:sectionId/lessons", sectionLessonsRouter);
router.use("/sections", sectionsRouter);
router.use("/lessons/:lessonId/progress", lessonProgressRouter);
router.use("/lessons/:lessonId/quizzes", lessonQuizzesRouter);
router.use("/lessons/:lessonId/comments", lessonCommentsRouter);
router.use("/lessons", lessonsRouter);
router.use("/quizzes", quizzesRouter);
router.use("/questions", questionsRouter);
router.use("/options", optionsRouter);
router.use("/quiz-attempts", quizAttemptsRouter);
router.use("/assignments", assignmentsRouter);
router.use("/submissions", submissionsRouter);
router.use("/submission-files", submissionFilesRouter);
router.use("/announcements", announcementsRouter);
router.use("/notifications", notificationsRouter);
router.use("/notification-preferences", preferencesRouter);
router.use("/reviews", reviewsRouter);
router.use("/comments", commentsRouter);
router.use("/orders/:orderId/payments/mock", orderPaymentsRouter);
router.use("/orders", ordersRouter);
router.use("/payments", paymentsRouter);
router.use("/certificates", certificatesRouter);
router.use("/enrollments", enrollmentsRouter);
router.use("/instructor", instructorCoursesRouter);
router.use("/instructor", instructorCommerceRouter);
router.use("/users", usersRouter);
router.use("/messages", messagesRouter);

/**
 * @openapi
 * /health:
 *   get:
 *     operationId: checkHealth
 *     summary: Check API health
 *     tags: [System]
 *     security: []
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: ok }
 *                 timestamp: { type: string, format: date-time }
 */
router.get("/health", (_request, response) => {
  response.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString()
  });
});

export default router;