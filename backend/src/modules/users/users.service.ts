import { AppError } from "../../common/errors/AppError.js";
import { prisma } from "../../config/database.js";

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
