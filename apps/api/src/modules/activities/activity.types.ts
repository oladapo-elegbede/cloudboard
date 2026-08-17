import type { Prisma } from "@prisma/client";

export const ACTION_TYPES = {
  TASK_CREATED: "TASK_CREATED",
  TASK_UPDATED: "TASK_UPDATED",
  TASK_MOVED: "TASK_MOVED",
  TASK_DELETED: "TASK_DELETED",
  COMMENT_ADDED: "COMMENT_ADDED",
  COMMENT_EDITED: "COMMENT_EDITED",
  COMMENT_DELETED: "COMMENT_DELETED",
} as const;

export type ActionType = (typeof ACTION_TYPES)[keyof typeof ACTION_TYPES];

export const ENTITY_TYPES = {
  TASK: "TASK",
  COMMENT: "COMMENT",
} as const;

export type EntityType = (typeof ENTITY_TYPES)[keyof typeof ENTITY_TYPES];

export type ActivitySnapshot = Prisma.InputJsonValue;

export interface PublicActivity {
  id: string;
  organizationId: string;
  boardId: string | null;
  actorId: string | null;
  actorName: string;
  actionType: ActionType;
  entityType: EntityType;
  entityId: string;
  entitySnapshot: unknown;
  createdAt: Date;
}

export interface LogActivityInput {
  organizationId: string;
  boardId: string;
  actorId: string;
  actorName: string;
  actionType: ActionType;
  entityType: EntityType;
  entityId: string;
  entitySnapshot?: ActivitySnapshot;
}

export interface ListActivitiesOptions {
  boardId: string;
  limit?: number;
  cursor?: string;
}

export interface ListActivitiesResult {
  activities: PublicActivity[];
  pagination: {
    nextCursor: string | null;
    hasMore: boolean;
  };
}
