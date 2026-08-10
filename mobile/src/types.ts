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

export type OrderStatus = 'PENDING' | 'PAID' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED';

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
  total: number;
  currency: string;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  payments: Payment[];
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
  Home: undefined;
  Courses: undefined;
  CourseDetail: { slug: string };
  Login: undefined;
  Register: undefined;
  Dashboard: undefined;
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
  Checkout: { orderId: string };
  MockPayment: { orderId: string; checkoutUrl: string };
  PaymentResult: { orderId: string };
  Certificates: undefined;
  VerifyCertificate: { initialCode?: string } | undefined;
};
