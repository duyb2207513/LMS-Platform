import bcrypt from "bcryptjs";
import { AppError } from "../../common/errors/AppError.js";
import { prisma } from "../../config/database.js";
import type { ChangePasswordInput, UpdateProfileInput } from "./users.types.js";

const PASSWORD_SALT_ROUNDS = 12;

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      email: true,
      avatarUrl: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  return user;
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  try {
    return await prisma.user.update({
      where: { id: userId },
      data: input,
      select: {
        id: true,
        fullName: true,
        email: true,
        avatarUrl: true,
        role: true,
        status: true
      }
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2025"
    ) {
      throw new AppError(404, "User not found");
    }

    throw error;
  }
}

export async function changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true }
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  const currentPasswordMatches = await bcrypt.compare(
    input.currentPassword,
    user.passwordHash
  );

  if (!currentPasswordMatches) {
    throw new AppError(400, "Current password is incorrect");
  }

  const newPasswordMatchesCurrent = await bcrypt.compare(
    input.newPassword,
    user.passwordHash
  );

  if (newPasswordMatchesCurrent) {
    throw new AppError(400, "New password must be different from current password");
  }

  const passwordHash = await bcrypt.hash(input.newPassword, PASSWORD_SALT_ROUNDS);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash }
  });
}
