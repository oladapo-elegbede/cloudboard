import * as userService from "../users/index.js";
import * as authModule from "./index.js";
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
  const user = await userService.createUser({
    email: input.email,
    password: input.password,
    name: input.name,
  });

  return issueTokens(user, metadata);
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
