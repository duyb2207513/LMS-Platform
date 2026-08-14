import assert from "node:assert/strict";
import { calculateStreak, parseDateRange } from "../../dist/modules/analytics/analytics.date.js";
import { parseCoursePerformanceQuery, validateLearningEventInput, validateVideoWatchEventInput } from "../../dist/modules/analytics/analytics.validation.js";

const uuid = "90000000-0000-4000-8000-000000000001";
const now = new Date();
assert.deepEqual(calculateStreak(["2026-08-10", "2026-08-11", "2026-08-13", "2026-08-14"], "2026-08-14"), { currentStreakDays: 2, longestStreakDays: 2 });
assert.deepEqual(calculateStreak(["2026-08-10", "2026-08-11", "2026-08-12"], "2026-08-13"), { currentStreakDays: 3, longestStreakDays: 3 });
assert.deepEqual(calculateStreak([], "2026-08-14"), { currentStreakDays: 0, longestStreakDays: 0 });

const range = parseDateRange({ from: "2026-08-01", to: "2026-08-31", groupBy: "week" });
assert.equal(range.groupBy, "week");
assert.equal(range.fromDate.toISOString(), "2026-07-31T17:00:00.000Z");
assert.throws(() => parseDateRange({ from: "2026-09-01", to: "2026-08-01" }));
assert.throws(() => parseDateRange({ from: "2025-01-01", to: "2026-08-01" }));
assert.throws(() => parseCoursePerformanceQuery({ sortBy: "unsafe-sql" }));

assert.equal(validateLearningEventInput({ courseId: uuid, lessonId: uuid, eventType: "STUDY_SESSION", durationSeconds: 60, occurredAt: now.toISOString(), sessionId: uuid }).data.durationSeconds, 60);
assert.ok(validateLearningEventInput({ courseId: uuid, lessonId: uuid, eventType: "STUDY_SESSION", durationSeconds: 301, occurredAt: now.toISOString(), sessionId: uuid }).errors.durationSeconds);
assert.ok(validateLearningEventInput({ courseId: uuid, eventType: "COURSE_OPENED", durationSeconds: 60, occurredAt: now.toISOString(), sessionId: uuid }).errors.durationSeconds);
assert.ok(validateLearningEventInput({ courseId: uuid, eventType: "LESSON_COMPLETED", occurredAt: now.toISOString(), sessionId: uuid }).errors.eventType);
assert.ok(validateLearningEventInput({ courseId: uuid, eventType: "COURSE_OPENED", occurredAt: now.toISOString(), sessionId: uuid, userId: uuid }).errors.userId);

const video = validateVideoWatchEventInput({ courseId: uuid, lessonId: uuid, sessionId: uuid, startedAt: new Date(now.getTime() - 60_000).toISOString(), endedAt: now.toISOString(), startPositionSeconds: 0, endPositionSeconds: 60, watchedSeconds: 60, completed: false });
assert.equal(video.data.watchedSeconds, 60);
assert.ok(validateVideoWatchEventInput({ courseId: uuid, lessonId: uuid, sessionId: uuid, startedAt: now.toISOString(), startPositionSeconds: -1, watchedSeconds: 60, completed: false }).errors.startPositionSeconds);
console.log("Sprint 9 analytics validation and streak tests passed");
