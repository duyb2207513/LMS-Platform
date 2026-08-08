import bcrypt from "bcryptjs";
import { AppError } from "../../common/errors/AppError.js";
import { prisma } from "../../config/database.js";
import type { RegisterInput } from "./auth.types.js";

const PASSWORD_SALT_ROUNDS = 12;

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

export async function register(input: RegisterInput) {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true }
  });

  if (existingUser) {
    throw new AppError(409, "Email already exists");
  }

  const passwordHash = await bcrypt.hash(input.password, PASSWORD_SALT_ROUNDS);

  try {
    return await prisma.user.create({
      data: {
        fullName: input.fullName,
        email: input.email,
        passwordHash
      },
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
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new AppError(409, "Email already exists");
    }

    throw error;
  }
}
