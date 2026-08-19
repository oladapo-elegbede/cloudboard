import { apiRequest } from "./api-client";
import type { PublicTask } from "./boards-api";

export interface CreateTaskResponse {
  task: PublicTask;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH";
  dueDate?: string;
}

export interface MoveTaskInput {
  targetColumnId?: string;
  afterTaskId?: string;
  beforeTaskId?: string;
}

export interface MoveTaskResponse {
  task: PublicTask;
}

export const createTask = async (
  accessToken: string,
  columnId: string,
  input: CreateTaskInput,
): Promise<PublicTask> => {
  const result = await apiRequest<CreateTaskResponse>(`/columns/${columnId}/tasks`, {
    method: "POST",
    accessToken,
    body: input,
  });
  return result.task;
};

export const moveTask = async (
  accessToken: string,
  taskId: string,
  input: MoveTaskInput,
): Promise<PublicTask> => {
  const result = await apiRequest<MoveTaskResponse>(`/tasks/${taskId}/move`, {
    method: "POST",
    accessToken,
    body: input,
  });
  return result.task;
};
