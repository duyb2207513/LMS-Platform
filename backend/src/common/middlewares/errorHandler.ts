import type { ErrorRequestHandler } from "express";
import { AppError } from "../errors/AppError.js";
import { logger } from "../../config/logger.js";
import { Sentry } from "../../config/monitoring.js";

export const errorHandler: ErrorRequestHandler = (error, request, response, _next) => {
  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      success: false,
      message: error.message,
      ...(error.details === undefined ? {} : { errors: error.details })
    });
    return;
  }

  logger.error({ err: error, requestId: request.id, method: request.method, path: request.originalUrl }, "Unhandled application error");
  Sentry.captureException(error, { extra: { requestId: request.id, method: request.method, path: request.originalUrl } });
  response.status(500).json({
    success: false,
    message: "Internal server error"
  });
};
