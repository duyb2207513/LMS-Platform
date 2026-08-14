export type UserRole = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'BLOCKED';
export type CourseLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type LessonType = 'VIDEO' | 'TEXT' | 'DOCUMENT';

export interface User {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface Course {
  id: string;
  instructorId?: string;
  categoryId?: string;
  title: string;
  slug: string;
  description?: string;
  thumbnailUrl: string | null;
  level: CourseLevel;
  price: number;
  isFree: boolean;
  language?: string;
  requirements?: string | null;
  learningOutcomes?: string | null;
  status: CourseStatus;
  publishedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  instructor?: Pick<User, 'id' | 'fullName' | 'avatarUrl'>;
  category?: Pick<Category, 'id' | 'name' | 'slug'>;
}

export interface CourseInput {
  title: string;
  description: string;
  categoryId: string;
  level: CourseLevel;
  price: number;
  isFree: boolean;
  language: string;
  requirements?: string | null;
  learningOutcomes?: string | null;
}

export interface LessonProgress {
  id?: string;
  lessonId?: string;
  isCompleted: boolean;
  lastWatchedSecond: number;
  completedAt?: string | null;
  updatedAt?: string;
}

export interface Lesson {
  id: string;
  sectionId?: string;
  title: string;
  lessonType: LessonType;
  content: string | null;
  videoUrl: string | null;
  documentUrl: string | null;
  durationSeconds: number | null;
  position: number;
  isPreview: boolean;
  isRequired: boolean;
  isPublished: boolean;
  progress?: LessonProgress;
  quiz?: Quiz | null;
}

export interface QuizOption { id: string; questionId?: string; text: string; position: number; isCorrect?: boolean }
export interface QuizQuestion { id: string; quizId?: string; text: string; explanation?: string | null; points: number; position: number; options: QuizOption[] }
export interface Quiz {
  id: string; lessonId?: string; title: string; description: string | null; passingScore: number;
  maxAttempts: number; timeLimitMinutes: number | null; isPublished: boolean; questions?: QuizQuestion[];
}
export interface QuizAttempt { id: string; quizId: string; attemptNumber: number; status: 'IN_PROGRESS' | 'SUBMITTED'; score: number | null; passed: boolean | null; startedAt: string; submittedAt: string | null }
export interface QuizResult {
  id: string; quizId: string; attemptNumber: number; status: 'SUBMITTED'; score: number; earnedPoints: number; totalPoints: number; passed: boolean; submittedAt: string;
  answers: Array<{ questionId: string; question: string; selectedOptionId: string | null; correctOptionId?: string; isCorrect: boolean; pointsEarned: number; explanation: string | null }>;
}
export interface Review { id: string; courseId: string; rating: number; content: string | null; createdAt: string; updatedAt: string; user: Pick<User, 'id' | 'fullName' | 'avatarUrl'> }
export interface Comment { id: string; lessonId: string; parentId: string | null; content: string | null; isDeleted?: boolean; createdAt: string; updatedAt: string; user: Pick<User, 'id' | 'fullName' | 'avatarUrl' | 'role'>; replies?: Comment[] }

export interface CourseSection {
  id: string;
  courseId?: string;
  title: string;
  position: number;
  lessons: Lesson[];
}

export interface Enrollment {
  id: string;
  courseId: string;
  progressPercent: number;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  enrolledAt: string;
  completedAt: string | null;
  course: Pick<Course, 'id' | 'title' | 'slug' | 'thumbnailUrl'> & {
    instructor?: Pick<User, 'id' | 'fullName'>;
    category?: Pick<Category, 'id' | 'name' | 'slug'>;
  };
}

export interface CourseContent {
  course: Pick<Course, 'id' | 'title'>;
  sections: CourseSection[];
}

export interface CourseProgress {
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
}

export type OrderStatus = 'PENDING' | 'PAID' | 'CANCELLED' | 'REFUNDED';
export type PaymentStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED';

export interface OrderItem {
  id: string;
  courseId: string;
  courseTitleSnapshot: string;
  priceSnapshot: number;
  course?: Pick<Course, 'slug' | 'thumbnailUrl'>;
}

export interface Payment {
  id: string;
  provider: 'MOCK' | 'VNPAY';
  status: PaymentStatus;
  amount: number;
  currency: string;
  providerTransactionId: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  subtotal: number;
  discount?: number;
  total: number;
  couponId?: string | null;
  coupon?: { id: string; code: string; discountType: 'PERCENTAGE' | 'FIXED_AMOUNT'; discountValue: number } | null;
  currency: string;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  payments: Payment[];
}

export interface AssignmentFile {
  id: string;
  originalName: string;
  fileUrl: string;
  mimeType: string;
  sizeBytes: number;
}

export interface SubmissionFeedback {
  id: string;
  score: number;
  comment: string | null;
  gradedAt: string;
  grader?: Pick<User, 'id' | 'fullName'>;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  attemptNumber: number;
  textContent: string | null;
  status: 'SUBMITTED' | 'GRADED';
  submittedAt: string;
  isLate: boolean;
  student?: Pick<User, 'id' | 'fullName' | 'email' | 'avatarUrl'>;
  files: AssignmentFile[];
  feedback: SubmissionFeedback | null;
}

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  instructions: string | null;
  dueAt: string;
  maxScore: number;
  allowResubmission: boolean;
  maxSubmissions: number;
  allowLateSubmissions: boolean;
  isPublished: boolean;
  createdAt: string;
  submissions?: AssignmentSubmission[];
  _count?: { submissions: number };
}

