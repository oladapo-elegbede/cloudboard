import type { Board } from "@prisma/client";
import * as boardRepository from "./board.repository.js";
import type { PublicBoard, CreateBoardInput, UpdateBoardInput } from "./board.types.js";

export class BoardNotFoundError extends Error {
  constructor(id: string) {
    super(`Board ${id} not found`);
    this.name = "BoardNotFoundError";
  }
}

export class BoardNotArchivedError extends Error {
  constructor() {
    super("Board must be archived before permanent deletion");
    this.name = "BoardNotArchivedError";
  }
}

const toPublicBoard = (board: Board): PublicBoard => ({
  id: board.id,
  name: board.name,
  description: board.description,
  organizationId: board.organizationId,
  createdById: board.createdById,
  archivedAt: board.archivedAt,
  createdAt: board.createdAt,
  updatedAt: board.updatedAt,
});

export const createBoard = async (
  organizationId: string,
  createdById: string,
  input: CreateBoardInput,
): Promise<PublicBoard> => {
  const board = await boardRepository.createBoard({
    name: input.name,
    description: input.description,
    organizationId,
    createdById,
  });
  return toPublicBoard(board);
};

export const listOrganizationBoards = async (
  organizationId: string,
  includeArchived: boolean = false,
): Promise<PublicBoard[]> => {
  const boards = await boardRepository.findBoardsByOrganization(organizationId, includeArchived);
  return boards.map(toPublicBoard);
};

export const getBoard = async (boardId: string): Promise<PublicBoard> => {
  const board = await boardRepository.findBoardById(boardId);
  if (!board) {
    throw new BoardNotFoundError(boardId);
  }
  return toPublicBoard(board);
};

export const updateBoard = async (
  boardId: string,
  input: UpdateBoardInput,
): Promise<PublicBoard> => {
  const existing = await boardRepository.findBoardById(boardId);
  if (!existing) {
    throw new BoardNotFoundError(boardId);
  }
  const board = await boardRepository.updateBoard(boardId, input);
  return toPublicBoard(board);
};

export const archiveBoard = async (boardId: string): Promise<PublicBoard> => {
  const existing = await boardRepository.findBoardById(boardId);
  if (!existing) {
    throw new BoardNotFoundError(boardId);
  }
  const board = await boardRepository.archiveBoard(boardId);
  return toPublicBoard(board);
};

export const restoreBoard = async (boardId: string): Promise<PublicBoard> => {
  const existing = await boardRepository.findBoardById(boardId);
  if (!existing) {
    throw new BoardNotFoundError(boardId);
  }
  const board = await boardRepository.restoreBoard(boardId);
  return toPublicBoard(board);
};

export const deleteBoard = async (boardId: string): Promise<void> => {
  const existing = await boardRepository.findBoardById(boardId);
  if (!existing) {
    throw new BoardNotFoundError(boardId);
  }
  if (existing.archivedAt === null) {
    throw new BoardNotArchivedError();
  }
  await boardRepository.deleteBoard(boardId);
};
