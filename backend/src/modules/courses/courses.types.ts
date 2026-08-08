export type CourseLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
export type CourseStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface PublicCourseQuery {
  page: number;
  limit: number;
  search?: string;
  categoryId?: string;
  level?: CourseLevel;
  minPrice?: number;
  maxPrice?: number;
  sortBy: "createdAt" | "title" | "price" | "publishedAt";
  sortOrder: "asc" | "desc";
}

export interface InstructorCourseQuery {
  page: number;
  limit: number;
  search?: string;
  status?: CourseStatus;
}

export interface CreateCourseInput {
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

export interface UpdateCourseInput {
  title?: string;
  description?: string;
  categoryId?: string;
  level?: CourseLevel;
  price?: number;
  isFree?: boolean;
  language?: string;
  requirements?: string | null;
  learningOutcomes?: string | null;
}
