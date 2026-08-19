"use client";

import { useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../../contexts/auth-context";
import { getBoard, listBoardTasks } from "../../../lib/boards-api";
import { listBoardColumns } from "../../../lib/columns-api";
import { ApiError } from "../../../lib/api-client";
import { LoadingState } from "../../../components/LoadingState";
import { ErrorState } from "../../../components/ErrorState";
import { EmptyState } from "../../../components/EmptyState";
import { CreateColumnForm } from "../../../components/CreateColumnForm";
import { CreateTaskForm } from "../../../components/CreateTaskForm";
import type { PublicTask, TaskPriority } from "../../../lib/boards-api";

const priorityConfig: Record<string, { label: string; className: string }> = {
  HIGH: { label: "High", className: "bg-red-900/60 text-red-300 border-red-800" },
  MEDIUM: { label: "Med", className: "bg-yellow-900/60 text-yellow-300 border-yellow-800" },
  LOW: { label: "Low", className: "bg-green-900/60 text-green-300 border-green-800" },
};

type DueDateStatus = "overdue" | "today" | "future" | "none";

const getDueDateStatus = (dueDate: string | null): DueDateStatus => {
  if (!dueDate) return "none";
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (due < today) return "overdue";
  if (due < tomorrow) return "today";
  return "future";
};

const dueDateStyles: Record<DueDateStatus, string> = {
  overdue: "text-red-400",
  today: "text-amber-400",
  future: "text-gray-500",
  none: "",
};

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

const PriorityBadge = ({ priority }: { priority: TaskPriority }) => {
  const config = priorityConfig[priority];
  if (!config) return null;
  return (
    <span className={`rounded border px-1.5 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
};

const TaskCard = ({ task }: { task: PublicTask }) => {
  const dueDateStatus = getDueDateStatus(task.dueDate);

  return (
    <div className="rounded-md border border-gray-700 bg-gray-800 p-3 shadow-sm">
      <p className="text-sm font-medium text-white">{task.title}</p>
      <div className="mt-2 flex items-center gap-2">
        {task.priority && <PriorityBadge priority={task.priority} />}
        {task.dueDate && (
          <span className={`text-xs ${dueDateStyles[dueDateStatus]}`}>
            {formatDate(task.dueDate)}
          </span>
        )}
      </div>
    </div>
  );
};

export default function BoardDetailPage() {
  const router = useRouter();
  const params = useParams();
  const boardId = typeof params.boardId === "string" ? params.boardId : "";
  const { status, accessToken } = useAuth();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  const boardQuery = useQuery({
    queryKey: ["board", boardId],
    queryFn: () => getBoard(accessToken as string, boardId),
    enabled: status === "authenticated" && Boolean(accessToken) && Boolean(boardId),
  });

  const columnsQuery = useQuery({
    queryKey: ["columns", boardId],
    queryFn: () => listBoardColumns(accessToken as string, boardId),
    enabled: status === "authenticated" && Boolean(accessToken) && Boolean(boardId),
  });

  const tasksQuery = useQuery({
    queryKey: ["boardTasks", boardId],
    queryFn: () => listBoardTasks(accessToken as string, boardId),
    enabled: status === "authenticated" && Boolean(accessToken) && Boolean(boardId),
  });

  const tasksByColumn = useMemo(() => {
    if (!tasksQuery.data) return {};
    const grouped: Record<string, PublicTask[]> = {};
    for (const task of tasksQuery.data) {
      if (!grouped[task.columnId]) {
        grouped[task.columnId] = [];
      }
      grouped[task.columnId].push(task);
    }
    return grouped;
  }, [tasksQuery.data]);

  if (status === "loading" || status === "unauthenticated") {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <LoadingState />
      </main>
    );
  }

  const boardErrorIsAccessRelated =
    boardQuery.error instanceof ApiError &&
    (boardQuery.error.status === 403 || boardQuery.error.status === 404);

  if (boardErrorIsAccessRelated) {
    return (
      <main className="min-h-screen p-8">
        <div className="mx-auto max-w-4xl">
          <ErrorState message="Board not found or you do not have access." />
          <div className="mt-4 text-center">
            <Link href="/" className="text-sm text-blue-400 hover:text-blue-300">
              Back to organizations
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const isLoading = boardQuery.isLoading || columnsQuery.isLoading || tasksQuery.isLoading;
  const hasError =
    (boardQuery.isError && !boardErrorIsAccessRelated) ||
    columnsQuery.isError ||
    tasksQuery.isError;

  return (
    <main className="flex h-screen flex-col overflow-hidden">
      <header className="shrink-0 border-b border-gray-800 px-6 py-4">
        <Link
          href={boardQuery.data ? `/organizations/${boardQuery.data.organizationId}` : "/"}
          className="mb-2 inline-block text-sm text-gray-400 hover:text-gray-200"
        >
          Back to boards
        </Link>
        {boardQuery.isSuccess && (
          <div>
            <h1 className="text-2xl font-bold">{boardQuery.data.name}</h1>
            {boardQuery.data.description && (
              <p className="mt-1 text-sm text-gray-400">{boardQuery.data.description}</p>
            )}
          </div>
        )}
      </header>

      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        {isLoading && <LoadingState />}

        {hasError && (
          <ErrorState
            message="Could not load board data"
            onRetry={() => {
              boardQuery.refetch();
              columnsQuery.refetch();
              tasksQuery.refetch();
            }}
          />
        )}

        {columnsQuery.isSuccess && columnsQuery.data.length === 0 && !isLoading && (
          <div className="flex gap-4">
            <EmptyState
              title="No columns yet"
              description="Add columns to start organizing tasks."
            />
            <CreateColumnForm boardId={boardId} />
          </div>
        )}

        {columnsQuery.isSuccess && columnsQuery.data.length > 0 && (
          <div className="flex gap-4" style={{ minWidth: "fit-content" }}>
            {columnsQuery.data.map((column) => {
              const columnTasks = tasksByColumn[column.id] ?? [];
              return (
                <div
                  key={column.id}
                  className="flex w-80 shrink-0 flex-col rounded-lg border border-gray-800 bg-gray-900/50"
                >
                  <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
                    <h3 className="text-sm font-semibold text-gray-200">{column.name}</h3>
                    <span className="text-xs text-gray-500">{columnTasks.length}</span>
                  </div>

                  <div className="flex-1 space-y-2 overflow-y-auto p-3">
                    {columnTasks.length === 0 && (
                      <p className="py-4 text-center text-xs text-gray-600">No tasks</p>
                    )}
                    {columnTasks.map((task) => (
                      <TaskCard key={task.id} task={task} />
                    ))}
                    <CreateTaskForm columnId={column.id} boardId={boardId} />
                  </div>
                </div>
              );
            })}
            <CreateColumnForm boardId={boardId} />
          </div>
        )}
      </div>
    </main>
  );
}
