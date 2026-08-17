import { createHash, randomBytes, randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { AppError } from "../../common/errors/AppError.js";
import { writeAuditLog, type AuditContext } from "../../common/utils/audit.js";
import { prisma } from "../../config/database.js";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
import { sendEmailChangeEmail, sendPasswordResetEmail, sendVerificationEmail } from "../../config/mail.js";
import { createAccessToken, createRefreshToken, REFRESH_TOKEN_EXPIRES_IN_SECONDS, verifyRefreshToken } from "./auth.tokens.js";
import type { ChangeEmailInput, GoogleLoginInput, LoginInput, RegisterInput, ResetPasswordInput } from "./auth.types.js";
import { safelyRunCommunication, sendWelcomeCommunication } from "../../services/communication/communication.service.js";

const PASSWORD_SALT_ROUNDS = 12;
const DUMMY_PASSWORD_HASH = bcrypt.hashSync("invalid-password", PASSWORD_SALT_ROUNDS);
const googleClient = new OAuth2Client();
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
const opaqueToken = () => randomBytes(32).toString("hex");
const publicUserSelect = { id: true, fullName: true, email: true, avatarUrl: true, role: true, status: true, emailVerifiedAt: true, createdAt: true, updatedAt: true } as const;

type ClientContext = { request?: AuditContext; ipAddress?: string; userAgent?: string; actionBaseUrl?: string };
const contextFrom = (context?: ClientContext) => ({ ipAddress: context?.ipAddress, userAgent: context?.userAgent?.slice(0, 500) });

function isUniqueConstraintError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

async function createOneTimeToken(userId: string, type: "VERIFY_EMAIL" | "RESET_PASSWORD" | "CHANGE_EMAIL" | "MOBILE_OAUTH", expiresMinutes: number, targetEmail?: string) {
  const token = opaqueToken();
  await prisma.$transaction([
    prisma.authToken.updateMany({ where: { userId, type, usedAt: null }, data: { usedAt: new Date() } }),
    prisma.authToken.create({ data: { userId, type, tokenHash: hashToken(token), targetEmail, expiresAt: new Date(Date.now() + expiresMinutes * 60_000) } })
  ]);
  return token;
}

async function safelySend(job: () => Promise<unknown>) {
  try { await job(); } catch (error) { logger.error({ err: error }, "Could not send authentication email"); }
}

async function createSession(user: { id: string; role: "STUDENT" | "INSTRUCTOR" | "ADMIN" }, context?: ClientContext) {
  const sessionId = randomUUID();
  const payload = { userId: user.id, role: user.role, sessionId };
  const refreshToken = createRefreshToken(payload);
  await prisma.authSession.create({
    data: {
      id: sessionId,
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN_SECONDS * 1000),
      ...contextFrom(context)
    }
  });
  return { accessToken: createAccessToken(payload), refreshToken, sessionId };
}

export async function register(input: RegisterInput, context?: ClientContext) {
  if (await prisma.user.findUnique({ where: { email: input.email }, select: { id: true } })) throw new AppError(409, "Email already exists");
  const passwordHash = await bcrypt.hash(input.password, PASSWORD_SALT_ROUNDS);
  try {
    const user = await prisma.user.create({ data: { fullName: input.fullName, email: input.email, passwordHash, role: "STUDENT" }, select: publicUserSelect });
    const token = await createOneTimeToken(user.id, "VERIFY_EMAIL", 24 * 60);
    await safelySend(() => sendVerificationEmail(user.email, token, context?.actionBaseUrl));
    await safelyRunCommunication(() => sendWelcomeCommunication(user));
    await writeAuditLog({ actorUserId: user.id, action: "AUTH_REGISTER", entityType: "USER", entityId: user.id, request: context?.request });
    return user;
  } catch (error) {
    if (isUniqueConstraintError(error)) throw new AppError(409, "Email already exists");
    throw error;
  }
}