export interface CourseGrade {
  student?: Pick<User, 'id' | 'fullName' | 'email' | 'avatarUrl'>;
  courseId: string;
  studentId: string;
  finalScore: number;
  passed: boolean;
  rule: CourseGradeRule;
  assignment: { percent: number; earned: number; maximum: number; total: number; graded: number };
  quiz: { percent: number; total: number; attempted: number };
}

export interface CourseGradeRule {
  courseId: string;
  assignmentWeight: number;
  quizWeight: number;
  passingScore: number;
}

export type NotificationType = 'WELCOME' | 'COURSE_ENROLLED' | 'NEW_LESSON' | 'COURSE_ANNOUNCEMENT' | 'ASSIGNMENT_DUE' | 'QUIZ_RESULT' | 'CERTIFICATE_ISSUED';
export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationPreference {
  inAppEnabled: boolean;
  emailEnabled: boolean;
  courseUpdates: boolean;
  assignmentReminders: boolean;
  quizResults: boolean;
  certificateUpdates: boolean;
}

export interface Announcement {
  id: string;
  courseId: string;
  authorId: string;
  title: string;
  content: string;
  status: 'DRAFT' | 'PUBLISHED';
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author?: Pick<User, 'id' | 'fullName' | 'role'>;
}

export interface StudentAnalyticsOverview {
  enrolledCourses: number;
  inProgressCourses: number;
  completedCourses: number;
  notStartedCourses: number;
  totalLearningSeconds: number;
  averageQuizScore: number | null;
  currentStreak: number;
  longestStreak: number;
}

export interface InstructorAnalyticsOverview {
  uniqueStudents: number;
  newEnrollments: number;
  completionRate: number;
  averageQuizScore: number | null;
  averageRating: number | null;
  ratingCount: number;
  revenue: { amount: number; currency: string; available: boolean };
}

export interface CouponValidation {
  valid: boolean;
  coupon: { code: string; discountType: 'PERCENTAGE' | 'FIXED_AMOUNT'; discountValue: number };
  pricing: { originalAmount: number; discountAmount: number; finalAmount: number; currency: string };
}

