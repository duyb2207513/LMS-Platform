import type { Request, Response } from "express";
import { sendSuccess } from "../../common/utils/response.js";
import { register } from "./auth.service.js";
import type { RegisterInput } from "./auth.types.js";

export async function registerController(request: Request, response: Response): Promise<void> {
  const user = await register(request.body as RegisterInput);

  sendSuccess(response, 201, "Account registered successfully", { user });
}