export async function login(input: LoginInput, context?: ClientContext) {
  const user = await prisma.user.findUnique({ where: { email: input.email }, select: { id: true, fullName: true, email: true, passwordHash: true, avatarUrl: true, role: true, status: true, emailVerifiedAt: true, failedLoginAttempts: true, lockedUntil: true } });
  const passwordMatches = await bcrypt.compare(input.password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);
  if (user?.lockedUntil && user.lockedUntil > new Date()) throw new AppError(423, "Account is temporarily locked. Please try again later");
  if (!user || !passwordMatches) {
    if (user) {
      const attempts = user.failedLoginAttempts + 1;
      await prisma.user.update({ where: { id: user.id }, data: { failedLoginAttempts: attempts >= env.loginMaxAttempts ? 0 : attempts, lockedUntil: attempts >= env.loginMaxAttempts ? new Date(Date.now() + env.loginLockMinutes * 60_000) : null } });
      if (attempts >= env.loginMaxAttempts) await writeAuditLog({ actorUserId: user.id, action: "AUTH_ACCOUNT_TEMPORARILY_LOCKED", entityType: "USER", entityId: user.id, request: context?.request });
    }
    throw new AppError(401, "Invalid email or password");
  }
  if (user.status === "BLOCKED") throw new AppError(403, "Account is blocked");
  if (env.requireEmailVerification && !user.emailVerifiedAt) throw new AppError(403, "Email verification is required");
  await prisma.user.update({ where: { id: user.id }, data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() } });
  const session = await createSession(user, context);
  await writeAuditLog({ actorUserId: user.id, action: "AUTH_LOGIN", entityType: "AUTH_SESSION", entityId: session.sessionId, request: context?.request });
  return { ...session, user: { id: user.id, fullName: user.fullName, email: user.email, avatarUrl: user.avatarUrl, role: user.role, status: user.status, emailVerifiedAt: user.emailVerifiedAt } };
}

export async function googleLogin(input: GoogleLoginInput, context?: ClientContext) {
  if (!env.googleClientId) throw new AppError(503, "Google login is not configured");
  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: input.idToken, audience: env.googleClientId });
    payload = ticket.getPayload();
  } catch { throw new AppError(401, "Invalid Google identity token"); }
  if (!payload?.sub || !payload.email || !payload.email_verified) throw new AppError(401, "Google account email is not verified");
  const email = payload.email.toLowerCase();
  let user = await prisma.user.findFirst({ where: { OR: [{ googleId: payload.sub }, { email }] }, select: publicUserSelect });
  const isNewGoogleUser = !user;
  if (user) {
    user = await prisma.user.update({ where: { id: user.id }, data: { googleId: payload.sub, emailVerifiedAt: user.emailVerifiedAt || new Date(), lastLoginAt: new Date(), failedLoginAttempts: 0, lockedUntil: null }, select: publicUserSelect });
  } else {
    user = await prisma.user.create({ data: { fullName: payload.name?.trim().slice(0, 100) || email.split("@")[0], email, googleId: payload.sub, emailVerifiedAt: new Date(), avatarUrl: payload.picture }, select: publicUserSelect });
  }
  if (user.status === "BLOCKED") throw new AppError(403, "Account is blocked");
  if (isNewGoogleUser) await safelyRunCommunication(() => sendWelcomeCommunication(user));
  const session = await createSession(user, context);
  await writeAuditLog({ actorUserId: user.id, action: "AUTH_GOOGLE_LOGIN", entityType: "AUTH_SESSION", entityId: session.sessionId, request: context?.request });
  return { ...session, user };
}

type GitHubTokenResponse = { access_token?: string; error?: string };
type GitHubProfile = { id?: number; login?: string; name?: string | null; avatar_url?: string | null };
type GitHubEmail = { email?: string; primary?: boolean; verified?: boolean };

async function fetchGitHubJson<T>(url: string, accessToken: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "LMS-Platform",
      "X-GitHub-Api-Version": "2022-11-28"
    },
    signal: AbortSignal.timeout(10_000)
  });
  if (!response.ok) throw new AppError(502, "GitHub authentication is temporarily unavailable");
  return response.json() as Promise<T>;
}

