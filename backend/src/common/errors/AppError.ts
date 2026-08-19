export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errors?: Record<string, string> | any;
  public readonly details?: Record<string, string> | any;

  constructor(statusCode: number, message: string, errors?: Record<string, string> | any) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.errors = errors;
    this.details = errors;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
