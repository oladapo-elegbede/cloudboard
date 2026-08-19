import type { Task } from "@prisma/client";
import { generateKeyBetween } from "fractional-indexing";
import * as taskRepository from "./task.repository.js";
import { findColumnById } from "../columns/column.repository.js";
import { findBoardById } from "../boards/board.repository.js";
import { prisma } from "../../infrastructure/database/prisma.js";
import { logActivity, ACTION_TYPES, ENTITY_TYPES } from "../activities/index.js";
import type { ActivitySnapshot } from "../activities/index.js";
import type { PublicTask, CreateTaskInput, UpdateTaskInput, MoveTaskInput } from "./task.types.js";

export class TaskNotFoundError extends Error {
  constructor(id: string) {
    super(`Task ${id} not found`);
    this.name = "TaskNotFoundError";
  }
}

export class ColumnNotFoundForTaskError extends Error {
  constructor(id: string) {
    super(`Column ${id} not found`);
    this.name = "ColumnNotFoundForTaskError";
  }
}

export class TaskColumnMismatchError extends Error {
  constructor() {
    super("Reference tasks must belong to the same column");
    this.name = "TaskColumnMismatchError";
  }
}

export class InvalidTaskPositionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidTaskPositionError";
  }
}

const toPublicTask = (task: Task): PublicTask => ({
  id: task.id,
  columnId: task.columnId,
  title: task.title,
  description: task.description,
  position: task.position,
  createdById: task.createdById,
  assigneeId: task.assigneeId,
  dueDate: task.dueDate,
  priority: task.priority,
  createdAt: task.createdAt,
  updatedAt: task.updatedAt,
});

const resolveNeighborTaskPosition = async (
  columnId: string,
  neighborId: string | undefined,
): Promise<string | null> => {
  if (!neighborId) return null;
  const neighbor = await taskRepository.findTaskById(neighborId);
  if (!neighbor) {
    throw new TaskNotFoundError(neighborId);
  }
  if (neighbor.columnId !== columnId) {
    throw new TaskColumnMismatchError();
  }
  return neighbor.position;
};

const calculateTaskPosition = async (
  columnId: string,
  afterTaskId: string | undefined,
  beforeTaskId: string | undefined,
): Promise<string> => {
  const afterPosition = await resolveNeighborTaskPosition(columnId, afterTaskId);
  const beforePosition = await resolveNeighborTaskPosition(columnId, beforeTaskId);

  let leftBound = afterPosition;
  const rightBound = beforePosition;

  if (leftBound === null && rightBound === null) {
    const lastTask = await taskRepository.findLastTaskByColumn(columnId);
    leftBound = lastTask ? lastTask.position : null;
  }

  try {
    return generateKeyBetween(leftBound, rightBound);
  } catch {
    throw new InvalidTaskPositionError("Could not generate position between the specified tasks");
  }
};

const resolveBoardAndOrg = async (
  columnId: string,
): Promise<{ boardId: string; organizationId: string } | null> => {
  const column = await findColumnById(columnId);
  if (!column) return null;
  const board = await findBoardById(column.boardId);
  if (!board) return null;
  return { boardId: board.id, organizationId: board.organizationId };
};

const getUserName = async (userId: string): Promise<string> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });
  return user?.name ?? "Unknown user";
};

const serializeUpdateChanges = (input: UpdateTaskInput): ActivitySnapshot => {
  const changes: Record<string, unknown> = {};
  if (input.title !== undefined) changes.title = input.title;
  if (input.description !== undefined) changes.description = input.description;
  if (input.assigneeId !== undefined) changes.assigneeId = input.assigneeId;
  if (input.dueDate !== undefined) {
    changes.dueDate = input.dueDate ? input.dueDate.toISOString() : null;
  }
  if (input.priority !== undefined) changes.priority = input.priority;
  return changes as ActivitySnapshot;
};

export const createTask = async (
  columnId: string,
  createdById: string,
  input: CreateTaskInput,
): Promise<PublicTask> => {
  const column = await findColumnById(columnId);
  if (!column) {
    throw new ColumnNotFoundForTaskError(columnId);
  }

  const position = await calculateTaskPosition(columnId, input.afterTaskId, input.beforeTaskId);

  const task = await taskRepository.createTask({
    columnId,
    title: input.title,
    description: input.description ?? null,
    position,
    createdById,
    assigneeId: input.assigneeId ?? null,
    dueDate: input.dueDate ?? null,
    priority: input.priority ?? null,
  });

  const context = await resolveBoardAndOrg(columnId);
  if (context) {
    const actorName = await getUserName(createdById);
    await logActivity({
      organizationId: context.organizationId,
      boardId: context.boardId,
      actorId: createdById,
      actorName,
      actionType: ACTION_TYPES.TASK_CREATED,
      entityType: ENTITY_TYPES.TASK,
      entityId: task.id,
      entitySnapshot: {
        title: task.title,
        columnId: task.columnId,
        priority: task.priority ?? null,
      },
    });
  }

  return toPublicTask(task);
};

