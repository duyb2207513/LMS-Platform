import type { Request, Response } from "express";
import { sendSuccess } from "../../common/utils/response.js";
import { changePassword, getProfile, updateProfile } from "./users.service.js";
import type { ChangePasswordInput, UpdateProfileInput } from "./users.types.js";

export async function getMyProfileController(
  request: Request,
  response: Response
): Promise<void> {
  const profile = await getProfile(request.auth.userId);

  sendSuccess(response, 200, "Profile retrieved successfully", profile);
}

export async function updateMyProfileController(
  request: Request,
  response: Response
): Promise<void> {
  const profile = await updateProfile(request.auth.userId, request.body as UpdateProfileInput);

  sendSuccess(response, 200, "Profile updated successfully", profile);
}

export async function changeMyPasswordController(
  request: Request,
  response: Response
): Promise<void> {
  await changePassword(request.auth.userId, request.body as ChangePasswordInput);

  sendSuccess(response, 200, "Password changed successfully", null);
}
