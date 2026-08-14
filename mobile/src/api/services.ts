import type {
  Announcement, ApiResponse, AppNotification, Assignment, AssignmentSubmission, Category, Course, CourseContent, CourseGrade,
  CourseGradeRule, CourseInput, CourseProgress, Coupon, CouponValidation, Certificate, CertificateVerification, Comment,
  CourseSection, Enrollment, InstructorAnalyticsOverview, InstructorEarning, Lesson, LessonType, NotificationPreference, Order,
  PaginatedResponse, Payment, Payout, Quiz, QuizAttempt, QuizOption, QuizQuestion, QuizResult, RefundRequest, RevenueOverview,
  Review, StudentAnalyticsOverview, User,
} from '../types';
import { apiClient } from './client';

export const authApi = {
  register: (input: { fullName: string; email: string; password: string; confirmPassword: string }) =>
    apiClient.post<ApiResponse<{ user: User }>>('/auth/register', input),
  login: (input: { email: string; password: string }) =>
    apiClient.post<ApiResponse<{ accessToken: string; user: User }>>('/auth/login', input),
  logout: () => apiClient.post<ApiResponse<null>>('/auth/logout'),
};

export const usersApi = {
  me: () => apiClient.get<ApiResponse<User>>('/users/me'),
  update: (input: { fullName?: string; avatarUrl?: string | null }) =>
    apiClient.patch<ApiResponse<User>>('/users/me', input),
  changePassword: (input: { currentPassword: string; newPassword: string; confirmNewPassword: string }) =>
    apiClient.patch<ApiResponse<null>>('/users/me/password', input),
  uploadAvatar: (uri: string) => {
    const data = new FormData();
    data.append('avatar', { uri, name: 'avatar.jpg', type: 'image/jpeg' } as unknown as Blob);
    return apiClient.post<ApiResponse<User>>('/users/me/avatar', data, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

export const categoriesApi = {
  list: () => apiClient.get<ApiResponse<Category[]>>('/categories'),
  create: (input: { name: string; description?: string }) =>
    apiClient.post<ApiResponse<Category>>('/categories', input),
  update: (id: string, input: { name?: string; description?: string }) =>
    apiClient.patch<ApiResponse<Category>>(`/categories/${id}`, input),
  remove: (id: string) => apiClient.delete(`/categories/${id}`),
};

export const coursesApi = {
  list: (params?: Record<string, string | number | undefined>) =>
    apiClient.get<PaginatedResponse<Course>>('/courses', { params }),
  detail: (slug: string) => apiClient.get<ApiResponse<Course>>(`/courses/${slug}`),
  managed: (params?: Record<string, string | number | undefined>) =>
    apiClient.get<PaginatedResponse<Course>>('/instructor/courses', { params }),
  create: (input: CourseInput) => apiClient.post<ApiResponse<Course>>('/courses', input),
  update: (id: string, input: Partial<CourseInput>) => apiClient.patch<ApiResponse<Course>>(`/courses/${id}`, input),
  publish: (id: string) => apiClient.post<ApiResponse<Course>>(`/courses/${id}/publish`),
  unpublish: (id: string) => apiClient.post<ApiResponse<Course>>(`/courses/${id}/unpublish`),
  remove: (id: string) => apiClient.delete(`/courses/${id}`),
  uploadThumbnail: (id: string, uri: string) => {
    const data = new FormData();
    data.append('thumbnail', { uri, name: 'thumbnail.jpg', type: 'image/jpeg' } as unknown as Blob);
    return apiClient.post<ApiResponse<{ thumbnailUrl: string }>>(`/courses/${id}/thumbnail`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const sectionsApi = {
  list: (courseId: string) => apiClient.get<ApiResponse<CourseSection[]>>(`/courses/${courseId}/sections`),
  create: (courseId: string, input: { title: string; position?: number }) =>
    apiClient.post<ApiResponse<CourseSection>>(`/courses/${courseId}/sections`, input),
  update: (sectionId: string, input: { title?: string; position?: number }) =>
    apiClient.patch<ApiResponse<CourseSection>>(`/sections/${sectionId}`, input),
  remove: (sectionId: string) => apiClient.delete(`/sections/${sectionId}`),
};

export interface LessonInput {
  title: string;
  lessonType: LessonType;
  content?: string | null;
  durationSeconds?: number | null;
  position?: number;
  isPreview?: boolean;
  isRequired?: boolean;
  isPublished?: boolean;
}

export const lessonsApi = {
  create: (sectionId: string, input: LessonInput) =>
    apiClient.post<ApiResponse<Lesson>>(`/sections/${sectionId}/lessons`, input),
  update: (lessonId: string, input: Partial<LessonInput>) =>
    apiClient.patch<ApiResponse<Lesson>>(`/lessons/${lessonId}`, input),
  remove: (lessonId: string) => apiClient.delete(`/lessons/${lessonId}`),
  uploadFile: (lessonId: string, file: { uri: string; name: string; mimeType?: string | null }) => {
    const data = new FormData();
    data.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.mimeType || 'application/octet-stream',
    } as unknown as Blob);
    return apiClient.post<ApiResponse<Lesson>>(`/lessons/${lessonId}/file`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const enrollmentsApi = {
  enroll: (courseId: string) => apiClient.post<ApiResponse<Enrollment>>(`/courses/${courseId}/enroll`),
  mine: () => apiClient.get<ApiResponse<Enrollment[]>>('/enrollments/me'),
};

export const learningApi = {
  content: (courseId: string) => apiClient.get<ApiResponse<CourseContent>>(`/courses/${courseId}/content`),
  progress: (courseId: string) => apiClient.get<ApiResponse<CourseProgress>>(`/courses/${courseId}/progress`),
  updateProgress: (lessonId: string, input: { lastWatchedSecond?: number; isCompleted?: boolean }) =>
    apiClient.patch<ApiResponse<{ lessonProgress: Lesson['progress']; courseProgress: CourseProgress }>>(`/lessons/${lessonId}/progress`, input),
};

export const quizzesApi = {
  get: (quizId: string) => apiClient.get<ApiResponse<Quiz>>(`/quizzes/${quizId}`),
  create: (lessonId: string, input: { title: string; description?: string | null; passingScore?: number; maxAttempts?: number; timeLimitMinutes?: number | null }) => apiClient.post<ApiResponse<Quiz>>(`/lessons/${lessonId}/quizzes`, input),
  update: (quizId: string, input: Partial<{ title: string; description: string | null; passingScore: number; maxAttempts: number; timeLimitMinutes: number | null; isPublished: boolean }>) => apiClient.patch<ApiResponse<Quiz>>(`/quizzes/${quizId}`, input),
  remove: (quizId: string) => apiClient.delete(`/quizzes/${quizId}`),
  createQuestion: (quizId: string, input: { text: string; explanation?: string | null; points?: number }) => apiClient.post<ApiResponse<QuizQuestion>>(`/quizzes/${quizId}/questions`, input),
  updateQuestion: (questionId: string, input: Partial<{ text: string; explanation: string | null; points: number }>) => apiClient.patch<ApiResponse<QuizQuestion>>(`/questions/${questionId}`, input),
  removeQuestion: (questionId: string) => apiClient.delete(`/questions/${questionId}`),
  createOption: (questionId: string, input: { text: string; isCorrect?: boolean }) => apiClient.post<ApiResponse<QuizOption>>(`/questions/${questionId}/options`, input),
  updateOption: (optionId: string, input: Partial<{ text: string; isCorrect: boolean }>) => apiClient.patch<ApiResponse<QuizOption>>(`/options/${optionId}`, input),
  removeOption: (optionId: string) => apiClient.delete(`/options/${optionId}`),
  attempts: (quizId: string) => apiClient.get<ApiResponse<QuizAttempt[]>>(`/quizzes/${quizId}/attempts/me`),
  start: (quizId: string) => apiClient.post<ApiResponse<QuizAttempt>>(`/quizzes/${quizId}/attempts`),
  submit: (attemptId: string, answers: Array<{ questionId: string; optionId: string }>) => apiClient.post<ApiResponse<QuizResult>>(`/quiz-attempts/${attemptId}/submit`, { answers }),
};

export const reviewsApi = {
  list: (courseId: string) => apiClient.get<ApiResponse<{ items: Review[]; summary: { averageRating: number; totalReviews: number } }>>(`/courses/${courseId}/reviews`),
  create: (courseId: string, input: { rating: number; content?: string | null }) => apiClient.post<ApiResponse<Review>>(`/courses/${courseId}/reviews`, input),
  update: (reviewId: string, input: { rating?: number; content?: string | null }) => apiClient.patch<ApiResponse<Review>>(`/reviews/${reviewId}`, input),
  remove: (reviewId: string) => apiClient.delete(`/reviews/${reviewId}`),
};

export const commentsApi = {
  list: (lessonId: string) => apiClient.get<ApiResponse<Comment[]>>(`/lessons/${lessonId}/comments`),
  create: (lessonId: string, input: { content: string; parentId?: string | null }) => apiClient.post<ApiResponse<Comment>>(`/lessons/${lessonId}/comments`, input),
  update: (commentId: string, content: string) => apiClient.patch<ApiResponse<Comment>>(`/comments/${commentId}`, { content }),
  remove: (commentId: string) => apiClient.delete(`/comments/${commentId}`),
};

export const ordersApi = {
  create: (courseIds: string[], couponCode?: string) => apiClient.post<ApiResponse<Order>>('/orders', { courseIds, ...(couponCode ? { couponCode } : {}) }),
  mine: () => apiClient.get<ApiResponse<Order[]>>('/orders/me'),
  get: (orderId: string) => apiClient.get<ApiResponse<Order>>(`/orders/${orderId}`),
  cancel: (orderId: string) => apiClient.delete(`/orders/${orderId}`),
  initiateMockPayment: (orderId: string) => apiClient.post<ApiResponse<{ payment: Payment; mockPaymentUrl: string }>>(`/orders/${orderId}/payments/mock`),
};

export const assignmentsApi = {
  list: (courseId: string) => apiClient.get<ApiResponse<Assignment[]>>(`/courses/${courseId}/assignments`),
  get: (assignmentId: string) => apiClient.get<ApiResponse<Assignment>>(`/assignments/${assignmentId}`),
  create: (courseId: string, input: {
    title: string; description?: string | null; instructions?: string | null; dueAt: string; maxScore: number;
    allowResubmission: boolean; maxSubmissions: number; allowLateSubmissions: boolean; isPublished: boolean;
  }) => apiClient.post<ApiResponse<Assignment>>(`/courses/${courseId}/assignments`, input),
  update: (assignmentId: string, input: Partial<Assignment>) => apiClient.patch<ApiResponse<Assignment>>(`/assignments/${assignmentId}`, input),
  remove: (assignmentId: string) => apiClient.delete(`/assignments/${assignmentId}`),
  submit: (assignmentId: string, textContent: string, files: Array<{ uri: string; name: string; mimeType?: string | null }>) => {
    const data = new FormData();
    if (textContent.trim()) data.append('textContent', textContent.trim());
    files.forEach(file => data.append('files', { uri: file.uri, name: file.name, type: file.mimeType || 'application/octet-stream' } as unknown as Blob));
    return apiClient.post<ApiResponse<AssignmentSubmission>>(`/assignments/${assignmentId}/submissions`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  mine: (assignmentId: string) => apiClient.get<ApiResponse<AssignmentSubmission[]>>(`/assignments/${assignmentId}/submissions/me`),
  submissions: (assignmentId: string) => apiClient.get<ApiResponse<AssignmentSubmission[]>>(`/assignments/${assignmentId}/submissions`),
  submission: (submissionId: string) => apiClient.get<ApiResponse<AssignmentSubmission>>(`/submissions/${submissionId}`),
  grade: (submissionId: string, input: { score: number; comment?: string | null }) => apiClient.patch<ApiResponse<AssignmentSubmission['feedback']>>(`/submissions/${submissionId}/grade`, input),
  gradeRule: (courseId: string) => apiClient.get<ApiResponse<CourseGradeRule>>(`/courses/${courseId}/grades/rule`),
  updateGradeRule: (courseId: string, input: Omit<CourseGradeRule, 'courseId'>) => apiClient.put<ApiResponse<CourseGradeRule>>(`/courses/${courseId}/grades/rule`, input),
  myGrade: (courseId: string) => apiClient.get<ApiResponse<CourseGrade>>(`/courses/${courseId}/grades/me`),
  courseGrades: (courseId: string) => apiClient.get<ApiResponse<CourseGrade[]>>(`/courses/${courseId}/grades`),
};

export const notificationsApi = {
  list: (params?: { page?: number; limit?: number; isRead?: boolean }) => apiClient.get<ApiResponse<AppNotification[]> & { meta: { page: number; limit: number; total: number; totalPages: number; unreadCount: number } }>('/notifications', { params }),
  unreadCount: () => apiClient.get<ApiResponse<{ unreadCount: number }>>('/notifications/unread-count'),
  markRead: (id: string) => apiClient.patch<ApiResponse<AppNotification>>(`/notifications/${id}/read`),
  markAllRead: () => apiClient.patch<ApiResponse<{ updatedCount: number; readAt: string }>>('/notifications/read-all'),
  remove: (id: string) => apiClient.delete(`/notifications/${id}`),
};

export const notificationPreferencesApi = {
  get: () => apiClient.get<ApiResponse<NotificationPreference>>('/notification-preferences'),
  update: (input: Partial<NotificationPreference>) => apiClient.patch<ApiResponse<NotificationPreference>>('/notification-preferences', input),
};

export const announcementsApi = {
  list: (courseId: string) => apiClient.get<ApiResponse<Announcement[]>>(`/courses/${courseId}/announcements`),
  create: (courseId: string, input: { title: string; content: string }) => apiClient.post<ApiResponse<Announcement>>(`/courses/${courseId}/announcements`, input),
  update: (id: string, input: Partial<Pick<Announcement, 'title' | 'content'>>) => apiClient.patch<ApiResponse<Announcement>>(`/announcements/${id}`, input),
  publish: (id: string) => apiClient.post<ApiResponse<Announcement>>(`/announcements/${id}/publish`),
  remove: (id: string) => apiClient.delete(`/announcements/${id}`),
};

const analyticsRange = () => {
  const to = new Date();
  const from = new Date(to); from.setDate(from.getDate() - 29);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
};
export const analyticsApi = {
  studentOverview: () => apiClient.get<ApiResponse<StudentAnalyticsOverview>>('/analytics/student/overview'),
  studentProgress: () => apiClient.get<ApiResponse<Array<{ courseId: string; title: string; thumbnailUrl: string | null; completedLessons: number; totalLessons: number; progressPercent: number; lastLearningAt: string | null }>>>('/analytics/student/course-progress'),
  studentActivity: () => apiClient.get<ApiResponse<Array<{ date: string; learningSeconds: number; completedLessons: number; quizAttempts: number }>>>('/analytics/student/activity', { params: { ...analyticsRange(), groupBy: 'day' } }),
  instructorOverview: () => apiClient.get<ApiResponse<InstructorAnalyticsOverview> & { meta: Record<string, string> }>('/analytics/instructor/overview', { params: analyticsRange() }),
  instructorEnrollments: () => apiClient.get<ApiResponse<Array<{ date: string; count: number }>>>('/analytics/instructor/enrollments', { params: { ...analyticsRange(), groupBy: 'day' } }),
  coursePerformance: () => apiClient.get<ApiResponse<Array<{ courseId: string; title: string; enrollments: number; activeStudents: number; completionRate: number; averageQuizScore: number | null; averageRating: number | null; revenue: { amount: number; currency: string } }>>>('/analytics/instructor/course-performance', { params: { ...analyticsRange(), sortBy: 'enrollments', limit: 10 } }),
};

export const couponsApi = {
  validate: (code: string, courseId: string) => apiClient.post<ApiResponse<CouponValidation>>('/coupons/validate', { code, courseId }),
  list: () => apiClient.get<ApiResponse<Coupon[]> & { meta: Record<string, number> }>('/admin/coupons', { params: { page: 1, limit: 100 } }),
  create: (input: Omit<Coupon, 'id' | 'redeemedCount' | 'courses'> & { courseIds: string[] }) => apiClient.post<ApiResponse<Coupon>>('/admin/coupons', input),
  update: (id: string, input: Partial<Coupon> & { courseIds?: string[] }) => apiClient.patch<ApiResponse<Coupon>>(`/admin/coupons/${id}`, input),
  setStatus: (id: string, isActive: boolean) => apiClient.patch<ApiResponse<Coupon>>(`/admin/coupons/${id}/status`, { isActive }),
};

export const refundsApi = {
  create: (orderId: string, reason: string) => apiClient.post<ApiResponse<RefundRequest>>('/refund-requests', { orderId, reason }),
  mine: () => apiClient.get<ApiResponse<RefundRequest[]>>('/refund-requests/me'),
  cancel: (id: string) => apiClient.patch<ApiResponse<RefundRequest>>(`/refund-requests/${id}/cancel`),
  adminList: () => apiClient.get<ApiResponse<RefundRequest[]> & { meta: Record<string, number> }>('/admin/refund-requests', { params: { page: 1, limit: 100 } }),
  approve: (id: string, adminNote: string) => apiClient.post<ApiResponse<RefundRequest>>(`/admin/refund-requests/${id}/approve`, { adminNote }, { headers: { 'Idempotency-Key': `mobile-refund-${id}` } }),
  reject: (id: string, adminNote: string) => apiClient.post<ApiResponse<RefundRequest>>(`/admin/refund-requests/${id}/reject`, { adminNote }),
};

export const revenueApi = {
  overview: () => apiClient.get<ApiResponse<RevenueOverview>>('/instructor/revenue/overview'),
  earnings: () => apiClient.get<ApiResponse<InstructorEarning[]> & { meta: Record<string, number> }>('/instructor/revenue/earnings', { params: { page: 1, limit: 100 } }),
  byCourse: () => apiClient.get<ApiResponse<Array<{ courseId: string; title: string; grossRevenue: number; platformFees: number; netRevenue: number }>>>('/instructor/revenue/by-course'),
  payouts: () => apiClient.get<ApiResponse<Payout[]> & { meta: Record<string, number> }>('/instructor/payouts', { params: { page: 1, limit: 100 } }),
};

export const payoutsApi = {
  balances: () => apiClient.get<ApiResponse<Array<{ instructor?: { id: string; fullName: string; email: string }; availableAmount: number; earningCount: number; currency: string }>>>('/admin/payouts/balances'),
  list: () => apiClient.get<ApiResponse<Payout[]> & { meta: Record<string, number> }>('/admin/payouts', { params: { page: 1, limit: 100 } }),
  create: (instructorId: string) => apiClient.post<ApiResponse<Payout>>('/admin/payouts', { instructorId }, { headers: { 'Idempotency-Key': `mobile-payout-${instructorId}-${Date.now()}` } }),
  process: (id: string, succeed = true) => apiClient.post<ApiResponse<Payout>>(`/admin/payouts/${id}/process`, { succeed }),
};

export const certificatesApi = {
  issue: (courseId: string) => apiClient.post<ApiResponse<Certificate>>(`/courses/${courseId}/certificates`),
  mine: () => apiClient.get<ApiResponse<Certificate[]>>('/certificates/me'),
  get: (certificateId: string) => apiClient.get<ApiResponse<Certificate>>(`/certificates/${certificateId}`),
  verify: (code: string) => apiClient.get<ApiResponse<CertificateVerification>>(`/certificates/verify/${encodeURIComponent(code)}`),
};