export async function githubLogin(code: string, context?: ClientContext) {
  if (!env.githubClientId || !env.githubClientSecret) throw new AppError(503, "GitHub login is not configured");

  let tokenData: GitHubTokenResponse;
  try {
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: env.githubClientId,
        client_secret: env.githubClientSecret,
        code,
        redirect_uri: env.githubCallbackUrl
      }),
      signal: AbortSignal.timeout(10_000)
    });
    if (!tokenResponse.ok) throw new Error("GitHub token exchange failed");
    tokenData = await tokenResponse.json() as GitHubTokenResponse;
  } catch (error) {
    logger.warn({ err: error }, "GitHub OAuth token exchange failed");
    throw new AppError(502, "GitHub authentication is temporarily unavailable");
  }
  if (!tokenData.access_token || tokenData.error) throw new AppError(401, "GitHub authorization code is invalid or expired");

  let profile: GitHubProfile;
  let emails: GitHubEmail[];
  try {
    [profile, emails] = await Promise.all([
      fetchGitHubJson<GitHubProfile>("https://api.github.com/user", tokenData.access_token),
      fetchGitHubJson<GitHubEmail[]>("https://api.github.com/user/emails", tokenData.access_token)
    ]);
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.warn({ err: error }, "Could not load GitHub profile");
    throw new AppError(502, "GitHub authentication is temporarily unavailable");
  }

  if (typeof profile.id !== "number" || !profile.login) throw new AppError(401, "GitHub profile is invalid");
  const verifiedEmail = emails.find(item => item.primary && item.verified && item.email)?.email
    ?? emails.find(item => item.verified && item.email)?.email;
  if (!verifiedEmail) throw new AppError(403, "A verified GitHub email is required");

  const githubId = String(profile.id);
  const email = verifiedEmail.toLowerCase();
  const existing = await prisma.user.findFirst({
    where: { OR: [{ githubId }, { email }] },
    select: { id: true, githubId: true, status: true }
  });
  if (existing?.status === "BLOCKED") throw new AppError(403, "Account is blocked");
  if (existing?.githubId && existing.githubId !== githubId) throw new AppError(409, "Email is already linked to another GitHub account");

  let user;
  try {
    user = existing
      ? await prisma.user.update({
          where: { id: existing.id },
          data: {
            githubId,
            emailVerifiedAt: new Date(),
            lastLoginAt: new Date(),
            failedLoginAttempts: 0,
            lockedUntil: null
          },
          select: publicUserSelect
        })
      : await prisma.user.create({
          data: {
            fullName: (profile.name?.trim() || profile.login).slice(0, 100),
            email,
            githubId,
            avatarUrl: profile.avatar_url || null,
            emailVerifiedAt: new Date(),
            role: "STUDENT"
          },
          select: publicUserSelect
        });
  } catch (error) {
    if (isUniqueConstraintError(error)) throw new AppError(409, "GitHub account or email is already linked");
    throw error;
  }

  const session = await createSession(user, context);
  if (!existing) await safelyRunCommunication(() => sendWelcomeCommunication(user));
  await writeAuditLog({ actorUserId: user.id, action: "AUTH_GITHUB_LOGIN", entityType: "AUTH_SESSION", entityId: session.sessionId, request: context?.request });
  return { ...session, user };
}

export function createMobileOAuthHandoff(userId: string) {
  return createOneTimeToken(userId, "MOBILE_OAUTH", 5);
}

export async function exchangeMobileOAuthCode(code: string, context?: ClientContext) {
  const record = await prisma.authToken.findUnique({ where: { tokenHash: hashToken(code) } });
  if (!record || record.type !== "MOBILE_OAUTH" || record.usedAt || record.expiresAt <= new Date()) {
    throw new AppError(401, "OAuth exchange code is invalid or expired");
  }
  const user = await prisma.user.findUnique({ where: { id: record.userId }, select: publicUserSelect });
  if (!user || user.status !== "ACTIVE") throw new AppError(401, "OAuth exchange code is invalid or expired");
  const consumed = await prisma.authToken.updateMany({ where: { id: record.id, usedAt: null }, data: { usedAt: new Date() } });
  if (!consumed.count) throw new AppError(401, "OAuth exchange code is invalid or expired");
  const session = await createSession(user, context);
  await writeAuditLog({ actorUserId: user.id, action: "AUTH_MOBILE_OAUTH_EXCHANGE", entityType: "AUTH_SESSION", entityId: session.sessionId, request: context?.request });
  return { ...session, user };
}

export async function refreshSession(refreshToken: string, context?: ClientContext) {
  let payload;
  try { payload = verifyRefreshToken(refreshToken); } catch { throw new AppError(401, "Invalid or expired refresh token"); }
  if (!payload.sessionId) throw new AppError(401, "Invalid or expired refresh token");
  const session = await prisma.authSession.findUnique({ where: { id: payload.sessionId }, include: { user: { select: { id: true, role: true, status: true } } } });
  if (!session || session.userId !== payload.userId || session.tokenHash !== hashToken(refreshToken) || session.revokedAt || session.expiresAt <= new Date() || session.user.status !== "ACTIVE") throw new AppError(401, "Invalid or expired refresh token");
  const nextPayload = { userId: session.user.id, role: session.user.role, sessionId: session.id };
  const nextRefreshToken = createRefreshToken(nextPayload);
  await prisma.authSession.update({ where: { id: session.id }, data: { tokenHash: hashToken(nextRefreshToken), lastUsedAt: new Date(), ...contextFrom(context) } });
  return { accessToken: createAccessToken(nextPayload), refreshToken: nextRefreshToken };
}

export async function revokeRefreshToken(refreshToken?: string) {
  if (!refreshToken) return;
  try {
    const payload = verifyRefreshToken(refreshToken);
    await prisma.authSession.updateMany({ where: { id: payload.sessionId, userId: payload.userId, tokenHash: hashToken(refreshToken), revokedAt: null }, data: { revokedAt: new Date() } });
  } catch { /* Invalid cookie is cleared by the controller. */ }
}

export async function requestEmailVerification(userId: string, actionBaseUrl?: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, emailVerifiedAt: true } });
  if (!user || user.emailVerifiedAt) return;
  const token = await createOneTimeToken(userId, "VERIFY_EMAIL", 24 * 60);
  await safelySend(() => sendVerificationEmail(user.email, token, actionBaseUrl));
}

