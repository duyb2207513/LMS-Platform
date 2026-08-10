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

const router = Router();

router.use("/auth", authRouter);
router.use("/categories", categoriesRouter);
router.use("/courses/:courseId/sections", courseSectionsRouter);
router.use("/courses/:courseId/enroll", courseEnrollmentRouter);
router.use("/courses/:courseId/content", courseLearningRouter);
router.use("/courses/:courseId/progress", courseProgressRouter);
router.use("/courses/:courseId/reviews", courseReviewsRouter);
router.use("/courses/:courseId/certificates", courseCertificatesRouter);
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
router.use("/reviews", reviewsRouter);
router.use("/comments", commentsRouter);
router.use("/orders/:orderId/payments/mock", orderPaymentsRouter);
router.use("/orders", ordersRouter);
router.use("/payments", paymentsRouter);
router.use("/certificates", certificatesRouter);
router.use("/enrollments", enrollmentsRouter);
router.use("/instructor", instructorCoursesRouter);
router.use("/users", usersRouter);

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Check API health
 *     tags:
 *       - System
 *     responses:
 *       200:
 *         description: API is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: LMS API is running
 *                 data:
 *                   type: object
 */
router.get("/health", (_request, response) => {
  response.status(200).json({
    success: true,
    message: "LMS API is running",
    data: {
      environment: process.env.NODE_ENV ?? "development",
      timestamp: new Date().toISOString()
    }
  });
});

export default router;
