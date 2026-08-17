import type { MembershipRole, Activity } from "@prisma/client";
import * as activityRepository from "./activity.repository.js";
import type { PublicActivity, LogActivityInput, ListActivitiesResult } from "./activity.types.js";
import type { ActionType, EntityType } from "./activity.types.js";

const toPublicActivity = (activity: Activity): PublicActivity => ({
  id: activity.id,
  organizationId: activity.organizationId,
  boardId: activity.boardId,
  actorId: activity.actorId,
  actorName: activity.actorName,
  actionType: activity.actionType as ActionType,
  entityType: activity.entityType as EntityType,
  entityId: activity.entityId,
  entitySnapshot: activity.entitySnapshot,
  createdAt: activity.createdAt,
});

const stripSnapshotForViewer = (activity: PublicActivity, role: MembershipRole): PublicActivity => {
  if (role === "VIEWER") {
    return { ...activity, entitySnapshot: null };
  }
  return activity;
};

export const logActivity = async (input: LogActivityInput): Promise<void> => {
  try {
    await activityRepository.createActivity(input);
  } catch (error) {
    console.error("[ACTIVITY_LOG_FAILURE]", {
      actionType: input.actionType,
      entityType: input.entityType,
      entityId: input.entityId,
      error,
    });
    // TODO: Route to error tracking (Sentry, etc.) when we add it.
    // Never let logging failures propagate — activity is supporting infrastructure.
  }
};

interface ListBoardActivitiesInput {
  boardId: string;
  role: MembershipRole;
  limit: number;
  cursor?: string;
}

const parseOffsetCursor = (cursor: string | undefined): number => {
  if (!cursor) return 0;
  const parsed = parseInt(cursor, 10);
  if (isNaN(parsed) || parsed < 0) return 0;
  return parsed;
};

export const listBoardActivities = async (
  input: ListBoardActivitiesInput,
): Promise<ListActivitiesResult> => {
  const offset = parseOffsetCursor(input.cursor);
  const limit = input.limit;

  const activities = await activityRepository.findActivitiesByBoard({
    boardId: input.boardId,
    limit: limit + 1,
    offset,
  });

  const hasMore = activities.length > limit;
  const trimmed = hasMore ? activities.slice(0, limit) : activities;

  const publicActivities = trimmed
    .map(toPublicActivity)
    .map((activity) => stripSnapshotForViewer(activity, input.role));

  return {
    activities: publicActivities,
    pagination: {
      nextCursor: hasMore ? String(offset + limit) : null,
      hasMore,
    },
  };
};
