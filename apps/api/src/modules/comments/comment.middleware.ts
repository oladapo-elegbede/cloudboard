import type { Request, Response, NextFunction } from "express";
import { findCommentById } from "./comment.repository.js";
import { findTaskById } from "../tasks/task.repository.js";
import { findColumnById } from "../columns/column.repository.js";
import { findBoardById } from "../boards/board.repository.js";
import { findMembership } from "../organizations/membership.repository.js";

const getCommentIdParam = (req: Request): string | null => {
  const value = req.params.id;
  return typeof value === "string" && value.length > 0 ? value : null;
};

export const requireCommentAccess = async (
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

  const commentId = getCommentIdParam(req);
  if (!commentId) {
    res.status(400).json({
      success: false,
      error: { code: "MISSING_PARAM", message: "Comment id is required" },
    });
    return;
  }

  try {
    const comment = await findCommentById(commentId);
    if (!comment) {
      res.status(404).json({
        success: false,
        error: { code: "COMMENT_NOT_FOUND", message: "Comment not found" },
      });
      return;
    }

    const task = await findTaskById(comment.taskId);
    if (!task) {
      res.status(404).json({
        success: false,
        error: { code: "TASK_NOT_FOUND", message: "Task not found" },
      });
      return;
    }

    const column = await findColumnById(task.columnId);
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
        error: { code: "NOT_MEMBER", message: "You do not have access to this comment" },
      });
      return;
    }

    req.membership = membership;
    next();
  } catch (error) {
    console.error("requireCommentAccess middleware error:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
    });
  }
};
