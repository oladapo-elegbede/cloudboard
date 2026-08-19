import { apiRequest } from "./api-client";

export interface PublicActivity {
  id: string;
  organizationId: string;
  boardId: string | null;
  actorId: string | null;
  actorName: string;
  actionType: string;
  entityType: string;
  entityId: string;
  entitySnapshot: Record<string, unknown> | null;
  createdAt: string;
}

export interface ListActivitiesResponse {
  activities: PublicActivity[];
  pagination: {
    nextCursor: string | null;
    hasMore: boolean;
  };
}

export const listBoardActivities = async (
  accessToken: string,
  boardId: string,
  limit: number = 20,
): Promise<ListActivitiesResponse> => {
  return apiRequest<ListActivitiesResponse>(`/boards/${boardId}/activities`, {
    method: "GET",
    accessToken,
    query: { limit },
  });
};
