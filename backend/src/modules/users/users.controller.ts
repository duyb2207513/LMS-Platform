import type { Request, Response } from "express";
import { sendSuccess } from "../../common/utils/response.js";
import { getProfile } from "./users.service.js";

export async function getMyProfileController(
  request: Request,
  response: Response
): Promise<void> {
  const profile = await getProfile(request.auth.userId);

  sendSuccess(response, 200, "Profile retrieved successfully", profile);
}
