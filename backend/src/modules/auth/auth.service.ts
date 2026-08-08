import bcrypt from "bcryptjs";
import { AppError } from "../../common/errors/AppError.js";
import { prisma } from "../../config/database.js";
import {
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken
} from "./auth.tokens.js";
import type { LoginInput, RegisterInput } from "./auth.types.js";

const PASSWORD_SALT_ROUNDS = 12;
const DUMMY_PASSWORD_HASH = bcrypt.hashSync("invalid-password", PASSWORD_SALT_ROUNDS);

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
        passwordHash,
        role: input.role
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

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: {
      id: true,
      fullName: true,
      email: true,
      passwordHash: true,
      avatarUrl: true,
      role: true,
      status: true
    }
  });

  const passwordMatches = await bcrypt.compare(
    input.password,
    user?.passwordHash ?? DUMMY_PASSWORD_HASH
  );

  if (!user || !passwordMatches) {
    throw new AppError(401, "Invalid email or password");
  }

  if (user.status === "BLOCKED") {
    throw new AppError(403, "Account is blocked");
  }

  const tokenPayload = { userId: user.id, role: user.role };

  return {
    accessToken: createAccessToken(tokenPayload),
    refreshToken: createRefreshToken(tokenPayload),
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      avatarUrl: user.avatarUrl,
      role: user.role,
      status: user.status
    }
  };
}

export async function refreshAccessToken(refreshToken: string): Promise<string> {
  let tokenPayload;

  try {
    tokenPayload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError(401, "Invalid or expired refresh token");
  }

  const user = await prisma.user.findUnique({
    where: { id: tokenPayload.userId },
    select: { id: true, role: true, status: true }
  });

  if (!user || user.status !== "ACTIVE") {
    throw new AppError(401, "Invalid or expired refresh token");
  }

  return createAccessToken({ userId: user.id, role: user.role });
}
