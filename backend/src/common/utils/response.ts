import type { Response } from "express";

export function sendSuccess<T>(
  response: Response,
  statusCode = 200,
  message = "Success",
  data?: T,
  meta?: any
): void {
  response.status(statusCode).json({
    success: true,
    message,
    ...(data !== undefined ? { data } : {}),
    ...(meta !== undefined ? { meta } : {})
  });
}
