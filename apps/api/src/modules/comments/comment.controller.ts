import type { Request, Response } from "express";
import { createCommentSchema, updateCommentSchema } from "./comment.schemas.js";
import {
  createComment,
  listTaskComments,
  updateComment,
  deleteComment,
  CommentNotFoundError,
  NotCommentAuthorError,
  InsufficientDeletePermissionError,
} from "./comment.service.js";

const getStringParam = (req: Request, res: Response, paramName: string): string | null => {
  const value = req.params[paramName];
  if (typeof value !== "string" || value.length === 0) {
    res.status(400).json({
      success: false,
      error: { code: "MISSING_PARAM", message: `${paramName} is required` },
    });
    return null;
  }
  return value;
};

const sendInternalError = (res: Response, error: unknown, context: string): void => {
  console.error(`${context}:`, error);
  res.status(500).json({
    success: false,
    error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
  });
};

export const handleCreateComment = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: { code: "NOT_AUTHENTICATED", message: "Authentication required" },
    });
    return;
  }

  const taskId = getStringParam(req, res, "id");
  if (!taskId) return;

  const parseResult = createCommentSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid comment data",
        details: parseResult.error.flatten().fieldErrors,
      },
    });
    return;
  }

  try {
    const comment = await createComment(taskId, req.user.sub, parseResult.data);
    res.status(201).json({ success: true, data: { comment } });
  } catch (error) {
    sendInternalError(res, error, "Create comment failed");
  }
};

export const handleListComments = async (req: Request, res: Response): Promise<void> => {
  const taskId = getStringParam(req, res, "id");
  if (!taskId) return;

  try {
    const comments = await listTaskComments(taskId);
    res.status(200).json({ success: true, data: { comments } });
  } catch (error) {
    sendInternalError(res, error, "List comments failed");
  }
};

export const handleUpdateComment = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: { code: "NOT_AUTHENTICATED", message: "Authentication required" },
    });
    return;
  }

  const commentId = getStringParam(req, res, "id");
  if (!commentId) return;

  const parseResult = updateCommentSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid comment data",
        details: parseResult.error.flatten().fieldErrors,
      },
    });
    return;
  }

  try {
    const comment = await updateComment(commentId, req.user.sub, parseResult.data);
    res.status(200).json({ success: true, data: { comment } });
  } catch (error) {
    if (error instanceof CommentNotFoundError) {
      res.status(404).json({
        success: false,
        error: { code: "COMMENT_NOT_FOUND", message: error.message },
      });
      return;
    }
    if (error instanceof NotCommentAuthorError) {
      res.status(403).json({
        success: false,
        error: { code: "NOT_COMMENT_AUTHOR", message: error.message },
      });
      return;
    }
    sendInternalError(res, error, "Update comment failed");
  }
};

export const handleDeleteComment = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: { code: "NOT_AUTHENTICATED", message: "Authentication required" },
    });
    return;
  }

  if (!req.membership) {
    res.status(500).json({
      success: false,
      error: {
        code: "MIDDLEWARE_ORDER_ERROR",
        message: "Comment deletion requires membership context",
      },
    });
    return;
  }

  const commentId = getStringParam(req, res, "id");
  if (!commentId) return;

  try {
    await deleteComment(commentId, req.user.sub, req.membership.role);
    res.status(200).json({
      success: true,
      data: { message: "Comment deleted successfully" },
    });
  } catch (error) {
    if (error instanceof CommentNotFoundError) {
      res.status(404).json({
        success: false,
        error: { code: "COMMENT_NOT_FOUND", message: error.message },
      });
      return;
    }
    if (error instanceof InsufficientDeletePermissionError) {
      res.status(403).json({
        success: false,
        error: { code: "INSUFFICIENT_PERMISSION", message: error.message },
      });
      return;
    }
    sendInternalError(res, error, "Delete comment failed");
  }
};
