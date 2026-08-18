export enum NotificationType {
  WELCOME = "WELCOME",
  COURSE_ENROLLED = "COURSE_ENROLLED",
  NEW_LESSON = "NEW_LESSON",
  ASSIGNMENT_DUE = "ASSIGNMENT_DUE",
  QUIZ_RESULT = "QUIZ_RESULT",
  CERTIFICATE_ISSUED = "CERTIFICATE_ISSUED",
  COURSE_ANNOUNCEMENT = "COURSE_ANNOUNCEMENT",
  ASSIGNMENT_GRADED = "ASSIGNMENT_GRADED",
  PAYMENT_SUCCEEDED = "PAYMENT_SUCCEEDED",
  DIRECT_MESSAGE = "DIRECT_MESSAGE",
}

export interface Notification {
  id: string;
  userId?: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: {
    url?: string;
    courseId?: string;
    announcementId?: string;
    lessonId?: string;
    quizId?: string;
    assignmentId?: string;
    [key: string]: unknown;
  } | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface NotificationPreference {
  id?: string;
  userId?: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  courseUpdates: boolean;
  assignmentReminders: boolean;
  quizResults: boolean;
  certificateUpdates: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface NotificationPreferenceInput {
  inAppEnabled?: boolean;
  emailEnabled?: boolean;
  courseUpdates?: boolean;
  assignmentReminders?: boolean;
  quizResults?: boolean;
  certificateUpdates?: boolean;
}

export interface NotificationPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  unreadCount?: number;
}

export enum AnnouncementStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
}

export interface CourseAnnouncement {
  id: string;
  courseId: string;
  authorId: string;
  title: string;
  content: string;
  status: AnnouncementStatus;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
  };
}

export interface AnnouncementFormData {
  title: string;
  content: string;
}
