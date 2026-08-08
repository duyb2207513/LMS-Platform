import type { RequestHandler } from "express";

export interface RequestValidationResult<T> {
  data?: T;
  errors?: Record<string, string>;
}

type RequestValidator<T> = (body: unknown) => RequestValidationResult<T>;

export function validateRequest<T>(validator: RequestValidator<T>): RequestHandler {
  return (request, response, next) => {
    const result = validator(request.body);

    if (!result.data) {
      response.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.errors
      });
      return;
    }

    request.body = result.data;
    next();
  };
}
