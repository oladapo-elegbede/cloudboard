import type { Comment, MembershipRole } from "@prisma/client";
import * as commentRepository from "./comment.repository.js";
import { findTaskById } from "../tasks/task.repository.js";
import { findColumnById } from "../columns/column.repository.js";
import { findBoardById } from "../boards/board.repository.js";
import { prisma } from "../../infrastructure/database/prisma.js";
import { logActivity, ACTION_TYPES, ENTITY_TYPES } from "../activities/index.js";
import type { PublicComment, CreateCommentInput, UpdateCommentInput } from "./comment.types.js";

export class CommentNotFoundError extends Error {
  constructor(id: string) {
    super(`Comment ${id} not found`);
    this.name = "CommentNotFoundError";
  }
}

export class NotCommentAuthorError extends Error {
  constructor() {
    super("You can only edit your own comments");
    this.name = "NotCommentAuthorError";
  }
}

export class InsufficientDeletePermissionError extends Error {
  constructor() {
    super("You can only delete your own comments unless you are an admin");
    this.name = "InsufficientDeletePermissionError";
  }
}

const ROLE_HIERARCHY: Record<MembershipRole, number> = {
  OWNER: 4,
  ADMIN: 3,
  MEMBER: 2,
  VIEWER: 1,
};

const toPublicComment = (comment: Comment): PublicComment => ({
  id: comment.id,
  taskId: comment.taskId,
  authorId: comment.authorId,
  body: comment.body,
  editedAt: comment.editedAt,
  createdAt: comment.createdAt,
  updatedAt: comment.updatedAt,
});

const resolveContextFromTaskId = async (
  taskId: string,
): Promise<{ boardId: string; organizationId: string; taskTitle: string } | null> => {
  const task = await findTaskById(taskId);
  if (!task) return null;
  const column = await findColumnById(task.columnId);
  if (!column) return null;
  const board = await findBoardById(column.boardId);
  if (!board) return null;
  return {
    boardId: board.id,
    organizationId: board.organizationId,
    taskTitle: task.title,
  };
};

const getUserName = async (userId: string): Promise<string> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });
  return user?.name ?? "Unknown user";
};

const truncateBody = (body: string, maxLength: number = 200): string => {
  return body.length > maxLength ? `${body.slice(0, maxLength)}...` : body;
};

export const createComment = async (
  taskId: string,
  authorId: string,
  input: CreateCommentInput,
): Promise<PublicComment> => {
  const comment = await commentRepository.createComment({
    taskId,
    authorId,
    body: input.body,
  });

  const context = await resolveContextFromTaskId(taskId);
  if (context) {
    const actorName = await getUserName(authorId);
    await logActivity({
      organizationId: context.organizationId,
      boardId: context.boardId,
      actorId: authorId,
      actorName,
      actionType: ACTION_TYPES.COMMENT_ADDED,
      entityType: ENTITY_TYPES.COMMENT,
      entityId: comment.id,
      entitySnapshot: {
        taskId,
        taskTitle: context.taskTitle,
        bodyPreview: truncateBody(comment.body),
      },
    });
  }

  return toPublicComment(comment);
};

export const listTaskComments = async (taskId: string): Promise<PublicComment[]> => {
  const comments = await commentRepository.findCommentsByTask(taskId);
  return comments.map(toPublicComment);
};

export const getComment = async (commentId: string): Promise<PublicComment> => {
  const comment = await commentRepository.findCommentById(commentId);
  if (!comment) {
    throw new CommentNotFoundError(commentId);
  }
  return toPublicComment(comment);
};

export const updateComment = async (
  commentId: string,
  userId: string,
  input: UpdateCommentInput,
): Promise<PublicComment> => {
  const existing = await commentRepository.findCommentById(commentId);
  if (!existing) {
    throw new CommentNotFoundError(commentId);
  }

  if (existing.authorId !== userId) {
    throw new NotCommentAuthorError();
  }

  const comment = await commentRepository.updateComment(commentId, {
    body: input.body,
    editedAt: new Date(),
  });

  const context = await resolveContextFromTaskId(existing.taskId);
  if (context) {
    const actorName = await getUserName(userId);
    await logActivity({
      organizationId: context.organizationId,
      boardId: context.boardId,
      actorId: userId,
      actorName,
      actionType: ACTION_TYPES.COMMENT_EDITED,
      entityType: ENTITY_TYPES.COMMENT,
      entityId: comment.id,
      entitySnapshot: {
        taskId: existing.taskId,
        taskTitle: context.taskTitle,
        bodyPreview: truncateBody(comment.body),
      },
    });
  }

  return toPublicComment(comment);
};

export const deleteComment = async (
  commentId: string,
  userId: string,
  userRole: MembershipRole,
): Promise<void> => {
  const existing = await commentRepository.findCommentById(commentId);
  if (!existing) {
    throw new CommentNotFoundError(commentId);
  }

  const isAuthor = existing.authorId === userId;
  const isAdminOrAbove = ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY.ADMIN;

  if (!isAuthor && !isAdminOrAbove) {
    throw new InsufficientDeletePermissionError();
  }

  const context = await resolveContextFromTaskId(existing.taskId);
  const actorName = context ? await getUserName(userId) : "Unknown user";

  await commentRepository.deleteComment(commentId);

  if (context) {
    await logActivity({
      organizationId: context.organizationId,
      boardId: context.boardId,
      actorId: userId,
      actorName,
      actionType: ACTION_TYPES.COMMENT_DELETED,
      entityType: ENTITY_TYPES.COMMENT,
      entityId: existing.id,
      entitySnapshot: {
        taskId: existing.taskId,
        taskTitle: context.taskTitle,
        bodyPreview: truncateBody(existing.body),
      },
    });
  }
};
