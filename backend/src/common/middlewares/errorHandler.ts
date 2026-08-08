import type { ErrorRequestHandler } from "express";
import { AppError } from "../errors/AppError.js";

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      success: false,
      message: error.message,
      ...(error.details === undefined ? {} : { errors: error.details })
    });
    return;
  }

  console.error("Unhandled application error", error);
  response.status(500).json({
    success: false,
    message: "Internal server error"
  });
};
