import * as userService from "../users/index.js";
import * as authModule from "./index.js";
import type { RegisterInput } from "./auth.schemas.js";
import type { PublicUser } from "../users/index.js";

export interface AuthResult {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}

interface RegisterMetadata {
  userAgent?: string | null;
  ipAddress?: string | null;
}

export const registerUser = async (
  input: RegisterInput,
  metadata: RegisterMetadata = {},
): Promise<AuthResult> => {
  const user = await userService.createUser({
    email: input.email,
    password: input.password,
    name: input.name,
  });

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
