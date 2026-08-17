// ==================== Enums ====================
export * from './notification'
export * from './commerce'
export enum UserRole {
  STUDENT = 'STUDENT',
  INSTRUCTOR = 'INSTRUCTOR',
  ADMIN = 'ADMIN',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  BLOCKED = 'BLOCKED',
}

export enum CourseLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
}

export enum CourseStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

// ==================== Models ====================
export interface User {
  id: string
  fullName: string
  firstName?: string | null
  lastName?: string | null
  phoneNumber?: string | null
  email: string
  avatarUrl?: string | null
  role: UserRole
  status: UserStatus
  googleId?: string | null
  githubId?: string | null
  lastLoginAt?: string | null
  emailVerifiedAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string | null
  createdAt: string
  updatedAt: string
  _count?: { courses: number }
}

export interface Course {
  id: string
  instructorId: string
  categoryId: string
  title: string
  slug: string
  description: string
  thumbnailUrl?: string | null
  level: CourseLevel
  price: number
  isFree: boolean
  language: string
  requirements?: string | null
  learningOutcomes?: string | null
  status: CourseStatus
  publishedAt?: string | null
  createdAt: string
  updatedAt: string
  instructor?: User
  category?: Category
}

// ==================== API ====================
export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
}

export interface PaginatedResponse<T> {
  success: boolean
  message: string
  data: T[]
  meta: {
    total?: number
    totalItems?: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  fullName: string
  email: string
  password: string
  confirmPassword: string
}

export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
}

export interface AuthSession {
  id: string
  ipAddress: string | null
  userAgent: string | null
  lastUsedAt: string
  expiresAt: string
  createdAt: string
  isCurrent: boolean
}

