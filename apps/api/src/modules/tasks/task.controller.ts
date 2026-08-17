import type { Request, Response } from "express";
import { createTaskSchema, updateTaskSchema, moveTaskSchema } from "./task.schemas.js";
import {
  createTask,
  listColumnTasks,
  getTask,
  updateTask,
  moveTask,
  deleteTask,
  TaskNotFoundError,
  ColumnNotFoundForTaskError,
  TaskColumnMismatchError,
  InvalidTaskPositionError,
} from "./task.service.js";

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

const handleTaskError = (res: Response, error: unknown): boolean => {
  if (error instanceof TaskNotFoundError) {
    res.status(404).json({
      success: false,
      error: { code: "TASK_NOT_FOUND", message: error.message },
    });
    return true;
  }
  if (error instanceof ColumnNotFoundForTaskError) {
    res.status(404).json({
      success: false,
      error: { code: "COLUMN_NOT_FOUND", message: error.message },
    });
    return true;
  }
  if (error instanceof TaskColumnMismatchError) {
    res.status(400).json({
      success: false,
      error: { code: "TASK_COLUMN_MISMATCH", message: error.message },
    });
    return true;
  }
  if (error instanceof InvalidTaskPositionError) {
    res.status(400).json({
      success: false,
      error: { code: "INVALID_POSITION", message: error.message },
    });
    return true;
  }
  return false;
};

export const handleCreateTask = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: { code: "NOT_AUTHENTICATED", message: "Authentication required" },
    });
    return;
  }

  const columnId = getStringParam(req, res, "id");
  if (!columnId) return;

  const parseResult = createTaskSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid task data",
        details: parseResult.error.flatten().fieldErrors,
      },
    });
    return;
  }

  try {
    const task = await createTask(columnId, req.user.sub, parseResult.data);
    res.status(201).json({ success: true, data: { task } });
  } catch (error) {
    if (handleTaskError(res, error)) return;
    sendInternalError(res, error, "Create task failed");
  }
};

export const handleListTasks = async (req: Request, res: Response): Promise<void> => {
  const columnId = getStringParam(req, res, "id");
  if (!columnId) return;

  try {
    const tasks = await listColumnTasks(columnId);
    res.status(200).json({ success: true, data: { tasks } });
  } catch (error) {
    sendInternalError(res, error, "List tasks failed");
  }
};

export const handleGetTask = async (req: Request, res: Response): Promise<void> => {
  const taskId = getStringParam(req, res, "id");
  if (!taskId) return;

  try {
    const task = await getTask(taskId);
    res.status(200).json({ success: true, data: { task } });
  } catch (error) {
    if (handleTaskError(res, error)) return;
    sendInternalError(res, error, "Get task failed");
  }
};

export const handleUpdateTask = async (req: Request, res: Response): Promise<void> => {
  const taskId = getStringParam(req, res, "id");
  if (!taskId) return;

  const parseResult = updateTaskSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid task data",
        details: parseResult.error.flatten().fieldErrors,
      },
    });
    return;
  }

  try {
    const task = await updateTask(taskId, parseResult.data);
    res.status(200).json({ success: true, data: { task } });
  } catch (error) {
    if (handleTaskError(res, error)) return;
    sendInternalError(res, error, "Update task failed");
  }
};

export const handleMoveTask = async (req: Request, res: Response): Promise<void> => {
  const taskId = getStringParam(req, res, "id");
  if (!taskId) return;

  const parseResult = moveTaskSchema.safeParse(req.body);
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
    const task = await moveTask(taskId, parseResult.data);
    res.status(200).json({ success: true, data: { task } });
  } catch (error) {
    if (handleTaskError(res, error)) return;
    sendInternalError(res, error, "Move task failed");
  }
};

export const handleDeleteTask = async (req: Request, res: Response): Promise<void> => {
  const taskId = getStringParam(req, res, "id");
  if (!taskId) return;

  try {
    await deleteTask(taskId);
    res.status(200).json({
      success: true,
      data: { message: "Task deleted successfully" },
    });
  } catch (error) {
    if (handleTaskError(res, error)) return;
    sendInternalError(res, error, "Delete task failed");
  }
};
