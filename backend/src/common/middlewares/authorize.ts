import type { RequestHandler } from "express";
import { AppError } from "../errors/AppError.js";
import type { AuthTokenPayload } from "../../modules/auth/auth.types.js";

type UserRole = AuthTokenPayload["role"];

export function authorize(...allowedRoles: UserRole[]): RequestHandler {
  return (request, _response, next) => {
    if (!allowedRoles.includes(request.auth.role)) {
      throw new AppError(403, "You do not have permission to perform this action");
    }

    next();
  };
}
