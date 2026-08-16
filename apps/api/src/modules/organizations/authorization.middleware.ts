import type { Request, Response, NextFunction } from "express";
import type { MembershipRole } from "@prisma/client";
import { findMembership } from "./membership.repository.js";

const ROLE_HIERARCHY: Record<MembershipRole, number> = {
  OWNER: 4,
  ADMIN: 3,
  MEMBER: 2,
  VIEWER: 1,
};

const getRoleLevel = (role: MembershipRole): number => ROLE_HIERARCHY[role];

const getOrganizationIdParam = (req: Request): string | null => {
  const value = req.params.id;
  return typeof value === "string" && value.length > 0 ? value : null;
};

export const requireMembership = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: {
        code: "NOT_AUTHENTICATED",
        message: "Authentication required",
      },
    });
    return;
  }

  const organizationId = getOrganizationIdParam(req);
  if (!organizationId) {
    res.status(400).json({
      success: false,
      error: {
        code: "MISSING_PARAM",
        message: "Organization id is required",
      },
    });
    return;
  }

  try {
    const membership = await findMembership(req.user.sub, organizationId);
    if (!membership) {
      res.status(403).json({
        success: false,
        error: {
          code: "NOT_MEMBER",
          message: "You are not a member of this organization",
        },
      });
      return;
    }

    req.membership = membership;
    next();
  } catch (error) {
    console.error("requireMembership middleware error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    });
  }
};

export const requireRole = (minimumRole: MembershipRole) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.membership) {
      res.status(500).json({
        success: false,
        error: {
          code: "MIDDLEWARE_ORDER_ERROR",
          message: "requireRole must run after requireMembership",
        },
      });
      return;
    }

    const userLevel = getRoleLevel(req.membership.role);
    const requiredLevel = getRoleLevel(minimumRole);

    if (userLevel < requiredLevel) {
      res.status(403).json({
        success: false,
        error: {
          code: "INSUFFICIENT_ROLE",
          message: `This action requires ${minimumRole} role or higher`,
        },
      });
      return;
    }

    next();
  };
};
