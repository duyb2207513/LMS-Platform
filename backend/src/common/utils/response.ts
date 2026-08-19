import type { Response } from "express";

export function sendSuccess<T>(
  response: Response,
<<<<<<< HEAD
  statusCode: number,
  message: string,
  data: T,
  meta?: unknown
=======
  statusCode = 200,
  message = "Success",
  data?: T,
  meta?: any
>>>>>>> df17fd1ccc89144d240c76d09f8d290190e5b902
): void {
  response.status(statusCode).json({
    success: true,
    message,
<<<<<<< HEAD
    data,
    ...(meta === undefined ? {} : { meta })
=======
    ...(data !== undefined ? { data } : {}),
    ...(meta !== undefined ? { meta } : {})
>>>>>>> df17fd1ccc89144d240c76d09f8d290190e5b902
  });
}
