import jwt from "jsonwebtoken";
import { randomBytes, createHash } from "node:crypto";
import { env } from "../../config/index.js";
import type { AccessTokenPayload, RefreshTokenPair } from "./token.types.js";

export class InvalidTokenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidTokenError";
  }
}

export const generateAccessToken = (userId: string, email: string): string => {
  const payload: AccessTokenPayload = {
    sub: userId,
    email,
  };

  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRY as jwt.SignOptions["expiresIn"],
    algorithm: "HS256",
  });
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      algorithms: ["HS256"],
    });

    if (typeof decoded === "string" || !decoded.sub || !decoded.email) {
      throw new InvalidTokenError("Token payload is malformed");
    }

    return {
      sub: decoded.sub as string,
      email: decoded.email as string,
    };
  } catch (error) {
    if (error instanceof InvalidTokenError) {
      throw error;
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new InvalidTokenError("Token has expired");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new InvalidTokenError("Token is invalid");
    }
    throw new InvalidTokenError("Token verification failed");
  }
};

export const generateRefreshToken = (): RefreshTokenPair => {
  const token = randomBytes(32).toString("hex");
  const hash = hashRefreshToken(token);
  return { token, hash };
};

export const hashRefreshToken = (token: string): string => {
  return createHash("sha256").update(token).digest("hex");
};

export const getRefreshTokenExpiryDate = (): Date => {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + env.JWT_REFRESH_EXPIRY_DAYS);
  return expiry;
};
