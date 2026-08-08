import type { RequestHandler } from "express";
import type { RequestValidationResult } from "./validateRequest.js";

type QueryValidator<T> = (query: unknown) => RequestValidationResult<T>;

export function validateQuery<T>(validator: QueryValidator<T>): RequestHandler {
  return (request, response, next) => {
    const result = validator(request.query);

    if (!result.data) {
      response.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.errors
      });
      return;
    }

    response.locals.validatedQuery = result.data;
    next();
  };
}
