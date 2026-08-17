import type { Request, Response } from "express";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { AppError } from "../../common/errors/AppError.js";
import { sendSuccess } from "../../common/utils/response.js";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
import { REFRESH_TOKEN_EXPIRES_IN_SECONDS } from "./auth.tokens.js";
import {
  confirmEmailChange, createMobileOAuthHandoff, exchangeMobileOAuthCode, forgotPassword, githubLogin, googleLogin,
  listSessions, login, refreshSession, register, requestEmailChange, requestEmailVerificationByEmail, resetPassword,
  revokeOtherSessions, revokeRefreshToken, revokeSession, verifyEmail
} from "./auth.service.js";
import type {
  ChangeEmailInput, ForgotPasswordInput, GoogleLoginInput, LoginInput, MobileOAuthExchangeInput,
  MobileRefreshInput, RegisterInput, ResetPasswordInput, TokenInput
} from "./auth.types.js";

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: REFRESH_TOKEN_EXPIRES_IN_SECONDS * 1000,
  path: "/api/v1/auth"
});
const clientContext = (request: Request) => ({
  request,
  ipAddress: request.ip,
  userAgent: request.headers["user-agent"],
  actionBaseUrl: request.headers["x-client-platform"] === "mobile" ? env.mobileAppUrl : undefined
});
const setRefreshCookie = (response: Response, token: string) => response.cookie("refreshToken", token, cookieOptions());
const clearRefreshCookie = (response: Response) => response.clearCookie("refreshToken", cookieOptions());
const githubStateCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/api/v1/auth/github"
});
const githubCallbackPage = (error?: string) => {
  const url = new URL("/auth/github/callback", env.frontendUrl);
  if (error) url.searchParams.set("error", error);
  return url.toString();
};
const githubMobileCallbackPage = (redirectUri: string, input: { code?: string; error?: string }) => {
  const url = new URL(redirectUri);
  if (input.code) url.searchParams.set("code", input.code);
  if (input.error) url.searchParams.set("error", input.error);
  return url.toString();
};
const allowedMobileRedirect = (value: unknown) => {
  if (typeof value !== "string" || !value) return undefined;
  try {
    const requested = new URL(value);
    const configured = new URL(env.mobileAppUrl);
    const developmentExpoScheme = env.nodeEnv !== "production" && ["exp:", "exps:"].includes(requested.protocol);
    return requested.protocol === configured.protocol || developmentExpoScheme ? requested.toString() : undefined;
  } catch { return undefined; }
};
const stateMatches = (received: string, stored: string) => {
  const left = Buffer.from(received);
  const right = Buffer.from(stored);
  return left.length === right.length && timingSafeEqual(left, right);
};

export async function registerController(request: Request, response: Response) {
  const user = await register(request.body as RegisterInput, clientContext(request));
  sendSuccess(response, 201, "Account registered successfully. Please verify your email", { user });
}

export async function loginController(request: Request, response: Response) {
  const result = await login(request.body as LoginInput, clientContext(request));
  setRefreshCookie(response, result.refreshToken);
  sendSuccess(response, 200, "Login successful", { accessToken: result.accessToken, user: result.user });
}

export async function googleLoginController(request: Request, response: Response) {
  const result = await googleLogin(request.body as GoogleLoginInput, clientContext(request));
  setRefreshCookie(response, result.refreshToken);
  sendSuccess(response, 200, "Google login successful", { accessToken: result.accessToken, user: result.user });
}

export async function mobileLoginController(request: Request, response: Response) {
  const result = await login(request.body as LoginInput, clientContext(request));
  sendSuccess(response, 200, "Login successful", { accessToken: result.accessToken, refreshToken: result.refreshToken, user: result.user });
}

export async function mobileGoogleLoginController(request: Request, response: Response) {
  const result = await googleLogin(request.body as GoogleLoginInput, clientContext(request));
  sendSuccess(response, 200, "Google login successful", { accessToken: result.accessToken, refreshToken: result.refreshToken, user: result.user });
}

export async function startGitHubLoginController(request: Request, response: Response) {
  if (!env.githubClientId || !env.githubClientSecret) throw new AppError(503, "GitHub login is not configured");
  const state = randomBytes(32).toString("hex");
  const authorizationUrl = new URL("https://github.com/login/oauth/authorize");
  authorizationUrl.searchParams.set("client_id", env.githubClientId);
  authorizationUrl.searchParams.set("redirect_uri", env.githubCallbackUrl);
  authorizationUrl.searchParams.set("scope", "read:user user:email");
  authorizationUrl.searchParams.set("state", state);
  response.cookie("githubOAuthState", state, { ...githubStateCookieOptions(), maxAge: 10 * 60 * 1000 });
  const mobileRedirect = allowedMobileRedirect(request.query.redirectUri);
  if (mobileRedirect) response.cookie("githubOAuthReturn", mobileRedirect, { ...githubStateCookieOptions(), maxAge: 10 * 60 * 1000 });
  response.redirect(authorizationUrl.toString());
}

