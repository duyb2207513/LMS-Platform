import type { Request, Response, NextFunction, RequestHandler } from "express";
import { AppError } from "../errors/AppError.js";

export interface RequestValidationResult<T> {
  data?: T;
  errors?: Record<string, string>;
}

export function validateRequest<T>(
  validator: (body: unknown) => RequestValidationResult<T>
): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = validator(req.body);
    if (result.errors && Object.keys(result.errors).length > 0) {
      throw new AppError(400, "Validation failed", result.errors);
    }
    if (result.data !== undefined) {
      req.body = result.data;
    }
    next();
  };
}
