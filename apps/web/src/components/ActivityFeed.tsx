"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../contexts/auth-context";
import { listBoardActivities } from "../lib/activities-api";
import { LoadingState } from "./LoadingState";
import { ErrorState } from "./ErrorState";

const ACTION_LABELS: Record<string, string> = {
  TASK_CREATED: "created task",
  TASK_UPDATED: "updated task",
  TASK_MOVED: "moved task",
  TASK_DELETED: "deleted task",
  COMMENT_ADDED: "commented on",
  COMMENT_EDITED: "edited comment on",
  COMMENT_DELETED: "deleted comment on",
};

const formatTimeAgo = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const getEntityTitle = (activity: {
  actionType: string;
  entitySnapshot: Record<string, unknown> | null;
}): string => {
  if (!activity.entitySnapshot) return "";
  const snapshot = activity.entitySnapshot;
  if (typeof snapshot.title === "string") return `"${snapshot.title}"`;
  if (typeof snapshot.taskTitle === "string") return `"${snapshot.taskTitle}"`;
  if (typeof snapshot.bodyPreview === "string") return `"${snapshot.bodyPreview}"`;
  return "";
};

interface ActivityFeedProps {
  boardId: string;
}

export const ActivityFeed = ({ boardId }: ActivityFeedProps) => {
  const { accessToken } = useAuth();

  const query = useQuery({
    queryKey: ["activities", boardId],
    queryFn: () => listBoardActivities(accessToken as string, boardId, 30),
    enabled: Boolean(accessToken),
    refetchInterval: 30000,
  });

  return (
    <div className="flex h-full flex-col">
      <h3 className="shrink-0 border-b border-gray-800 px-4 py-3 text-sm font-semibold text-gray-200">
        Activity
      </h3>

      <div className="flex-1 overflow-y-auto">
        {query.isLoading && <LoadingState />}

        {query.isError && (
          <ErrorState message="Could not load activity" onRetry={() => query.refetch()} />
        )}

        {query.isSuccess && query.data.activities.length === 0 && (
          <p className="px-4 py-6 text-center text-xs text-gray-600">No activity yet</p>
        )}

        {query.isSuccess && query.data.activities.length > 0 && (
          <ul className="divide-y divide-gray-800/50">
            {query.data.activities.map((activity) => {
              const actionLabel = ACTION_LABELS[activity.actionType] ?? activity.actionType;
              const entityTitle = getEntityTitle(activity);

              return (
                <li key={activity.id} className="px-4 py-3">
                  <p className="text-xs text-gray-300">
                    <span className="font-medium text-gray-100">{activity.actorName}</span>{" "}
                    {actionLabel}
                    {entityTitle && (
                      <>
                        {" "}
                        <span className="text-gray-400">{entityTitle}</span>
                      </>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-600">
                    {formatTimeAgo(activity.createdAt)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
