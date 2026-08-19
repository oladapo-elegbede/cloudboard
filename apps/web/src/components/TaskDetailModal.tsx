"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/auth-context";
import { listTaskComments, createComment } from "../lib/comments-api";
import { ApiError } from "../lib/api-client";
import { LoadingState } from "./LoadingState";
import { ErrorState } from "./ErrorState";
import type { PublicTask, TaskPriority } from "../lib/boards-api";

const priorityConfig: Record<string, { label: string; className: string }> = {
  HIGH: { label: "High", className: "bg-red-900/60 text-red-300 border-red-800" },
  MEDIUM: { label: "Medium", className: "bg-yellow-900/60 text-yellow-300 border-yellow-800" },
  LOW: { label: "Low", className: "bg-green-900/60 text-green-300 border-green-800" },
};

const formatDateTime = (dateStr: string): string => {
  return new Date(dateStr).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

interface TaskDetailModalProps {
  task: PublicTask;
  onClose: () => void;
}

export const TaskDetailModal = ({ task, onClose }: TaskDetailModalProps) => {
  const { accessToken, user } = useAuth();
  const queryClient = useQueryClient();
  const [commentBody, setCommentBody] = useState("");
  const [commentError, setCommentError] = useState<string | null>(null);

  const commentsQuery = useQuery({
    queryKey: ["comments", task.id],
    queryFn: () => listTaskComments(accessToken as string, task.id),
    enabled: Boolean(accessToken),
  });

  const commentMutation = useMutation({
    mutationFn: () => createComment(accessToken as string, task.id, { body: commentBody.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", task.id] });
      setCommentBody("");
      setCommentError(null);
    },
    onError: (err) => {
      setCommentError(err instanceof ApiError ? err.message : "Failed to add comment");
    },
  });

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentBody.trim()) return;
    commentMutation.mutate();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  const priorityInfo = task.priority ? priorityConfig[task.priority] : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-gray-700 bg-gray-900 shadow-xl">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-gray-800 bg-gray-900 px-6 py-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold text-white">{task.title}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {priorityInfo && (
                <span
                  className={`rounded border px-2 py-0.5 text-xs font-medium ${priorityInfo.className}`}
                >
                  {priorityInfo.label} priority
                </span>
              )}
              {task.dueDate && (
                <span className="text-xs text-gray-400">
                  Due {new Date(task.dueDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-4 shrink-0 rounded-md p-1 text-gray-400 hover:bg-gray-800 hover:text-gray-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="px-6 py-4 space-y-6">
          {task.description && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-300">Description</h3>
              <p className="whitespace-pre-wrap text-sm text-gray-400">{task.description}</p>
            </div>
          )}

          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-300">
              Comments {commentsQuery.isSuccess && `(${commentsQuery.data.length})`}
            </h3>

            {commentsQuery.isLoading && <LoadingState />}

            {commentsQuery.isError && (
              <ErrorState
                message="Could not load comments"
                onRetry={() => commentsQuery.refetch()}
              />
            )}

            {commentsQuery.isSuccess && (
              <div className="space-y-3">
                {commentsQuery.data.length === 0 && (
                  <p className="text-sm text-gray-600">No comments yet. Be the first to comment.</p>
                )}

                {commentsQuery.data.map((comment) => (
                  <div
                    key={comment.id}
                    className="rounded-md border border-gray-800 bg-gray-800/50 px-4 py-3"
                  >
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{comment.authorId === user?.id ? "You" : "Team member"}</span>
                      <span>·</span>
                      <span>{formatDateTime(comment.createdAt)}</span>
                      {comment.editedAt && <span className="italic">(edited)</span>}
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-gray-300">{comment.body}</p>
                  </div>
                ))}

                <form onSubmit={handleSubmitComment} className="mt-4 space-y-2">
                  <textarea
                    placeholder="Write a comment..."
                    value={commentBody}
                    onChange={(e) => setCommentBody(e.target.value)}
                    rows={3}
                    className="w-full resize-none rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                  />
                  {commentError && <p className="text-xs text-red-400">{commentError}</p>}
                  <button
                    type="submit"
                    disabled={commentMutation.isPending || !commentBody.trim()}
                    className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed"
                  >
                    {commentMutation.isPending ? "Posting..." : "Post comment"}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
