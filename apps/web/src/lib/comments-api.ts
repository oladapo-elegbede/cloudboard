import { apiRequest } from "./api-client";

export interface PublicComment {
  id: string;
  taskId: string;
  authorId: string | null;
  body: string;
  editedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListCommentsResponse {
  comments: PublicComment[];
}

export interface CreateCommentResponse {
  comment: PublicComment;
}

export interface CreateCommentInput {
  body: string;
}

export const listTaskComments = async (
  accessToken: string,
  taskId: string,
): Promise<PublicComment[]> => {
  const result = await apiRequest<ListCommentsResponse>(`/tasks/${taskId}/comments`, {
    method: "GET",
    accessToken,
  });
  return result.comments;
};

export const createComment = async (
  accessToken: string,
  taskId: string,
  input: CreateCommentInput,
): Promise<PublicComment> => {
  const result = await apiRequest<CreateCommentResponse>(`/tasks/${taskId}/comments`, {
    method: "POST",
    accessToken,
    body: input,
  });
  return result.comment;
};
