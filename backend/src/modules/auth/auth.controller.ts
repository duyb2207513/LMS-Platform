import type { Request, Response } from "express";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { AppError } from "../../common/errors/AppError.js";
import { sendSuccess } from "../../common/utils/response.js";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
import { REFRESH_TOKEN_EXPIRES_IN_SECONDS } from "./auth.tokens.js";
import {
  checkEmailExists,
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

export async function checkEmailExistsController(request: Request, response: Response) {
  const email = typeof request.query.email === "string" ? request.query.email : "";
  const result = await checkEmailExists(email);
  sendSuccess(response, 200, "Email availability checked", result);
}

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
  response.cookie("githubOAuthState", state, { ...githubStateCookieOptions(), maxAge: 10 * 60 * 1000 });

  const accountParam = typeof request.query.account === "string" ? request.query.account.trim() : "";

  if (env.nodeEnv === "development" && (env.githubClientId.startsWith("dev_") || env.githubClientId.startsWith("mock_"))) {
    if (accountParam) {
      const mockCallbackUrl = new URL("/api/v1/auth/github/callback", `http://localhost:${env.port}`);
      mockCallbackUrl.searchParams.set("code", `mock_github_code_${accountParam}`);
      mockCallbackUrl.searchParams.set("state", state);
      response.redirect(mockCallbackUrl.toString());
      return;
    }

    response.type("html").send(`<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Đăng nhập GitHub Sandbox (Localhost Test)</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0d1117; color: #c9d1d9; display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 20px; }
    .card { background: #161b22; width: 100%; max-width: 420px; border-radius: 16px; border: 1px solid #30363d; padding: 32px 28px; box-shadow: 0 15px 35px rgba(0,0,0,0.5); text-align: center; }
    .logo { width: 48px; height: 48px; fill: #f0f6fc; margin: 0 auto 16px; }
    h1 { font-size: 20px; font-weight: 700; color: #f0f6fc; margin-bottom: 8px; }
    p { font-size: 13px; color: #8b949e; margin-bottom: 24px; line-height: 1.5; }
    form { text-align: left; }
    label { display: block; font-size: 13px; font-weight: 600; color: #c9d1d9; margin-bottom: 8px; }
    input[type="text"] { width: 100%; padding: 12px 14px; border-radius: 8px; border: 1px solid #30363d; background: #0d1117; color: #f0f6fc; font-size: 14px; margin-bottom: 16px; outline: none; }
    input[type="text"]:focus { border-color: #58a6ff; box-shadow: 0 0 0 3px rgba(88,166,255,0.15); }
    .btn { width: 100%; background: #238636; color: white; border: none; padding: 12px; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; transition: background 0.2s; }
    .btn:hover { background: #2ea043; }
    .presets { margin-top: 20px; border-top: 1px solid #21262d; padding-top: 16px; text-align: left; }
    .presets-title { font-size: 12px; color: #8b949e; font-weight: 600; margin-bottom: 10px; }
    .preset-btns { display: flex; flex-wrap: wrap; gap: 8px; }
    .preset-btn { background: #21262d; border: 1px solid #30363d; color: #c9d1d9; padding: 8px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; text-decoration: none; display: inline-block; }
    .preset-btn:hover { background: #30363d; border-color: #8b949e; color: #fff; }
  </style>
</head>
<body>
  <div class="card">
    <svg class="logo" viewBox="0 0 24 24"><path d="M12 .7a11.5 11.5 0 0 0-3.64 22.41c.58.11.79-.25.79-.56v-2.23c-3.22.7-3.9-1.37-3.9-1.37-.52-1.34-1.28-1.7-1.28-1.7-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.2 1.77 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.57-.3-5.27-1.29-5.27-5.69 0-1.26.45-2.29 1.19-3.1-.12-.3-.52-1.47.11-3.06 0 0 .97-.31 3.17 1.18a10.9 10.9 0 0 1 5.78 0c2.2-1.5 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.06.74.81 1.19 1.84 1.19 3.1 0 4.41-2.71 5.39-5.29 5.68.42.36.79 1.07.79 2.16v3.2c0 .31.21.68.8.56A11.5 11.5 0 0 0 12 .7Z" /></svg>
    <h1>Đăng nhập GitHub (Localhost Test)</h1>
    <p>Nhập tên hoặc email tài khoản bất kỳ để kiểm thử đăng nhập trên Localhost mà không bị lưu cố định:</p>
    <form method="get" action="/api/v1/auth/github">
      <label for="account-input">Email hoặc Username GitHub:</label>
      <input type="text" id="account-input" name="account" placeholder="Ví dụ: dat.ma@example.com hoặc user2" required autofocus />
      <button type="submit" class="btn">Tiếp tục đăng nhập với tài khoản này</button>
    </form>
    <div class="presets">
      <div class="presets-title">Hoặc chọn nhanh tài khoản mẫu:</div>
      <div class="preset-btns">
        <a href="/api/v1/auth/github?account=maquocdat" class="preset-btn">👤 Ma Quoc Dat</a>
        <a href="/api/v1/auth/github?account=student1" class="preset-btn">👤 Học viên 1</a>
        <a href="/api/v1/auth/github?account=student2" class="preset-btn">👤 Học viên 2</a>
        <a href="/api/v1/auth/github?account=instructor" class="preset-btn">👨‍🏫 Giảng viên</a>
      </div>
    </div>
  </div>
</body>
</html>`);
    return;
  }

  const authorizationUrl = new URL("https://github.com/login/oauth/authorize");
  authorizationUrl.searchParams.set("client_id", env.githubClientId);
  authorizationUrl.searchParams.set("redirect_uri", env.githubCallbackUrl);
  authorizationUrl.searchParams.set("scope", "read:user user:email");
  authorizationUrl.searchParams.set("state", state);
  authorizationUrl.searchParams.set("prompt", "select_account");
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
