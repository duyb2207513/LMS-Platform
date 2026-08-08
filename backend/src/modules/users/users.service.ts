import { AppError } from "../../common/errors/AppError.js";
import { prisma } from "../../config/database.js";
import type { UpdateProfileInput } from "./users.types.js";

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
