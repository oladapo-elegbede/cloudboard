"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/auth-context";
import { createColumn } from "../lib/columns-api";
import { ApiError } from "../lib/api-client";

interface CreateColumnFormProps {
  boardId: string;
}

export const CreateColumnForm = ({ boardId }: CreateColumnFormProps) => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => createColumn(accessToken as string, boardId, { name: name.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["columns", boardId] });
      setName("");
      setError(null);
      setIsOpen(false);
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : "Failed to create column");
    },
  });

  if (!isOpen) {
    return (
      <div className="flex w-80 shrink-0 items-start">
        <button
          onClick={() => setIsOpen(true)}
          className="w-full rounded-lg border border-dashed border-gray-700 px-4 py-3 text-sm text-gray-400 hover:border-gray-500 hover:text-gray-200"
        >
          + New column
        </button>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    mutation.mutate();
  };

  return (
    <div className="w-80 shrink-0">
      <form
        onSubmit={handleSubmit}
        className="rounded-lg border border-gray-700 bg-gray-900 p-3 space-y-2"
      >
        <input
          type="text"
          placeholder="Column name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={mutation.isPending || !name.trim()}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed"
          >
            {mutation.isPending ? "Adding..." : "Add"}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              setName("");
              setError(null);
            }}
            className="rounded-md px-3 py-1.5 text-sm text-gray-400 hover:text-gray-200"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
