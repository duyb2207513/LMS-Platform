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
  refreshToken: string
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
