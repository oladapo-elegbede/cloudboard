import { apiRequest } from "./api-client";

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

export interface ListBoardsResponse {
  boards: PublicBoard[];
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
