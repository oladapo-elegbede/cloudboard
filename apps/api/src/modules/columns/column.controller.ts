import type { Request, Response } from "express";
import { createColumnSchema, updateColumnSchema, moveColumnSchema } from "./column.schemas.js";
import {
  createColumn,
  listBoardColumns,
  updateColumn,
  moveColumn,
  deleteColumn,
  ColumnNotFoundError,
  ColumnBoardMismatchError,
  InvalidColumnPositionError,
  ColumnNotEmptyError,
} from "./column.service.js";

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

const handlePositionError = (res: Response, error: unknown): boolean => {
  if (error instanceof ColumnNotFoundError) {
    res.status(404).json({
      success: false,
      error: { code: "COLUMN_NOT_FOUND", message: error.message },
    });
    return true;
  }
  if (error instanceof ColumnBoardMismatchError) {
    res.status(400).json({
      success: false,
      error: { code: "COLUMN_BOARD_MISMATCH", message: error.message },
    });
    return true;
  }
  if (error instanceof InvalidColumnPositionError) {
    res.status(400).json({
      success: false,
      error: { code: "INVALID_POSITION", message: error.message },
    });
    return true;
  }
  return false;
};

export const handleCreateColumn = async (req: Request, res: Response): Promise<void> => {
  const boardId = getStringParam(req, res, "id");
  if (!boardId) return;

  const parseResult = createColumnSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid column data",
        details: parseResult.error.flatten().fieldErrors,
      },
    });
    return;
  }

  try {
    const column = await createColumn(boardId, parseResult.data);
    res.status(201).json({ success: true, data: { column } });
  } catch (error) {
    if (handlePositionError(res, error)) return;
    sendInternalError(res, error, "Create column failed");
  }
};

export const handleListColumns = async (req: Request, res: Response): Promise<void> => {
  const boardId = getStringParam(req, res, "id");
  if (!boardId) return;

  try {
    const columns = await listBoardColumns(boardId);
    res.status(200).json({ success: true, data: { columns } });
  } catch (error) {
    sendInternalError(res, error, "List columns failed");
  }
};

export const handleUpdateColumn = async (req: Request, res: Response): Promise<void> => {
  const columnId = getStringParam(req, res, "id");
  if (!columnId) return;

  const parseResult = updateColumnSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid column data",
        details: parseResult.error.flatten().fieldErrors,
      },
    });
    return;
  }

  try {
    const column = await updateColumn(columnId, parseResult.data);
    res.status(200).json({ success: true, data: { column } });
  } catch (error) {
    if (error instanceof ColumnNotFoundError) {
      res.status(404).json({
        success: false,
        error: { code: "COLUMN_NOT_FOUND", message: error.message },
      });
      return;
    }
    sendInternalError(res, error, "Update column failed");
  }
};

export const handleMoveColumn = async (req: Request, res: Response): Promise<void> => {
  const columnId = getStringParam(req, res, "id");
  if (!columnId) return;

  const parseResult = moveColumnSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid move data",
        details: parseResult.error.flatten().fieldErrors,
      },
    });
    return;
  }

  try {
    const column = await moveColumn(columnId, parseResult.data);
    res.status(200).json({ success: true, data: { column } });
  } catch (error) {
    if (handlePositionError(res, error)) return;
    sendInternalError(res, error, "Move column failed");
  }
};

export const handleDeleteColumn = async (req: Request, res: Response): Promise<void> => {
  const columnId = getStringParam(req, res, "id");
  if (!columnId) return;

  try {
    await deleteColumn(columnId);
    res.status(200).json({
      success: true,
      data: { message: "Column deleted successfully" },
    });
  } catch (error) {
    if (error instanceof ColumnNotFoundError) {
      res.status(404).json({
        success: false,
        error: { code: "COLUMN_NOT_FOUND", message: error.message },
      });
      return;
    }
    if (error instanceof ColumnNotEmptyError) {
      res.status(409).json({
        success: false,
        error: {
          code: "COLUMN_NOT_EMPTY",
          message: error.message,
          details: { taskCount: error.taskCount },
        },
      });
      return;
    }
    sendInternalError(res, error, "Delete column failed");
  }
};
