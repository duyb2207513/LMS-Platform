import type { Request, Response } from "express";
import { sendSuccess } from "../../common/utils/response.js";
import { REFRESH_TOKEN_EXPIRES_IN_SECONDS } from "./auth.tokens.js";
import { login, register } from "./auth.service.js";
import type { LoginInput, RegisterInput } from "./auth.types.js";

export async function registerController(request: Request, response: Response): Promise<void> {
  const user = await register(request.body as RegisterInput);

  sendSuccess(response, 201, "Account registered successfully", { user });
}

export async function loginController(request: Request, response: Response): Promise<void> {
  const { accessToken, refreshToken, user } = await login(request.body as LoginInput);

  response.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: REFRESH_TOKEN_EXPIRES_IN_SECONDS * 1000,
    path: "/api/v1/auth"
  });

  sendSuccess(response, 200, "Login successful", { accessToken, user });
}