export async function githubCallbackController(request: Request, response: Response) {
  const code = typeof request.query.code === "string" ? request.query.code : "";
  const state = typeof request.query.state === "string" ? request.query.state : "";
  const storedState = typeof request.cookies?.githubOAuthState === "string" ? request.cookies.githubOAuthState : "";
  const mobileRedirect = allowedMobileRedirect(request.cookies?.githubOAuthReturn);
  response.clearCookie("githubOAuthState", githubStateCookieOptions());
  response.clearCookie("githubOAuthReturn", githubStateCookieOptions());

  if (request.query.error || !code || !state || !storedState || !stateMatches(state, storedState)) {
    const message = "Phiên đăng nhập GitHub không hợp lệ hoặc đã hết hạn";
    response.redirect(mobileRedirect ? githubMobileCallbackPage(mobileRedirect, { error: message }) : githubCallbackPage(message));
    return;
  }

  try {
    const result = await githubLogin(code, clientContext(request));
    if (mobileRedirect) {
      const handoffCode = await createMobileOAuthHandoff(result.user.id);
      await revokeSession(result.user.id, result.sessionId);
      response.redirect(githubMobileCallbackPage(mobileRedirect, { code: handoffCode }));
      return;
    }
    setRefreshCookie(response, result.refreshToken);
    response.redirect(githubCallbackPage());
  } catch (error) {
    if (error instanceof AppError) logger.warn({ statusCode: error.statusCode }, "GitHub login was rejected");
    else logger.error({ err: error }, "Unexpected GitHub login error");
    const message = error instanceof AppError ? error.message : "Đăng nhập GitHub thất bại";
    response.redirect(mobileRedirect ? githubMobileCallbackPage(mobileRedirect, { error: message }) : githubCallbackPage(message));
  }
}

export async function mobileOAuthExchangeController(request: Request, response: Response) {
  const result = await exchangeMobileOAuthCode((request.body as MobileOAuthExchangeInput).code, clientContext(request));
  sendSuccess(response, 200, "OAuth login successful", { accessToken: result.accessToken, refreshToken: result.refreshToken, user: result.user });
}

export async function refreshTokenController(request: Request, response: Response) {
  const refreshToken = request.cookies?.refreshToken;
  if (typeof refreshToken !== "string" || !refreshToken) throw new AppError(401, "Refresh token is required");
  const result = await refreshSession(refreshToken, clientContext(request));
  setRefreshCookie(response, result.refreshToken);
  sendSuccess(response, 200, "Token refreshed successfully", { accessToken: result.accessToken });
}

export async function mobileRefreshTokenController(request: Request, response: Response) {
  const result = await refreshSession((request.body as MobileRefreshInput).refreshToken, clientContext(request));
  sendSuccess(response, 200, "Token refreshed successfully", result);
}

export async function logoutController(request: Request, response: Response) {
  await revokeRefreshToken(typeof request.cookies?.refreshToken === "string" ? request.cookies.refreshToken : undefined);
  clearRefreshCookie(response);
  sendSuccess(response, 200, "Logout successful", null);
}

export async function mobileLogoutController(request: Request, response: Response) {
  await revokeRefreshToken((request.body as MobileRefreshInput).refreshToken);
  sendSuccess(response, 200, "Logout successful", null);
}

export async function verifyEmailController(request: Request, response: Response) {
  await verifyEmail((request.body as TokenInput).token);
  sendSuccess(response, 200, "Email verified successfully", null);
}

export async function resendVerificationController(request: Request, response: Response) {
  await requestEmailVerificationByEmail((request.body as ForgotPasswordInput).email, clientContext(request).actionBaseUrl);
  sendSuccess(response, 200, "If the account needs verification, an email has been sent", null);
}

export async function forgotPasswordController(request: Request, response: Response) {
  await forgotPassword((request.body as ForgotPasswordInput).email, clientContext(request).actionBaseUrl);
  sendSuccess(response, 200, "If the account exists, a password reset email has been sent", null);
}

export async function resetPasswordController(request: Request, response: Response) {
  await resetPassword(request.body as ResetPasswordInput);
  clearRefreshCookie(response);
  sendSuccess(response, 200, "Password reset successfully", null);
}

export async function requestEmailChangeController(request: Request, response: Response) {
  await requestEmailChange(request.auth!.userId, request.body as ChangeEmailInput, clientContext(request).actionBaseUrl);
  sendSuccess(response, 200, "A confirmation link has been sent to the new email", null);
}

export async function confirmEmailChangeController(request: Request, response: Response) {
  await confirmEmailChange((request.body as TokenInput).token);
  clearRefreshCookie(response);
  sendSuccess(response, 200, "Email changed successfully. Please log in again", null);
}

export async function listSessionsController(request: Request, response: Response) {
  sendSuccess(response, 200, "Sessions retrieved successfully", await listSessions(request.auth!.userId, request.auth?.sessionId));
}

export async function revokeSessionController(request: Request, response: Response) {
  await revokeSession(request.auth!.userId, String(request.params.sessionId));
  if (request.params.sessionId === request.auth?.sessionId) clearRefreshCookie(response);
  sendSuccess(response, 200, "Session revoked successfully", null);
}

export async function revokeOtherSessionsController(request: Request, response: Response) {
  await revokeOtherSessions(request.auth!.userId, request.auth?.sessionId);
  sendSuccess(response, 200, "Other sessions revoked successfully", null);
}
