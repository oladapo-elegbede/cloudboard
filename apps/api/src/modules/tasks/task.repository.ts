import type { Task, TaskPriority } from "@prisma/client";
import { prisma } from "../../infrastructure/database/prisma.js";

interface CreateTaskData {
  columnId: string;
  title: string;
  description?: string | null;
  position: string;
  createdById: string;
  assigneeId?: string | null;
  dueDate?: Date | null;
  priority?: TaskPriority | null;
}

interface UpdateTaskData {
  title?: string;
  description?: string | null;
  assigneeId?: string | null;
  dueDate?: Date | null;
  priority?: TaskPriority | null;
  columnId?: string;
  position?: string;
}

export const createTask = async (data: CreateTaskData): Promise<Task> => {
  return prisma.task.create({ data });
};

export const findTaskById = async (id: string): Promise<Task | null> => {
  return prisma.task.findUnique({
    where: { id },
  });
};

export const findTasksByColumn = async (columnId: string): Promise<Task[]> => {
  return prisma.task.findMany({
    where: { columnId },
    orderBy: { position: "asc" },
  });
};

export const findTasksByBoardId = async (boardId: string): Promise<Task[]> => {
  return prisma.task.findMany({
    where: {
      column: {
        boardId,
      },
    },
    orderBy: [{ columnId: "asc" }, { position: "asc" }],
  });
};

export const findLastTaskByColumn = async (columnId: string): Promise<Task | null> => {
  return prisma.task.findFirst({
    where: { columnId },
    orderBy: { position: "desc" },
  });
};

export const countTasksByColumn = async (columnId: string): Promise<number> => {
  return prisma.task.count({
    where: { columnId },
  });
};

export const updateTask = async (id: string, data: UpdateTaskData): Promise<Task> => {
  return prisma.task.update({
    where: { id },
    data,
  });
};

export const deleteTask = async (id: string): Promise<Task> => {
  return prisma.task.delete({
    where: { id },
  });
};