export interface Coupon {
  id: string;
  code: string;
  name: string;
  description: string | null;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  maxDiscountAmount: number | null;
  minOrderAmount: number | null;
  startsAt: string;
  expiresAt: string;
  maxRedemptions: number | null;
  redeemedCount: number;
  appliesToAllCourses: boolean;
  isActive: boolean;
  courses?: Array<{ course: Pick<Course, 'id' | 'title' | 'slug'> }>;
}

export type RefundStatus = 'PENDING' | 'PROCESSING' | 'APPROVED' | 'REFUNDED' | 'REJECTED' | 'CANCELLED' | 'FAILED';
export interface RefundRequest {
  id: string;
  orderId: string;
  userId: string;
  paymentId: string;
  reason: string;
  status: RefundStatus;
  requestedAmount: number;
  approvedAmount: number | null;
  adminNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
  order?: Pick<Order, 'id' | 'orderNumber' | 'total' | 'currency'>;
  user?: Pick<User, 'id' | 'fullName' | 'email'>;
}

export interface RevenueOverview {
  grossRevenue: number;
  platformFees: number;
  netRevenue: number;
  pendingBalance: number;
  availableBalance: number;
  paidAmount: number;
  reversedAmount: number;
  currency: string;
}

export interface InstructorEarning {
  id: string;
  courseId: string;
  grossAmount: number;
  platformFeeAmount: number;
  netAmount: number;
  status: 'PENDING' | 'AVAILABLE' | 'PAID' | 'REVERSED';
  availableAt: string;
  createdAt: string;
  course?: Pick<Course, 'id' | 'title' | 'slug'>;
}

export interface Payout {
  id: string;
  instructorId: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'CANCELLED';
  failureReason: string | null;
  createdAt: string;
  processedAt?: string | null;
  instructor?: Pick<User, 'id' | 'fullName' | 'email'>;
}

export interface Certificate {
  id: string;
  certificateNumber: string;
  verificationCode: string;
  enrollmentId: string;
  studentId: string;
  courseId: string;
  studentNameSnapshot: string;
  courseTitleSnapshot: string;
  instructorNameSnapshot: string;
  issuedAt: string;
  revokedAt: string | null;
}

export interface CertificateVerification {
  valid: boolean;
  certificate: Pick<Certificate, 'certificateNumber' | 'studentNameSnapshot' | 'courseTitleSnapshot' | 'instructorNameSnapshot' | 'issuedAt' | 'revokedAt'>;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, string>;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export type RootStackParamList = {
  Main: { screen?: keyof MainTabParamList } | undefined;
  CourseDetail: { slug: string };
  Login: undefined;
  Register: undefined;
  Profile: undefined;
  ChangePassword: undefined;
  InstructorCourses: undefined;
  CourseForm: { course?: Course } | undefined;
  CourseBuilder: { course: Course };
  MyCourses: undefined;
  Learning: { courseId: string; courseTitle: string };
  QuizBuilder: { lesson: Lesson };
  Quiz: { quizId: string; title: string };
  QuizResult: { result: QuizResult; quizTitle: string };
  AdminCategories: undefined;
  Orders: undefined;
  Checkout: { orderId?: string; courseId?: string; courseTitle?: string; price?: number };
  MockPayment: { orderId: string; checkoutUrl: string };
  PaymentResult: { orderId: string };
  Certificates: undefined;
  VerifyCertificate: { initialCode?: string } | undefined;
  Assignments: { courseId: string; courseTitle: string };
  AssignmentDetail: { assignmentId: string; courseId: string };
  AssignmentManager: { courseId: string; courseTitle: string };
  AssignmentSubmissions: { assignmentId: string; assignmentTitle: string; maxScore: number };
  SubmissionDetail: { submissionId: string; maxScore: number };
  Announcements: { courseId: string; courseTitle: string };
  Analytics: undefined;
  Refunds: undefined;
  AdminRefunds: undefined;
  AdminCoupons: undefined;
  Revenue: undefined;
  AdminPayouts: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  CoursesTab: undefined;
  SearchTab: undefined;
  NotificationsTab: undefined;
  AccountTab: undefined;
};
