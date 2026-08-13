import { prisma } from "../../infrastructure/database/index.js";
import type { RefreshToken } from "@prisma/client";

interface CreateRefreshTokenData {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  userAgent?: string | null;
  ipAddress?: string | null;
}

export const createRefreshToken = async (data: CreateRefreshTokenData): Promise<RefreshToken> => {
  return prisma.refreshToken.create({
    data: {
      userId: data.userId,
      tokenHash: data.tokenHash,
      expiresAt: data.expiresAt,
      userAgent: data.userAgent ?? null,
      ipAddress: data.ipAddress ?? null,
    },
  });
};

export const findActiveRefreshTokenByHash = async (
  tokenHash: string,
): Promise<RefreshToken | null> => {
  return prisma.refreshToken.findUnique({
    where: { tokenHash },
  });
};

export const revokeRefreshToken = async (id: string): Promise<RefreshToken> => {
  return prisma.refreshToken.update({
    where: { id },
    data: { revokedAt: new Date() },
  });
};

export const revokeAllUserRefreshTokens = async (userId: string): Promise<number> => {
  const result = await prisma.refreshToken.updateMany({
    where: {
      userId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
  return result.count;
};

export const deleteExpiredRefreshTokens = async (): Promise<number> => {
  const result = await prisma.refreshToken.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });
  return result.count;
};
