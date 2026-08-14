import * as userService from "../users/index.js";
import * as authModule from "./index.js";
import { createPersonalOrganization } from "../organizations/organization.service.js";
import { prisma } from "../../infrastructure/database/prisma.js";
import { hashPassword } from "./password.service.js";
import type { RegisterInput, LoginInput } from "./auth.schemas.js";
import type { PublicUser } from "../users/index.js";

export interface AuthResult {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshResult {
  accessToken: string;
  refreshToken: string;
}

interface AuthMetadata {
  userAgent?: string | null;
  ipAddress?: string | null;
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super("Invalid email or password");
    this.name = "InvalidCredentialsError";
  }
}

export class InvalidRefreshTokenError extends Error {
  constructor() {
    super("Invalid refresh token");
    this.name = "InvalidRefreshTokenError";
  }
}

const toPublicUser = (user: {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
}): PublicUser => ({
  id: user.id,
  email: user.email,
  name: user.name,
  emailVerified: user.emailVerified,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  lastLoginAt: user.lastLoginAt,
});

const issueTokens = async (user: PublicUser, metadata: AuthMetadata): Promise<AuthResult> => {
  const accessToken = authModule.generateAccessToken(user.id, user.email);
  const refreshTokenPair = authModule.generateRefreshToken();

  await authModule.createRefreshToken({
    userId: user.id,
    tokenHash: refreshTokenPair.hash,
    expiresAt: authModule.getRefreshTokenExpiryDate(),
    userAgent: metadata.userAgent,
    ipAddress: metadata.ipAddress,
  });

  return {
    user,
    accessToken,
    refreshToken: refreshTokenPair.token,
  };
};

export const registerUser = async (
  input: RegisterInput,
  metadata: AuthMetadata = {},
): Promise<AuthResult> => {
  const existingUser = await prisma.user.findUnique({ where: { email: input.email } });
  if (existingUser) {
    throw new userService.UserAlreadyExistsError(input.email);
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        email: input.email,
        passwordHash,
        name: input.name,
      },
    });

    await createPersonalOrganization(createdUser.id, createdUser.name, tx);

    return createdUser;
  });

  return issueTokens(toPublicUser(user), metadata);
};

export const loginUser = async (
  input: LoginInput,
  metadata: AuthMetadata = {},
): Promise<AuthResult> => {
  const user = await userService.verifyUserCredentials(input.email, input.password);
  if (!user) {
    throw new InvalidCredentialsError();
  }

  return issueTokens(user, metadata);
};

export const refreshUserSession = async (
  presentedRefreshToken: string,
  metadata: AuthMetadata = {},
): Promise<RefreshResult> => {
  const tokenHash = authModule.hashRefreshToken(presentedRefreshToken);
  const storedToken = await authModule.findActiveRefreshTokenByHash(tokenHash);

  if (!storedToken) {
    throw new InvalidRefreshTokenError();
  }

  if (storedToken.revokedAt !== null) {
    throw new InvalidRefreshTokenError();
  }

  if (storedToken.expiresAt.getTime() <= Date.now()) {
    throw new InvalidRefreshTokenError();
  }

  const user = await userService.getUserById(storedToken.userId);
  if (!user) {
    throw new InvalidRefreshTokenError();
  }

  await authModule.revokeRefreshToken(storedToken.id);

  const newAccessToken = authModule.generateAccessToken(user.id, user.email);
  const newRefreshTokenPair = authModule.generateRefreshToken();

  await authModule.createRefreshToken({
    userId: user.id,
    tokenHash: newRefreshTokenPair.hash,
    expiresAt: authModule.getRefreshTokenExpiryDate(),
    userAgent: metadata.userAgent,
    ipAddress: metadata.ipAddress,
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshTokenPair.token,
  };
};

export const logoutSession = async (presentedRefreshToken: string | null): Promise<void> => {
  if (!presentedRefreshToken) {
    return;
  }

  const tokenHash = authModule.hashRefreshToken(presentedRefreshToken);
  const storedToken = await authModule.findActiveRefreshTokenByHash(tokenHash);

  if (!storedToken || storedToken.revokedAt !== null) {
    return;
  }

  await authModule.revokeRefreshToken(storedToken.id);
};
