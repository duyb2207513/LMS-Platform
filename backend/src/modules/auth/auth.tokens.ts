import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../../config/env.js";
import type { AuthTokenPayload } from "./auth.types.js";

export const ACCESS_TOKEN_EXPIRES_IN_SECONDS = 15 * 60;
export const REFRESH_TOKEN_EXPIRES_IN_SECONDS = 7 * 24 * 60 * 60;

export function createAccessToken(payload: AuthTokenPayload): string {
  const options: SignOptions = {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN_SECONDS,
    subject: payload.userId
  };

  return jwt.sign(payload, env.jwtAccessSecret, options);
}

export function createRefreshToken(payload: AuthTokenPayload): string {
  const options: SignOptions = {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN_SECONDS,
    subject: payload.userId
  };

  return jwt.sign({ ...payload, tokenType: "refresh" }, env.jwtRefreshSecret, options);
}
