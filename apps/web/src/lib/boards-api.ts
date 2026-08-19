import { apiRequest } from "./api-client";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export interface PublicBoard {
  id: string;
  name: string;
  description: string | null;
  organizationId: string;
  createdById: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PublicTask {
  id: string;
  columnId: string;
  title: string;
  description: string | null;
  position: string;
  createdById: string | null;
  assigneeId: string | null;
  dueDate: string | null;
  priority: TaskPriority | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListBoardsResponse {
  boards: PublicBoard[];
}

export interface GetBoardResponse {
  board: PublicBoard;
}

export interface ListBoardTasksResponse {
  tasks: PublicTask[];
}

interface ListBoardsOptions {
  includeArchived?: boolean;
}

export const listOrganizationBoards = async (
  accessToken: string,
  organizationId: string,
  options: ListBoardsOptions = {},
): Promise<PublicBoard[]> => {
  const result = await apiRequest<ListBoardsResponse>(`/organizations/${organizationId}/boards`, {
    method: "GET",
    accessToken,
    query: {
      includeArchived: options.includeArchived,
    },
  });
  return result.boards;
};

export const getBoard = async (accessToken: string, boardId: string): Promise<PublicBoard> => {
  const result = await apiRequest<GetBoardResponse>(`/boards/${boardId}`, {
    method: "GET",
    accessToken,
  });
  return result.board;
};

export const listBoardTasks = async (
  accessToken: string,
  boardId: string,
): Promise<PublicTask[]> => {
  const result = await apiRequest<ListBoardTasksResponse>(`/boards/${boardId}/tasks`, {
    method: "GET",
    accessToken,
  });
  return result.tasks;
};
