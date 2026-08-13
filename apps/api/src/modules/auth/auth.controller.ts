import type { Request, Response } from "express";
import { registerSchema } from "./auth.schemas.js";
import { registerUser } from "./auth.service.js";
import { UserAlreadyExistsError } from "../users/index.js";
import { env } from "../../config/index.js";

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

    setRefreshTokenCookie(res, result.refreshToken);

    res.status(201).json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
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
