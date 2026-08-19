import { apiRequest } from "./api-client";

export interface PublicColumn {
  id: string;
  boardId: string;
  name: string;
  position: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListColumnsResponse {
  columns: PublicColumn[];
}

export interface CreateColumnResponse {
  column: PublicColumn;
}

export interface CreateColumnInput {
  name: string;
}

export const listBoardColumns = async (
  accessToken: string,
  boardId: string,
): Promise<PublicColumn[]> => {
  const result = await apiRequest<ListColumnsResponse>(`/boards/${boardId}/columns`, {
    method: "GET",
    accessToken,
  });
  return result.columns;
};

export const createColumn = async (
  accessToken: string,
  boardId: string,
  input: CreateColumnInput,
): Promise<PublicColumn> => {
  const result = await apiRequest<CreateColumnResponse>(`/boards/${boardId}/columns`, {
    method: "POST",
    accessToken,
    body: input,
  });
  return result.column;
};
