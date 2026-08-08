import type { RequestHandler } from "express";
import { verifyAccessToken } from "../../modules/auth/auth.tokens.js";
import { AppError } from "../errors/AppError.js";

export const authenticate: RequestHandler = (request, _response, next) => {
  const authorization = request.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    throw new AppError(401, "Authentication required");
  }

  const token = authorization.slice("Bearer ".length).trim();

  if (!token) {
    throw new AppError(401, "Authentication required");
  }

  try {
    request.auth = verifyAccessToken(token);
    next();
  } catch {
    throw new AppError(401, "Invalid or expired access token");
  }
};
