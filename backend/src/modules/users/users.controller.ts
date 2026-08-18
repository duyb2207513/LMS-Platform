import { unlink } from "node:fs/promises";
import path from "node:path";
import type { Request, Response } from "express";
import { AppError } from "../../common/errors/AppError.js";
import { sendSuccess } from "../../common/utils/response.js";
import { AVATAR_DIRECTORY, isValidStoredImage } from "../../config/upload.js";
import {
  deleteFromCloudinary,
  isCloudinaryConfigured,
  uploadFileToCloudinary
} from "../../config/cloudinary.js";
import { changePassword, getProfile, setAvatar, updateProfile } from "./users.service.js";
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

const removeStoredAvatar = async (avatarUrl: string | null | undefined) => {
  if (!avatarUrl) return;
  if (avatarUrl.includes("cloudinary.com")) {
    await deleteFromCloudinary(avatarUrl, "image");
    return;
  }
  if (avatarUrl.includes("/uploads/avatars/")) {
    await unlink(path.join(AVATAR_DIRECTORY, path.basename(avatarUrl))).catch(() => undefined);
  }
};

export async function uploadMyAvatarController(request: Request, response: Response): Promise<void> {
  if (!request.file) throw new AppError(400, "Avatar file is required");

  if (!(await isValidStoredImage(request.file.path, request.file.mimetype))) {
    await unlink(request.file.path).catch(() => undefined);
    throw new AppError(400, "Avatar file content is invalid");
  }

  let avatarUrl: string;
  if (isCloudinaryConfigured()) {
    try {
      const cloudinaryResult = await uploadFileToCloudinary(request.file.path, {
        folder: "lms/avatars",
        resourceType: "image"
      });
      avatarUrl = cloudinaryResult.secure_url;
    } finally {
      await unlink(request.file.path).catch(() => undefined);
    }
  } else {
    avatarUrl = `${request.protocol}://${request.get("host")}/uploads/avatars/${request.file.filename}`;
  }

  try {
    const currentProfile = await getProfile(request.auth.userId);
    const profile = await setAvatar(request.auth.userId, avatarUrl);
    await removeStoredAvatar(currentProfile.avatarUrl);
    sendSuccess(response, 200, "Avatar uploaded successfully", profile);
  } catch (error) {
    if (!isCloudinaryConfigured()) {
      await unlink(request.file.path).catch(() => undefined);
    }
    throw error;
  }
}

export async function deleteMyAvatarController(request: Request, response: Response): Promise<void> {
  const currentProfile = await getProfile(request.auth.userId);
  const profile = await setAvatar(request.auth.userId, null);
  await removeStoredAvatar(currentProfile.avatarUrl);
  sendSuccess(response, 200, "Avatar removed successfully", profile);
}

export async function changeMyPasswordController(
  request: Request,
  response: Response
): Promise<void> {
  await changePassword(request.auth.userId, request.body as ChangePasswordInput);

  sendSuccess(response, 200, "Password changed successfully", null);
}
