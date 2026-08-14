import jwt, { type SignOptions } from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { env } from "../../config/env.js";
import type { AuthTokenPayload } from "./auth.types.js";

const ROLES = ["STUDENT", "INSTRUCTOR", "ADMIN"] as const;
export const ACCESS_TOKEN_EXPIRES_IN_SECONDS = 15 * 60;
export const REFRESH_TOKEN_EXPIRES_IN_SECONDS = 7 * 24 * 60 * 60;

export function createAccessToken(payload: AuthTokenPayload): string {
  const options: SignOptions = {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN_SECONDS,
    subject: payload.userId
  };

  return jwt.sign(payload, env.jwtAccessSecret, options);
}

export function verifyAccessToken(token: string): AuthTokenPayload {
  const payload = jwt.verify(token, env.jwtAccessSecret);

  if (
    typeof payload === "string" ||
    typeof payload.userId !== "string" ||
    !ROLES.some((role) => role === payload.role) ||
    payload.tokenType !== undefined
  ) {
    throw new Error("Invalid access token payload");
  }

  return {
    userId: payload.userId,
    role: payload.role as AuthTokenPayload["role"],
    ...(typeof payload.sessionId === "string" ? { sessionId: payload.sessionId } : {})
  };
}

export function createRefreshToken(payload: AuthTokenPayload): string {
  const options: SignOptions = {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN_SECONDS,
    subject: payload.userId,
    jwtid: randomUUID()
  };

  return jwt.sign({ ...payload, tokenType: "refresh" }, env.jwtRefreshSecret, options);
}

export function verifyRefreshToken(token: string): AuthTokenPayload {
  const payload = jwt.verify(token, env.jwtRefreshSecret);

  if (
    typeof payload === "string" ||
    typeof payload.userId !== "string" ||
    !ROLES.some((role) => role === payload.role) ||
    payload.tokenType !== "refresh" ||
    (payload.sessionId !== undefined && typeof payload.sessionId !== "string")
  ) {
    throw new Error("Invalid refresh token payload");
  }

  return {
    userId: payload.userId,
    role: payload.role as AuthTokenPayload["role"],
    ...(typeof payload.sessionId === "string" ? { sessionId: payload.sessionId } : {})
  };
}