export const listColumnTasks = async (columnId: string): Promise<PublicTask[]> => {
  const tasks = await taskRepository.findTasksByColumn(columnId);
  return tasks.map(toPublicTask);
};

export const listBoardTasks = async (boardId: string): Promise<PublicTask[]> => {
  const tasks = await taskRepository.findTasksByBoardId(boardId);
  return tasks.map(toPublicTask);
};

export const getTask = async (taskId: string): Promise<PublicTask> => {
  const task = await taskRepository.findTaskById(taskId);
  if (!task) {
    throw new TaskNotFoundError(taskId);
  }
  return toPublicTask(task);
};

export const updateTask = async (
  taskId: string,
  actorId: string,
  input: UpdateTaskInput,
): Promise<PublicTask> => {
  const existing = await taskRepository.findTaskById(taskId);
  if (!existing) {
    throw new TaskNotFoundError(taskId);
  }
  const task = await taskRepository.updateTask(taskId, input);

  const context = await resolveBoardAndOrg(existing.columnId);
  if (context) {
    const actorName = await getUserName(actorId);
    await logActivity({
      organizationId: context.organizationId,
      boardId: context.boardId,
      actorId,
      actorName,
      actionType: ACTION_TYPES.TASK_UPDATED,
      entityType: ENTITY_TYPES.TASK,
      entityId: task.id,
      entitySnapshot: {
        title: task.title,
        changes: serializeUpdateChanges(input),
      },
    });
  }

  return toPublicTask(task);
};

export const moveTask = async (
  taskId: string,
  actorId: string,
  input: MoveTaskInput,
): Promise<PublicTask> => {
  const existing = await taskRepository.findTaskById(taskId);
  if (!existing) {
    throw new TaskNotFoundError(taskId);
  }

  const targetColumnId = input.targetColumnId ?? existing.columnId;

  if (input.targetColumnId && input.targetColumnId !== existing.columnId) {
    const targetColumn = await findColumnById(input.targetColumnId);
    if (!targetColumn) {
      throw new ColumnNotFoundForTaskError(input.targetColumnId);
    }
  }

  if (input.afterTaskId === taskId || input.beforeTaskId === taskId) {
    throw new InvalidTaskPositionError("Cannot move task relative to itself");
  }

  const position = await calculateTaskPosition(
    targetColumnId,
    input.afterTaskId,
    input.beforeTaskId,
  );

  const task = await taskRepository.updateTask(taskId, {
    columnId: targetColumnId,
    position,
  });

  const context = await resolveBoardAndOrg(targetColumnId);
  if (context) {
    const actorName = await getUserName(actorId);
    await logActivity({
      organizationId: context.organizationId,
      boardId: context.boardId,
      actorId,
      actorName,
      actionType: ACTION_TYPES.TASK_MOVED,
      entityType: ENTITY_TYPES.TASK,
      entityId: task.id,
      entitySnapshot: {
        title: task.title,
        fromColumnId: existing.columnId,
        toColumnId: targetColumnId,
      },
    });
  }

  return toPublicTask(task);
};

export const deleteTask = async (taskId: string, actorId: string): Promise<void> => {
  const existing = await taskRepository.findTaskById(taskId);
  if (!existing) {
    throw new TaskNotFoundError(taskId);
  }

  const context = await resolveBoardAndOrg(existing.columnId);
  const actorName = context ? await getUserName(actorId) : "Unknown user";

  await taskRepository.deleteTask(taskId);

  if (context) {
    await logActivity({
      organizationId: context.organizationId,
      boardId: context.boardId,
      actorId,
      actorName,
      actionType: ACTION_TYPES.TASK_DELETED,
      entityType: ENTITY_TYPES.TASK,
      entityId: existing.id,
      entitySnapshot: {
        title: existing.title,
        description: existing.description ?? null,
        columnId: existing.columnId,
      },
    });
  }
};
