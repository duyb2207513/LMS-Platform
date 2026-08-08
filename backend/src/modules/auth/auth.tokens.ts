import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import type { AuthTokenPayload } from "./auth.types.js";

const ROLES = ["STUDENT", "INSTRUCTOR", "ADMIN"] as const;

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
    role: payload.role as AuthTokenPayload["role"]
  };
}
