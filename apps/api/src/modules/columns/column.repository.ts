import type { BoardColumn } from "@prisma/client";
import { prisma } from "../../infrastructure/database/prisma.js";

interface CreateColumnData {
  boardId: string;
  name: string;
  position: string;
}

interface UpdateColumnData {
  name?: string;
  position?: string;
}

export const createColumn = async (data: CreateColumnData): Promise<BoardColumn> => {
  return prisma.boardColumn.create({ data });
};

export const findColumnById = async (id: string): Promise<BoardColumn | null> => {
  return prisma.boardColumn.findUnique({
    where: { id },
  });
};

export const findColumnsByBoard = async (boardId: string): Promise<BoardColumn[]> => {
  return prisma.boardColumn.findMany({
    where: { boardId },
    orderBy: { position: "asc" },
  });
};

export const findLastColumnByBoard = async (boardId: string): Promise<BoardColumn | null> => {
  return prisma.boardColumn.findFirst({
    where: { boardId },
    orderBy: { position: "desc" },
  });
};

export const updateColumn = async (id: string, data: UpdateColumnData): Promise<BoardColumn> => {
  return prisma.boardColumn.update({
    where: { id },
    data,
  });
};

export const deleteColumn = async (id: string): Promise<BoardColumn> => {
  return prisma.boardColumn.delete({
    where: { id },
  });
};
