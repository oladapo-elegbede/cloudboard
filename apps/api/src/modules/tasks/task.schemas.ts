import { z } from "zod";

const uuidSchema = z.string().uuid("Invalid UUID format");

const prioritySchema = z.enum(["LOW", "MEDIUM", "HIGH"]);

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(500, "Title is too long"),
  description: z.string().max(10000, "Description is too long").optional(),
  assigneeId: uuidSchema.optional(),
  dueDate: z.coerce.date().optional(),
  priority: prioritySchema.optional(),
  afterTaskId: uuidSchema.optional(),
  beforeTaskId: uuidSchema.optional(),
});

export type CreateTaskSchemaInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(500, "Title is too long").optional(),
    description: z.string().max(10000, "Description is too long").nullable().optional(),
    assigneeId: uuidSchema.nullable().optional(),
    dueDate: z.coerce.date().nullable().optional(),
    priority: prioritySchema.nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export type UpdateTaskSchemaInput = z.infer<typeof updateTaskSchema>;

export const moveTaskSchema = z
  .object({
    targetColumnId: uuidSchema.optional(),
    afterTaskId: uuidSchema.optional(),
    beforeTaskId: uuidSchema.optional(),
  })
  .refine(
    (data) =>
      data.targetColumnId !== undefined ||
      data.afterTaskId !== undefined ||
      data.beforeTaskId !== undefined,
    { message: "At least one of targetColumnId, afterTaskId, or beforeTaskId is required" },
  );

export type MoveTaskSchemaInput = z.infer<typeof moveTaskSchema>;
