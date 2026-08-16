import type { Request, Response } from "express";
import { createBoardSchema, updateBoardSchema } from "./board.schemas.js";
import {
  createBoard,
  listOrganizationBoards,
  getBoard,
  updateBoard,
  archiveBoard,
  restoreBoard,
  deleteBoard,
  BoardNotFoundError,
  BoardNotArchivedError,
} from "./board.service.js";

const getStringParam = (req: Request, res: Response, paramName: string): string | null => {
  const value = req.params[paramName];
  if (typeof value !== "string" || value.length === 0) {
    res.status(400).json({
      success: false,
      error: {
        code: "MISSING_PARAM",
        message: `${paramName} is required`,
      },
    });
    return null;
  }
  return value;
};

export const handleCreateBoard = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: { code: "NOT_AUTHENTICATED", message: "Authentication required" },
    });
    return;
  }

  const organizationId = getStringParam(req, res, "id");
  if (!organizationId) return;

  const parseResult = createBoardSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid board data",
        details: parseResult.error.flatten().fieldErrors,
      },
    });
    return;
  }

  try {
    const board = await createBoard(organizationId, req.user.sub, parseResult.data);
    res.status(201).json({ success: true, data: { board } });
  } catch (error) {
    console.error("Create board failed:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
    });
  }
};

export const handleListBoards = async (req: Request, res: Response): Promise<void> => {
  const organizationId = getStringParam(req, res, "id");
  if (!organizationId) return;

  const includeArchived = req.query.includeArchived === "true";

  try {
    const boards = await listOrganizationBoards(organizationId, includeArchived);
    res.status(200).json({ success: true, data: { boards } });
  } catch (error) {
    console.error("List boards failed:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
    });
  }
};

export const handleGetBoard = async (req: Request, res: Response): Promise<void> => {
  const boardId = getStringParam(req, res, "id");
  if (!boardId) return;

  try {
    const board = await getBoard(boardId);
    res.status(200).json({ success: true, data: { board } });
  } catch (error) {
    if (error instanceof BoardNotFoundError) {
      res.status(404).json({
        success: false,
        error: { code: "BOARD_NOT_FOUND", message: error.message },
      });
      return;
    }
    console.error("Get board failed:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
    });
  }
};

export const handleUpdateBoard = async (req: Request, res: Response): Promise<void> => {
  const boardId = getStringParam(req, res, "id");
  if (!boardId) return;

  const parseResult = updateBoardSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid board data",
        details: parseResult.error.flatten().fieldErrors,
      },
    });
    return;
  }

  try {
    const board = await updateBoard(boardId, parseResult.data);
    res.status(200).json({ success: true, data: { board } });
  } catch (error) {
    if (error instanceof BoardNotFoundError) {
      res.status(404).json({
        success: false,
        error: { code: "BOARD_NOT_FOUND", message: error.message },
      });
      return;
    }
    console.error("Update board failed:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
    });
  }
};

export const handleArchiveBoard = async (req: Request, res: Response): Promise<void> => {
  const boardId = getStringParam(req, res, "id");
  if (!boardId) return;

  try {
    const board = await archiveBoard(boardId);
    res.status(200).json({ success: true, data: { board } });
  } catch (error) {
    if (error instanceof BoardNotFoundError) {
      res.status(404).json({
        success: false,
        error: { code: "BOARD_NOT_FOUND", message: error.message },
      });
      return;
    }
    console.error("Archive board failed:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
    });
  }
};

export const handleRestoreBoard = async (req: Request, res: Response): Promise<void> => {
  const boardId = getStringParam(req, res, "id");
  if (!boardId) return;

  try {
    const board = await restoreBoard(boardId);
    res.status(200).json({ success: true, data: { board } });
  } catch (error) {
    if (error instanceof BoardNotFoundError) {
      res.status(404).json({
        success: false,
        error: { code: "BOARD_NOT_FOUND", message: error.message },
      });
      return;
    }
    console.error("Restore board failed:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
    });
  }
};

export const handleDeleteBoard = async (req: Request, res: Response): Promise<void> => {
  const boardId = getStringParam(req, res, "id");
  if (!boardId) return;

  try {
    await deleteBoard(boardId);
    res.status(200).json({
      success: true,
      data: { message: "Board permanently deleted" },
    });
  } catch (error) {
    if (error instanceof BoardNotFoundError) {
      res.status(404).json({
        success: false,
        error: { code: "BOARD_NOT_FOUND", message: error.message },
      });
      return;
    }
    if (error instanceof BoardNotArchivedError) {
      res.status(400).json({
        success: false,
        error: { code: "BOARD_NOT_ARCHIVED", message: error.message },
      });
      return;
    }
    console.error("Delete board failed:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
    });
  }
};
