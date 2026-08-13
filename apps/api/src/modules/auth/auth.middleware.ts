import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken, InvalidTokenError } from "./token.service.js";

const BEARER_PREFIX = "Bearer ";

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.get("authorization");

  if (!authHeader || !authHeader.startsWith(BEARER_PREFIX)) {
    res.status(401).json({
      success: false,
      error: {
        code: "MISSING_TOKEN",
        message: "Authorization header with Bearer token is required",
      },
    });
    return;
  }

  const token = authHeader.slice(BEARER_PREFIX.length);

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof InvalidTokenError) {
      res.status(401).json({
        success: false,
        error: {
          code: "INVALID_TOKEN",
          message: error.message,
        },
      });
      return;
    }

    console.error("Auth middleware error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    });
  }
};
