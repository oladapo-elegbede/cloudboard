import { z } from "zod";

const uuidSchema = z.string().uuid("Invalid UUID format");

export const createColumnSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name is too long"),
  beforeColumnId: uuidSchema.optional(),
  afterColumnId: uuidSchema.optional(),
});

export type CreateColumnSchemaInput = z.infer<typeof createColumnSchema>;

export const updateColumnSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name is too long"),
});

export type UpdateColumnSchemaInput = z.infer<typeof updateColumnSchema>;

export const moveColumnSchema = z
  .object({
    beforeColumnId: uuidSchema.optional(),
    afterColumnId: uuidSchema.optional(),
  })
  .refine((data) => data.beforeColumnId !== undefined || data.afterColumnId !== undefined, {
    message: "At least one of beforeColumnId or afterColumnId is required",
  });

export type MoveColumnSchemaInput = z.infer<typeof moveColumnSchema>;
