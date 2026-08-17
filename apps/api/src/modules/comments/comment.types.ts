export interface PublicComment {
  id: string;
  taskId: string;
  authorId: string | null;
  body: string;
  editedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCommentInput {
  body: string;
}

export interface UpdateCommentInput {
  body: string;
}
