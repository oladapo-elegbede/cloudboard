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
