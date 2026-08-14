export const CLIENT_LEARNING_EVENT_TYPES = ["COURSE_OPENED", "LESSON_STARTED", "STUDY_SESSION"] as const;
export type ClientLearningEventType = (typeof CLIENT_LEARNING_EVENT_TYPES)[number];

export type AnalyticsGroupBy = "day" | "week" | "month";
export type CoursePerformanceSort = "enrollments" | "completionRate" | "rating" | "revenue";

export type AnalyticsDateRange = {
  from: string;
  to: string;
  fromDate: Date;
  toExclusive: Date;
  groupBy: AnalyticsGroupBy;
};

export type InstructorAnalyticsQuery = AnalyticsDateRange & { courseId?: string };
export type CoursePerformanceQuery = InstructorAnalyticsQuery & { sortBy: CoursePerformanceSort; limit: number };
export type DropOffQuery = AnalyticsDateRange & { courseId: string; limit: number };

export type EventMetadataValue = string | number | boolean | null;

export type LearningEventInput = {
  courseId: string;
  lessonId?: string;
  eventType: ClientLearningEventType;
  durationSeconds?: number;
  occurredAt: Date;
  sessionId: string;
  metadata?: Record<string, EventMetadataValue>;
};

export type VideoWatchEventInput = {
  courseId: string;
  lessonId: string;
  sessionId: string;
  startedAt: Date;
  endedAt?: Date;
  startPositionSeconds: number;
  endPositionSeconds?: number;
  watchedSeconds: number;
  completed: boolean;
};
