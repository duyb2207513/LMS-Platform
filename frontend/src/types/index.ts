// ==================== Enums ====================
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
  email: string
  avatarUrl?: string | null
  role: UserRole
  status: UserStatus
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
    total: number
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
  role?: UserRole
}

export interface AuthResponse {
  user: User
  accessToken: string
}

export interface CategoryFormData {
  name: string
  description?: string
}

export interface CourseFormData {
  categoryId: string
  title: string
  description: string
  thumbnailUrl?: string
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
