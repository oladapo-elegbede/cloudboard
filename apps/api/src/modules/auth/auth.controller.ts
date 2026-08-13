import type { Request, Response } from "express";
import { registerSchema, loginSchema } from "./auth.schemas.js";
import {
  registerUser,
  loginUser,
  refreshUserSession,
  logoutSession,
  InvalidCredentialsError,
  InvalidRefreshTokenError,
} from "./auth.service.js";
import { UserAlreadyExistsError } from "../users/index.js";
import { env } from "../../config/index.js";
import type { AuthResult, RefreshResult } from "./auth.service.js";

const REFRESH_TOKEN_COOKIE_NAME = "cb_refresh_token";
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const setRefreshTokenCookie = (res: Response, refreshToken: string): void => {
  res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: env.JWT_REFRESH_EXPIRY_DAYS * MS_PER_DAY,
    path: "/",
  });
};

const clearRefreshTokenCookie = (res: Response): void => {
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });
};

const sendAuthSuccess = (res: Response, statusCode: number, result: AuthResult): void => {
  setRefreshTokenCookie(res, result.refreshToken);
  res.status(statusCode).json({
    success: true,
    data: {
      user: result.user,
      accessToken: result.accessToken,
    },
  });
};

const sendRefreshSuccess = (res: Response, result: RefreshResult): void => {
  setRefreshTokenCookie(res, result.refreshToken);
  res.status(200).json({
    success: true,
    data: {
      accessToken: result.accessToken,
    },
  });
};

const sendInvalidRefreshToken = (res: Response): void => {
  clearRefreshTokenCookie(res);
  res.status(401).json({
    success: false,
    error: {
      code: "INVALID_REFRESH_TOKEN",
      message: "Session expired. Please log in again.",
    },
  });
};

export const handleRegister = async (req: Request, res: Response): Promise<void> => {
  const parseResult = registerSchema.safeParse(req.body);

  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid registration data",
        details: parseResult.error.flatten().fieldErrors,
      },
    });
    return;
  }

  try {
    const result = await registerUser(parseResult.data, {
      userAgent: req.get("user-agent") ?? null,
      ipAddress: req.ip ?? null,
    });

    sendAuthSuccess(res, 201, result);
  } catch (error) {
    if (error instanceof UserAlreadyExistsError) {
      res.status(409).json({
        success: false,
        error: {
          code: "USER_ALREADY_EXISTS",
          message: "An account with this email already exists",
        },
      });
      return;
    }

    console.error("Registration failed:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    });
  }
};

export const handleLogin = async (req: Request, res: Response): Promise<void> => {
  const parseResult = loginSchema.safeParse(req.body);

  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid login data",
        details: parseResult.error.flatten().fieldErrors,
      },
    });
    return;
  }

  try {
    const result = await loginUser(parseResult.data, {
      userAgent: req.get("user-agent") ?? null,
      ipAddress: req.ip ?? null,
    });

    sendAuthSuccess(res, 200, result);
  } catch (error) {
    if (error instanceof InvalidCredentialsError) {
      res.status(401).json({
        success: false,
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password",
        },
      });
      return;
    }

    console.error("Login failed:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    });
  }
};

export const handleRefresh = async (req: Request, res: Response): Promise<void> => {
  const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];

  if (!refreshToken || typeof refreshToken !== "string") {
    sendInvalidRefreshToken(res);
    return;
  }

  try {
    const result = await refreshUserSession(refreshToken, {
      userAgent: req.get("user-agent") ?? null,
      ipAddress: req.ip ?? null,
    });

    sendRefreshSuccess(res, result);
  } catch (error) {
    if (error instanceof InvalidRefreshTokenError) {
      sendInvalidRefreshToken(res);
      return;
    }

    console.error("Token refresh failed:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    });
  }
};

export const handleLogout = async (req: Request, res: Response): Promise<void> => {
  const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];
  const presentedToken =
    typeof refreshToken === "string" && refreshToken.length > 0 ? refreshToken : null;

  try {
    await logoutSession(presentedToken);
    clearRefreshTokenCookie(res);
    res.status(200).json({
      success: true,
      data: {
        message: "Logged out successfully",
      },
    });
  } catch (error) {
    console.error("Logout failed:", error);
    clearRefreshTokenCookie(res);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    });
  }
};
