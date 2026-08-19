"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/auth-context";
import { createTask } from "../lib/tasks-api";
import { ApiError } from "../lib/api-client";

interface CreateTaskFormProps {
  columnId: string;
  boardId: string;
}

export const CreateTaskForm = ({ columnId, boardId }: CreateTaskFormProps) => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => createTask(accessToken as string, columnId, { title: title.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boardTasks", boardId] });
      setTitle("");
      setError(null);
      setIsOpen(false);
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : "Failed to create task");
    },
  });

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full rounded-md border border-dashed border-gray-700 px-3 py-2 text-xs text-gray-500 hover:border-gray-500 hover:text-gray-300"
      >
        + Add task
      </button>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    mutation.mutate();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      setTitle("");
      setError(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input
        type="text"
        placeholder="Task title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
        className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={mutation.isPending || !title.trim()}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed"
        >
          {mutation.isPending ? "Adding..." : "Add"}
        </button>
        <button
          type="button"
          onClick={() => {
            setIsOpen(false);
            setTitle("");
            setError(null);
          }}
          className="rounded-md px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};
