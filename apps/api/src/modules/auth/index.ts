export { hashPassword, verifyPassword } from "./password.service.js";
export {
  generateAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  getRefreshTokenExpiryDate,
  InvalidTokenError,
} from "./token.service.js";
export type { AccessTokenPayload, RefreshTokenPair } from "./token.types.js";
export {
  createRefreshToken,
  findActiveRefreshTokenByHash,
  revokeRefreshToken,
  revokeAllUserRefreshTokens,
  deleteExpiredRefreshTokens,
} from "./refresh-token.repository.js";
export { registerSchema, loginSchema } from "./auth.schemas.js";
export type { RegisterInput, LoginInput } from "./auth.schemas.js";
export {
  registerUser,
  loginUser,
  refreshUserSession,
  logoutSession,
  InvalidCredentialsError,
  InvalidRefreshTokenError,
} from "./auth.service.js";
export type { AuthResult, RefreshResult } from "./auth.service.js";
export { handleRegister, handleLogin, handleRefresh, handleLogout } from "./auth.controller.js";
export { authRouter } from "./auth.routes.js";
export { requireAuth } from "./auth.middleware.js";
