import type { BoardColumn } from "@prisma/client";
import { generateKeyBetween } from "fractional-indexing";
import * as columnRepository from "./column.repository.js";
import { countTasksByColumn } from "../tasks/task.repository.js";
import type {
  PublicColumn,
  CreateColumnInput,
  UpdateColumnInput,
  MoveColumnInput,
} from "./column.types.js";

export class ColumnNotFoundError extends Error {
  constructor(id: string) {
    super(`Column ${id} not found`);
    this.name = "ColumnNotFoundError";
  }
}

export class ColumnBoardMismatchError extends Error {
  constructor() {
    super("Reference columns must belong to the same board");
    this.name = "ColumnBoardMismatchError";
  }
}

export class InvalidColumnPositionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidColumnPositionError";
  }
}

export class ColumnNotEmptyError extends Error {
  public readonly taskCount: number;
  constructor(taskCount: number) {
    super(`Cannot delete column with ${taskCount} task(s). Move or delete tasks first.`);
    this.name = "ColumnNotEmptyError";
    this.taskCount = taskCount;
  }
}

const toPublicColumn = (column: BoardColumn): PublicColumn => ({
  id: column.id,
  boardId: column.boardId,
  name: column.name,
  position: column.position,
  createdAt: column.createdAt,
  updatedAt: column.updatedAt,
});

const resolveNeighborPosition = async (
  boardId: string,
  neighborId: string | undefined,
): Promise<string | null> => {
  if (!neighborId) return null;
  const neighbor = await columnRepository.findColumnById(neighborId);
  if (!neighbor) {
    throw new ColumnNotFoundError(neighborId);
  }
  if (neighbor.boardId !== boardId) {
    throw new ColumnBoardMismatchError();
  }
  return neighbor.position;
};

const calculatePosition = async (
  boardId: string,
  afterColumnId: string | undefined,
  beforeColumnId: string | undefined,
): Promise<string> => {
  const afterPosition = await resolveNeighborPosition(boardId, afterColumnId);
  const beforePosition = await resolveNeighborPosition(boardId, beforeColumnId);

  let leftBound = afterPosition;
  const rightBound = beforePosition;

  if (leftBound === null && rightBound === null) {
    const lastColumn = await columnRepository.findLastColumnByBoard(boardId);
    leftBound = lastColumn ? lastColumn.position : null;
  }

  try {
    return generateKeyBetween(leftBound, rightBound);
  } catch {
    throw new InvalidColumnPositionError(
      "Could not generate position between the specified columns",
    );
  }
};

export const createColumn = async (
  boardId: string,
  input: CreateColumnInput,
): Promise<PublicColumn> => {
  const position = await calculatePosition(boardId, input.afterColumnId, input.beforeColumnId);
  const column = await columnRepository.createColumn({
    boardId,
    name: input.name,
    position,
  });
  return toPublicColumn(column);
};

export const listBoardColumns = async (boardId: string): Promise<PublicColumn[]> => {
  const columns = await columnRepository.findColumnsByBoard(boardId);
  return columns.map(toPublicColumn);
};

export const getColumn = async (columnId: string): Promise<PublicColumn> => {
  const column = await columnRepository.findColumnById(columnId);
  if (!column) {
    throw new ColumnNotFoundError(columnId);
  }
  return toPublicColumn(column);
};

export const updateColumn = async (
  columnId: string,
  input: UpdateColumnInput,
): Promise<PublicColumn> => {
  const existing = await columnRepository.findColumnById(columnId);
  if (!existing) {
    throw new ColumnNotFoundError(columnId);
  }
  const column = await columnRepository.updateColumn(columnId, { name: input.name });
  return toPublicColumn(column);
};

export const moveColumn = async (
  columnId: string,
  input: MoveColumnInput,
): Promise<PublicColumn> => {
  const existing = await columnRepository.findColumnById(columnId);
  if (!existing) {
    throw new ColumnNotFoundError(columnId);
  }

  if (input.afterColumnId === columnId || input.beforeColumnId === columnId) {
    throw new InvalidColumnPositionError("Cannot move column relative to itself");
  }

  const position = await calculatePosition(
    existing.boardId,
    input.afterColumnId,
    input.beforeColumnId,
  );

  const column = await columnRepository.updateColumn(columnId, { position });
  return toPublicColumn(column);
};

export const deleteColumn = async (columnId: string): Promise<void> => {
  const existing = await columnRepository.findColumnById(columnId);
  if (!existing) {
    throw new ColumnNotFoundError(columnId);
  }

  const taskCount = await countTasksByColumn(columnId);
  if (taskCount > 0) {
    throw new ColumnNotEmptyError(taskCount);
  }

  await columnRepository.deleteColumn(columnId);
};
