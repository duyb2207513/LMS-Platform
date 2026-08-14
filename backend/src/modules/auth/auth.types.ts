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
  sessionId?: string;
}

export interface ForgotPasswordInput { email: string; }
export interface ResetPasswordInput { token: string; newPassword: string; confirmNewPassword: string; }
export interface TokenInput { token: string; }
export interface GoogleLoginInput { idToken: string; }
export interface ChangeEmailInput { newEmail: string; currentPassword?: string; }
