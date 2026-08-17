import type { Task } from "@prisma/client";
import { generateKeyBetween } from "fractional-indexing";
import * as taskRepository from "./task.repository.js";
import { findColumnById } from "../columns/column.repository.js";
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

  return toPublicTask(task);
};

export const listColumnTasks = async (columnId: string): Promise<PublicTask[]> => {
  const tasks = await taskRepository.findTasksByColumn(columnId);
  return tasks.map(toPublicTask);
};

export const getTask = async (taskId: string): Promise<PublicTask> => {
  const task = await taskRepository.findTaskById(taskId);
  if (!task) {
    throw new TaskNotFoundError(taskId);
  }
  return toPublicTask(task);
};

export const updateTask = async (taskId: string, input: UpdateTaskInput): Promise<PublicTask> => {
  const existing = await taskRepository.findTaskById(taskId);
  if (!existing) {
    throw new TaskNotFoundError(taskId);
  }
  const task = await taskRepository.updateTask(taskId, input);
  return toPublicTask(task);
};

export const moveTask = async (taskId: string, input: MoveTaskInput): Promise<PublicTask> => {
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

  return toPublicTask(task);
};

export const deleteTask = async (taskId: string): Promise<void> => {
  const existing = await taskRepository.findTaskById(taskId);
  if (!existing) {
    throw new TaskNotFoundError(taskId);
  }
  await taskRepository.deleteTask(taskId);
};