export interface Enrollment { id:string;courseId:string;progressPercent:number;status:'ACTIVE'|'COMPLETED'|'CANCELLED';enrolledAt:string;completedAt:string|null;course:Course }
export interface LessonProgress { isCompleted:boolean;lastWatchedSecond:number;completedAt?:string|null }
export interface Lesson { id:string;sectionId:string;title:string;lessonType:'VIDEO'|'TEXT'|'DOCUMENT';content:string|null;videoUrl:string|null;documentUrl:string|null;durationSeconds:number|null;position:number;isPreview:boolean;isRequired:boolean;isPublished:boolean;progress?:LessonProgress;quiz?:Quiz|null }
export interface CourseSection { id:string;courseId:string;title:string;position:number;lessons:Lesson[] }
export interface CourseContent { course:Pick<Course,'id'|'title'>;sections:CourseSection[] }
export interface CourseProgress { totalLessons:number;completedLessons:number;progressPercent:number }
export interface QuizOption { id:string;text:string;position:number;isCorrect?:boolean }
export interface QuizQuestion { id:string;text:string;explanation?:string|null;points:number;position:number;options:QuizOption[] }
export interface Quiz { id:string;lessonId:string;courseId?:string;title:string;description:string|null;passingScore:number;maxAttempts:number;timeLimitMinutes:number|null;isPublished:boolean;questions?:QuizQuestion[] }
export interface QuizAttempt { id:string;quizId:string;attemptNumber:number;status:'IN_PROGRESS'|'SUBMITTED';score:number|null;passed:boolean|null;startedAt:string;submittedAt:string|null }
export interface QuizResult extends QuizAttempt { earnedPoints:number;totalPoints:number;score:number;passed:boolean;answers:Array<{questionId:string;question:string;selectedOptionId:string|null;correctOptionId?:string;isCorrect:boolean;pointsEarned:number;explanation:string|null}> }
export interface Review { id:string;courseId:string;rating:number;content:string|null;createdAt:string;updatedAt:string;user:Pick<User,'id'|'fullName'|'avatarUrl'> }
export interface Comment { id:string;lessonId:string;parentId:string|null;content:string|null;isDeleted?:boolean;createdAt:string;user:Pick<User,'id'|'fullName'|'avatarUrl'|'role'>;replies?:Comment[] }
export interface Payment { id:string;status:'PENDING'|'SUCCEEDED'|'FAILED';amount:number;currency:string;createdAt:string;paidAt:string|null }
export interface OrderItem { id:string;courseId:string;courseTitleSnapshot:string;priceSnapshot:number;course?:Pick<Course,'slug'|'thumbnailUrl'> }
export interface Order { id:string;orderNumber:string;status:'PENDING'|'PAID'|'CANCELLED';subtotal:number;total:number;currency:string;paidAt:string|null;createdAt:string;items:OrderItem[];payments:Payment[] }
export interface Certificate { id:string;certificateNumber:string;verificationCode:string;studentNameSnapshot:string;courseTitleSnapshot:string;instructorNameSnapshot:string;issuedAt:string;revokedAt:string|null;courseId:string }
export interface SubmissionFile { id:string;originalName:string;fileUrl:string;mimeType:string;sizeBytes:number;createdAt:string }
export interface SubmissionFeedback { id:string;score:number;comment:string|null;gradedAt:string;updatedAt:string;grader?:Pick<User,'id'|'fullName'> }
export interface AssignmentSubmission { id:string;assignmentId:string;studentId:string;attemptNumber:number;textContent:string|null;status:'SUBMITTED'|'GRADED';submittedAt:string;updatedAt:string;student?:Pick<User,'id'|'fullName'|'email'|'avatarUrl'>;files:SubmissionFile[];feedback:SubmissionFeedback|null }
export interface Assignment { id:string;courseId:string;title:string;description:string|null;instructions:string|null;dueAt:string;maxScore:number;allowResubmission:boolean;maxSubmissions:number;allowLateSubmissions:boolean;isPublished:boolean;createdAt:string;updatedAt:string;isOverdue?:boolean;remainingSubmissions?:number;submissions?:AssignmentSubmission[];_count?:{submissions:number};course?:Pick<Course,'id'|'title'|'slug'> }
export interface CourseGradeRule { courseId:string;assignmentWeight:number;quizWeight:number;passingScore:number }
export interface CourseGrade { courseId:string;studentId:string;finalScore:number;passed:boolean;rule:CourseGradeRule;assignment:{percent:number;earned:number;maximum:number;total:number;graded:number};quiz:{percent:number;total:number;attempted:number};student?:Pick<User,'id'|'fullName'|'email'|'avatarUrl'> }
export interface MessageContact extends Pick<User, 'id' | 'fullName' | 'email' | 'avatarUrl' | 'role' | 'status'> {}
export interface DirectMessage { id:string;senderId:string;recipientId:string;content:string;readAt:string|null;createdAt:string;updatedAt:string;sender:MessageContact;recipient:MessageContact }
export interface MessageConversation { contact:MessageContact;lastMessage:DirectMessage;unreadCount:number }

export interface CategoryFormData {
  name: string
  description?: string
}

export interface CourseFormData {
  categoryId: string
  title: string
  description: string
  level: CourseLevel
  price: number
  isFree: boolean
  language: string
  requirements?: string
  learningOutcomes?: string
}

export interface CourseFilters {
  search?: string
  categoryId?: string
  level?: CourseLevel
  isFree?: boolean
  page?: number
  limit?: number
}

export interface AdminListResponse<T> extends ApiResponse<{ items: T[]; meta: { page: number; limit: number; totalItems: number; totalPages: number } }> {}
export interface AdminDashboardStats {
  users: { total: number; byRole: Record<string, number> }
  courses: { total: number; byStatus: Record<string, number> }
  learning: { enrollments: number; reviews: number; comments: number }
  commerce: { paidOrders: number; revenue: number; currency: string }
  certificates: number
  recent: { users: User[]; orders: Array<{ id: string; orderNumber: string; status: string; total: number; currency: string; createdAt: string; user: { fullName: string; email: string } }> }
}
export interface AdminReview { id: string; rating: number; content: string | null; createdAt: string; user: Pick<User, 'id' | 'fullName' | 'email'>; course: Pick<Course, 'id' | 'title' | 'slug'> }
export interface AdminComment { id: string; content: string | null; isDeleted: boolean; createdAt: string; user: Pick<User, 'id' | 'fullName' | 'email' | 'role'>; lesson: { id: string; title: string; section: { course: Pick<Course, 'id' | 'title'> } } }
