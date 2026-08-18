export interface StudentOverview {
  enrolledCourses: number
  inProgressCourses: number
  completedCourses: number
  notStartedCourses: number
  totalLearningSeconds: number
  averageQuizScore: number
  currentStreakDays: number
  longestStreakDays: number
}

export interface StudentCourseProgress {
  courseId: string
  title: string
  thumbnailUrl?: string | null
  completedLessons: number
  totalLessons: number
  progressPercent: number
  lastLearningAt?: string | null
  continueUrl: string
}

export interface StudentActivityItem {
  date: string
  learningSeconds: number
  completedLessons: number
  quizAttempts: number
}

export interface StudentActivityMeta {
  from: string
  to: string
  timezone: string
}

export interface StudentActivityResponse {
  data: StudentActivityItem[]
  meta: StudentActivityMeta
}

export interface RevenueInfo {
  amount: number
  currency: string
  available: boolean
}

export interface InstructorOverview {
  uniqueStudents: number
  newEnrollments: number
  completionRate: number
  averageQuizScore: number
  averageRating: number
  ratingCount: number
  revenue: RevenueInfo
}

export interface EnrollmentTrendItem {
  date: string
  count: number
}

export interface CoursePerformanceItem {
  courseId: string
  title: string
  enrollments: number
  activeStudents: number
  completionRate: number
  averageQuizScore: number
  averageRating: number
  ratingCount: number
  revenue: RevenueInfo
}

export interface DropOffLessonItem {
  lessonId: string
  title: string
  startedStudents: number
  completedStudents: number
  dropOffStudents: number
  dropOffRate: number
}

export type LearningEventType =
  | 'COURSE_OPENED'
  | 'LESSON_STARTED'
  | 'LESSON_COMPLETED'
  | 'QUIZ_STARTED'
  | 'QUIZ_SUBMITTED'
  | 'STUDY_SESSION'

export interface LearningEventInput {
  courseId: string
  lessonId?: string
  eventType: LearningEventType
  durationSeconds?: number
  occurredAt?: string
  sessionId?: string
}

export interface VideoWatchEventInput {
  courseId: string
  lessonId: string
  sessionId: string
  startedAt: string
  endedAt?: string
  startPositionSeconds: number
  endPositionSeconds?: number
  watchedSeconds: number
  completed: boolean
}

export interface AnalyticsQueryParams {
  from?: string
  to?: string
  courseId?: string
  groupBy?: 'day' | 'week' | 'month'
  sortBy?: string
  limit?: number
}
