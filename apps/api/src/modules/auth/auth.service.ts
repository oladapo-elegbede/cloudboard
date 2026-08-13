import * as userService from "../users/index.js";
import * as authModule from "./index.js";
import type { RegisterInput, LoginInput } from "./auth.schemas.js";
import type { PublicUser } from "../users/index.js";

export interface AuthResult {
  user: PublicUser;
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