export async function requestEmailVerificationByEmail(email: string, actionBaseUrl?: string) {
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, emailVerifiedAt: true } });
  if (!user || user.emailVerifiedAt) return;
  await requestEmailVerification(user.id, actionBaseUrl);
}

export async function verifyEmail(token: string) {
  const record = await prisma.authToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!record || record.type !== "VERIFY_EMAIL" || record.usedAt || record.expiresAt <= new Date()) throw new AppError(400, "Verification token is invalid or expired");
  await prisma.$transaction([
    prisma.authToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    prisma.user.update({ where: { id: record.userId }, data: { emailVerifiedAt: new Date() } })
  ]);
  await writeAuditLog({ actorUserId: record.userId, action: "AUTH_EMAIL_VERIFIED", entityType: "USER", entityId: record.userId });
}

export async function forgotPassword(email: string, actionBaseUrl?: string) {
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true } });
  if (!user) return;
  const token = await createOneTimeToken(user.id, "RESET_PASSWORD", 30);
  await safelySend(() => sendPasswordResetEmail(user.email, token, actionBaseUrl));
}

export async function resetPassword(input: ResetPasswordInput) {
  const record = await prisma.authToken.findUnique({ where: { tokenHash: hashToken(input.token) } });
  if (!record || record.type !== "RESET_PASSWORD" || record.usedAt || record.expiresAt <= new Date()) throw new AppError(400, "Password reset token is invalid or expired");
  const passwordHash = await bcrypt.hash(input.newPassword, PASSWORD_SALT_ROUNDS);
  await prisma.$transaction([
    prisma.authToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash, failedLoginAttempts: 0, lockedUntil: null } }),
    prisma.authSession.updateMany({ where: { userId: record.userId, revokedAt: null }, data: { revokedAt: new Date() } })
  ]);
  await writeAuditLog({ actorUserId: record.userId, action: "AUTH_PASSWORD_RESET", entityType: "USER", entityId: record.userId });
}

export async function requestEmailChange(userId: string, input: ChangeEmailInput, actionBaseUrl?: string) {
  const [user, existing] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { email: true, passwordHash: true } }),
    prisma.user.findUnique({ where: { email: input.newEmail }, select: { id: true } })
  ]);
  if (!user) throw new AppError(404, "User not found");
  if (existing || input.newEmail === user.email) throw new AppError(409, "Email already exists");
  if (user.passwordHash && (!input.currentPassword || !(await bcrypt.compare(input.currentPassword, user.passwordHash)))) throw new AppError(401, "Current password is incorrect");
  const token = await createOneTimeToken(userId, "CHANGE_EMAIL", 30, input.newEmail);
  await safelySend(() => sendEmailChangeEmail(input.newEmail, token, actionBaseUrl));
}

export async function confirmEmailChange(token: string) {
  const record = await prisma.authToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!record || record.type !== "CHANGE_EMAIL" || !record.targetEmail || record.usedAt || record.expiresAt <= new Date()) throw new AppError(400, "Email change token is invalid or expired");
  try {
    await prisma.$transaction([
      prisma.authToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
      prisma.user.update({ where: { id: record.userId }, data: { email: record.targetEmail, emailVerifiedAt: new Date() } }),
      prisma.authSession.updateMany({ where: { userId: record.userId, revokedAt: null }, data: { revokedAt: new Date() } })
    ]);
  } catch (error) { if (isUniqueConstraintError(error)) throw new AppError(409, "Email already exists"); throw error; }
  await writeAuditLog({ actorUserId: record.userId, action: "AUTH_EMAIL_CHANGED", entityType: "USER", entityId: record.userId, metadata: { email: record.targetEmail } });
}

export async function listSessions(userId: string, currentSessionId?: string) {
  const sessions = await prisma.authSession.findMany({ where: { userId, revokedAt: null, expiresAt: { gt: new Date() } }, orderBy: { lastUsedAt: "desc" }, select: { id: true, ipAddress: true, userAgent: true, lastUsedAt: true, expiresAt: true, createdAt: true } });
  return sessions.map(session => ({ ...session, isCurrent: session.id === currentSessionId }));
}

export async function revokeSession(userId: string, sessionId: string) {
  const result = await prisma.authSession.updateMany({ where: { id: sessionId, userId, revokedAt: null }, data: { revokedAt: new Date() } });
  if (!result.count) throw new AppError(404, "Session not found");
}

export async function revokeOtherSessions(userId: string, currentSessionId?: string) {
  await prisma.authSession.updateMany({ where: { userId, revokedAt: null, ...(currentSessionId ? { id: { not: currentSessionId } } : {}) }, data: { revokedAt: new Date() } });
}
