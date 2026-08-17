import type { TaskPriority } from "@prisma/client";

export interface PublicTask {
  id: string;
  columnId: string;
  title: string;
  description: string | null;
  position: string;
  createdById: string | null;
  assigneeId: string | null;
  dueDate: Date | null;
  priority: TaskPriority | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  assigneeId?: string;
  dueDate?: Date;
  priority?: TaskPriority;
  afterTaskId?: string;
  beforeTaskId?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  assigneeId?: string | null;
  dueDate?: Date | null;
  priority?: TaskPriority | null;
}

export interface MoveTaskInput {
  targetColumnId?: string;
  afterTaskId?: string;
  beforeTaskId?: string;
}
