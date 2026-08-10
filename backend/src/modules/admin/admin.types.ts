export type AdminUserRole = "STUDENT" | "INSTRUCTOR" | "ADMIN";
export type AdminUserStatus = "ACTIVE" | "BLOCKED";
export type AdminCourseStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface AdminListQuery {
  page: number;
  limit: number;
  search?: string;
  role?: AdminUserRole;
  userStatus?: AdminUserStatus;
  courseStatus?: AdminCourseStatus;
}

export interface UpdateAdminUserInput { role?: AdminUserRole; status?: AdminUserStatus }
export interface UpdateAdminCourseInput { status: AdminCourseStatus }
