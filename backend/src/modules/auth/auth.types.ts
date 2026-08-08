export interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthTokenPayload {
  userId: string;
  role: "STUDENT" | "INSTRUCTOR" | "ADMIN";
}
// nothing happen