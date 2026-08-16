import type { Request, Response, NextFunction } from "express";
import type { MembershipRole } from "@prisma/client";
import { findColumnById } from "./column.repository.js";
import { findBoardById } from "../boards/board.repository.js";
import { findMembership } from "../organizations/membership.repository.js";

const ROLE_HIERARCHY: Record<MembershipRole, number> = {
  OWNER: 4,
  ADMIN: 3,
  MEMBER: 2,
  VIEWER: 1,
};

const getColumnIdParam = (req: Request): string | null => {
  const value = req.params.id;
  return typeof value === "string" && value.length > 0 ? value : null;
};

export const requireColumnAccess = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: { code: "NOT_AUTHENTICATED", message: "Authentication required" },
    });
    return;
  }

  const columnId = getColumnIdParam(req);
  if (!columnId) {
    res.status(400).json({
      success: false,
      error: { code: "MISSING_PARAM", message: "Column id is required" },
    });
    return;
  }

  try {
    const column = await findColumnById(columnId);
    if (!column) {
      res.status(404).json({
        success: false,
        error: { code: "COLUMN_NOT_FOUND", message: "Column not found" },
      });
      return;
    }

    const board = await findBoardById(column.boardId);
    if (!board) {
      res.status(404).json({
        success: false,
        error: { code: "BOARD_NOT_FOUND", message: "Board not found" },
      });
      return;
    }

    const membership = await findMembership(req.user.sub, board.organizationId);
    if (!membership) {
      res.status(403).json({
        success: false,
        error: { code: "NOT_MEMBER", message: "You do not have access to this column" },
      });
      return;
    }

    req.membership = membership;
    next();
  } catch (error) {
    console.error("requireColumnAccess middleware error:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
    });
  }
};

export const requireColumnRole = (minimumRole: MembershipRole) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.membership) {
      res.status(500).json({
        success: false,
        error: {
          code: "MIDDLEWARE_ORDER_ERROR",
          message: "requireColumnRole must run after requireColumnAccess",
        },
      });
      return;
    }

    const userLevel = ROLE_HIERARCHY[req.membership.role];
    const requiredLevel = ROLE_HIERARCHY[minimumRole];

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
