import type { Comment } from "@prisma/client";
import { prisma } from "../../infrastructure/database/prisma.js";

interface CreateCommentData {
  taskId: string;
  authorId: string;
  body: string;
}

interface UpdateCommentData {
  body: string;
  editedAt: Date;
}

export const createComment = async (data: CreateCommentData): Promise<Comment> => {
  return prisma.comment.create({ data });
};

export const findCommentById = async (id: string): Promise<Comment | null> => {
  return prisma.comment.findUnique({
    where: { id },
  });
};

export const findCommentsByTask = async (taskId: string): Promise<Comment[]> => {
  return prisma.comment.findMany({
    where: { taskId },
    orderBy: { createdAt: "asc" },
  });
};

export const updateComment = async (id: string, data: UpdateCommentData): Promise<Comment> => {
  return prisma.comment.update({
    where: { id },
    data,
  });
};

export const deleteComment = async (id: string): Promise<Comment> => {
  return prisma.comment.delete({
    where: { id },
  });
};
