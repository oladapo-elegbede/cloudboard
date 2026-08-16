import type { Board } from "@prisma/client";
import { prisma } from "../../infrastructure/database/prisma.js";

interface CreateBoardData {
  name: string;
  description?: string | null;
  organizationId: string;
  createdById: string;
}

interface UpdateBoardData {
  name?: string;
  description?: string | null;
}

export const createBoard = async (data: CreateBoardData): Promise<Board> => {
  return prisma.board.create({
    data: {
      name: data.name,
      description: data.description ?? null,
      organizationId: data.organizationId,
      createdById: data.createdById,
    },
  });
};

export const findBoardById = async (id: string): Promise<Board | null> => {
  return prisma.board.findUnique({
    where: { id },
  });
};

export const findBoardsByOrganization = async (
  organizationId: string,
  includeArchived: boolean = false,
): Promise<Board[]> => {
  return prisma.board.findMany({
    where: {
      organizationId,
      ...(includeArchived ? {} : { archivedAt: null }),
    },
    orderBy: { createdAt: "desc" },
  });
};

export const updateBoard = async (id: string, data: UpdateBoardData): Promise<Board> => {
  return prisma.board.update({
    where: { id },
    data,
  });
};

export const archiveBoard = async (id: string): Promise<Board> => {
  return prisma.board.update({
    where: { id },
    data: { archivedAt: new Date() },
  });
};

export const restoreBoard = async (id: string): Promise<Board> => {
  return prisma.board.update({
    where: { id },
    data: { archivedAt: null },
  });
};

export const deleteBoard = async (id: string): Promise<Board> => {
  return prisma.board.delete({
    where: { id },
  });
};
