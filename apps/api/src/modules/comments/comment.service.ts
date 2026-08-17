import type { Comment, MembershipRole } from "@prisma/client";
import * as commentRepository from "./comment.repository.js";
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

  await commentRepository.deleteComment(commentId);
};
