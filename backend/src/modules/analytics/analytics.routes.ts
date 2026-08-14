import { Router } from "express";
import { authenticate } from "../../common/middlewares/authenticate.js";
import { authorize } from "../../common/middlewares/authorize.js";
import { validateRequest } from "../../common/middlewares/validateRequest.js";
import { asyncHandler } from "../../common/utils/asyncHandler.js";
import {
  instructorCoursePerformanceController, instructorDropOffLessonsController, instructorEnrollmentsController, instructorOverviewController,
  learningEventController, studentActivityController, studentCourseProgressController, studentOverviewController, studentStreakController,
  videoWatchEventController
} from "./analytics.controller.js";
import { validateLearningEventInput, validateVideoWatchEventInput } from "./analytics.validation.js";

const router = Router();
const student = [authenticate, authorize("STUDENT")] as const;
const instructor = [authenticate, authorize("INSTRUCTOR")] as const;

/**
 * @openapi
 * /analytics/events:
 *   post:
 *     summary: Idempotently record a learning event for the authenticated student
 *     tags: [Analytics]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: false
 *             required: [courseId, eventType, occurredAt, sessionId]
 *             properties:
 *               courseId: { type: string, format: uuid }
 *               lessonId: { type: string, format: uuid }
 *               eventType: { type: string, enum: [COURSE_OPENED, LESSON_STARTED, STUDY_SESSION] }
 *               durationSeconds: { type: integer, minimum: 1, maximum: 300 }
 *               occurredAt: { type: string, format: date-time }
 *               sessionId: { type: string, format: uuid }
 *               metadata: { type: object, additionalProperties: true }
 *     responses: { 204: { description: Event accepted or already recorded }, 400: { description: Invalid event }, 403: { description: Enrollment required } }
 * /analytics/video-watch-events:
 *   post:
 *     summary: Idempotently record a validated video watch segment
 *     tags: [Analytics]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: false
 *             required: [courseId, lessonId, sessionId, startedAt, startPositionSeconds, watchedSeconds, completed]
 *             properties:
 *               courseId: { type: string, format: uuid }
 *               lessonId: { type: string, format: uuid }
 *               sessionId: { type: string, format: uuid }
 *               startedAt: { type: string, format: date-time }
 *               endedAt: { type: string, format: date-time }
 *               startPositionSeconds: { type: integer, minimum: 0 }
 *               endPositionSeconds: { type: integer, minimum: 0 }
 *               watchedSeconds: { type: integer, minimum: 1, maximum: 300 }
 *               completed: { type: boolean }
 *     responses: { 204: { description: Watch segment accepted or already recorded }, 400: { description: Invalid duration or video position }, 403: { description: Enrollment required } }
 */
router.post("/events", ...student, validateRequest(validateLearningEventInput), asyncHandler(learningEventController));
router.post("/video-watch-events", ...student, validateRequest(validateVideoWatchEventInput), asyncHandler(videoWatchEventController));

/**
 * @openapi
 * /analytics/student/overview:
 *   get:
 *     summary: Get lifetime KPI metrics for the authenticated student
 *     tags: [Analytics]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Student overview retrieved }, 403: { description: Student role required } }
 * /analytics/student/course-progress:
 *   get:
 *     summary: Get course progress and continue-learning targets
 *     tags: [Analytics]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Course progress retrieved } }
 * /analytics/student/activity:
 *   get:
 *     summary: Get learning time, completed lessons and quiz attempts by date bucket
 *     tags: [Analytics]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: from, schema: { type: string, format: date, example: '2026-08-01' } }
 *       - { in: query, name: to, schema: { type: string, format: date, example: '2026-08-31' } }
 *       - { in: query, name: groupBy, schema: { type: string, enum: [day, week, month], default: day } }
 *     responses: { 200: { description: Student activity retrieved }, 400: { description: Invalid date range } }
 * /analytics/student/streak:
 *   get:
 *     summary: Get current and longest learning streak in Asia/Ho_Chi_Minh timezone
 *     tags: [Analytics]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Learning streak retrieved } }
 */
router.get("/student/overview", ...student, asyncHandler(studentOverviewController));
router.get("/student/course-progress", ...student, asyncHandler(studentCourseProgressController));
router.get("/student/activity", ...student, asyncHandler(studentActivityController));
router.get("/student/streak", ...student, asyncHandler(studentStreakController));

/**
 * @openapi
 * /analytics/instructor/overview:
 *   get:
 *     summary: Get enrollment, completion, quiz, rating and revenue KPIs for owned courses
 *     tags: [Analytics]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: from, schema: { type: string, format: date } }
 *       - { in: query, name: to, schema: { type: string, format: date } }
 *       - { in: query, name: courseId, schema: { type: string, format: uuid } }
 *     responses: { 200: { description: Instructor overview retrieved }, 403: { description: Instructor role or course ownership required } }
 * /analytics/instructor/enrollments:
 *   get:
 *     summary: Get enrollment trend with empty date buckets included
 *     tags: [Analytics]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: from, schema: { type: string, format: date } }
 *       - { in: query, name: to, schema: { type: string, format: date } }
 *       - { in: query, name: courseId, schema: { type: string, format: uuid } }
 *       - { in: query, name: groupBy, schema: { type: string, enum: [day, week, month], default: day } }
 *     responses: { 200: { description: Enrollment trend retrieved }, 400: { description: Invalid date range } }
 * /analytics/instructor/course-performance:
 *   get:
 *     summary: Rank owned courses by a whitelisted performance metric
 *     tags: [Analytics]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: from, schema: { type: string, format: date } }
 *       - { in: query, name: to, schema: { type: string, format: date } }
 *       - { in: query, name: courseId, schema: { type: string, format: uuid } }
 *       - { in: query, name: sortBy, schema: { type: string, enum: [enrollments, completionRate, rating, revenue], default: enrollments } }
 *       - { in: query, name: limit, schema: { type: integer, minimum: 1, maximum: 50, default: 10 } }
 *     responses: { 200: { description: Course performance retrieved }, 403: { description: Course ownership required } }
 * /analytics/instructor/drop-off-lessons:
 *   get:
 *     summary: Rank lessons by students who started but did not complete them
 *     tags: [Analytics]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: courseId, required: true, schema: { type: string, format: uuid } }
 *       - { in: query, name: from, schema: { type: string, format: date } }
 *       - { in: query, name: to, schema: { type: string, format: date } }
 *       - { in: query, name: limit, schema: { type: integer, minimum: 1, maximum: 50, default: 5 } }
 *     responses: { 200: { description: Lesson drop-off retrieved }, 400: { description: courseId is required }, 403: { description: Course ownership required } }
 */
router.get("/instructor/overview", ...instructor, asyncHandler(instructorOverviewController));
router.get("/instructor/enrollments", ...instructor, asyncHandler(instructorEnrollmentsController));
router.get("/instructor/course-performance", ...instructor, asyncHandler(instructorCoursePerformanceController));
router.get("/instructor/drop-off-lessons", ...instructor, asyncHandler(instructorDropOffLessonsController));

export default router;
